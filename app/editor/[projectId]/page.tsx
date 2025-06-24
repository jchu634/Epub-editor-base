'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileExplorer } from '@/components/file-explorer';
import { MonacoEditor } from '@/components/monaco-editor';
import { PreviewPane } from '@/components/preview-pane';
import { OPFSManager } from '@/lib/opfs';
import { appStore, Project } from '@/lib/store';
import { useSelector } from '@xstate/store/react';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Settings, 
  Loader2,
  FileText,
  Eye,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileItem[];
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { currentProject } = useSelector(appStore, (state) => state.context);

  // Memoize loadFileContent function
  const loadFileContent = useCallback(async (filePath: string) => {
    try {
      const opfs = OPFSManager.getInstance();
      const content = await opfs.readFile(projectId, filePath);
      setFileContent(content);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to load file content:', err);
      toast.error('Failed to load file');
    }
  }, [projectId]);

  // Memoize loadFileStructure function
  const loadFileStructure = useCallback(async () => {
    try {
      const opfs = OPFSManager.getInstance();
      const allFiles = await opfs.listAllFilesAndDirectories(projectId);
      
      // Build file tree structure from the flat list with full paths
      const fileTree = buildFileTree(allFiles);
      setFiles(fileTree);
      
      // Auto-select first HTML file
      const firstHtmlFile = findFirstHtmlFile(allFiles);
      if (firstHtmlFile) {
        setSelectedFile(firstHtmlFile);
        await loadFileContent(firstHtmlFile);
      }
      
    } catch (err) {
      console.error('Failed to load file structure:', err);
      toast.error('Failed to load files');
    }
  }, [projectId, loadFileContent]);

  // Memoize handleFileSelect function
  const handleFileSelect = useCallback(async (filePath: string) => {
    if (hasUnsavedChanges) {
      const shouldContinue = confirm('You have unsaved changes. Do you want to continue without saving?');
      if (!shouldContinue) return;
    }

    setSelectedFile(filePath);
    await loadFileContent(filePath);
  }, [hasUnsavedChanges, loadFileContent]);

  // Memoize handleContentChange function
  const handleContentChange = useCallback((newContent: string) => {
    setFileContent(newContent);
    setHasUnsavedChanges(true);
  }, []);

  // Memoize handleSave function
  const handleSave = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setIsSaving(true);
      const opfs = OPFSManager.getInstance();
      await opfs.writeFile(projectId, selectedFile, fileContent);
      
      // Update project metadata
      const metadataStr = await opfs.readFile(projectId, 'metadata.json');
      const metadata = JSON.parse(metadataStr);
      metadata.lastModified = new Date().toISOString();
      await opfs.writeFile(projectId, 'metadata.json', JSON.stringify(metadata, null, 2));
      
      setHasUnsavedChanges(false);
      toast.success('File saved successfully');
    } catch (err) {
      console.error('Failed to save file:', err);
      toast.error('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, fileContent, projectId]);

  // Memoize handleExport function
  const handleExport = useCallback(async () => {
    try {
      // TODO: Implement EPUB export functionality
      toast.info('Export functionality coming soon!');
    } catch (err) {
      console.error('Failed to export:', err);
      toast.error('Failed to export EPUB');
    }
  }, []);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const opfs = OPFSManager.getInstance();
      
      // Initialize OPFS before any file system operations
      const initialized = await opfs.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize OPFS');
      }
      
      // Load project metadata
      const metadataStr = await opfs.readFile(projectId, 'metadata.json');
      const metadata = JSON.parse(metadataStr);
      
      const project: Project = {
        id: projectId,
        name: metadata.name,
        createdAt: new Date(metadata.createdAt),
        lastModified: new Date(metadata.lastModified),
        metadata: metadata.epubMetadata,
      };
      
      appStore.send({ type: 'setCurrentProject', project });
      
      // Load file structure
      await loadFileStructure();
      
    } catch (err) {
      console.error('Failed to load project:', err);
      toast.error('Failed to load project');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const buildFileTree = (allFiles: { name: string; type: 'file' | 'directory'; fullPath: string }[]): FileItem[] => {
    const tree: FileItem[] = [];
    const pathMap = new Map<string, FileItem>();

    // Sort files by path depth and then alphabetically
    const sortedFiles = allFiles.sort((a, b) => {
      const aDepth = a.fullPath.split('/').length;
      const bDepth = b.fullPath.split('/').length;
      
      if (aDepth !== bDepth) {
        return aDepth - bDepth;
      }
      
      // Same depth, sort directories first, then alphabetically
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      
      return a.fullPath.localeCompare(b.fullPath);
    });

    // Build the tree structure
    for (const file of sortedFiles) {
      const pathParts = file.fullPath.split('/');
      const item: FileItem = {
        name: file.name,
        type: file.type,
        path: file.fullPath,
        children: file.type === 'directory' ? [] : undefined,
      };

      if (pathParts.length === 1) {
        // Root level item
        tree.push(item);
        pathMap.set(file.fullPath, item);
      } else {
        // Nested item - find parent
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = pathMap.get(parentPath);
        
        if (parent && parent.children) {
          parent.children.push(item);
          pathMap.set(file.fullPath, item);
        }
      }
    }

    return tree;
  };

  const findFirstHtmlFile = (allFiles: { name: string; type: 'file' | 'directory'; fullPath: string }[]): string | null => {
    for (const file of allFiles) {
      if (file.type === 'file' && (file.fullPath.endsWith('.html') || file.fullPath.endsWith('.xhtml'))) {
        return file.fullPath;
      }
    }
    return null;
  };

  const getFileLanguage = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext || 'plaintext';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="font-semibold">{currentProject?.name}</h1>
              <p className="text-xs text-muted-foreground">
                {currentProject?.metadata.author}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full border-r">
              <div className="flex items-center gap-2 p-3 border-b bg-muted/50">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Files</span>
              </div>
              <FileExplorer
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                onRefresh={loadFileStructure}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Editor */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full border-r">
              <div className="flex items-center gap-2 p-3 border-b bg-muted/50">
                <Code className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {selectedFile ? selectedFile.split('/').pop() : 'No file selected'}
                </span>
                {hasUnsavedChanges && (
                  <span className="text-xs text-orange-500">• Unsaved</span>
                )}
              </div>
              {selectedFile ? (
                <MonacoEditor
                  value={fileContent}
                  onChange={handleContentChange}
                  language={getFileLanguage(selectedFile)}
                  onSave={handleSave}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a file to start editing</p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Preview */}
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full">
              <div className="flex items-center gap-2 p-3 border-b bg-muted/50">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Preview</span>
              </div>
              {selectedFile ? (
                <PreviewPane
                  content={fileContent}
                  filePath={selectedFile}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Preview will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
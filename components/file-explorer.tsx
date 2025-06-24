import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  File, 
  FileText, 
  Image, 
  Code, 
  Search,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileItem[];
  expanded?: boolean;
}

interface FileExplorerProps {
  files: FileItem[];
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
  onRefresh: () => void;
}

export function FileExplorer({ files, selectedFile, onFileSelect, onRefresh }: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'xhtml':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'css':
        return <Code className="h-4 w-4 text-blue-500" />;
      case 'js':
        return <Code className="h-4 w-4 text-yellow-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image className="h-4 w-4 text-green-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFileExtension = (fileName: string) => {
    const ext = fileName.split('.').pop();
    return ext ? ext.toUpperCase() : '';
  };

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const filterFiles = (items: FileItem[], term: string): FileItem[] => {
    if (!term) return items;

    return items.filter(item => {
      if (item.type === 'directory') {
        const hasMatchingChildren = item.children && filterFiles(item.children, term).length > 0;
        return item.name.toLowerCase().includes(term.toLowerCase()) || hasMatchingChildren;
      }
      return item.name.toLowerCase().includes(term.toLowerCase());
    }).map(item => ({
      ...item,
      children: item.children ? filterFiles(item.children, term) : undefined
    }));
  };

  const renderFileTree = (items: FileItem[], level = 0) => {
    const filteredItems = filterFiles(items, searchTerm);

    return filteredItems.map((item) => (
      <div key={item.path}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-sm cursor-pointer group",
            selectedFile === item.path && "bg-accent",
            level > 0 && "ml-4"
          )}
          onClick={() => {
            if (item.type === 'directory') {
              toggleDirectory(item.path);
            } else {
              onFileSelect(item.path);
            }
          }}
        >
          {item.type === 'directory' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleDirectory(item.path);
              }}
            >
              {expandedDirs.has(item.path) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          
          {getFileIcon(item.name, item.type === 'directory')}
          
          <span className="flex-1 text-sm truncate">{item.name}</span>
          
          {item.type === 'file' && (
            <Badge variant="outline" className="text-xs h-5">
              {getFileExtension(item.name)}
            </Badge>
          )}
        </div>

        {item.type === 'directory' && 
         item.children && 
         expandedDirs.has(item.path) && 
         renderFileTree(item.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {renderFileTree(files)}
        </div>
      </ScrollArea>
    </div>
  );
}
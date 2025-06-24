"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProjectCard } from "@/components/project-card";
import { UploadDialog } from "@/components/upload-dialog";
import { OPFSManager } from "@/lib/opfs";
import { EpubParser } from "@/lib/epub";
import { appStore, Project } from "@/lib/store";
import { useSelector } from "@xstate/store/react";
import { Plus, BookOpen, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const { projects, isLoading, error, opfsSupported } = useSelector(
        appStore,
        (state) => state.context
    );

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        appStore.send({ type: "setLoading", loading: true });

        const opfs = OPFSManager.getInstance();
        const supported = opfs.isSupported();

        appStore.send({ type: "setOpfsSupported", supported });

        if (!supported) {
            appStore.send({
                type: "setError",
                error: "Your browser does not support OPFS (Origin Private File System). Please use a modern browser like Chrome, Edge, or Firefox.",
            });
            appStore.send({ type: "setLoading", loading: false });
            return;
        }

        try {
            const initialized = await opfs.initialize();
            if (!initialized) {
                throw new Error("Failed to initialize OPFS");
            }

            await loadProjects();
        } catch (err) {
            appStore.send({
                type: "setError",
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to initialize application",
            });
        } finally {
            appStore.send({ type: "setLoading", loading: false });
        }
    };

    const loadProjects = async () => {
        try {
            const opfs = OPFSManager.getInstance();
            const projectIds = await opfs.listProjects();

            const loadedProjects: Project[] = [];

            for (const projectId of projectIds) {
                try {
                    const metadataStr = await opfs.readFile(
                        projectId,
                        "metadata.json"
                    );
                    const metadata = JSON.parse(metadataStr);
                    loadedProjects.push({
                        id: projectId,
                        name: metadata.name,
                        createdAt: new Date(metadata.createdAt),
                        lastModified: new Date(metadata.lastModified),
                        metadata: metadata.epubMetadata,
                    });
                } catch (err) {
                    console.warn(`Failed to load project ${projectId}:`, err);
                }
            }

            appStore.send({ type: "setProjects", projects: loadedProjects });
        } catch (err) {
            console.error("Failed to load projects:", err);
            toast.error("Failed to load projects");
        }
    };

    const handleUpload = async (file: File) => {
        try {
            appStore.send({ type: "setLoading", loading: true });

            const epubStructure = await EpubParser.parseEpub(file);
            const projectId = `project-${Date.now()}`;

            const opfs = OPFSManager.getInstance();
            await opfs.createProject(projectId);

            // Save all EPUB files
            for (const epubFile of epubStructure.files) {
                await opfs.writeFile(
                    projectId,
                    epubFile.path,
                    epubFile.content
                );
            }

            // Save project metadata
            const projectMetadata = {
                name: epubStructure.metadata.title,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                epubMetadata: epubStructure.metadata,
                manifest: epubStructure.manifest,
                spine: epubStructure.spine,
            };

            await opfs.writeFile(
                projectId,
                "metadata.json",
                JSON.stringify(projectMetadata, null, 2)
            );

            const newProject: Project = {
                id: projectId,
                name: epubStructure.metadata.title,
                createdAt: new Date(),
                lastModified: new Date(),
                metadata: epubStructure.metadata,
            };

            appStore.send({ type: "addProject", project: newProject });
            toast.success("Project created successfully!");
        } catch (err) {
            console.error("Upload failed:", err);
            toast.error(
                err instanceof Error ? err.message : "Failed to upload EPUB"
            );
            throw err;
        } finally {
            appStore.send({ type: "setLoading", loading: false });
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (
            !confirm(
                "Are you sure you want to delete this project? This action cannot be undone."
            )
        ) {
            return;
        }

        try {
            const opfs = OPFSManager.getInstance();
            await opfs.deleteProject(projectId);
            appStore.send({ type: "removeProject", projectId });
            toast.success("Project deleted successfully");
        } catch (err) {
            console.error("Failed to delete project:", err);
            toast.error("Failed to delete project");
        }
    };

    const handleEditProject = (project: Project) => {
        setEditingProject(project);
        // TODO: Implement edit dialog
        toast.info("Edit functionality coming soon!");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Loading application...
                    </p>
                </div>
            </div>
        );
    }

    if (!opfsSupported || error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <CardTitle>Browser Not Supported</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertDescription>
                                {error ||
                                    "Your browser does not support the required features for this application."}
                            </AlertDescription>
                        </Alert>
                        <p className="text-sm text-muted-foreground mt-4">
                            Please use a modern browser like Chrome, Edge, or
                            Firefox to access the EPUB editor.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">EPUB Editor</h1>
                    <p className="text-muted-foreground text-lg">
                        Create and edit EPUB books with advanced tools
                    </p>
                </div>

                {projects.length === 0 ? (
                    <div className="max-w-md mx-auto">
                        <Card className="text-center">
                            <CardHeader>
                                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <CardTitle>No Projects Yet</CardTitle>
                                <CardDescription>
                                    Upload an EPUB file to create your first
                                    project
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => setUploadDialogOpen(true)}
                                    size="lg"
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Project
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">
                                Your Projects
                            </h2>
                            <Button onClick={() => setUploadDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Project
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onDelete={handleDeleteProject}
                                    onEdit={handleEditProject}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <UploadDialog
                    open={uploadDialogOpen}
                    onOpenChange={setUploadDialogOpen}
                    onUpload={handleUpload}
                />
            </div>
        </div>
    );
}

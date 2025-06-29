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
import { ConfirmDeleteProjectDialog } from "@/components/ui/confirm-delete-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Logo from "@/components/logo";

export default function HomePage() {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(
        null
    );

    const { projects, isLoading, error, opfsSupported } = useSelector(
        appStore,
        (state) => state.context
    );

    useEffect(() => {
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
        initializeApp();
    }, []);

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
                err instanceof Error ? err.message : "Failed to upload ePUB"
            );
            throw err;
        } finally {
            appStore.send({ type: "setLoading", loading: false });
        }
    };

    const handleDeleteProject = (projectId: string) => {
        const project = projects.find((p) => p.id === projectId) || null;
        setProjectToDelete(project);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        try {
            const opfs = OPFSManager.getInstance();
            await opfs.deleteProject(projectToDelete.id);
            appStore.send({
                type: "removeProject",
                projectId: projectToDelete.id,
            });
            toast.success("Project deleted successfully");
        } catch (err) {
            console.error("Failed to delete project:", err);
            toast.error("Failed to delete project");
        } finally {
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Importing ePUB...</p>
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
                            Inkproof requires a modern updated browser to
                            operate.(e.g. Chrome, Edge, or Firefox.)
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background/95 p-8 flex flex-col">
            <div className="flex justify-between">
                <div className="flex flex-row items-center mb-6 grow-0">
                    <div className=" dark:text-black">
                        <Logo
                            width={100}
                            height={100}
                            className="text-black block dark:hidden"
                        />
                        <Logo
                            width={100}
                            height={100}
                            className="text-white hidden dark:block"
                        />
                    </div>
                    <div className="flex flex-col ">
                        <h1 className="text-4xl font-bold mb-2">
                            Inkproof Editor
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Edit ePUB books with advanced tools
                        </p>
                    </div>
                </div>
                <div>
                    <ThemeToggle />
                </div>
            </div>

            <div className="w-full justify-start items-start p-8 bg-muted-foreground/30 dark:bg-muted/50 min-h-3/4 grow-8 rounded-3xl">
                {projects.length === 0 ? (
                    <div className="max-w-md ">
                        <Card className="text-center bg-background/95">
                            <CardHeader className="flex flex-row items-center space-x-2 ">
                                <div>
                                    <BookOpen className="h-12 w-12 mx-auto  text-muted-foreground" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <CardTitle>No Projects Yet</CardTitle>
                                    <CardDescription>
                                        Upload an ePUB file to create your first
                                        project
                                    </CardDescription>
                                </div>
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
                        <div className="flex justify-between items-center mb-6 ">
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
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div className="pt-10">
                    <div className="text-2xl pt-2 font-semibold">
                        Recent Projects
                    </div>

                    <Separator className="border-2 my-2" />
                    <div className="max-w-md ">
                        {/* TODO: Implement Recent Projects */}
                        <Card className="bg-background/95">
                            <CardHeader>
                                <CardTitle>No Projects Yet</CardTitle>
                                <CardDescription>
                                    Upload an ePUB file to create your first
                                    project
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </div>

            <UploadDialog
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                onUpload={handleUpload}
            />

            <ConfirmDeleteProjectDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) setProjectToDelete(null);
                }}
                onConfirm={confirmDeleteProject}
                deleteName={projectToDelete?.name || ""}
            />

            {/* Bolt images in bottom right */}
            <div className="fixed bottom-6 right-6 z-50">
                {/* eslint-disable-next-line */}
                <img
                    src="/bolt_black_circle.png"
                    alt="Bolt Black"
                    className="size-30 block dark:hidden"
                />
                {/* eslint-disable-next-line */}
                <img
                    src="/bolt_white_circle.png"
                    alt="Bolt White"
                    className="size-30 hidden dark:block"
                />
            </div>
        </div>
    );
}

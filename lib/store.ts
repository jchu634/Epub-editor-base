import { createStore } from "@xstate/store";

export interface Project {
    id: string;
    name: string;
    createdAt: Date;
    lastModified: Date;
    metadata: {
        title: string;
        author: string;
        language: string;
    };
}

export interface AppState {
    projects: Project[];
    currentProject: Project | null;
    isLoading: boolean;
    error: string | null;
    opfsSupported: boolean;
    isPrettierEnabled: boolean;
}

export const appStore = createStore({
    // Initial context
    context: {
        projects: [] as Project[],
        currentProject: null as Project | null,
        isLoading: false,
        error: null as string | null,
        opfsSupported: false,
        isPrettierEnabled: true,
    },
    // Event handlers
    on: {
        setProjects: (
            context,
            event: { type: "setProjects"; projects: Project[] }
        ) => ({
            ...context,
            projects: event.projects,
        }),
        setCurrentProject: (
            context,
            event: { type: "setCurrentProject"; project: Project | null }
        ) => ({
            ...context,
            currentProject: event.project,
        }),
        setLoading: (
            context,
            event: { type: "setLoading"; loading: boolean }
        ) => ({
            ...context,
            isLoading: event.loading,
        }),
        setError: (
            context,
            event: { type: "setError"; error: string | null }
        ) => ({
            ...context,
            error: event.error,
        }),
        setOpfsSupported: (
            context,
            event: { type: "setOpfsSupported"; supported: boolean }
        ) => ({
            ...context,
            opfsSupported: event.supported,
        }),
        togglePrettier: (context) => ({
            ...context,
            isPrettierEnabled: !context.isPrettierEnabled,
        }),
        addProject: (
            context,
            event: { type: "addProject"; project: Project }
        ) => ({
            ...context,
            projects: [...context.projects, event.project],
        }),
        updateProject: (
            context,
            event: { type: "updateProject"; project: Project }
        ) => ({
            ...context,
            projects: context.projects.map((p) =>
                p.id === event.project.id ? event.project : p
            ),
            currentProject:
                context.currentProject?.id === event.project.id
                    ? event.project
                    : context.currentProject,
        }),
        removeProject: (
            context,
            event: { type: "removeProject"; projectId: string }
        ) => ({
            ...context,
            projects: context.projects.filter((p) => p.id !== event.projectId),
            currentProject:
                context.currentProject?.id === event.projectId
                    ? null
                    : context.currentProject,
        }),
    },
});
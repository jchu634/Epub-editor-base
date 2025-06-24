import { createStore } from '@xstate/store';

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
}

export const appStore = createStore(
  {
    projects: [] as Project[],
    currentProject: null as Project | null,
    isLoading: false,
    error: null as string | null,
    opfsSupported: false,
  },
  {
    setProjects: (context, event: { projects: Project[] }) => ({
      ...context,
      projects: event.projects,
    }),
    setCurrentProject: (context, event: { project: Project | null }) => ({
      ...context,
      currentProject: event.project,
    }),
    setLoading: (context, event: { loading: boolean }) => ({
      ...context,
      isLoading: event.loading,
    }),
    setError: (context, event: { error: string | null }) => ({
      ...context,
      error: event.error,
    }),
    setOpfsSupported: (context, event: { supported: boolean }) => ({
      ...context,
      opfsSupported: event.supported,
    }),
    addProject: (context, event: { project: Project }) => ({
      ...context,
      projects: [...context.projects, event.project],
    }),
    updateProject: (context, event: { project: Project }) => ({
      ...context,
      projects: context.projects.map(p => 
        p.id === event.project.id ? event.project : p
      ),
      currentProject: context.currentProject?.id === event.project.id 
        ? event.project 
        : context.currentProject,
    }),
    removeProject: (context, event: { projectId: string }) => ({
      ...context,
      projects: context.projects.filter(p => p.id !== event.projectId),
      currentProject: context.currentProject?.id === event.projectId 
        ? null 
        : context.currentProject,
    }),
  }
);
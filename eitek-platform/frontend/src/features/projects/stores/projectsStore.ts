import { create } from 'zustand';
import { Project, ProjectNode } from '../types';

interface ProjectsState {
  projects: Project[];
  tree: ProjectNode[];
  currentPath: { id: string; name: string }[];
  selectedNodeIds: string[];
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  
  // Basic CRUD
  setProjects: (projects: Project[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  
  // Tree operations
  fetchProjectTree: () => Promise<void>;
  navigateToNode: (nodeId: string) => void;
  selectNode: (nodeId: string) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  tree: [],
  currentPath: [],
  selectedNodeIds: [],
  isLoading: false,
  loading: false,
  error: null,
  
  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ isLoading: loading, loading }),
  setError: (error) => set({ error }),
  
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
    
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, ...updates } : project
      ),
    })),
    
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    })),
    
  fetchProjectTree: async () => {
    set({ loading: true, error: null });
    try {
      // Mock implementation - replace with actual API call
      const mockTree: ProjectNode[] = [
        {
          id: '1',
          name: 'Sample Project',
          description: 'A sample project',
          type: 'project' as any, // Override the Project's type field
          status: 'Active',
          level: 0,
          path: '/sample-project',
          settings: {} as any, // Mock settings
          ownerId: 'user-1',
          members: [],
          deviceCount: 5,
          dashboardCount: 2,
          templateCount: 1,
          stats: {
            totalDevices: 5,
            onlineDevices: 4,
            totalAlarms: 0,
            activeAlarms: 0,
            totalDataPoints: 1000
          },
          tags: ['sample'],
          metadata: {},
          version: '1.0.0',
          createdTime: new Date().toISOString(),
          updatedTime: new Date().toISOString(),
          createdBy: 'user-1',
          lastModifiedBy: 'user-1'
        }
      ];
      set({ tree: mockTree, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  navigateToNode: (nodeId) => {
    // Mock implementation
    console.log('Navigating to node:', nodeId);
  },
  
  selectNode: (nodeId) => {
    set((state) => ({ 
      selectedNodeIds: state.selectedNodeIds.includes(nodeId) 
        ? state.selectedNodeIds.filter(id => id !== nodeId)
        : [...state.selectedNodeIds, nodeId]
    }));
  },
  
  createProject: async (projectData) => {
    set({ loading: true });
    try {
      // Mock implementation - replace with actual API call
      const newProject: Project = {
        ...projectData,
        id: Date.now().toString(),
        type: 'Industrial',
        status: 'Active',
        level: 0,
        path: `/${projectData.name.toLowerCase().replace(/\s+/g, '-')}`,
        children: [],
        settings: {} as any,
        ownerId: 'user-1',
        members: [],
        deviceCount: 0,
        dashboardCount: 0,
        templateCount: 0,
        stats: {
          totalDevices: 0,
          onlineDevices: 0,
          totalAlarms: 0,
          activeAlarms: 0,
          totalDataPoints: 0
        },
        tags: [],
        metadata: {},
        version: '1.0.0',
        createdTime: new Date().toISOString(),
        updatedTime: new Date().toISOString(),
        createdBy: 'user-1',
        lastModifiedBy: 'user-1'
      };
      get().addProject(newProject);
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  createFolder: async (name, parentId) => {
    set({ loading: true });
    try {
      // Mock implementation - replace with actual API call
      console.log('Creating folder:', name, 'with parent:', parentId);
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
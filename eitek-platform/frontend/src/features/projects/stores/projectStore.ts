import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Project,
  ProjectTemplate,
  ProjectTreeNode,
  ProjectFilters,
  ProjectSort,
  ProjectActivity,
  ProjectBackup,
  ProjectInvitation,
  ProjectMoveRequest,
} from '../types';
import { projectService } from '../services/projectService';

interface ProjectState {
  // Data state
  projects: Project[];
  currentProject: Project | null;
  projectTree: ProjectTreeNode[];
  templates: ProjectTemplate[];
  recentProjects: Project[];
  favoriteProjects: Project[];
  
  // UI state
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // Tree view state
  expandedNodes: Set<string>;
  selectedNode: string | null;
  
  // List state
  pagination: {
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  };
  
  // Filters and sorting
  filters: ProjectFilters;
  sort: ProjectSort;
  
  // Modal states
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isTemplateModalOpen: boolean;
  isMembersModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isBackupModalOpen: boolean;
  isImportModalOpen: boolean;
  isExportModalOpen: boolean;
  isMoveModalOpen: boolean;
  
  // Activities and audit
  activities: ProjectActivity[];
  backups: ProjectBackup[];
  invitations: ProjectInvitation[];
  
  // View mode
  viewMode: 'tree' | 'list' | 'grid' | 'card';
}

interface ProjectActions {
  // Data actions
  fetchProjects: (params?: any) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  fetchProjectTree: (rootId?: string) => Promise<void>;
  createProject: (data: any) => Promise<void>;
  updateProject: (data: any) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  deleteProjects: (ids: string[]) => Promise<void>;
  
  // Project hierarchy
  moveProject: (projectId: string, newParentId?: string) => Promise<void>;
  cloneProject: (projectId: string, data: any) => Promise<void>;
  
  // Template actions
  fetchTemplates: (category?: string) => Promise<void>;
  createProjectFromTemplate: (templateId: string, data: any) => Promise<void>;
  
  // Tree actions
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  toggleNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  
  // Project context
  setCurrentProject: (project: Project | null) => void;
  
  // Filter and sort actions
  setFilters: (filters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: ProjectSort) => void;
  setSearch: (search: string) => void;
  
  // Modal actions
  openCreateModal: () => void;
  openEditModal: (project: Project) => void;
  openDeleteModal: (project: Project) => void;
  openTemplateModal: () => void;
  openMembersModal: (project: Project) => void;
  openSettingsModal: (project: Project) => void;
  openBackupModal: (project: Project) => void;
  openImportModal: () => void;
  openExportModal: (project: Project) => void;
  openMoveModal: (project: Project) => void;
  closeAllModals: () => void;
  
  // Activities
  fetchActivities: (projectId: string) => Promise<void>;
  
  // Backups
  fetchBackups: (projectId: string) => Promise<void>;
  createBackup: (projectId: string, data: any) => Promise<void>;
  restoreBackup: (projectId: string, backupId: string) => Promise<void>;
  deleteBackup: (projectId: string, backupId: string) => Promise<void>;
  
  // Invitations
  fetchInvitations: (projectId?: string) => Promise<void>;
  inviteUsers: (projectId: string, data: any) => Promise<void>;
  respondToInvitation: (invitationId: string, accept: boolean) => Promise<void>;
  
  // Favorites
  fetchFavorites: () => Promise<void>;
  addToFavorites: (projectId: string) => Promise<void>;
  removeFromFavorites: (projectId: string) => Promise<void>;
  
  // Recent projects
  fetchRecentProjects: () => Promise<void>;
  
  // Pagination actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // View actions
  setViewMode: (mode: 'tree' | 'list' | 'grid' | 'card') => void;
  
  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  reset: () => void;
}

const initialFilters: ProjectFilters = {
  search: '',
  types: [],
  statuses: [],
  tags: [],
  ownedByMe: false,
  memberOfMe: false,
};

const initialSort: ProjectSort = {
  field: 'name',
  direction: 'asc',
};

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  projectTree: [],
  templates: [],
  recentProjects: [],
  favoriteProjects: [],
  
  loading: false,
  saving: false,
  error: null,
  
  expandedNodes: new Set(),
  selectedNode: null,
  
  pagination: {
    page: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
  },
  
  filters: initialFilters,
  sort: initialSort,
  
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isTemplateModalOpen: false,
  isMembersModalOpen: false,
  isSettingsModalOpen: false,
  isBackupModalOpen: false,
  isImportModalOpen: false,
  isExportModalOpen: false,
  isMoveModalOpen: false,
  
  activities: [],
  backups: [],
  invitations: [],
  
  viewMode: 'tree',
};

export const useProjectStore = create<ProjectState & ProjectActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Data actions
          fetchProjects: async (params) => {
            try {
              set((state) => {
                state.loading = true;
                state.error = null;
              });

              const { filters, sort, pagination } = get();
              const requestParams = {
                page: pagination.page,
                pageSize: pagination.pageSize,
                sortBy: sort.field,
                sortOrder: sort.direction.toUpperCase() as 'ASC' | 'DESC',
                ...params,
              };

              // Apply filters
              if (filters.search) requestParams.search = filters.search;
              if (filters.types.length > 0) requestParams.types = filters.types;
              if (filters.statuses.length > 0) requestParams.statuses = filters.statuses;
              if (filters.tags.length > 0) requestParams.tags = filters.tags;
              if (filters.ownedByMe) requestParams.ownedByMe = filters.ownedByMe;
              if (filters.memberOfMe) requestParams.memberOfMe = filters.memberOfMe;

              const response = await projectService.getProjects(requestParams);

              set((state) => {
                state.projects = response.data;
                state.pagination = {
                  ...state.pagination,
                  totalElements: response.totalElements,
                  totalPages: response.totalPages,
                  hasNext: response.hasNext,
                };
                state.loading = false;
              });
            } catch (error) {
              set((state) => {
                state.loading = false;
                state.error = error instanceof Error ? error.message : 'Failed to fetch projects';
              });
            }
          },

          fetchProject: async (id) => {
            try {
              set((state) => {
                state.loading = true;
                state.error = null;
              });

              const project = await projectService.getProject(id);

              set((state) => {
                state.currentProject = project;
                state.loading = false;
              });
            } catch (error) {
              set((state) => {
                state.loading = false;
                state.error = error instanceof Error ? error.message : 'Failed to fetch project';
              });
            }
          },

          fetchProjectTree: async (rootId) => {
            try {
              set((state) => {
                state.loading = true;
                state.error = null;
              });

              const tree = await projectService.getProjectTree(rootId);

              set((state) => {
                state.projectTree = tree;
                state.loading = false;
              });
            } catch (error) {
              set((state) => {
                state.loading = false;
                state.error = error instanceof Error ? error.message : 'Failed to fetch project tree';
              });
            }
          },

          createProject: async (data) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              const project = await projectService.createProject(data);

              set((state) => {
                state.projects.unshift(project);
                state.saving = false;
                state.isCreateModalOpen = false;
              });

              // Refresh data
              get().fetchProjects();
              get().fetchProjectTree();
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to create project';
              });
            }
          },

          updateProject: async (data) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              const updatedProject = await projectService.updateProject(data);

              set((state) => {
                const index = state.projects.findIndex(p => p.id === data.id);
                if (index !== -1) {
                  state.projects[index] = updatedProject;
                }
                if (state.currentProject?.id === data.id) {
                  state.currentProject = updatedProject;
                }
                state.saving = false;
                state.isEditModalOpen = false;
              });
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to update project';
              });
            }
          },

          deleteProject: async (id) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              await projectService.deleteProject(id);

              set((state) => {
                state.projects = state.projects.filter(p => p.id !== id);
                if (state.currentProject?.id === id) {
                  state.currentProject = null;
                }
                state.saving = false;
                state.isDeleteModalOpen = false;
              });

              // Refresh tree
              get().fetchProjectTree();
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to delete project';
              });
            }
          },

          deleteProjects: async (ids) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              await projectService.deleteProjects(ids);

              set((state) => {
                state.projects = state.projects.filter(p => !ids.includes(p.id));
                if (state.currentProject && ids.includes(state.currentProject.id)) {
                  state.currentProject = null;
                }
                state.saving = false;
              });

              // Refresh tree
              get().fetchProjectTree();
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to delete projects';
              });
            }
          },

          // Project hierarchy
          moveProject: async (projectId, newParentId) => {
            try {
              const request: ProjectMoveRequest = { projectId };
              if (newParentId !== undefined) {
                request.newParentId = newParentId;
              }
              const updatedProject = await projectService.moveProject(request);

              set((state) => {
                const index = state.projects.findIndex(p => p.id === projectId);
                if (index !== -1) {
                  state.projects[index] = updatedProject;
                }
                state.isMoveModalOpen = false;
              });

              // Refresh tree
              get().fetchProjectTree();
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to move project';
              });
            }
          },

          cloneProject: async (projectId, data) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              const clonedProject = await projectService.cloneProject({
                projectId,
                ...data,
              });

              set((state) => {
                state.projects.unshift(clonedProject);
                state.saving = false;
              });

              // Refresh data
              get().fetchProjects();
              get().fetchProjectTree();
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to clone project';
              });
            }
          },

          // Template actions
          fetchTemplates: async (category) => {
            try {
              const templates = await projectService.getProjectTemplates(category);
              set((state) => {
                state.templates = templates;
              });
            } catch (error) {
              console.error('Failed to fetch templates:', error);
            }
          },

          createProjectFromTemplate: async (templateId, data) => {
            try {
              set((state) => {
                state.saving = true;
                state.error = null;
              });

              const project = await projectService.createProjectFromTemplate(templateId, data);

              set((state) => {
                state.projects.unshift(project);
                state.saving = false;
                state.isTemplateModalOpen = false;
              });

              // Refresh data
              get().fetchProjects();
              get().fetchProjectTree();
            } catch (error) {
              set((state) => {
                state.saving = false;
                state.error = error instanceof Error ? error.message : 'Failed to create project from template';
              });
            }
          },

          // Tree actions
          expandNode: (nodeId) => {
            set((state) => {
              state.expandedNodes.add(nodeId);
            });
          },

          collapseNode: (nodeId) => {
            set((state) => {
              state.expandedNodes.delete(nodeId);
            });
          },

          toggleNode: (nodeId) => {
            set((state) => {
              if (state.expandedNodes.has(nodeId)) {
                state.expandedNodes.delete(nodeId);
              } else {
                state.expandedNodes.add(nodeId);
              }
            });
          },

          selectNode: (nodeId) => {
            set((state) => {
              state.selectedNode = nodeId;
            });
          },

          // Project context
          setCurrentProject: (project) => {
            set((state) => {
              state.currentProject = project;
            });
          },

          // Filter and sort actions
          setFilters: (filters) => {
            set((state) => {
              state.filters = { ...state.filters, ...filters };
              state.pagination.page = 0;
            });
            get().fetchProjects();
          },

          resetFilters: () => {
            set((state) => {
              state.filters = initialFilters;
              state.pagination.page = 0;
            });
            get().fetchProjects();
          },

          setSort: (sort) => {
            set((state) => {
              state.sort = sort;
              state.pagination.page = 0;
            });
            get().fetchProjects();
          },

          setSearch: (search) => {
            set((state) => {
              state.filters.search = search;
              state.pagination.page = 0;
            });
            // Debounce search
            setTimeout(() => {
              get().fetchProjects();
            }, 300);
          },

          // Modal actions
          openCreateModal: () => {
            set((state) => {
              state.isCreateModalOpen = true;
            });
          },

          openEditModal: (project) => {
            set((state) => {
              state.currentProject = project;
              state.isEditModalOpen = true;
            });
          },

          openDeleteModal: (project) => {
            set((state) => {
              state.currentProject = project;
              state.isDeleteModalOpen = true;
            });
          },

          openTemplateModal: () => {
            set((state) => {
              state.isTemplateModalOpen = true;
            });
          },

          openMembersModal: (project) => {
            set((state) => {
              state.currentProject = project;
              state.isMembersModalOpen = true;
            });
          },

          openSettingsModal: (project) => {
            set((state) => {
              state.currentProject = project;
              state.isSettingsModalOpen = true;
            });
          },

          openBackupModal: (project) => {
            set((state) => {
              state.currentProject = project;
              state.isBackupModalOpen = true;
            });
          },

          openImportModal: () => {
            set((state) => {
              state.isImportModalOpen = true;
            });
          },

          openExportModal: (project) => {
            set((state) => {
              state.currentProject = project;
              state.isExportModalOpen = true;
            });
          },

          openMoveModal: (project) => {
            set((state) => {
              state.currentProject = project;
              state.isMoveModalOpen = true;
            });
          },

          closeAllModals: () => {
            set((state) => {
              state.isCreateModalOpen = false;
              state.isEditModalOpen = false;
              state.isDeleteModalOpen = false;
              state.isTemplateModalOpen = false;
              state.isMembersModalOpen = false;
              state.isSettingsModalOpen = false;
              state.isBackupModalOpen = false;
              state.isImportModalOpen = false;
              state.isExportModalOpen = false;
              state.isMoveModalOpen = false;
            });
          },

          // Activities
          fetchActivities: async (projectId) => {
            try {
              const response = await projectService.getProjectActivities(projectId);
              set((state) => {
                state.activities = response.data;
              });
            } catch (error) {
              console.error('Failed to fetch activities:', error);
            }
          },

          // Backups
          fetchBackups: async (projectId) => {
            try {
              const backups = await projectService.getProjectBackups(projectId);
              set((state) => {
                state.backups = backups;
              });
            } catch (error) {
              console.error('Failed to fetch backups:', error);
            }
          },

          createBackup: async (projectId, data) => {
            try {
              const backup = await projectService.createProjectBackup(projectId, data);
              set((state) => {
                state.backups.unshift(backup);
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to create backup';
              });
            }
          },

          restoreBackup: async (projectId, backupId) => {
            try {
              await projectService.restoreProjectBackup(projectId, backupId);
              // Refresh project data
              get().fetchProject(projectId);
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to restore backup';
              });
            }
          },

          deleteBackup: async (projectId, backupId) => {
            try {
              await projectService.deleteProjectBackup(projectId, backupId);
              set((state) => {
                state.backups = state.backups.filter(b => b.id !== backupId);
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to delete backup';
              });
            }
          },

          // Invitations
          fetchInvitations: async (projectId) => {
            try {
              const invitations = await projectService.getInvitations(projectId);
              set((state) => {
                state.invitations = invitations;
              });
            } catch (error) {
              console.error('Failed to fetch invitations:', error);
            }
          },

          inviteUsers: async (projectId, data) => {
            try {
              const invitation = await projectService.inviteUsers({ projectId, ...data });
              set((state) => {
                state.invitations.unshift(invitation);
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to send invitations';
              });
            }
          },

          respondToInvitation: async (invitationId, accept) => {
            try {
              await projectService.respondToInvitation(invitationId, accept);
              set((state) => {
                const invitation = state.invitations.find(i => i.id === invitationId);
                if (invitation) {
                  invitation.status = accept ? 'Accepted' : 'Rejected';
                  invitation.respondedTime = new Date().toISOString();
                }
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to respond to invitation';
              });
            }
          },

          // Favorites
          fetchFavorites: async () => {
            try {
              const favorites = await projectService.getFavoriteProjects();
              set((state) => {
                state.favoriteProjects = favorites;
              });
            } catch (error) {
              console.error('Failed to fetch favorites:', error);
            }
          },

          addToFavorites: async (projectId) => {
            try {
              await projectService.addToFavorites(projectId);
              get().fetchFavorites();
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to add to favorites';
              });
            }
          },

          removeFromFavorites: async (projectId) => {
            try {
              await projectService.removeFromFavorites(projectId);
              get().fetchFavorites();
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to remove from favorites';
              });
            }
          },

          // Recent projects
          fetchRecentProjects: async () => {
            try {
              const recent = await projectService.getRecentProjects();
              set((state) => {
                state.recentProjects = recent;
              });
            } catch (error) {
              console.error('Failed to fetch recent projects:', error);
            }
          },

          // Pagination actions
          setPage: (page) => {
            set((state) => {
              state.pagination.page = page;
            });
            get().fetchProjects();
          },

          setPageSize: (pageSize) => {
            set((state) => {
              state.pagination.pageSize = pageSize;
              state.pagination.page = 0;
            });
            get().fetchProjects();
          },

          // View actions
          setViewMode: (mode) => {
            set((state) => {
              state.viewMode = mode;
            });
          },

          // Utility actions
          setError: (error) => {
            set((state) => {
              state.error = error;
            });
          },

          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },

          setLoading: (loading) => {
            set((state) => {
              state.loading = loading;
            });
          },

          setSaving: (saving) => {
            set((state) => {
              state.saving = saving;
            });
          },

          reset: () => {
            set(() => initialState);
          },
        }))
      ),
      {
        name: 'project-store',
        partialize: (state) => ({
          viewMode: state.viewMode,
          expandedNodes: Array.from(state.expandedNodes),
          pagination: {
            pageSize: state.pagination.pageSize,
          },
          filters: state.filters,
          sort: state.sort,
        }),
        merge: (persistedState: any, currentState) => ({
          ...currentState,
          ...persistedState,
          expandedNodes: new Set(persistedState.expandedNodes || []),
        }),
      }
    ),
    {
      name: 'project-store',
    }
  )
);
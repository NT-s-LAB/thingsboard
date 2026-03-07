import { apiClient } from '@/shared/services/api';
import type {
  Project,
  ProjectTemplate,
  ProjectInvitation,
  ProjectActivity,
  ProjectBackup,
  ProjectTreeNode,
  ProjectMember,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectListParams,
  ProjectListResponse,
  ProjectMemberUpdateRequest,
  ProjectInviteRequest,
  ProjectMoveRequest,
  ProjectCloneRequest,
  ProjectExportRequest,
  ProjectImportRequest,
  ProjectStatsRequest,
  ProjectStatsResponse,
} from '../types';

class ProjectService {
  // Project CRUD operations
  async getProjects(params: ProjectListParams = {}): Promise<ProjectListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.parentId !== undefined) queryParams.append('parentId', params.parentId);
    if (params.search) queryParams.append('search', params.search);
    if (params.types?.length) {
      params.types.forEach(type => queryParams.append('type', type));
    }
    if (params.statuses?.length) {
      params.statuses.forEach(status => queryParams.append('status', status));
    }
    if (params.tags?.length) {
      params.tags.forEach(tag => queryParams.append('tag', tag));
    }
    if (params.ownedByMe !== undefined) queryParams.append('ownedByMe', params.ownedByMe.toString());
    if (params.memberOfMe !== undefined) queryParams.append('memberOfMe', params.memberOfMe.toString());
    if (params.includeChildren !== undefined) queryParams.append('includeChildren', params.includeChildren.toString());
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<ProjectListResponse>(`/projects?${queryParams.toString()}`);
    return response;
  }

  async getProject(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response;
  }

  async createProject(data: ProjectCreateRequest): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', data);
    return response;
  }

  async updateProject(data: ProjectUpdateRequest): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${data.id}`, data);
    return response;
  }

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  }

  async deleteProjects(ids: string[]): Promise<void> {
    await apiClient.deleteWithBody('/projects/bulk', { projectIds: ids });
  }

  // Project hierarchy operations
  async getProjectTree(rootId?: string): Promise<ProjectTreeNode[]> {
    const queryParams = rootId ? `?rootId=${rootId}` : '';
    const response = await apiClient.get<ProjectTreeNode[]>(`/projects/tree${queryParams}`);
    return response;
  }

  async moveProject(data: ProjectMoveRequest): Promise<Project> {
    const response = await apiClient.post<Project>(`/projects/${data.projectId}/move`, data);
    return response;
  }

  async cloneProject(data: ProjectCloneRequest): Promise<Project> {
    const response = await apiClient.post<Project>(`/projects/${data.projectId}/clone`, data);
    return response;
  }

  // Project members
  async getProjectMembers(projectId: string): Promise<any[]> {
    const response = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);
    return response;
  }

  async addProjectMember(data: ProjectMemberUpdateRequest): Promise<any> {
    const response = await apiClient.post<ProjectMember>(`/projects/${data.projectId}/members`, data);
    return response;
  }

  async updateProjectMember(data: ProjectMemberUpdateRequest): Promise<any> {
    const response = await apiClient.put<ProjectMember>(`/projects/${data.projectId}/members/${data.userId}`, data);
    return response;
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  }

  async leaveProject(projectId: string): Promise<void> {
    await apiClient.post(`/projects/${projectId}/leave`);
  }

  // Project invitations
  async inviteUsers(data: ProjectInviteRequest): Promise<ProjectInvitation> {
    const response = await apiClient.post<ProjectInvitation>(`/projects/${data.projectId}/invite`, data);
    return response;
  }

  async getInvitations(projectId?: string): Promise<ProjectInvitation[]> {
    const queryParams = projectId ? `?projectId=${projectId}` : '';
    const response = await apiClient.get<ProjectInvitation[]>(`/invitations${queryParams}`);
    return response;
  }

  async respondToInvitation(invitationId: string, accept: boolean): Promise<void> {
    await apiClient.post(`/invitations/${invitationId}/respond`, { accept });
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    await apiClient.delete(`/invitations/${invitationId}`);
  }

  // Project templates
  async getProjectTemplates(category?: string): Promise<ProjectTemplate[]> {
    const queryParams = category ? `?category=${category}` : '';
    const response = await apiClient.get<ProjectTemplate[]>(`/projects/templates${queryParams}`);
    return response;
  }

  async getProjectTemplate(id: string): Promise<ProjectTemplate> {
    const response = await apiClient.get<ProjectTemplate>(`/projects/templates/${id}`);
    return response;
  }

  async createProjectTemplate(template: Omit<ProjectTemplate, 'id' | 'createdTime' | 'updatedTime' | 'createdBy' | 'usageCount' | 'rating' | 'reviews'>): Promise<ProjectTemplate> {
    const response = await apiClient.post<ProjectTemplate>('/projects/templates', template);
    return response;
  }

  async updateProjectTemplate(template: ProjectTemplate): Promise<ProjectTemplate> {
    const response = await apiClient.put<ProjectTemplate>(`/projects/templates/${template.id}`, template);
    return response;
  }

  async deleteProjectTemplate(id: string): Promise<void> {
    await apiClient.delete(`/projects/templates/${id}`);
  }

  async createProjectFromTemplate(templateId: string, data: ProjectCreateRequest): Promise<Project> {
    const response = await apiClient.post<Project>(`/projects/templates/${templateId}/create`, data);
    return response;
  }

  // Project activities
  async getProjectActivities(projectId: string, page = 0, pageSize = 50): Promise<{ data: ProjectActivity[], totalElements: number }> {
    const response = await apiClient.get<{ data: ProjectActivity[], totalElements: number }>(`/projects/${projectId}/activities?page=${page}&pageSize=${pageSize}`);
    return response;
  }

  async logActivity(projectId: string, activity: Omit<ProjectActivity, 'id' | 'timestamp' | 'projectId' | 'userId' | 'userName'>): Promise<ProjectActivity> {
    const response = await apiClient.post<ProjectActivity>(`/projects/${projectId}/activities`, activity);
    return response;
  }

  // Project backup and restore
  async getProjectBackups(projectId: string): Promise<ProjectBackup[]> {
    const response = await apiClient.get<ProjectBackup[]>(`/projects/${projectId}/backups`);
    return response;
  }

  async createProjectBackup(projectId: string, backup: Omit<ProjectBackup, 'id' | 'status' | 'createdTime' | 'createdBy'>): Promise<ProjectBackup> {
    const response = await apiClient.post<ProjectBackup>(`/projects/${projectId}/backups`, backup);
    return response;
  }

  async restoreProjectBackup(projectId: string, backupId: string): Promise<void> {
    await apiClient.post(`/projects/${projectId}/backups/${backupId}/restore`);
  }

  async deleteProjectBackup(projectId: string, backupId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/backups/${backupId}`);
  }

  async downloadProjectBackup(projectId: string, backupId: string): Promise<Blob> {
    const response = await apiClient.getBlob(`/projects/${projectId}/backups/${backupId}/download`);
    return response;
  }

  // Project statistics
  async getProjectStats(request: ProjectStatsRequest): Promise<ProjectStatsResponse> {
    const response = await apiClient.post<ProjectStatsResponse>(`/projects/${request.projectId}/stats`, request);
    return response;
  }

  async getProjectSummary(projectId: string): Promise<{
    overview: any;
    devices: any;
    dashboards: any;
    alarms: any;
    activities: any;
  }> {
    const response = await apiClient.get<any>(`/projects/${projectId}/summary`);
    return response;
  }

  // Import/Export
  async exportProject(request: ProjectExportRequest): Promise<Blob> {
    const response = await apiClient.postBlob(`/projects/${request.projectId}/export`, request);
    return response;
  }

  async importProject(request: ProjectImportRequest): Promise<{ 
    project: Project; 
    report: { 
      imported: number; 
      skipped: number; 
      errors: any[] 
    } 
  }> {
    const formData = new FormData();
    formData.append('file', request.file);
    if (request.parentId) formData.append('parentId', request.parentId);
    formData.append('options', JSON.stringify(request.options));

    const response = await apiClient.postFormData<{ project: Project, report: { imported: number, skipped: number, errors: any[] } }>('/projects/import', formData);
    return response;
  }

  // Project settings
  async updateProjectSettings(projectId: string, settings: any): Promise<any> {
    const response = await apiClient.put<any>(`/projects/${projectId}/settings`, settings);
    return response;
  }

  async getProjectPermissions(projectId: string): Promise<string[]> {
    const response = await apiClient.get<any>(`/projects/${projectId}/permissions`);
    return response;
  }

  // Project files and attachments
  async uploadProjectFile(projectId: string, file: File, description?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);

    const response = await apiClient.postFormData<any>(`/projects/${projectId}/files`, formData);
    return response;
  }

  async getProjectFiles(projectId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/projects/${projectId}/files`);
    return response;
  }

  async deleteProjectFile(projectId: string, fileId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/files/${fileId}`);
  }

  async downloadProjectFile(projectId: string, fileId: string): Promise<Blob> {
    const response = await apiClient.getBlob(`/projects/${projectId}/files/${fileId}/download`);
    return response;
  }

  // Search and discovery
  async searchProjects(query: string, filters?: any): Promise<Project[]> {
    const queryParams = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get<Project[]>(`/projects/search?${queryParams.toString()}`);
    return response;
  }

  async getRecentProjects(limit = 10): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(`/projects/recent?limit=${limit}`);
    return response;
  }

  async getFavoriteProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects/favorites');
    return response;
  }

  async addToFavorites(projectId: string): Promise<void> {
    await apiClient.post(`/projects/${projectId}/favorite`);
  }

  async removeFromFavorites(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/favorite`);
  }

  // Project validation
  async validateProject(project: Partial<Project>): Promise<{
    valid: boolean;
    errors: Array<{
      field: string;
      message: string;
      code: string;
    }>;
    warnings: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  }> {
    const response = await apiClient.post<{
      valid: boolean;
      errors: Array<{
        field: string;
        message: string;
        code: string;
      }>;
      warnings: Array<{
        field: string;
        message: string;
        code: string;
      }>;
    }>('/projects/validate', project);
    return response;
  }

  // Bulk operations
  async bulkUpdateProjects(projectIds: string[], updates: Partial<Project>): Promise<void> {
    await apiClient.put('/projects/bulk', { projectIds, updates });
  }

  async bulkMoveProjects(projectIds: string[], parentId?: string): Promise<void> {
    await apiClient.post('/projects/bulk/move', { projectIds, parentId });
  }

  async bulkArchiveProjects(projectIds: string[]): Promise<void> {
    await apiClient.post('/projects/bulk/archive', { projectIds });
  }

  async bulkRestoreProjects(projectIds: string[]): Promise<void> {
    await apiClient.post('/projects/bulk/restore', { projectIds });
  }
}

export const projectService = new ProjectService();

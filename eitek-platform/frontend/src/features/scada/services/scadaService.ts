import { apiClient } from '@/shared/services/api';
import type {
  ScadaDashboard,
  DashboardCreateRequest,
  DashboardUpdateRequest,
  DashboardListParams,
  DashboardListResponse,
  Widget,
  ScadaTemplate,
  ScadaVariable,
  ScadaScript,
  ScadaLayer,
} from '../types';

class ScadaService {
  // Dashboard CRUD operations
  async getDashboards(params: DashboardListParams = {}): Promise<DashboardListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.projectId) queryParams.append('projectId', params.projectId);
    if (params.search) queryParams.append('search', params.search);
    if (params.tags?.length) {
      params.tags.forEach(tag => queryParams.append('tag', tag));
    }
    if (params.createdBy) queryParams.append('createdBy', params.createdBy);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());

    const response = await apiClient.get<DashboardListResponse>(`/scada/dashboards?${queryParams.toString()}`);
    return response;
  }

  async getDashboard(id: string): Promise<ScadaDashboard> {
    const response = await apiClient.get<ScadaDashboard>(`/scada/dashboards/${id}`);
    return response;
  }

  async createDashboard(data: DashboardCreateRequest): Promise<ScadaDashboard> {
    const response = await apiClient.post<ScadaDashboard>('/scada/dashboards', data);
    return response;
  }

  async updateDashboard(data: DashboardUpdateRequest): Promise<ScadaDashboard> {
    const response = await apiClient.put<ScadaDashboard>(`/scada/dashboards/${data.id}`, data);
    return response;
  }

  async deleteDashboard(id: string): Promise<void> {
    await apiClient.delete(`/scada/dashboards/${id}`);
  }

  async cloneDashboard(id: string, name: string): Promise<ScadaDashboard> {
    const response = await apiClient.post<ScadaDashboard>(`/scada/dashboards/${id}/clone`, { name });
    return response;
  }

  // Widget operations
  async addWidget(dashboardId: string, widget: Omit<Widget, 'id' | 'createdTime' | 'updatedTime' | 'createdBy'>): Promise<Widget> {
    const response = await apiClient.post<Widget>(`/scada/dashboards/${dashboardId}/widgets`, widget);
    return response;
  }

  async updateWidget(dashboardId: string, widget: Widget): Promise<Widget> {
    const response = await apiClient.put<Widget>(`/scada/dashboards/${dashboardId}/widgets/${widget.id}`, widget);
    return response;
  }

  async deleteWidget(dashboardId: string, widgetId: string): Promise<void> {
    await apiClient.delete(`/scada/dashboards/${dashboardId}/widgets/${widgetId}`);
  }

  async duplicateWidget(dashboardId: string, widgetId: string): Promise<Widget> {
    const response = await apiClient.post<Widget>(`/scada/dashboards/${dashboardId}/widgets/${widgetId}/duplicate`);
    return response;
  }

  async bulkUpdateWidgets(dashboardId: string, widgets: Widget[]): Promise<Widget[]> {
    const response = await apiClient.put<Widget[]>(`/scada/dashboards/${dashboardId}/widgets/bulk`, { widgets });
    return response;
  }

  // Layer operations
  async createLayer(dashboardId: string, name: string): Promise<any> {
    const response = await apiClient.post<ScadaLayer>(`/scada/dashboards/${dashboardId}/layers`, { name });
    return response;
  }

  async updateLayer(dashboardId: string, layer: any): Promise<any> {
    const response = await apiClient.put<ScadaLayer>(`/scada/dashboards/${dashboardId}/layers/${layer.id}`, layer);
    return response;
  }

  async deleteLayer(dashboardId: string, layerId: string): Promise<void> {
    await apiClient.delete(`/scada/dashboards/${dashboardId}/layers/${layerId}`);
  }

  async moveWidgetToLayer(dashboardId: string, widgetId: string, layerId: string): Promise<void> {
    await apiClient.post(`/scada/dashboards/${dashboardId}/widgets/${widgetId}/layer`, { layerId });
  }

  // Variable operations
  async createVariable(dashboardId: string, variable: Omit<ScadaVariable, 'id'>): Promise<ScadaVariable> {
    const response = await apiClient.post<ScadaVariable>(`/scada/dashboards/${dashboardId}/variables`, variable);
    return response;
  }

  async updateVariable(dashboardId: string, variable: ScadaVariable): Promise<ScadaVariable> {
    const response = await apiClient.put<ScadaVariable>(`/scada/dashboards/${dashboardId}/variables/${variable.id}`, variable);
    return response;
  }

  async deleteVariable(dashboardId: string, variableId: string): Promise<void> {
    await apiClient.delete(`/scada/dashboards/${dashboardId}/variables/${variableId}`);
  }

  // Script operations
  async createScript(dashboardId: string, script: Omit<ScadaScript, 'id'>): Promise<ScadaScript> {
    const response = await apiClient.post<ScadaScript>(`/scada/dashboards/${dashboardId}/scripts`, script);
    return response;
  }

  async updateScript(dashboardId: string, script: ScadaScript): Promise<ScadaScript> {
    const response = await apiClient.put<ScadaScript>(`/scada/dashboards/${dashboardId}/scripts/${script.id}`, script);
    return response;
  }

  async deleteScript(dashboardId: string, scriptId: string): Promise<void> {
    await apiClient.delete(`/scada/dashboards/${dashboardId}/scripts/${scriptId}`);
  }

  async testScript(dashboardId: string, script: ScadaScript): Promise<{ success: boolean; result?: any; error?: string }> {
    const response = await apiClient.post<any>(`/scada/dashboards/${dashboardId}/scripts/test`, script);
    return response;
  }

  // Template operations
  async getTemplates(category?: string): Promise<ScadaTemplate[]> {
    const queryParams = category ? `?category=${category}` : '';
    const response = await apiClient.get<ScadaTemplate[]>(`/scada/templates${queryParams}`);
    return response;
  }

  async getTemplate(id: string): Promise<ScadaTemplate> {
    const response = await apiClient.get<ScadaTemplate>(`/scada/templates/${id}`);
    return response;
  }

  async createTemplate(template: Omit<ScadaTemplate, 'id' | 'createdTime' | 'updatedTime'>): Promise<ScadaTemplate> {
    const response = await apiClient.post<ScadaTemplate>('/scada/templates', template);
    return response;
  }

  async updateTemplate(template: ScadaTemplate): Promise<ScadaTemplate> {
    const response = await apiClient.put<ScadaTemplate>(`/scada/templates/${template.id}`, template);
    return response;
  }

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/scada/templates/${id}`);
  }

  async createDashboardFromTemplate(templateId: string, name: string, projectId: string): Promise<ScadaDashboard> {
    const response = await apiClient.post<ScadaDashboard>('/scada/dashboards/from-template', {
      templateId,
      name,
      projectId,
    });
    return response;
  }

  // Runtime operations
  async startRuntime(dashboardId: string): Promise<{ sessionId: string }> {
    const response = await apiClient.post<{ sessionId: string }>(`/scada/dashboards/${dashboardId}/runtime/start`);
    return response;
  }

  async stopRuntime(dashboardId: string, sessionId: string): Promise<void> {
    await apiClient.post(`/scada/dashboards/${dashboardId}/runtime/stop`, { sessionId });
  }

  async getRuntimeStatus(dashboardId: string): Promise<{ 
    isRunning: boolean; 
    sessionId?: string; 
    startTime?: string; 
    uptime?: number 
  }> {
    const response = await apiClient.get<any>(`/scada/dashboards/${dashboardId}/runtime/status`);
    return response;
  }

  // Data operations
  async getTelemetryData(deviceId: string, keys: string[], timeRange: { start: number; end: number }): Promise<Record<string, any[]>> {
    const queryParams = new URLSearchParams({
      keys: keys.join(','),
      startTs: timeRange.start.toString(),
      endTs: timeRange.end.toString(),
    });
    const response = await apiClient.get<Record<string, any[]>>(`/scada/telemetry/${deviceId}?${queryParams.toString()}`);
    return response;
  }

  async getAttributeData(deviceId: string, keys: string[]): Promise<Record<string, any>> {
    const queryParams = new URLSearchParams({
      keys: keys.join(','),
    });
    const response = await apiClient.get<Record<string, any>>(`/scada/attributes/${deviceId}?${queryParams.toString()}`);
    return response;
  }

  async sendRpcCommand(deviceId: string, method: string, params: any): Promise<any> {
    const response = await apiClient.post<any>(`/scada/rpc/${deviceId}`, {
      method,
      params,
    });
    return response;
  }

  // Version control
  async getDashboardVersions(dashboardId: string): Promise<Array<{
    version: string;
    timestamp: string;
    author: string;
    changes: string;
  }>> {
    const response = await apiClient.get<any[]>(`/scada/dashboards/${dashboardId}/versions`);
    return response;
  }

  async revertToVersion(dashboardId: string, version: string): Promise<ScadaDashboard> {
    const response = await apiClient.post<ScadaDashboard>(`/scada/dashboards/${dashboardId}/revert`, { version });
    return response;
  }

  async createVersion(dashboardId: string, changes: string): Promise<{ version: string }> {
    const response = await apiClient.post<any>(`/scada/dashboards/${dashboardId}/versions`, { changes });
    return response;
  }

  // Import/Export
  async exportDashboard(dashboardId: string, format: 'json' | 'scada'): Promise<Blob> {
    const response = await apiClient.getBlob(`/scada/dashboards/${dashboardId}/export?format=${format}`);
    return response;
  }

  async importDashboard(file: File, projectId: string): Promise<ScadaDashboard> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const response = await apiClient.postFormData<ScadaDashboard>('/scada/dashboards/import', formData);
    return response;
  }

  // Preview operations
  async generatePreview(dashboardId: string, options?: {
    width?: number;
    height?: number;
    format?: 'png' | 'jpeg' | 'webp';
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (options?.width) queryParams.append('width', options.width.toString());
    if (options?.height) queryParams.append('height', options.height.toString());
    if (options?.format) queryParams.append('format', options.format);
    
    const query = queryParams.toString();
    const response = await apiClient.getBlob(`/scada/dashboards/${dashboardId}/preview${query ? '?' + query : ''}`);
    return response;
  }

  // Validation
  async validateDashboard(dashboard: ScadaDashboard): Promise<{
    valid: boolean;
    errors: Array<{
      type: 'error' | 'warning';
      message: string;
      widgetId?: string;
      field?: string;
    }>;
  }> {
    const response = await apiClient.post<{
      valid: boolean;
      errors: Array<{
        type: 'error' | 'warning';
        message: string;
        widgetId?: string;
        field?: string;
      }>;
    }>('/scada/dashboards/validate', dashboard);
    return response;
  }

  // Collaboration
  async getDashboardCollaborators(dashboardId: string): Promise<Array<{
    userId: string;
    userName: string;
    role: 'viewer' | 'editor' | 'admin';
    lastAccess: string;
  }>> {
    const response = await apiClient.get<any[]>(`/scada/dashboards/${dashboardId}/collaborators`);
    return response;
  }

  async shareDashboard(dashboardId: string, users: Array<{
    userId: string;
    role: 'viewer' | 'editor' | 'admin';
  }>): Promise<void> {
    await apiClient.post(`/scada/dashboards/${dashboardId}/share`, { users });
  }
}

export const scadaService = new ScadaService();

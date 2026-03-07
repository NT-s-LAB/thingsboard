# EITEK Platform API Layer Design

## API Client Architecture

### 1. Base API Client

```typescript
// shared/services/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from '@/shared/types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors globally
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          this.clearAuth();
          window.location.href = '/login';
        }
        
        if (error.response?.status >= 500) {
          // Server error, show notification
          this.handleServerError(error);
        }
        
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem('auth-token', token);
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem('auth-token');
  }

  private handleServerError(error: any) {
    const message = error.response?.data?.message || 'Server error occurred';
    // Show global notification
    console.error('Server Error:', message);
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  // Paginated request
  async getPaginated<T>(
    url: string, 
    params?: Record<string, any>
  ): Promise<PaginatedResponse<T>> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  // File upload
  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Download file
  async download(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL!);
```

### 2. Service Layer Pattern

```typescript
// shared/services/BaseService.ts
import { apiClient } from './apiClient';
import { ApiResponse, PaginatedResponse, CreateRequest, UpdateRequest } from '@/shared/types';

export abstract class BaseService<T extends { id: string }> {
  protected abstract basePath: string;

  async getAll(params?: Record<string, any>): Promise<PaginatedResponse<T>> {
    return apiClient.getPaginated<T>(this.basePath, params);
  }

  async getById(id: string): Promise<ApiResponse<T>> {
    return apiClient.get<T>(`${this.basePath}/${id}`);
  }

  async create(data: CreateRequest<T>): Promise<ApiResponse<T>> {
    return apiClient.post<T>(this.basePath, data);
  }

  async update(id: string, data: UpdateRequest<T>): Promise<ApiResponse<T>> {
    return apiClient.put<T>(`${this.basePath}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  async bulkDelete(ids: string[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.basePath}/bulk-delete`, { ids });
  }
}
```

### 3. Feature-Specific Services

```typescript
// features/auth/services/authService.ts
import { apiClient } from '@/shared/services/apiClient';
import { LoginRequest, LoginResponse, User } from '@/shared/types';

class AuthService {
  private basePath = '/auth';

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(`${this.basePath}/login`, credentials);
    
    if (response.success && response.data.token) {
      apiClient.setAuthToken(response.data.token);
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.basePath}/logout`);
    } finally {
      apiClient.clearAuth();
    }
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>(`${this.basePath}/profile`);
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`${this.basePath}/profile`, data);
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(`${this.basePath}/change-password`, {
      oldPassword,
      newPassword,
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post(`${this.basePath}/password-reset`, { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post(`${this.basePath}/password-reset/confirm`, {
      token,
      password,
    });
  }

  async verifyToken(): Promise<boolean> {
    try {
      await apiClient.get(`${this.basePath}/verify`);
      return true;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
```

```typescript
// features/devices/services/deviceService.ts
import { BaseService } from '@/shared/services/BaseService';
import { apiClient } from '@/shared/services/apiClient';
import { Device, TelemetryValue, AttributeValue, CommandRequest } from '@/shared/types';

class DeviceService extends BaseService<Device> {
  protected basePath = '/devices';

  async getByArea(areaId: string): Promise<Device[]> {
    const response = await apiClient.get<Device[]>(`/areas/${areaId}/devices`);
    return response.data;
  }

  async getTelemetry(
    deviceId: string, 
    keys: string[], 
    startTs?: number, 
    endTs?: number
  ): Promise<Record<string, TelemetryValue[]>> {
    const params = {
      keys: keys.join(','),
      startTs,
      endTs,
    };
    
    const response = await apiClient.get<Record<string, TelemetryValue[]>>(
      `${this.basePath}/${deviceId}/telemetry`,
      { params }
    );
    
    return response.data;
  }

  async getLatestTelemetry(deviceId: string): Promise<Record<string, TelemetryValue>> {
    const response = await apiClient.get<Record<string, TelemetryValue>>(
      `${this.basePath}/${deviceId}/telemetry/latest`
    );
    
    return response.data;
  }

  async getAttributes(deviceId: string): Promise<Record<string, AttributeValue>> {
    const response = await apiClient.get<Record<string, AttributeValue>>(
      `${this.basePath}/${deviceId}/attributes`
    );
    
    return response.data;
  }

  async updateAttributes(
    deviceId: string, 
    attributes: Record<string, any>
  ): Promise<void> {
    await apiClient.post(`${this.basePath}/${deviceId}/attributes`, attributes);
  }

  async sendCommand(deviceId: string, command: CommandRequest): Promise<void> {
    await apiClient.post(`${this.basePath}/${deviceId}/commands`, command);
  }

  async getDeviceCredentials(deviceId: string): Promise<string> {
    const response = await apiClient.get<{ token: string }>(
      `${this.basePath}/${deviceId}/credentials`
    );
    
    return response.data.token;
  }

  async regenerateCredentials(deviceId: string): Promise<string> {
    const response = await apiClient.post<{ token: string }>(
      `${this.basePath}/${deviceId}/credentials/regenerate`
    );
    
    return response.data.token;
  }
}

export const deviceService = new DeviceService();
```

```typescript
// features/scada/services/scadaService.ts
import { BaseService } from '@/shared/services/BaseService';
import { apiClient } from '@/shared/services/apiClient';
import { ScadaView, ScadaConfiguration } from '@/shared/types';

class ScadaService extends BaseService<ScadaView> {
  protected basePath = '/scada-views';

  async getByArea(areaId: string): Promise<ScadaView[]> {
    const response = await apiClient.get<ScadaView[]>(`/areas/${areaId}/scada-views`);
    return response.data;
  }

  async updateConfiguration(
    viewId: string, 
    configuration: ScadaConfiguration
  ): Promise<ScadaView> {
    const response = await apiClient.put<ScadaView>(
      `${this.basePath}/${viewId}/configuration`,
      configuration
    );
    
    return response.data;
  }

  async duplicate(viewId: string, name: string): Promise<ScadaView> {
    const response = await apiClient.post<ScadaView>(
      `${this.basePath}/${viewId}/duplicate`,
      { name }
    );
    
    return response.data;
  }

  async exportView(viewId: string): Promise<void> {
    await apiClient.download(`${this.basePath}/${viewId}/export`);
  }

  async importView(areaId: string, file: File): Promise<ScadaView> {
    const response = await apiClient.upload<ScadaView>(
      `/areas/${areaId}/scada-views/import`,
      file
    );
    
    return response.data;
  }

  async previewConfiguration(configuration: ScadaConfiguration): Promise<string> {
    const response = await apiClient.post<{ previewUrl: string }>(
      `${this.basePath}/preview`,
      configuration
    );
    
    return response.data.previewUrl;
  }
}

export const scadaService = new ScadaService();
```

### 4. WebSocket Client

```typescript
// shared/services/socketClient.ts
import { io, Socket } from 'socket.io-client';
import { TelemetryValue, Alarm } from '@/shared/types';

class SocketClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('WebSocket disconnected');
    });

    this.socket.on('telemetry', (data: { deviceId: string; telemetry: Record<string, TelemetryValue> }) => {
      this.emit('telemetry', data);
    });

    this.socket.on('alarm', (alarm: Alarm) => {
      this.emit('alarm', alarm);
    });

    this.socket.on('device-status', (data: { deviceId: string; isOnline: boolean }) => {
      this.emit('device-status', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Subscribe to device telemetry
  subscribeTelemetry(deviceIds: string[]) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-telemetry', { deviceIds });
    }
  }

  // Unsubscribe from device telemetry
  unsubscribeTelemetry(deviceIds: string[]) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-telemetry', { deviceIds });
    }
  }

  // Subscribe to alarms
  subscribeAlarms(deviceIds?: string[]) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-alarms', { deviceIds });
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  get connected() {
    return this.isConnected;
  }
}

export const socketClient = new SocketClient();
```

### 5. React Query Integration

```typescript
// shared/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

export function useApiQuery<TData, TError = Error>(
  key: string | string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn,
    ...options,
  });
}

export function useApiMutation<TData, TError = Error, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Auto-invalidate related queries
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

// Specific hooks for common patterns
export function usePaginatedQuery<TData>(
  key: string[],
  queryFn: (page: number, pageSize: number) => Promise<PaginatedResponse<TData>>,
  page: number = 1,
  pageSize: number = 10
) {
  return useQuery({
    queryKey: [...key, 'page', page, 'pageSize', pageSize],
    queryFn: () => queryFn(page, pageSize),
    keepPreviousData: true,
  });
}
```

### 6. Error Handling

```typescript
// shared/services/errorHandler.ts
export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: any;

  constructor(message: string, status: number = 500, code: string = 'UNKNOWN', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function handleApiError(error: any): ApiError {
  if (error.response) {
    const { status, data } = error.response;
    return new ApiError(
      data.message || 'API Error',
      status,
      data.code || 'API_ERROR',
      data.details
    );
  }
  
  if (error.request) {
    return new ApiError('Network Error', 0, 'NETWORK_ERROR');
  }
  
  return new ApiError(error.message || 'Unknown Error', 500, 'UNKNOWN_ERROR');
}

// Error boundary for React Query
export function createErrorHandler() {
  return (error: Error, query: any) => {
    console.error('Query Error:', error, query);
    
    // Log to external service
    // logError(error, query);
    
    // Show user-friendly error message
    showErrorNotification(error);
  };
}

function showErrorNotification(error: Error) {
  // Integration with notification system
  console.error('API Error:', error.message);
}
```

### 7. API Type Safety

```typescript
// shared/types/api.types.ts
export interface ApiEndpoints {
  // Auth endpoints
  'POST /auth/login': {
    request: LoginRequest;
    response: LoginResponse;
  };
  
  'GET /auth/profile': {
    response: User;
  };
  
  // Device endpoints
  'GET /devices': {
    params?: {
      areaId?: string;
      page?: number;
      pageSize?: number;
      search?: string;
    };
    response: PaginatedResponse<Device>;
  };
  
  'GET /devices/:id': {
    params: { id: string };
    response: Device;
  };
  
  'POST /devices': {
    request: CreateRequest<Device>;
    response: Device;
  };
  
  // Add more endpoints...
}

// Type-safe API client
export function createTypedApiCall<
  TEndpoint extends keyof ApiEndpoints
>(endpoint: TEndpoint) {
  return async (
    ...args: ApiEndpoints[TEndpoint] extends { request: infer TRequest }
      ? [TRequest]
      : ApiEndpoints[TEndpoint] extends { params: infer TParams }
      ? [TParams]
      : []
  ): Promise<ApiEndpoints[TEndpoint]['response']> => {
    // Implementation...
    throw new Error('Not implemented');
  };
}
```

## Usage Examples

```typescript
// In components
export function DeviceList() {
  const { data: devices, isLoading, error } = useApiQuery(
    ['devices'],
    () => deviceService.getAll()
  );

  const createMutation = useApiMutation(
    (device: CreateRequest<Device>) => deviceService.create(device),
    {
      onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries(['devices']);
      },
    }
  );

  // Real-time updates
  useEffect(() => {
    socketClient.on('device-status', (data) => {
      // Update device status in real-time
    });

    return () => socketClient.off('device-status');
  }, []);

  return (
    // Component JSX...
  );
}
```
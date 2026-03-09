class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  }

  setToken(token: string) {
    this.token = token;
  }

  setRefreshToken(token: string) {
    this.refreshToken = token;
  }

  clearToken() {
    this.token = null;
    this.refreshToken = null;
  }

  private getHeaders() {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private getFormDataHeaders() {
    const headers: HeadersInit = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // Don't set Content-Type for FormData, let browser set it with boundary
    return headers;
  }

  /**
   * Try to refresh the access token using the refresh token
   */
  private async tryRefreshToken(): Promise<boolean> {
    // Avoid multiple refresh attempts at once
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      return false;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
          return false;
        }

        const json = await response.json();
        const data = json.data ?? json;

        if (data.accessToken) {
          this.token = data.accessToken;
          if (data.refreshToken) {
            this.refreshToken = data.refreshToken;
          }
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 (Unauthorized) - try to refresh token
      if (response.status === 401 && retry && !endpoint.includes('/auth/')) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry the request with the new token
          return this.request<T>(endpoint, options, false);
        }
        // Refresh failed - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      
      // Auto-unwrap BE response wrapper: { success, data, message, ... }
      if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        // Paginated response: { success, data, pagination: { total, page, limit, totalPages, hasNext, hasPrev } }
        if (json.pagination) {
          return {
            data: json.data,
            totalElements: json.pagination.total,
            totalPages: json.pagination.totalPages,
            hasNext: json.pagination.hasNext,
            hasPrev: json.pagination.hasPrev,
            page: json.pagination.page,
            limit: json.pagination.limit,
          } as T;
        }
        return json.data;
      }
      
      return json;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async requestBlob(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    // Remove Content-Type for blob requests
    if (config.headers && typeof config.headers === 'object' && 'Content-Type' in config.headers) {
      delete (config.headers as any)['Content-Type'];
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('API blob request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async getBlob(endpoint: string): Promise<Blob> {
    return this.requestBlob(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = { method: 'POST' };
    if (data) {
      options.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, options);
  }

  async postBlob(endpoint: string, data?: any): Promise<Blob> {
    const options: RequestInit = { method: 'POST' };
    if (data) {
      options.body = JSON.stringify(data);
    }
    return this.requestBlob(endpoint, options);
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      method: 'POST',
      headers: this.getFormDataHeaders(),
      body: formData,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      
      // Auto-unwrap BE response wrapper
      if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        if (json.pagination) {
          return { data: json.data, totalElements: json.pagination.total, totalPages: json.pagination.totalPages, hasNext: json.pagination.hasNext } as T;
        }
        return json.data;
      }
      return json;
    } catch (error) {
      console.error('API form data request failed:', error);
      throw error;
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = { method: 'PUT' };
    if (data) {
      options.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, options);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async deleteWithBody<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = { method: 'DELETE' };
    if (data) {
      options.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, options);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = { method: 'PATCH' };
    if (data) {
      options.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, options);
  }
}

export const api = new ApiService();
export const apiClient = api; // Alias for compatibility
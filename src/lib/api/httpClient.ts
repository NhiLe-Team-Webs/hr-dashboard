/**
 * HTTP Client for Backend API
 * Centralized HTTP client with authentication and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, unknown> | object;
}

class HttpClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    try {
      const authData = localStorage.getItem('hr-dashboard-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.access_token || null;
      }
    } catch (error) {
      console.error('Failed to parse auth token:', error);
    }
    return null;
  }

  /**
   * Refresh the access token
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const authData = localStorage.getItem('hr-dashboard-auth');
        if (!authData) return null;

        const parsed = JSON.parse(authData);
        const refreshToken = parsed.refresh_token;

        if (!refreshToken) return null;

        const response = await fetch(`${this.baseUrl}/hr/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) {
          throw new Error('Refresh failed');
        }

        const data = await response.json();

        // Construct new session object matching AuthContext interface
        const newSession = {
          ...data.data.session,
          user: data.data.user
        };

        localStorage.setItem('hr-dashboard-auth', JSON.stringify(newSession));
        return newSession.access_token;
      } catch (error) {
        console.error('Token refresh failed:', error);
        localStorage.removeItem('hr-dashboard-auth');
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, unknown> | object): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      const paramsObj = params as Record<string, unknown>;
      Object.entries(paramsObj).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    // Add authentication header
    let token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        token = await this.refreshAccessToken();

        if (token) {
          // Retry request with new token
          headers['Authorization'] = `Bearer ${token}`;
          response = await fetch(url, {
            ...fetchOptions,
            headers,
          });
        }

        // If still 401 or refresh failed
        if (response.status === 401) {
          localStorage.removeItem('hr-dashboard-auth');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      }

      // Parse response
      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Return data from successful response
      return data.data as T;
    } catch (error) {
      console.error('HTTP request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, unknown> | object): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const httpClient = new HttpClient(API_BASE_URL);

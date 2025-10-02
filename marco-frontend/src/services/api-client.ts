// API Client - Centralized HTTP client with automatic JWT authorization
import { API_BASE } from '../config/constants.js';
import { TokenManager } from './token-manager.js';
import { Authentication } from '../features/authentication.js';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  /**
   * Make authenticated API request
   */
  static async request<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Prepare URL
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    
    // Prepare headers with JWT token if available
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...TokenManager.getAuthHeader()
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle unauthorized responses (expired/invalid tokens)
      if (response.status === 401) {
        // Token might be expired or invalid
        TokenManager.clearToken();
        
        // Redirect to login if we're not already on auth pages
        if (!window.location.hash.includes('login') && !window.location.hash.includes('register')) {
          alert('Session expired. Please log in again.');
          window.location.hash = '#login';
        }
        
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      // Parse response
      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok) {
        return {
          success: true,
          data: data
        };
      } else {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
          data: data
        };
      }

    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  /**
   * GET request
   */
  static async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return ApiClient.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  static async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return ApiClient.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * PUT request
   */
  static async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return ApiClient.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * PATCH request
   */
  static async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return ApiClient.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * DELETE request
   */
  static async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return ApiClient.request<T>(endpoint, { 
      method: 'DELETE',
      body: JSON.stringify({}) // Add empty JSON body to prevent Fastify error
    });
  }

  /**
   * Upload file (multipart/form-data)
   */
  static async upload<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    // Don't set Content-Type for FormData, let browser set it with boundary
    const headers: HeadersInit = {
      ...TokenManager.getAuthHeader()
    };

    return ApiClient.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData
    });
  }

  /**
   * Legacy fetch wrapper for compatibility with existing code
   * This allows gradual migration from direct fetch calls
   */
  static async legacyFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: HeadersInit = {
      ...options.headers,
      ...TokenManager.getAuthHeader()
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle unauthorized responses
    if (response.status === 401) {
      TokenManager.clearToken();
      if (!window.location.hash.includes('login') && !window.location.hash.includes('register')) {
        alert('Session expired. Please log in again.');
        window.location.hash = '#login';
      }
    }

    return response;
  }

  /**
   * Check if user is authenticated and token is valid
   */
  static isAuthenticated(): boolean {
    return TokenManager.isAuthenticated();
  }

  /**
   * Get current user info from token
   */
  static getCurrentUser() {
    return TokenManager.getTokenData();
  }

  /**
   * Refresh token if needed (placeholder for future implementation)
   */
  static async refreshTokenIfNeeded(): Promise<boolean> {
    return TokenManager.refreshTokenIfNeeded();
  }
}
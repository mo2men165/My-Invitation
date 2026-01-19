// src/lib/api/auth.ts
import { RegisterFormData, LoginFormData, ForgotPasswordFormData } from '../validations/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Response types based on our backend
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  customCity?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: { message: string };
  user?: User;
  tokens?: AuthTokens;
}

class AuthAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async register(data: RegisterFormData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    // Remove confirmPassword and conditionally remove customCity
    const { confirmPassword, customCity, ...registerData } = data;
    
    // Only include customCity if city is 'اخري' and customCity has a value
    const payload = data.city === 'اخري' && customCity
      ? { ...registerData, customCity }
      : registerData;
    
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إنشاء الحساب');
    }
  
    // Store tokens in localStorage
    if (result.tokens) {
      localStorage.setItem('access_token', result.tokens.access_token);
      localStorage.setItem('refresh_token', result.tokens.refresh_token);
    }
  
    return result;
  }
     

  async login(data: LoginFormData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تسجيل الدخول');
    }

    // Store tokens in localStorage
    if (result.tokens) {
      localStorage.setItem('access_token', result.tokens.access_token);
      localStorage.setItem('refresh_token', result.tokens.refresh_token);
    }

    return result;
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint (optional since JWTs are stateless)
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      // Don't throw on logout errors
    } finally {
      // Always clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب بيانات المستخدم');
    }

    return result;
  }

  async forgotPassword(data: ForgotPasswordFormData): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إرسال رابط إعادة التعيين');
    }

    return result;
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إعادة تعيين كلمة المرور');
    }

    return result;
  }

  async verifyResetToken(token: string): Promise<{ success: boolean; valid: boolean; email?: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-token/${token}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في التحقق من الرمز');
    }

    return result;
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Only clear tokens if it's a real session expiry
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          throw new Error('انتهت صلاحية الجلسة');
        }
        // For other errors, don't clear tokens
        throw new Error(result.error?.message || 'فشل في تحديث الجلسة');
      }

      // Update access token
      localStorage.setItem('access_token', result.access_token);
      
      return {
        access_token: result.access_token,
        refresh_token: refreshToken,
        expires_in: result.expires_in,
        token_type: result.token_type || 'Bearer'
      };
    } catch (error: any) {
      // If it's a network error, don't clear tokens
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        throw new Error('خطأ في الشبكة. يرجى المحاولة مرة أخرى');
      }
      throw error;
    }
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Utility method to get stored tokens
  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refresh_token'),
    };
  }
}

export const authAPI = new AuthAPI();
// src/store/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI, User, AuthTokens } from '@/lib/api/auth';
import { RegisterFormData, LoginFormData } from '@/lib/validations/auth';

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  isInitialized: false,
};

// Async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterFormData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في إنشاء الحساب');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (loginData: LoginFormData, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(loginData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في تسجيل الدخول');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في جلب بيانات المستخدم');
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.forgotPassword({ email });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في إرسال رابط إعادة التعيين');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }: { token: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.resetPassword(token, password);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في إعادة تعيين كلمة المرور');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const tokens = await authAPI.refreshToken();
      return tokens;
    } catch (error: any) {
      return rejectWithValue(error.message || 'انتهت صلاحية الجلسة');
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    try {
      const { accessToken } = authAPI.getTokens();
      
      if (!accessToken) {
        return { isAuthenticated: false };
      }

      // Try to get current user
      const response = await authAPI.getCurrentUser();
      return { isAuthenticated: true, user: response.user };
    } catch (error: any) {
      // Token might be expired, try to refresh
      
      try {
        await dispatch(refreshToken()).unwrap();
        const response = await authAPI.getCurrentUser();
        return { isAuthenticated: true, user: response.user };
      } catch (refreshError) {
        // Refresh failed, clear tokens
        authAPI.logout();
        
        return { isAuthenticated: false };
      }
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;
      authAPI.logout();
    },
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user!;
        state.tokens = action.payload.tokens!;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user!;
        state.tokens = action.payload.tokens!;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user!;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })

      // Password Reset Request
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Refresh Token
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = action.payload;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        // Only clear auth if it's a real session expiry, not a network error
        const errorMessage = action.payload as string;
        if (errorMessage.includes('Session expired') || errorMessage.includes('انتهت صلاحية الجلسة')) {
          state.user = null;
          state.tokens = null;
          state.isAuthenticated = false;
        }
        state.error = errorMessage;
      })

      // Initialize Auth
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isInitialized = true;
        state.isAuthenticated = action.payload.isAuthenticated;
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isInitialized = true;
        state.isAuthenticated = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(profileData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في تحديث الملف الشخصي');
      }

      return result.user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'خطأ في تحديث الملف الشخصي');
    }
  }
);


export const { clearError, logout, setTokens } = authSlice.actions;
export default authSlice.reducer;
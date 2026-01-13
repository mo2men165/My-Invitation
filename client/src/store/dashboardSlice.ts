// src/store/dashboardSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dashboardAPI, DashboardStats, RecentOrder } from '@/lib/api/dashboard';

interface DashboardState {
  stats: DashboardStats | null;
  recentOrders: RecentOrder[];
  isLoadingStats: boolean;
  isLoadingOrders: boolean;
  statsError: string | null;
  ordersError: string | null;
  lastFetched: number | null;
}

const initialState: DashboardState = {
  stats: null,
  recentOrders: [],
  isLoadingStats: false,
  isLoadingOrders: false,
  statsError: null,
  ordersError: null,
  lastFetched: null,
};

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getDashboardStats();
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في جلب الإحصائيات');
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في جلب إحصائيات لوحة التحكم');
    }
  }
);

export const fetchRecentOrders = createAsyncThunk(
  'dashboard/fetchRecentOrders',
  async (limit: number = 5, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getRecentOrders(limit);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في جلب الطلبات');
      }
      
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في جلب الطلبات الأخيرة');
    }
  }
);

// Combined thunk to fetch all dashboard data
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchAll',
  async (_, { dispatch }) => {
    const [statsResult, ordersResult] = await Promise.allSettled([
      dispatch(fetchDashboardStats()),
      dispatch(fetchRecentOrders(5)),
    ]);

    return {
      statsSuccess: statsResult.status === 'fulfilled',
      ordersSuccess: ordersResult.status === 'fulfilled',
    };
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.statsError = null;
      state.ordersError = null;
    },
    resetDashboard: (state) => {
      state.stats = null;
      state.recentOrders = [];
      state.statsError = null;
      state.ordersError = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch dashboard stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoadingStats = true;
        state.statsError = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action: PayloadAction<DashboardStats | undefined>) => {
        state.isLoadingStats = false;
        state.stats = action.payload || null;
        state.lastFetched = Date.now();
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.statsError = action.payload as string;
      });

    // Fetch recent orders
    builder
      .addCase(fetchRecentOrders.pending, (state) => {
        state.isLoadingOrders = true;
        state.ordersError = null;
      })
      .addCase(fetchRecentOrders.fulfilled, (state, action: PayloadAction<RecentOrder[]>) => {
        state.isLoadingOrders = false;
        state.recentOrders = action.payload;
      })
      .addCase(fetchRecentOrders.rejected, (state, action) => {
        state.isLoadingOrders = false;
        state.ordersError = action.payload as string;
      });
  },
});

export const { clearErrors, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
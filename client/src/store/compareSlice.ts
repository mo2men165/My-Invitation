// src/store/compareSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { compareAPI, CompareItem } from '@/lib/api/compare';

export interface CompareState {
  items: CompareItem[];
  isLoading: boolean;
  error: string | null;
  count: number;
  isFull: boolean;
  isInitialized: boolean;
}

const initialState: CompareState = {
  items: [],
  isLoading: false,
  error: null,
  count: 0,
  isFull: false,
  isInitialized: false,
};

// Updated async thunks with packageType support
export const fetchCompareList = createAsyncThunk(
  'compare/fetchCompareList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await compareAPI.getCompareList();
      return response.compareList || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في جلب قائمة المقارنة');
    }
  }
);

export const checkIfCompareFull = createAsyncThunk(
  'compare/checkIfCompareFull',
  async (_, { rejectWithValue }) => {
    try {
      const response = await compareAPI.isCompareFull();
      return { isFull: response.isFull || false, count: response.count || 0 };
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في فحص قائمة المقارنة');
    }
  }
);

export const addToCompare = createAsyncThunk(
  'compare/addToCompare',
  async ({ designId, packageType }: { designId: string; packageType: 'classic' | 'premium' | 'vip' }, { rejectWithValue }) => {
    try {
      const response = await compareAPI.addToCompare(designId, packageType);
      return response.compareItem!;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في إضافة التصميم لقائمة المقارنة');
    }
  }
);

export const replaceCompareList = createAsyncThunk(
  'compare/replaceCompareList',
  async (items: { designId: string; packageType: 'classic' | 'premium' | 'vip' }[], { rejectWithValue }) => {
    try {
      const response = await compareAPI.replaceCompareList(items);
      // Fetch updated compare list
      const updatedResponse = await compareAPI.getCompareList();
      return updatedResponse.compareList || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في تحديث قائمة المقارنة');
    }
  }
);

// Rest of async thunks remain the same
export const removeFromCompare = createAsyncThunk(
  'compare/removeFromCompare',
  async (designId: string, { rejectWithValue }) => {
    try {
      await compareAPI.removeFromCompare(designId);
      return designId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في حذف التصميم من قائمة المقارنة');
    }
  }
);

export const clearCompareList = createAsyncThunk(
  'compare/clearCompareList',
  async (_, { rejectWithValue }) => {
    try {
      await compareAPI.clearCompareList();
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في مسح قائمة المقارنة');
    }
  }
);

// Updated slice with packageType support
const compareSlice = createSlice({
  name: 'compare',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCompare: (state) => {
      state.items = [];
      state.count = 0;
      state.isFull = false;
      state.error = null;
      state.isInitialized = false;
    },
    // Updated optimistic updates with packageType
    optimisticAddToCompare: (state, action: PayloadAction<{ designId: string; packageType: 'classic' | 'premium' | 'vip' }>) => {
      if (state.items.length < 3) {
        const newItem: CompareItem = {
          designId: action.payload.designId,
          packageType: action.payload.packageType,
          addedAt: new Date().toISOString()
        };
        state.items.push(newItem);
        state.count = state.items.length;
        state.isFull = state.count >= 3;
      }
    },
    optimisticRemoveFromCompare: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.designId !== action.payload);
      state.count = state.items.length;
      state.isFull = state.count >= 3;
    },
  },
  extraReducers: (builder) => {
    // All extraReducers remain the same as they handle the API responses
    builder
      .addCase(fetchCompareList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompareList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.count = action.payload.length;
        state.isFull = action.payload.length >= 3;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(fetchCompareList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })


      // Add to Compare
      .addCase(addToCompare.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCompare.fulfilled, (state, action) => {
        state.isLoading = false;
        // Check if item already exists and if we're not at capacity
        const existingIndex = state.items.findIndex(
          item => item.designId === action.payload.designId
        );
        if (existingIndex === -1 && state.items.length < 3) {
          state.items.push(action.payload);
          state.count = state.items.length;
          state.isFull = state.count >= 3;
        }
        state.error = null;
      })
      .addCase(addToCompare.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Replace Compare List
      .addCase(replaceCompareList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(replaceCompareList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.count = action.payload.length;
        state.isFull = action.payload.length >= 3;
        state.error = null;
      })
      .addCase(replaceCompareList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Remove from Compare
      .addCase(removeFromCompare.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCompare.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter(item => item.designId !== action.payload);
        state.count = state.items.length;
        state.isFull = state.count >= 3;
        state.error = null;
      })
      .addCase(removeFromCompare.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Clear Compare List
      .addCase(clearCompareList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCompareList.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.count = 0;
        state.isFull = false;
        state.error = null;
      })
      .addCase(clearCompareList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Check If Compare Full
      .addCase(checkIfCompareFull.fulfilled, (state, action) => {
        state.isFull = action.payload.isFull;
        state.count = action.payload.count;
      });
  },
});

export const { 
  clearError, 
  resetCompare,
  optimisticAddToCompare,
  optimisticRemoveFromCompare
} = compareSlice.actions;

export default compareSlice.reducer;
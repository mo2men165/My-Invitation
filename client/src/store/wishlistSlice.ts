// src/store/wishlistSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { wishlistAPI, WishlistItem } from '@/lib/api/wishlist';

export interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  count: number;
  isInitialized: boolean;
}

const initialState: WishlistState = {
  items: [],
  isLoading: false,
  error: null,
  count: 0,
  isInitialized: false,
};

// Updated async thunks with packageType support
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.getWishlist();
      return response.wishlist || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في جلب المفضلة');
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async ({ designId, packageType }: { designId: string; packageType?: 'classic' | 'premium' | 'vip' }, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.addToWishlist(designId, packageType);
      return response.wishlistItem!;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في إضافة التصميم للمفضلة');
    }
  }
);

export const addMultipleToWishlist = createAsyncThunk(
  'wishlist/addMultipleToWishlist',
  async (items: { designId: string; packageType?: 'classic' | 'premium' | 'vip' }[], { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.addMultipleToWishlist(items);
      // Fetch updated wishlist after bulk add
      const updatedResponse = await wishlistAPI.getWishlist();
      return updatedResponse.wishlist || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في إضافة التصاميم للمفضلة');
    }
  }
);

// Rest of the async thunks remain the same
export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (designId: string, { rejectWithValue }) => {
    try {
      await wishlistAPI.removeFromWishlist(designId);
      return designId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في حذف التصميم من المفضلة');
    }
  }
);

export const clearWishlist = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { rejectWithValue }) => {
    try {
      await wishlistAPI.clearWishlist();
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في مسح المفضلة');
    }
  }
);

// Updated optimistic actions to include packageType
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetWishlist: (state) => {
      state.items = [];
      state.count = 0;
      state.error = null;
      state.isInitialized = false;
    },
    // Updated optimistic updates with packageType
    optimisticAddToWishlist: (state, action: PayloadAction<{ designId: string; packageType?: 'classic' | 'premium' | 'vip' }>) => {
      const newItem: WishlistItem = {
        designId: action.payload.designId,
        packageType: action.payload.packageType,
        addedAt: new Date().toISOString()
      };
      state.items.push(newItem);
      state.count = state.items.length;
    },
    optimisticRemoveFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.designId !== action.payload);
      state.count = state.items.length;
    },
  },
  extraReducers: (builder) => {
    // All extraReducers remain the same as they handle the API responses
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.count = action.payload.length;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })
      // Add to Wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        // Check if item already exists
        const existingIndex = state.items.findIndex(
          item => item.designId === action.payload.designId
        );
        if (existingIndex === -1) {
          state.items.push(action.payload);
          state.count = state.items.length;
        }
        state.error = null;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Add Multiple to Wishlist
      .addCase(addMultipleToWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addMultipleToWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.count = action.payload.length;
        state.error = null;
      })
      .addCase(addMultipleToWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Remove from Wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter(item => item.designId !== action.payload);
        state.count = state.items.length;
        state.error = null;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Clear Wishlist
      .addCase(clearWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.count = 0;
        state.error = null;
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  resetWishlist,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist
} = wishlistSlice.actions;

export default wishlistSlice.reducer;


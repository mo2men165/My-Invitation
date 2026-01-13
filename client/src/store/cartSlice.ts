// src/store/cartSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { cartAPI, CartItem } from '@/lib/api/cart';

export interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  count: number;
  isInitialized: boolean;
  fieldUpdateLoading: { [itemId: string]: boolean }; // Track field-level updates
}

const initialState: CartState = {
  items: [],
  isLoading: false,
  error: null,
  count: 0,
  isInitialized: false,
  fieldUpdateLoading: {},
};

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCart();
      return response.cart || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في جلب السلة');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (item: Omit<CartItem, '_id' | 'addedAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await cartAPI.addToCart(item);
      return response.cartItem!;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في إضافة العنصر للسلة');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ id, updates }: { id: string; updates: Partial<Omit<CartItem, '_id' | 'addedAt' | 'updatedAt'>> }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.updateCartItem(id, updates);
      return response.cartItem!;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في تحديث العنصر');
    }
  }
);

// NEW: Update specific field
export const updateCartItemField = createAsyncThunk(
  'cart/updateCartItemField',
  async ({ id, field, value }: { id: string; field: string; value: any }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.updateCartItemField(id, field, value);
      return { id, cartItem: response.cartItem! };
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في تحديث الحقل');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (id: string, { rejectWithValue }) => {
    try {
      await cartAPI.removeFromCart(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في حذف العنصر من السلة');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartAPI.clearCart();
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في مسح السلة');
    }
  }
);

export const fetchCartCount = createAsyncThunk(
  'cart/fetchCartCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCartCount();
      return response.count || 0;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في جلب عدد عناصر السلة');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCart: (state) => {
      state.items = [];
      state.count = 0;
      state.error = null;
      state.isInitialized = false;
      state.fieldUpdateLoading = {};
    },
    // Optimistic updates for better UX
    optimisticAddToCart: (state, action: PayloadAction<CartItem>) => {
      state.items.push(action.payload);
      state.count = state.items.length;
    },
    optimisticRemoveFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item._id !== action.payload);
      state.count = state.items.length;
    },
    optimisticUpdateCartItem: (state, action: PayloadAction<CartItem>) => {
      const index = state.items.findIndex(item => item._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    // NEW: Optimistic field update
    optimisticUpdateField: (state, action: PayloadAction<{ id: string; field: string; value: any }>) => {
      const { id, field, value } = action.payload;
      const index = state.items.findIndex(item => item._id === id);
      if (index !== -1) {
        const item = state.items[index];
        if (field.startsWith('details.')) {
          const detailField = field.replace('details.', '');
          (item.details as any)[detailField] = value;
        } else {
          (item as any)[field] = value;
        }
        item.updatedAt = new Date().toISOString();
      }
    },
    // Clear field loading state
    clearFieldLoading: (state, action: PayloadAction<string>) => {
      delete state.fieldUpdateLoading[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.count = action.payload.length;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })

      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        // Check if item already exists (shouldn't happen but safety check)
        const existingIndex = state.items.findIndex(
          item => item._id === action.payload._id
        );
        if (existingIndex === -1) {
          state.items.push(action.payload);
          state.count = state.items.length;
        }
        state.error = null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Revert optimistic update if it was applied
        state.items = state.items.filter(item => !item._id?.startsWith('temp_'));
        state.count = state.items.length;
      })

      // Update Cart Item
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // NEW: Update Cart Item Field
      .addCase(updateCartItemField.pending, (state, action) => {
        const itemId = action.meta.arg.id;
        state.fieldUpdateLoading[itemId] = true;
        state.error = null;
      })
      .addCase(updateCartItemField.fulfilled, (state, action) => {
        const { id, cartItem } = action.payload;
        const index = state.items.findIndex(item => item._id === id);
        if (index !== -1) {
          state.items[index] = cartItem;
        }
        delete state.fieldUpdateLoading[id];
        state.error = null;
      })
      .addCase(updateCartItemField.rejected, (state, action) => {
        const itemId = action.meta.arg.id;
        delete state.fieldUpdateLoading[itemId];
        state.error = action.payload as string;
      })

      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter(item => item._id !== action.payload);
        state.count = state.items.length;
        state.error = null;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.count = 0;
        state.error = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Cart Count
      .addCase(fetchCartCount.fulfilled, (state, action) => {
        state.count = action.payload;
      });
  },
});

export const { 
  clearError, 
  resetCart,
  optimisticAddToCart,
  optimisticRemoveFromCart,
  optimisticUpdateCartItem,
  optimisticUpdateField,
  clearFieldLoading
} = cartSlice.actions;

export default cartSlice.reducer; 
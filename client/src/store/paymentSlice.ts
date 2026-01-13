// src/store/paymentSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentAPI } from '@/lib/api/payment';

export interface PaymentState {
  isProcessing: boolean;
  summary: any | null;
  lastPayment: any | null;
  error: string | null;
}

const initialState: PaymentState = {
  isProcessing: false,
  summary: null,
  lastPayment: null,
  error: null,
};

// Async thunks
export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async (paymentDetails: {
    paymentId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.processPayment(paymentDetails);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في معالجة الدفع');
    }
  }
);

export const getPaymentSummary = createAsyncThunk(
  'payment/getPaymentSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.getPaymentSummary();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في جلب ملخص الدفع');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetPayment: (state) => {
      state.summary = null;
      state.lastPayment = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Process Payment
      .addCase(processPayment.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.lastPayment = action.payload;
        state.error = null;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      })

      // Get Payment Summary
      .addCase(getPaymentSummary.fulfilled, (state, action) => {
        state.summary = action.payload.summary;
        state.error = null;
      })
      .addCase(getPaymentSummary.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
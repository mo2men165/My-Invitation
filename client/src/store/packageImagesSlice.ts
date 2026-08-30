// client/src/store/packageImagesSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { packagesAPI } from '@/lib/api/packages';
import { customDesignSentinel } from '@/constants/customDesign';
import { InvitationDesign } from '@/types';

export interface PackageImagesState {
  items: InvitationDesign[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: PackageImagesState = {
  items: [],
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const fetchPackageImages = createAsyncThunk(
  'packageImages/fetchPackageImages',
  async (_, { rejectWithValue }) => {
    try {
      return await packagesAPI.getImages();
    } catch (error: any) {
      return rejectWithValue(error.message || 'فشل في جلب تصاميم الباقات');
    }
  }
);

const packageImagesSlice = createSlice({
  name: 'packageImages',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPackageImages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPackageImages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.items = [...action.payload, customDesignSentinel];
      })
      .addCase(fetchPackageImages.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload as string;
      });
  },
});

export default packageImagesSlice.reducer;

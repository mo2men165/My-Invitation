'use client';
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchWishlist } from '@/store/wishlistSlice';
import { useAuth } from '@/hooks/useAuth';

export const useWishlistData = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAuth();
  const { items, isLoading, error, isInitialized: wishlistInitialized, count } = useAppSelector(
    (state) => state.wishlist
  );

  // Fetch wishlist when user is authenticated and not already initialized
  const initializeWishlist = useCallback(() => {
    if (isAuthenticated && isInitialized && !wishlistInitialized) {
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated, isInitialized, wishlistInitialized, dispatch]);

  useEffect(() => {
    initializeWishlist();
  }, [initializeWishlist]);

  // Refetch wishlist function
  const refetchWishlist = useCallback(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated, dispatch]);

  return {
    items,
    isLoading,
    error,
    count,
    isInitialized: wishlistInitialized,
    refetchWishlist,
    isEmpty: items.length === 0 && wishlistInitialized && !isLoading
  };
};

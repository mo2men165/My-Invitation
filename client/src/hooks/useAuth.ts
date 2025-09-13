// src/hooks/useAuth.ts
'use client';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { initializeAuth, refreshToken } from '@/store/authSlice';
import { CART_MODAL_CONSTANTS } from '@/constants/cartModalConstants';

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  // Initialize auth on app start
  useEffect(() => {
    if (!auth.isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, auth.isInitialized]);

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.tokens) return;

    const refreshInterval = setInterval(() => {
      // Only refresh if not already refreshing
      if (auth.isLoading) return;
      
      // Refresh token before expiry
      const refreshTime = (auth.tokens!.expires_in - CART_MODAL_CONSTANTS.TOKEN_REFRESH_BEFORE_EXPIRY) * 1000;
      
      if (refreshTime <= 0) {
        dispatch(refreshToken());
      }
    }, CART_MODAL_CONSTANTS.TOKEN_REFRESH_CHECK_INTERVAL); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [auth.isAuthenticated, auth.tokens, auth.isLoading, dispatch]);

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isInitialized: auth.isInitialized,
    error: auth.error,
  };
}




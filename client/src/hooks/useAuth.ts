// src/hooks/useAuth.ts
'use client';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { initializeAuth, refreshToken } from '@/store/authSlice';

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
      // Refresh token 5 minutes before expiry
      const refreshTime = (auth.tokens!.expires_in - 300) * 1000;
      
      if (refreshTime <= 0) {
        dispatch(refreshToken());
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [auth.isAuthenticated, auth.tokens, dispatch]);

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isInitialized: auth.isInitialized,
    error: auth.error,
  };
}




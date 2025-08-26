// src/components/auth/AuthProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { initializeAuth } from '@/store/authSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize authentication state on app start
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
}
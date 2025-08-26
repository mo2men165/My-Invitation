// src/components/auth/GuestRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestRoute({ children, redirectTo = '/dashboard' }: GuestRouteProps) {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isInitialized, redirectTo, router]);

  // If user is authenticated, don't render children (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}


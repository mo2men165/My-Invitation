'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface InstantRouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function InstantRouteGuard({ 
  children, 
  allowedRoles = ['user'], 
  redirectTo = '/login',
  fallback = null
}: InstantRouteGuardProps) {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isInitialized) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.replace(redirectTo);
        return;
      }

      // If authenticated but role not allowed, redirect
      if (user && !allowedRoles.includes(user.role)) {
        if (user.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace(redirectTo);
        }
        return;
      }
    }
  }, [mounted, isInitialized, isAuthenticated, user, allowedRoles, redirectTo, router]);

  // Don't render anything until mounted and initialized
  if (!mounted || !isInitialized) {
    return fallback;
  }

  // Don't render if not authenticated or role not allowed
  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return fallback;
  }

  return <>{children}</>;
}

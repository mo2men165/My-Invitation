'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminAccessDenied } from '@/components/auth/AdminAccessDenied';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted and initialized
  if (!mounted || !isInitialized) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    router.replace('/login');
    return null;
  }

  // If authenticated but not admin, show access denied page
  if (user && user.role !== 'admin') {
    return <AdminAccessDenied />;
  }

  // If no user data yet, show loading
  if (!user) {
    return null;
  }

  return <>{children}</>;
}

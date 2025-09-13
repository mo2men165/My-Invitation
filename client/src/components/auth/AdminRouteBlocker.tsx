'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminRouteBlockerProps {
  children: React.ReactNode;
}

export function AdminRouteBlocker({ children }: AdminRouteBlockerProps) {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if current route is an admin route
  const isAdminRoute = pathname.startsWith('/admin');

  // Redirect admin users from non-admin routes immediately
  useEffect(() => {
    if (mounted && isInitialized && isAuthenticated && user?.role === 'admin' && !isAdminRoute) {
      router.replace('/admin');
    }
  }, [mounted, isInitialized, isAuthenticated, user?.role, isAdminRoute, pathname, router]);

  // Don't render anything until mounted and initialized
  if (!mounted || !isInitialized) {
    return null;
  }

  // If admin user is on non-admin route, don't render anything (redirecting)
  if (isAuthenticated && user?.role === 'admin' && !isAdminRoute) {
    return null;
  }

  return <>{children}</>;
}

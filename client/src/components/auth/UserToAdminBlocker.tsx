'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserToAdminBlockerProps {
  children: React.ReactNode;
}

export function UserToAdminBlocker({ children }: UserToAdminBlockerProps) {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if current route is an admin route
  const isAdminRoute = pathname.startsWith('/admin');

  // Redirect non-admin users away from admin routes
  useEffect(() => {
    if (mounted && isInitialized && isAuthenticated && user?.role !== 'admin' && isAdminRoute) {
      // Get the referrer or default to home page
      const referrer = document.referrer;
      const isInternalReferrer = referrer && referrer.includes(window.location.origin);
      
      if (isInternalReferrer) {
        // Try to extract the path from the referrer
        try {
          const referrerUrl = new URL(referrer);
          const referrerPath = referrerUrl.pathname;
          // Only redirect to internal paths, not admin routes
          if (referrerPath && !referrerPath.startsWith('/admin')) {
            router.replace(referrerPath);
            return;
          }
        } catch (error) {
          // If URL parsing fails, fall back to home
        }
      }
      
      // Default to home page
      router.replace('/');
    }
  }, [mounted, isInitialized, isAuthenticated, user?.role, isAdminRoute, router]);

  // Don't render anything until mounted and initialized
  if (!mounted || !isInitialized) {
    return null;
  }

  // If non-admin user is on admin route, don't render anything (redirecting)
  if (isAuthenticated && user?.role !== 'admin' && isAdminRoute) {
    return null;
  }

  return <>{children}</>;
}

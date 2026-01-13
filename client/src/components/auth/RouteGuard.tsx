'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export function RouteGuard({ 
  children, 
  allowedRoles = ['user'], 
  redirectTo = '/login' 
}: RouteGuardProps) {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isInitialized && !isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // If authenticated but role not allowed, redirect
      if (user && !allowedRoles.includes(user.role)) {
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push(redirectTo);
        }
        return;
      }
    }
  }, [mounted, isInitialized, isLoading, isAuthenticated, user, allowedRoles, redirectTo, router]);

  // Show loading while checking authentication
  if (!mounted || !isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">جاري التحميل...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or role not allowed
  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

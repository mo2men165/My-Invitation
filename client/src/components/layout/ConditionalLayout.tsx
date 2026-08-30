'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { isInitialized } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Check if current route is an admin route
  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state only while auth is initializing on app boot.
  // Do NOT gate on the shared auth.isLoading flag here — it also flips true/false
  // for login/register/token-refresh actions, which would unmount this whole
  // subtree (including whatever form is on screen) mid-action and wipe its state.
  if (!mounted || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">جاري التحميل...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // Don't show header and footer for admin routes
  if (isAdminRoute) {
    return <>{children}</>;
  }
  
  // Show header and footer for all other routes
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

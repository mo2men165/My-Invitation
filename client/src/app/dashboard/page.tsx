// src/app/dashboard/page.tsx
'use client';

import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

// If you need metadata, you can use generateMetadata instead
// export async function generateMetadata(): Promise<Metadata> {
//   return {
//     title: 'لوحة التحكم - INVITATION',
//     description: 'إدارة حسابك ومناسباتك من لوحة التحكم الشخصية',
//   };
// }

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="container mx-auto px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-8 py-12">
        
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                مرحباً بك، <span className="text-[#C09B52]">
                  {isAuthenticated && user ? user.firstName : 'زائر'}
                </span>
              </h1>
              <p className="text-gray-400 text-lg">إليك نظرة سريعة على نشاطك الأخير</p>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mt-12">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <RecentOrders />
            <QuickActions />
          </div>

          {/* Right Column - Sidebar */}
          {/* <div className="space-y-8">
            <ActivityFeed />
          </div> */}

        </div>
      </div>
    </div>
  );
}
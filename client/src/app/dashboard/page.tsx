// src/app/dashboard/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { CollaborationDashboard } from '@/components/collaboration/CollaborationDashboard';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';
import { useAuth } from '@/hooks/useAuth';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import DeleteAccountButton from '@/components/account/DeleteAccountButton';
import { UserBills } from '@/components/dashboard/UserBills';

// If you need metadata, you can use generateMetadata instead
// export async function generateMetadata(): Promise<Metadata> {
//   return {
//     title: 'لوحة التحكم - INVITATION',
//     description: 'إدارة حسابك ومناسباتك من لوحة التحكم الشخصية',
//   };
// }

export default function DashboardPage() {
  const { user } = useAuth();
  const { deleteAccount, isDeletingAccount } = useAccountSettings();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  return (
    <InstantRouteGuard 
      allowedRoles={['user']}
      fallback={<DashboardSkeleton />}
    >
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
          
          {/* Welcome Header */}
          <div className="mb-6 sm:mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
                  مرحباً بك، <span className="text-[#C09B52]">
                    {user?.firstName || 'زائر'}
                  </span>
                </h1>
                <p className="text-gray-400 text-sm sm:text-base md:text-lg">إليك نظرة سريعة على نشاطك الأخير</p>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <DashboardStats />

          {/* Main Content Grid */}
          {tab === 'bills' ? (
            <div className="mt-6 sm:mt-8 md:mt-12">
              <UserBills />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 md:mt-12">
              
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
                <RecentOrders />
                <QuickActions />
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                <CollaborationDashboard />
                
                {/* Delete Account Section */}
                <DeleteAccountButton 
                  onDelete={deleteAccount}
                  isDeleting={isDeletingAccount}
                />
              </div>

            </div>
          )}
        </div>
      </div>
    </InstantRouteGuard>
  );
}
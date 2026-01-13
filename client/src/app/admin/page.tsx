'use client';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminDashboardStats } from '@/components/admin/AdminDashboardStats';
import { AdminPendingEvents } from '@/components/admin/AdminPendingEvents';
import { AdminRecentActivity } from '@/components/admin/AdminRecentActivity';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <AdminSidebar>
      <div className="container mx-auto px-8 py-12">
        
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="text-right">
              <h1 className="text-4xl font-bold text-white mb-3">
                مرحباً، <span className="text-[#C09B52]">
                  {user?.firstName}
                </span>
              </h1>
              <p className="text-gray-400 text-lg">إدارة المنصة والمستخدمين والأحداث</p>
            </div>
          </div>
        </div>

        {/* Admin Dashboard Stats */}
        <AdminDashboardStats />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-10 mt-12">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <AdminPendingEvents />
            <AdminQuickActions />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-10">
            <AdminRecentActivity />
          </div>

        </div>
      </div>
    </AdminSidebar>
  );
}
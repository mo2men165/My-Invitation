'use client';

import { AdminRouteGuard } from '@/components/admin/AdminRouteGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {children}
      </div>
    </AdminRouteGuard>
  );
}

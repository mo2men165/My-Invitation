'use client';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminOrdersList } from '@/components/admin/AdminOrdersList';
import { useAuth } from '@/hooks/useAuth';

export default function AdminOrdersPage() {
  const { user } = useAuth();

  return (
    <AdminSidebar>
      <div className="container mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="text-right">
              <h1 className="text-4xl font-bold text-white mb-3">
                إدارة <span className="text-[#C09B52]">الطلبات</span>
              </h1>
              <p className="text-gray-400 text-lg">عرض وإدارة جميع الطلبات والمعاملات المالية</p>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <AdminOrdersList />

      </div>
    </AdminSidebar>
  );
}


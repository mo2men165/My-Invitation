'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, XCircle, DollarSign, AlertCircle } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    suspended: number;
  };
  events: {
    total: number;
    pendingApprovals: number;
    approved: number;
    rejected: number;
  };
  revenue: {
    thisMonth: number;
  };
}

export function AdminDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminAPI.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-900/60 border border-gray-700 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="h-8 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-center">
        <p className="text-red-400">خطأ في تحميل الإحصائيات</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats.users.total.toLocaleString('ar-SA'),
      change: `${stats.users.active} نشط`,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-700'
    },
    {
      title: 'الأحداث المعلقة',
      value: stats.events.pendingApprovals.toLocaleString('ar-SA'),
      change: 'تحتاج موافقة',
      icon: AlertCircle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-700'
    },
    {
      title: 'الأحداث المعتمدة',
      value: stats.events.approved.toLocaleString('ar-SA'),
      change: 'من إجمالي الأحداث',
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-700'
    },
    {
      title: 'الأحداث المرفوضة',
      value: stats.events.rejected.toLocaleString('ar-SA'),
      change: 'مرفوض',
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700'
    },
    {
      title: 'إيرادات الشهر',
      value: `${stats.revenue.thisMonth.toLocaleString('ar-SA')} ر.س`,
      change: 'هذا الشهر',
      icon: DollarSign,
      color: 'text-[#C09B52]',
      bgColor: 'bg-[#C09B52]/10',
      borderColor: 'border-[#C09B52]'
    },
    {
      title: 'إجمالي الأحداث',
      value: stats.events.total.toLocaleString('ar-SA'),
      change: 'حدث مسجل',
      icon: Calendar,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <div
            key={index}
            className={`${stat.bgColor} border ${stat.borderColor} rounded-xl p-6 hover:border-[#C09B52] transition-all duration-300 hover:shadow-lg hover:shadow-[#C09B52]/10 group`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            
            <div className="text-right">
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold text-white mb-2">
                {stat.value}
              </p>
              <p className={`text-sm ${stat.color} font-medium`}>
                {stat.change}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
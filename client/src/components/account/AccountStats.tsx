'use client';
import React from 'react';
import { Heart, GitCompare, ShoppingCart, Calendar, User, Clock } from 'lucide-react';

interface AccountStatsProps {
  stats: {
    wishlistCount: number;
    compareCount: number;
    cartCount: number;
    ordersCount: number;
    joinDate: string;
    lastLogin: string;
  };
}

const AccountStats: React.FC<AccountStatsProps> = ({ stats }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const statItems = [
    {
      icon: Heart,
      label: 'المفضلة',
      value: stats.wishlistCount,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      icon: GitCompare,
      label: 'المقارنة',
      value: stats.compareCount,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      icon: ShoppingCart,
      label: 'السلة',
      value: stats.cartCount,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      icon: Calendar,
      label: 'الطلبات',
      value: stats.ordersCount,
      color: 'text-[#C09B52]',
      bgColor: 'bg-[#C09B52]/10',
      borderColor: 'border-[#C09B52]/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-[#C09B52]" />
          <h3 className="text-xl font-bold text-white">إحصائيات الحساب</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statItems.map((item, index) => (
            <div
              key={index}
              className={`${item.bgColor} ${item.borderColor} border rounded-xl p-4 text-center`}
            >
              <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
              <div className="text-sm text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Account Info */}
        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#C09B52]" />
            <div>
              <div className="text-sm text-gray-400">تاريخ الانضمام</div>
              <div className="text-white font-medium">{formatDate(stats.joinDate)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#C09B52]" />
            <div>
              <div className="text-sm text-gray-400">آخر تسجيل دخول</div>
              <div className="text-white font-medium">{formatDate(stats.lastLogin)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStats;
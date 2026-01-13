'use client';

import { Users, Calendar, Bell, FileText, Settings, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export function AdminQuickActions() {
  const quickActions = [
    {
      title: 'إدارة المستخدمين',
      description: 'عرض وإدارة جميع المستخدمين',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-700'
    },
    {
      title: 'إدارة الأحداث',
      description: 'عرض وإدارة جميع الأحداث',
      icon: Calendar,
      href: '/admin/events',
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-700'
    },
    {
      title: 'الإشعارات',
      description: 'إدارة إشعارات النظام',
      icon: Bell,
      href: '/admin/notifications',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-700'
    },
  ];

  return (
    <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6 hover:border-[#C09B52] transition-all duration-300">
      <div className="flex items-center mb-6">
        <Settings className="w-6 h-6 text-[#C09B52] mr-3" />
        <h2 className="text-xl font-bold text-white mr-3">الإجراءات السريعة</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <Link
              key={index}
              href={action.href}
              className={`group ${action.bgColor} border ${action.borderColor} rounded-lg p-4 hover:border-[#C09B52] transition-all duration-300 hover:shadow-lg hover:shadow-[#C09B52]/10 cursor-pointer`}
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg ${action.bgColor} border ${action.borderColor} mr-3`}>
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mr-3 mb-1 group-hover:text-[#C09B52] transition-colors duration-200">
                    {action.title}
                  </h3>
                  <p className="text-gray-400 text-sm mr-3">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
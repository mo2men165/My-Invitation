// client/src/constants/dashboardData.ts - Dashboard related constants
import { Plus, Calendar, Settings, Download, Users, Heart, BarChart3, CreditCard } from 'lucide-react';

// Quick Actions data
export const quickActions = [
  {
    title: 'إنشاء دعوة جديدة',
    description: 'ابدأ في تصميم دعوة مميزة لمناسبتك',
    icon: Plus,
    color: 'from-[#C09B52] to-amber-600',
    href: '/packages',
    primary: true
  },
  {
    title: 'إدارة المناسبات',
    description: 'عرض وتعديل مناسباتك الحالية',
    icon: Calendar,
    color: 'from-blue-500 to-cyan-500',
    href: '/events'
  },
  {
    title: 'إعدادات الحساب',
    description: 'تحديث معلوماتك الشخصية',
    icon: Settings,
    color: 'from-purple-500 to-pink-500',
    href: '/settings'
  },
  {
    title: 'المفضلة',
    description: 'عرض التصاميم المحفوظة',
    icon: Heart,
    color: 'from-red-500 to-rose-500',
    href: '/wishlist'
  }
];

// Dashboard stats configuration
export const statsConfig = [
  {
    title: 'الطلبات',
    icon: 'FileText',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    title: 'إجمالي الإنفاق',
    icon: 'TrendingUp',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-500/10 to-emerald-500/10',
  },
  {
    title: 'الضيوف',
    icon: 'Users',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-500/10 to-pink-500/10',
  },
  {
    title: 'المناسبات',
    icon: 'Calendar',
    color: 'from-orange-500 to-red-500',
    bgColor: 'from-orange-500/10 to-red-500/10',
  }
];

// Order status configuration
export const orderStatusConfig = {
  'مكتمل': {
    icon: 'CheckCircle',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  'قيد التنفيذ': {
    icon: 'Clock',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  'قيد المراجعة': {
    icon: 'Clock',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  'ملغي': {
    icon: 'XCircle',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

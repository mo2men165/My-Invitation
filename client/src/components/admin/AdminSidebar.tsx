'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store';
import { logout } from '@/store/authSlice';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';

interface AdminSidebarProps {
  children: React.ReactNode;
}

export function AdminSidebar({ children }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSignOut = () => {
    dispatch(logout());
    router.push('/login');
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
    // Trigger animation after DOM update
    requestAnimationFrame(() => {
      setIsAnimating(true);
    });
  };

  const closeSidebar = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsSidebarOpen(false);
    }, 300);
  };


  const sidebarItems = [
    {
      title: 'لوحة التحكم',
      href: '/admin',
      icon: LayoutDashboard,
      color: 'text-[#C09B52]'
    },
    {
      title: 'إدارة المستخدمين',
      href: '/admin/users',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      title: 'إدارة الأحداث',
      href: '/admin/events',
      icon: Calendar,
      color: 'text-green-400'
    },
    {
      title: 'إدارة الطلبات',
      href: '/admin/orders',
      icon: ShoppingCart,
      color: 'text-purple-400'
    },
    {
      title: 'الإشعارات',
      href: '/admin/notifications',
      icon: Bell,
      color: 'text-yellow-400'
    },
  ];

  const SidebarContent = ({ isCollapsed = false }) => (
    <div className={`h-full flex flex-col bg-gray-900 border-r border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Logo/Header */}
      <div className={`border-b border-gray-700 transition-all duration-300 ${
        isCollapsed ? 'p-2' : 'p-6'
      }`}>
        <div className="flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Admin Logo" 
                width={40} 
                height={40}
                className="w-auto ml-3 h-10"
              />
              <div className="text-right mr-3">
                <h2 className="text-lg font-bold text-white">لوحة الإدارة</h2>
                <p className="text-xs text-gray-400">نظام إدارة المنصة</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
                title="توسيع الشريط الجانبي"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0 ml-3">
              <span className="text-sm font-bold text-black">
                {user?.firstName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-white font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center justify-start">
                <Shield className="w-3 h-3 text-[#C09B52] ml-1" />
                <span className="text-xs text-[#C09B52]">مدير النظام</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className={`flex-1 space-y-3 transition-all duration-300 ${
        isCollapsed ? 'p-2' : 'p-4'
      }`}>
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={`flex items-center rounded-lg transition-all duration-200 group ${
                isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'
              } ${
                isActive 
                  ? 'bg-[#C09B52]/20 border border-[#C09B52]/50 text-[#C09B52]' 
                  : 'hover:bg-gray-800 text-gray-300 hover:text-white'
              }`}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'ml-3'} ${isActive ? 'text-[#C09B52]' : item.color}`} />
              {!isCollapsed && (
                <>
                  <span className="font-medium text-right flex-1">{item.title}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-[#C09B52] rounded-full"></div>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`border-t border-gray-700 space-y-3 transition-all duration-300 ${
        isCollapsed ? 'p-2' : 'p-4'
      }`}>
        
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center rounded-lg text-red-400 hover:text-red-300 hover:bg-gray-800 transition-all duration-200 ${
            isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'
          }`}
          title={isCollapsed ? 'تسجيل الخروج' : undefined}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'ml-3'}`} />
          {!isCollapsed && <span className="text-right flex-1">تسجيل الخروج</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-80'
      }`}>
        <SidebarContent isCollapsed={isCollapsed} />
        
        {/* Desktop Close Button (only when expanded) */}
        {!isCollapsed && (
          <div className="absolute top-4 left-4">
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
              title="طي الشريط الجانبي"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Admin Logo" 
              width={32} 
              height={32}
              className="h-8 w-auto ml-2"
            />
            <h1 className="text-lg font-bold text-white mr-3">لوحة الإدارة</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openSidebar}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
                isAnimating ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={closeSidebar} 
            />
            <div className={`fixed top-0 left-0 w-80 h-full transform transition-transform duration-300 ease-in-out ${
              isAnimating ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <div className="relative h-full">
                <SidebarContent isCollapsed={false} />
                <button
                  onClick={closeSidebar}
                  className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        isCollapsed ? 'lg:pl-16' : 'lg:pl-80'
      }`}>
        <main className="min-h-screen relative">
          {children}
        </main>
      </div>
    </div>
  );
}
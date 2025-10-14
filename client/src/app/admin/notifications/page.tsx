'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Bell, Calendar, CheckCircle, Clock, User, Check, MapPin, Package } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';

interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  eventId?: {
    details: {
      eventName?: string;
      hostName: string;
      eventDate: string;
      displayName?: string;
      eventLocation?: string;
    };
    packageType?: string;
  };
  userId?: {
    firstName: string;
    lastName: string;
  };
  isRead: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getNotifications({
        page: currentPage,
        limit: 15,
        unreadOnly: showUnreadOnly
      });
      setNotifications(data.data);
      setTotalPages(data.pagination.pages);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, showUnreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await adminAPI.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_event_pending':
        return <Calendar className="w-5 h-5 text-yellow-400" />;
      case 'payment_received':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_event_pending':
        return 'border-yellow-700 bg-yellow-900/20';
      case 'payment_received':
        return 'border-green-700 bg-green-900/20';
      default:
        return 'border-blue-700 bg-blue-900/20';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
    
    // Use Gregorian calendar instead of Hijri
    return date.toLocaleDateString('ar-SA', {
      calendar: 'gregory',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      calendar: 'gregory',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPackageLabel = (packageType: string) => {
    switch (packageType) {
      case 'classic':
        return 'كلاسيك';
      case 'premium':
        return 'بريميوم';
      case 'vip':
        return 'VIP';
      default:
        return packageType;
    }
  };

  if (loading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">جاري التحميل...</div>
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="container mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-[#C09B52] ml-3" />
              <h1 className="text-3xl font-bold text-white">الإشعارات</h1>
              {unreadCount > 0 && (
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm mr-3">
                  {unreadCount} غير مقروء
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => {
                    setShowUnreadOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="w-4 h-4 text-[#C09B52] bg-gray-800 border-gray-600 rounded focus:ring-[#C09B52] focus:ring-2"
                />
                <span className="ml-2 text-gray-300">غير مقروء فقط</span>
              </label>
            </div>
          </div>
          <p className="text-gray-400 text-right">إدارة إشعارات النظام والتحديثات</p>
        </div>

        {/* Notifications */}
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-white">جاري تحميل الإشعارات...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {showUnreadOnly ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-6 hover:bg-gray-800/40 transition-all duration-200 ${
                      !notification.isRead ? 'bg-gradient-to-r from-[#C09B52]/8 to-transparent border-r-4 border-r-[#C09B52] shadow-sm' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} flex-shrink-0 ml-4`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 text-right">
                              <h3 className={`text-lg font-bold mb-1 ${
                                notification.isRead ? 'text-gray-400' : 'text-white'
                              }`}>
                                {notification.title}
                              </h3>
                              <p className={`mt-2 text-sm leading-relaxed ${
                                notification.isRead ? 'text-gray-500' : 'text-gray-300'
                              }`}>
                                {notification.message}
                              </p>
                              
                              {/* Event Details */}
                              {notification.eventId && (
                                <div className="mt-4 p-4 bg-gradient-to-br from-gray-800/70 to-gray-800/40 border border-gray-600/70 rounded-lg text-right shadow-lg">
                                  <div className="text-sm text-[#C09B52] mb-3 font-bold uppercase tracking-wide">تفاصيل المناسبة</div>
                                  
                                  {notification.eventId.details.eventName && (
                                    <div className="text-white font-bold text-lg mb-3 leading-snug">
                                      {notification.eventId.details.eventName}
                                    </div>
                                  )}
                                  
                                  <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-sm">
                                      <User className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                      <span className="text-gray-400">المضيف:</span>
                                      <span className="text-white font-semibold">{notification.eventId.details.hostName}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm">
                                      <Calendar className="w-4 h-4 text-green-400 flex-shrink-0" />
                                      <span className="text-gray-300 font-medium">{formatEventDate(notification.eventId.details.eventDate)}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                      <span className="text-gray-300">{notification.eventId.details.displayName || notification.eventId.details.eventLocation || 'غير محدد'}</span>
                                    </div>
                                    
                                    {notification.eventId.packageType && (
                                      <div className="flex items-center gap-2 pt-1">
                                        <Package className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                        <div className="inline-block px-3 py-1.5 bg-gradient-to-r from-[#C09B52]/30 to-[#C09B52]/20 border border-[#C09B52]/50 rounded-full text-[#C09B52] text-xs font-bold shadow-sm">
                                          {getPackageLabel(notification.eventId.packageType)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* User Details */}
                              {notification.userId && (
                                <div className="mt-3 flex items-center text-sm justify-end">
                                  <User className="w-4 h-4 ml-1 text-blue-400" />
                                  <span className="text-gray-400 font-medium">
                                    {notification.userId.firstName} {notification.userId.lastName}
                                  </span>
                                </div>
                              )}
                              
                              {/* Time */}
                              <div className="mt-2 flex items-center text-sm justify-end">
                                <Clock className="w-4 h-4 ml-1 text-amber-400" />
                                <span className={`font-medium ${
                                  notification.isRead ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-3 ml-4">
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification._id)}
                                  className="p-2.5 bg-[#C09B52] hover:bg-amber-600 text-black rounded-lg transition-colors duration-200"
                                  title="تحديد كمقروء"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="relative flex-shrink-0">
                          <div className="w-3 h-3 bg-[#C09B52] rounded-full"></div>
                          <div className="absolute inset-0 w-3 h-3 bg-[#C09B52] rounded-full animate-ping opacity-50"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-800/50 border-t border-gray-700 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400 text-right">
                      صفحة {currentPage} من {totalPages}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 font-medium"
                      >
                        السابق
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 font-medium"
                      >
                        التالي
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminSidebar>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';

interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  eventId?: {
    details: {
      hostName: string;
      eventDate: string;
    };
  };
  userId?: {
    firstName: string;
    lastName: string;
  };
  isRead: boolean;
  createdAt: string;
}

export function AdminRecentActivity() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await adminAPI.getNotifications({ page: 1, limit: 10 });
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        return <Calendar className="w-4 h-4 text-yellow-400" />;
      case 'payment_received':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
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
    
    return date.toLocaleDateString('ar-SA');
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6 hover:border-[#C09B52] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-[#C09B52] mr-3" />
          <h2 className="text-xl font-bold text-white">النشاط الأخير</h2>
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs ml-3">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => !notification.isRead && markAsRead(notification._id)}
              className={`flex items-start p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                notification.isRead 
                  ? 'bg-gray-800/30 hover:bg-gray-800/50' 
                  : 'bg-[#C09B52]/10 border border-[#C09B52]/30 hover:bg-[#C09B52]/15'
              }`}
            >
              <div className="flex-shrink-0  mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-3">
                    <h4 className={`text-sm font-medium ${
                      notification.isRead ? 'text-gray-300' : 'text-white'
                    }`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mt-1  ${
                      notification.isRead ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {notification.eventId && (
                      <div className="mt-2 text-xs text-gray-500">
                        حدث: {notification.eventId.details.hostName}
                      </div>
                    )}
                    
                    {notification.userId && (
                      <div className="mt-1 text-xs text-gray-500">
                        بواسطة: {notification.userId.firstName} {notification.userId.lastName}
                      </div>
                    )}
                  </div>
                  
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-[#C09B52] rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
                
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-3" />
                  {formatTimeAgo(notification.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {notifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button className="w-full text-center text-sm text-[#C09B52] hover:text-amber-300 transition-colors duration-200">
            عرض جميع الإشعارات
          </button>
        </div>
      )}
    </div>
  );
}
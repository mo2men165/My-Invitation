// components/dashboard/RecentOrders.tsx
'use client';
import { useState, useEffect } from 'react';
import { MoreHorizontal, Eye, Download, Calendar, Users, CheckCircle, Clock, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchRecentOrders, clearErrors } from '@/store/dashboardSlice';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

export function RecentOrders() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { recentOrders, isLoadingOrders, ordersError, lastFetched } = useAppSelector((state) => state.dashboard);
  const [showAll, setShowAll] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Track page visibility for auto-refresh optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Fetch orders on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchRecentOrders(showAll ? 10 : 5));
    }
  }, [dispatch, isAuthenticated, showAll]);

  // Auto-refresh orders every 30 seconds for real-time updates (only when page is visible)
  useEffect(() => {
    if (!isAuthenticated || !isPageVisible) return;

    const interval = setInterval(() => {
      if (isPageVisible) {
        setIsBackgroundRefreshing(true);
        dispatch(fetchRecentOrders(showAll ? 10 : 5)).finally(() => {
          setIsBackgroundRefreshing(false);
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated, showAll, isPageVisible]);

  // Handle errors with toast
  useEffect(() => {
    if (ordersError) {
      toast({
        title: "خطأ في تحميل الطلبات",
        description: ordersError,
        variant: "destructive",
        duration: 5000
      });
      dispatch(clearErrors());
    }
  }, [ordersError, toast, dispatch]);

  const handleRetry = () => {
    dispatch(fetchRecentOrders(showAll ? 10 : 5));
  };

  const handleRefresh = () => {
    dispatch(fetchRecentOrders(showAll ? 10 : 5));
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/events/${orderId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'مكتمل':
        return <CheckCircle className="w-4 h-4" />;
      case 'قيد التنفيذ':
      case 'قيد المراجعة':
        return <Clock className="w-4 h-4" />;
      case 'ملغي':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusColor = (color: string) => {
    const colors = {
      green: 'text-green-400 bg-green-400/10 border-green-400/20',
      yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      red: 'text-red-400 bg-red-400/10 border-red-400/20',
      purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getPackageTypeDisplay = (packageType: string) => {
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

  const displayedOrders = showAll ? recentOrders : recentOrders.slice(0, 3);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">الطلبات الأخيرة</h2>
            {lastFetched && (
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                <span>آخر تحديث: {new Date(lastFetched).toLocaleString('ar-SA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  calendar: 'gregory'
                })}</span>
                {isBackgroundRefreshing && (
                  <span className="flex items-center gap-1 text-[#C09B52]">
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                    جاري التحديث...
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
            <button
              onClick={handleRefresh}
              disabled={isLoadingOrders}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#C09B52]/20 text-[#C09B52] rounded-lg hover:bg-[#C09B52]/30 transition-colors disabled:opacity-50 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">تحديث</span>
            </button>
            {isLoadingOrders && (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#C09B52] animate-spin" />
            )}
            <button 
              onClick={() => router.push('/events')}
              className="text-[#C09B52] hover:text-amber-400 transition-colors duration-300 text-xs sm:text-sm font-medium"
            >
              عرض الكل
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-3 sm:p-4 md:p-6">
        {ordersError && !isLoadingOrders ? (
          <div className="text-center py-6 sm:py-8">
            <div className="bg-red-500/10 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-red-500/20">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-400 mx-auto mb-2 sm:mb-3" />
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-white mb-1 sm:mb-2">خطأ في تحميل الطلبات</h3>
              <p className="text-red-400 text-xs sm:text-sm mb-3 sm:mb-4">{ordersError}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors mx-auto text-xs sm:text-sm"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                إعادة المحاولة
              </button>
            </div>
          </div>
        ) : displayedOrders.length === 0 && !isLoadingOrders ? (
          <div className="text-center py-8 sm:py-12">
            <Calendar className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-400 mb-1 sm:mb-2">لا توجد طلبات حتى الآن</h3>
            <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6">ابدأ بإنشاء أول دعوة إلكترونية لك</p>
            <button 
              onClick={() => router.push('/packages')}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300"
            >
              إنشاء دعوة جديدة
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Loading skeleton */}
            {isLoadingOrders && displayedOrders.length === 0 && (
              <>
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 rounded-lg sm:rounded-xl flex-shrink-0"></div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-3 sm:h-4 bg-gray-600 rounded w-1/3"></div>
                        <div className="h-2 sm:h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                      <div className="w-12 sm:w-16 h-5 sm:h-6 bg-gray-600 rounded hidden sm:block"></div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Actual orders */}
            {displayedOrders.map((order, index) => (
              <div
                key={order.id}
                className="group bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 hover:border-[#C09B52]/30 transition-all duration-300 hover:bg-white/10 cursor-pointer"
                onClick={() => handleViewOrder(order.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  
                  {/* Order Info */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-[#C09B52] transition-colors duration-300 truncate">
                          {order.event}
                        </h3>
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-[#C09B52]/20 text-[#C09B52] rounded-full border border-[#C09B52]/30">
                          {getPackageTypeDisplay(order.type)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs md:text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{order.date}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{order.guests} ضيف</span>
                        </span>
                        <span className="text-[#C09B52] font-medium">{order.amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 mr-auto sm:mr-0">
                    <div className={`flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border text-[10px] sm:text-xs font-medium ${getStatusColor(order.statusColor)}`}>
                      {getStatusIcon(order.status)}
                      <span>{order.status}</span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewOrder(order.id);
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-[#C09B52]/20 flex items-center justify-center transition-colors duration-300"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-[#C09B52]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show More Button */}
        {!showAll && recentOrders.length > 3 && !isLoadingOrders && (
          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={() => setShowAll(true)}
              disabled={isLoadingOrders}
              className="px-4 sm:px-6 py-2 sm:py-3 text-[#C09B52] hover:text-amber-400 hover:bg-[#C09B52]/10 rounded-lg sm:rounded-xl transition-all duration-300 font-medium text-sm sm:text-base disabled:opacity-50"
            >
              {isLoadingOrders ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  جاري التحميل...
                </span>
              ) : (
                `عرض المزيد (${recentOrders.length - 3} طلب)`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// components/dashboard/DashboardStats.tsx
'use client';
import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Users, Calendar, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchDashboardStats, clearErrors } from '@/store/dashboardSlice';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function DashboardStats() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { stats, isLoadingStats, statsError, lastFetched } = useAppSelector((state) => state.dashboard);
  const [isVisible, setIsVisible] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Track page visibility for auto-refresh optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Fetch stats on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchDashboardStats());
    }
  }, [dispatch, isAuthenticated]);

  // Auto-refresh stats every 30 seconds for real-time updates (only when page is visible)
  useEffect(() => {
    if (!isAuthenticated || !isPageVisible) return;

    const interval = setInterval(() => {
      if (isPageVisible) {
        setIsBackgroundRefreshing(true);
        dispatch(fetchDashboardStats()).finally(() => {
          setIsBackgroundRefreshing(false);
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated, isPageVisible]);

  // Handle errors with toast
  useEffect(() => {
    if (statsError) {
      toast({
        title: "خطأ في تحميل الإحصائيات",
        description: statsError,
        variant: "destructive",
        duration: 5000
      });
      dispatch(clearErrors());
    }
  }, [statsError, toast, dispatch]);

  const handleRetry = () => {
    dispatch(fetchDashboardStats());
  };

  const handleRefresh = () => {
    dispatch(fetchDashboardStats());
  };

  // Calculate percentage change display
  const formatChange = (change: number, unit = '%') => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change}${unit} من الشهر الماضي`;
  };

  // Default stats when loading or no data
  const defaultStats = {
    totalOrders: 0,
    totalSpent: 0,
    totalGuests: 0,
    upcomingEvents: 0,
    monthlyOrdersChange: 0,
    monthlySpentChange: 0
  };

  const currentStats = stats || defaultStats;

  const statsConfig = [
    {
      title: 'الطلبات',
      value: isLoadingStats ? '...' : currentStats.totalOrders.toString(),
      change: formatChange(currentStats.monthlyOrdersChange),
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      title: 'إجمالي الإنفاق',
      value: isLoadingStats ? '...' : `${currentStats.totalSpent.toLocaleString('ar-SA')} ر.س`,
      change: formatChange(currentStats.monthlySpentChange),
      icon: TrendingUp,
      color: 'from-[#C09B52] to-amber-500',
      bgColor: 'from-[#C09B52]/10 to-amber-500/10',
    },
    {
      title: 'الضيوف المدعوين',
      value: isLoadingStats ? '...' : currentStats.totalGuests.toLocaleString('ar-SA'),
      change: 'في جميع المناسبات',
      icon: Users,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'from-indigo-500/10 to-purple-500/10',
    },
    {
      title: 'المناسبات القادمة',
      value: isLoadingStats ? '...' : currentStats.upcomingEvents.toString(),
      change: 'خلال الشهر القادم',
      icon: Calendar,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-500/10 to-red-500/10',
    },
  ];

  if (statsError && !isLoadingStats) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-lg font-medium text-white">خطأ في تحميل الإحصائيات</h3>
              <p className="text-red-400 text-sm">{statsError}</p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">إحصائيات لوحة التحكم</h2>
          {lastFetched && (
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
              آخر تحديث: {new Date(lastFetched).toLocaleString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                calendar: 'gregory'
              })}
              {isBackgroundRefreshing && (
                <span className="flex items-center gap-1 text-[#C09B52]">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  جاري التحديث...
                </span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoadingStats}
          className="flex items-center gap-2 px-4 py-2 bg-[#C09B52]/20 text-[#C09B52] rounded-lg hover:bg-[#C09B52]/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`group relative transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            {/* Glow Effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500`}></div>
            
            {/* Card */}
            <div className={`relative h-full bg-gradient-to-br ${stat.bgColor} backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-500 group-hover:transform group-hover:scale-105`}>
              
              {/* Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} p-0.5 group-hover:scale-110 transition-transform duration-500`}>
                  <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                    {isLoadingStats ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${isLoadingStats ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`}></div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-gray-400 text-sm font-medium">
                  {stat.title}
                </h3>
                <p className={`text-2xl font-bold transition-colors duration-300 ${
                  isLoadingStats ? 'text-gray-400' : 'text-white group-hover:text-[#C09B52]'
                }`}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                  {stat.change}
                </p>
              </div>

              {/* Floating Particle */}
              <div className="absolute top-3 right-3 w-1 h-1 bg-gradient-to-r from-[#C09B52] to-amber-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
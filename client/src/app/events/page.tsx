// src/app/events/page.tsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { eventsAPI, EventItem } from '@/lib/api/events';
import { useToast } from '@/hooks/useToast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Loader2,
  Plus,
  Filter,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const EventsPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 12
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await eventsAPI.getEvents(params);
      
      if (response.success) {
        setEvents(response.events || []);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل المناسبات",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, toast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const getPackageDetails = (packageType: string) => {
    switch (packageType) {
      case 'classic':
        return { name: 'كلاسيك', color: 'from-blue-600 to-blue-700', bgColor: 'bg-blue-500/20' };
      case 'premium':
        return { name: 'بريميوم', color: 'from-purple-600 to-purple-700', bgColor: 'bg-purple-500/20' };
      case 'vip':
        return { name: 'VIP', color: 'from-yellow-600 to-yellow-700', bgColor: 'bg-yellow-500/20' };
      default:
        return { name: 'غير محدد', color: 'from-gray-600 to-gray-700', bgColor: 'bg-gray-500/20' };
    }
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { name: 'قادمة', color: 'text-green-400', bgColor: 'bg-green-500/20' };
      case 'done':
        return { name: 'مكتملة', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
      case 'cancelled':
        return { name: 'ملغية', color: 'text-red-400', bgColor: 'bg-red-500/20' };
      default:
        return { name: 'غير محدد', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalGuests = (guests: any[]) => {
    return guests.reduce((total, guest) => total + guest.numberOfAccompanyingGuests, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#C09B52]" />
          <p className="text-white">جاري تحميل المناسبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">مناسباتي</h1>
              <p className="text-gray-400">إدارة وتتبع جميع مناسباتك</p>
            </div>
            <Link 
              href="/packages"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-medium rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              إنشاء مناسبة جديدة
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[#C09B52]" />
            <span className="text-white font-medium">تصفية حسب الحالة:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'الكل' },
              { value: 'upcoming', label: 'قادمة' },
              { value: 'done', label: 'مكتملة' },
              { value: 'cancelled', label: 'ملغية' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  statusFilter === filter.value
                    ? 'bg-[#C09B52] text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#C09B52]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-[#C09B52]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">لا توجد مناسبات</h3>
            <p className="text-gray-400 mb-6">
              {statusFilter === 'all' ? 'لم تقم بإنشاء أي مناسبات بعد' : `لا توجد مناسبات ${statusFilter === 'upcoming' ? 'قادمة' : statusFilter === 'done' ? 'مكتملة' : 'ملغية'}`}
            </p>
            <Link 
              href="/packages"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C09B52] text-white font-medium rounded-lg hover:bg-[#B8935A] transition-colors"
            >
              <Plus className="w-5 h-5" />
              إنشاء مناسبة جديدة
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const packageDetails = getPackageDetails(event.packageType);
                const statusDetails = getStatusDetails(event.status);
                const totalGuests = getTotalGuests(event.guests);

                return (
                  <div
                    key={event._id}
                    className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300 group cursor-pointer"
                    onClick={() => router.push(`/events/${event._id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${packageDetails.color} text-white text-sm font-medium`}>
                        {packageDetails.name}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusDetails.bgColor} ${statusDetails.color}`}>
                        {statusDetails.name}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#C09B52] transition-colors">
                      {event.details.hostName}
                    </h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Calendar className="w-4 h-4 text-[#C09B52]" />
                        {formatEventDate(event.details.eventDate)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Clock className="w-4 h-4 text-[#C09B52]" />
                        {event.details.startTime} - {event.details.endTime}
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <MapPin className="w-4 h-4 text-[#C09B52]" />
                        <span className="truncate">{event.details.eventLocation}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Users className="w-4 h-4 text-[#C09B52]" />
                        {totalGuests} من {event.details.inviteCount} ضيف
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="text-right">
                        <div className="text-[#C09B52] font-bold">
                          {event.totalPrice.toLocaleString('ar-SA')} ر.س
                        </div>
                        <div className="text-xs text-gray-400">
                          {event.guests.length} ضيف مضاف
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[#C09B52] group-hover:translate-x-1 transition-transform">
                        <span className="text-sm font-medium">عرض التفاصيل</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-[#C09B52] text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
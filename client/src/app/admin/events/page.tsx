'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminEventGuests } from '@/components/admin/AdminEventGuests';
import { Calendar, Search, Check, X, Clock, Eye, CheckCircle, XCircle, MessageSquare, Users, MapPin, Package, ExternalLink, QrCode, CreditCard, Truck, UserCheck, ImageIcon } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';
import { invitationDesigns } from '@/constants/invitationDesigns';
import Image from 'next/image';

interface Event {
  id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  eventDetails: {
    eventName?: string;
    hostName: string;
    eventDate: string;
    eventLocation: string;
    displayName?: string;
    inviteCount: number;
    packageType: string;
    startTime?: string;
    endTime?: string;
    invitationText?: string;
    additionalCards?: number;
    gateSupervisors?: number;
    fastDelivery?: boolean;
    formattedAddress?: string;
    googleMapsUrl?: string;
    detectedCity?: string;
    isCustomDesign?: boolean;
    customDesignNotes?: string;
  };
  designId?: string;
  totalPrice: number;
  status: string;
  approvalStatus: string;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  paymentCompletedAt: string;
  invitationCardImage?: {
    public_id: string;
    secure_url: string;
    url: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    created_at: string;
  };
  qrCodeReaderUrl?: string;
  guests?: any[];
  guestListConfirmed?: {
    isConfirmed: boolean;
    confirmedAt?: string;
    confirmedBy?: string;
  };
  guestCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showGuestsModal, setShowGuestsModal] = useState(false);
  const [selectedEventForGuests, setSelectedEventForGuests] = useState<string | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [invitationCardImage, setInvitationCardImage] = useState<File | null>(null);
  const [invitationCardImagePreview, setInvitationCardImagePreview] = useState<string | null>(null);
  const [qrCodeReaderUrl, setQrCodeReaderUrl] = useState('');
  const [processingApproval, setProcessingApproval] = useState(false);
  const [editingEventImage, setEditingEventImage] = useState(false);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [uploadingEventImage, setUploadingEventImage] = useState(false);
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllEvents({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        approvalStatus: approvalStatusFilter,
        status: statusFilter
      });
      setEvents(data.data);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, approvalStatusFilter, statusFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const formatDate = (dateString: string) => {
    // Handle both ISO string and Date object
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'تاريخ غير صحيح';
    }
    
    // Format as Gregorian date in Arabic
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      calendar: 'gregory' // Force Gregorian calendar
    });
  };

  const formatDateCompact = (dateString: string) => {
    // Handle both ISO string and Date object
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'تاريخ غير صحيح';
    }
    
    // Format as compact Gregorian date in Arabic
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      calendar: 'gregory' // Force Gregorian calendar
    });
  };


  const handleApprovalAction = (event: Event, action: 'approve' | 'reject') => {
    setSelectedEvent(event);
    setApprovalAction(action);
    setApprovalNotes('');
    setInvitationCardImage(null);
    setInvitationCardImagePreview(null);
    setShowApprovalModal(true);
  };

  const handleUpdateEventImage = async () => {
    if (!selectedEvent || !eventImageFile) return;

    try {
      setUploadingEventImage(true);

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(eventImageFile.type)) {
        toast({
          title: "خطأ",
          description: "نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WebP)",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (10MB)
      if (eventImageFile.size > 10 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت",
          variant: "destructive"
        });
        return;
      }

      await adminAPI.updateEventImage(selectedEvent.id, eventImageFile);
      
      toast({
        title: "تم بنجاح",
        description: "تم تحديث صورة بطاقة الدعوة بنجاح",
        variant: "default"
      });

      // Refresh events to get updated image
      const updatedEvents = await adminAPI.getAllEvents({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        approvalStatus: approvalStatusFilter,
        status: statusFilter
      });
      
      // Update events list
      setEvents(updatedEvents.data);
      setTotalPages(updatedEvents.pagination.pages);
      
      // Update selected event if it's still open
      const updatedEvent = updatedEvents.data.find(e => e.id === selectedEvent.id);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      }

      // Reset state
      setEventImageFile(null);
      setEventImagePreview(null);
      setEditingEventImage(false);
    } catch (error: any) {
      console.error('Error updating event image:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الصورة",
        variant: "destructive"
      });
    } finally {
      setUploadingEventImage(false);
    }
  };

  const handleViewGuests = (eventId: string) => {
    setSelectedEventForGuests(eventId);
    setShowGuestsModal(true);
  };

  const handleCloseGuestsModal = () => {
    setShowGuestsModal(false);
    setSelectedEventForGuests(null);
  };

  const processApproval = async () => {
    if (!selectedEvent || !approvalAction) return;

    try {
      setProcessingApproval(true);
      
      if (approvalAction === 'approve') {
        // For approval, invitation card image is required
        if (!invitationCardImage) {
          toast({
            title: "خطأ",
            description: "يرجى رفع صورة بطاقة الدعوة",
            variant: "destructive"
          });
          return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(invitationCardImage.type)) {
          toast({
            title: "خطأ",
            description: "نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WebP)",
            variant: "destructive"
          });
          return;
        }

        // Validate file size (10MB)
        if (invitationCardImage.size > 10 * 1024 * 1024) {
          toast({
            title: "خطأ",
            description: "حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت",
            variant: "destructive"
          });
          return;
        }

        await adminAPI.approveEvent(selectedEvent.id, invitationCardImage, approvalNotes || undefined, qrCodeReaderUrl.trim() || undefined);
        toast({
          title: "تم بنجاح",
          description: "تم الموافقة على الحدث وإرسال إشعار للمستخدم",
          variant: "default"
        });
      } else {
        if (!approvalNotes.trim()) {
          toast({
            title: "خطأ",
            description: "يرجى إدخال سبب الرفض",
            variant: "destructive"
          });
          return;
        }
        await adminAPI.rejectEvent(selectedEvent.id, approvalNotes);
        toast({
          title: "تم بنجاح",
          description: "تم رفض الحدث بنجاح",
          variant: "default"
        });
      }

      setShowApprovalModal(false);
      setApprovalAction(null);
      setApprovalNotes('');
      setInvitationCardImage(null);
      setInvitationCardImagePreview(null);
      setQrCodeReaderUrl('');
      fetchEvents(); // Refresh the events list
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء معالجة الطلب",
        variant: "destructive"
      });
    } finally {
      setProcessingApproval(false);
    }
  };

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            معلق
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700">
            <Check className="w-3 h-3 mr-1" />
            معتمد
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-700">
            <X className="w-3 h-3 mr-1" />
            مرفوض
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700">
            نشط
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-700">
            مكتمل
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-900/30 text-gray-400 border border-gray-700">
            ملغي
          </span>
        );
      default:
        return null;
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
      <>
        <div className="container mx-auto px-8 py-12">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <Calendar className="w-8 h-8 text-[#C09B52] ml-3" />
              <h1 className="text-3xl font-bold text-white">إدارة الأحداث</h1>
            </div>
            <p className="text-gray-400 text-right">عرض وإدارة جميع الأحداث المسجلة في المنصة</p>
          </div>

          {/* Filters */}
          <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو الموقع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52] text-right"
                  dir="rtl"
                />
              </div>

              {/* Approval Status Filter */}
              <select
                value={approvalStatusFilter}
                onChange={(e) => setApprovalStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52] text-right"
                dir="rtl"
              >
                <option value="">جميع حالات الموافقة</option>
                <option value="pending">معلق</option>
                <option value="approved">معتمد</option>
                <option value="rejected">مرفوض</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52] text-right"
                dir="rtl"
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setApprovalStatusFilter('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                مسح الفلاتر
              </button>
            </div>
          </div>

          {/* Events Table */}
          <div className="bg-gray-900/60 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="text-white">جاري تحميل الأحداث...</div>
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد أحداث</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="bg-gray-800/50 border-b border-gray-700 px-6 py-5">
                  <div className="grid grid-cols-7 gap-6 text-sm font-medium text-gray-400 min-w-[700px]">
                    <div className="text-right">المناسبة</div>
                    <div className="text-right">المستخدم</div>
                    <div className="text-right">التاريخ</div>
                    <div className="text-right">السعر</div>
                    <div className="text-center">حالة الموافقة</div>
                    <div className="text-center">الحالة</div>
                    <div className="text-center">الإجراءات</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-700">
                  {events.map((event) => (
                    <div key={event.id} className="px-6 py-5 hover:bg-gray-800/30 transition-colors duration-200">
                      <div className="grid grid-cols-7 gap-6 items-center min-w-[700px]">
                        {/* Event Info */}
                        <div className="text-right">
                          <div className="text-white font-semibold text-sm">
                            {event.eventDetails.eventName || event.eventDetails.hostName}
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            مضيف: {event.eventDetails.hostName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-[#C09B52] text-xs font-medium">
                              {event.eventDetails.packageType}
                            </div>
                            {event.approvalStatus === 'approved' && (
                              <div className={`text-xs px-1.5 py-0.5 rounded ${
                                event.guestListConfirmed?.isConfirmed 
                                  ? 'bg-green-900/30 text-green-400' 
                                  : 'bg-yellow-900/30 text-yellow-400'
                              }`}>
                                {event.guestListConfirmed?.isConfirmed 
                                  ? `✓ ${event.guestCount || 0} ضيف` 
                                  : `${event.guestCount || 0} ضيف`
                                }
                              </div>
                            )}
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="min-w-0 text-right">
                          <div className="text-gray-300 text-sm truncate font-medium">
                            {event.user.name}
                          </div>
                          <div className="text-gray-500 text-xs font-mono mt-1" dir="ltr">
                            {event.user.phone}
                          </div>
                        </div>

                        {/* Date */}
                        <div className="text-gray-300 text-sm min-w-0 text-right">
                          <div className="text-xs truncate" title={formatDate(event.eventDetails.eventDate)}>
                            {formatDateCompact(event.eventDetails.eventDate)}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-[#C09B52] font-bold text-sm text-right">
                          {event.totalPrice.toLocaleString('ar-SA')} ر.س
                        </div>

                        {/* Approval Status */}
                        <div className="flex justify-center">
                          {getApprovalStatusBadge(event.approvalStatus)}
                        </div>

                        {/* Status */}
                        <div className="flex justify-center">
                          {getStatusBadge(event.status)}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDetailsModal(true);
                            }}
                            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* Guest Management Button - All Packages */}
                          {event.approvalStatus === 'approved' && (
                            <button
                              onClick={() => handleViewGuests(event.id)}
                              className={`p-2.5 text-white rounded-lg transition-colors duration-200 ${
                                event.guestListConfirmed?.isConfirmed 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-yellow-600 hover:bg-yellow-700'
                              }`}
                              title={
                                event.guestListConfirmed?.isConfirmed 
                                  ? `إدارة الضيوف (${event.guestCount || 0} ضيف مؤكد - ${event.eventDetails.packageType})` 
                                  : `إدارة الضيوف (${event.guestCount || 0} ضيف في انتظار التأكيد - ${event.eventDetails.packageType})`
                              }
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          )}
                          
                          {event.approvalStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprovalAction(event, 'approve')}
                                className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                                title="موافقة"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApprovalAction(event, 'reject')}
                                className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                                title="رفض"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
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
        </div>

        {/* Event Details Modal */}
        {showDetailsModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">تفاصيل الحدث الكاملة</h3>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setEditingEventImage(false);
                      setEventImageFile(null);
                      setEventImagePreview(null);
                    }}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Event Details */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#C09B52]" />
                    بيانات المناسبة
                  </h4>
                  <div className="bg-gray-800/50 rounded-xl p-5 space-y-4">
                    {selectedEvent.eventDetails.eventName && (
                      <div>
                        <label className="text-sm text-gray-400 font-medium">اسم المناسبة</label>
                        <div className="text-white font-bold text-lg mt-1">{selectedEvent.eventDetails.eventName}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 font-medium">المضيف</label>
                        <div className="text-white font-semibold mt-1">{selectedEvent.eventDetails.hostName}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 font-medium">نوع الحزمة</label>
                        <div className="mt-1">
                          <span className="inline-block px-3 py-1 bg-[#C09B52]/20 border border-[#C09B52]/40 rounded-full text-[#C09B52] text-sm font-bold">
                            {selectedEvent.eventDetails.packageType}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 font-medium">تاريخ المناسبة</label>
                        <div className="text-white mt-1">{formatDate(selectedEvent.eventDetails.eventDate)}</div>
                      </div>
                      {selectedEvent.eventDetails.startTime && selectedEvent.eventDetails.endTime && (
                        <div>
                          <label className="text-sm text-gray-400 font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            الوقت
                          </label>
                          <div className="text-white mt-1">
                            من {selectedEvent.eventDetails.startTime} إلى {selectedEvent.eventDetails.endTime}
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="text-sm text-gray-400 font-medium flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          عدد الدعوات
                        </label>
                        <div className="text-white font-semibold mt-1">{selectedEvent.eventDetails.inviteCount}</div>
                      </div>
                      {selectedEvent.eventDetails.packageType === 'vip' && selectedEvent.guestCount !== undefined && (
                        <div>
                          <label className="text-sm text-gray-400 font-medium flex items-center gap-1">
                            <UserCheck className="w-4 h-4" />
                            عدد الضيوف المضافين
                          </label>
                          <div className="text-white font-semibold mt-1">{selectedEvent.guestCount}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Design Selection */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#C09B52]" />
                    التصميم المختار
                  </h4>
                  <div className="bg-gray-800/50 rounded-xl p-5">
                    {selectedEvent.eventDetails.isCustomDesign ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-purple-900/30 border border-purple-700/40 rounded-full text-purple-400 text-sm font-bold">
                            تصميم مخصص
                          </div>
                        </div>
                        {selectedEvent.eventDetails.customDesignNotes && (
                          <div>
                            <label className="text-sm text-gray-400 font-medium">ملاحظات التصميم المخصص</label>
                            <div className="mt-2 bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                              <p className="text-white whitespace-pre-wrap">{selectedEvent.eventDetails.customDesignNotes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedEvent.designId && (() => {
                          const design = invitationDesigns.find(d => d.id === selectedEvent.designId);
                          return design ? (
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                              <div className="relative w-full sm:w-48 h-64 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
                                <Image
                                  src={design.image}
                                  alt={design.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 100vw, 192px"
                                />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div>
                                  <label className="text-sm text-gray-400 font-medium">اسم التصميم</label>
                                  <div className="text-white font-semibold mt-1">{design.name}</div>
                                </div>
                                <div>
                                  <label className="text-sm text-gray-400 font-medium">الفئة</label>
                                  <div className="text-white mt-1">{design.category}</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400">لم يتم العثور على معلومات التصميم</div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Details */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#C09B52]" />
                    تفاصيل الموقع
                  </h4>
                  <div className="bg-gray-800/50 rounded-xl p-5 space-y-3">
                    <div>
                      <label className="text-sm text-gray-400 font-medium">اسم المكان</label>
                      <div className="text-white mt-1">{selectedEvent.eventDetails.displayName || selectedEvent.eventDetails.eventLocation}</div>
                    </div>
                    {selectedEvent.eventDetails.formattedAddress && (
                      <div>
                        <label className="text-sm text-gray-400 font-medium">العنوان الكامل</label>
                        <div className="text-white mt-1">{selectedEvent.eventDetails.formattedAddress}</div>
                      </div>
                    )}
                    {selectedEvent.eventDetails.detectedCity && (
                      <div>
                        <label className="text-sm text-gray-400 font-medium">المدينة</label>
                        <div className="text-white mt-1">{selectedEvent.eventDetails.detectedCity}</div>
                      </div>
                    )}
                    {selectedEvent.eventDetails.googleMapsUrl && (
                      <div>
                        <a
                          href={selectedEvent.eventDetails.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          فتح في خرائط جوجل
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invitation Text */}
                {selectedEvent.eventDetails.invitationText && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#C09B52]" />
                      نص الدعوة
                    </h4>
                    <div className="bg-gray-800/50 rounded-xl p-5">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedEvent.eventDetails.invitationText}</p>
                    </div>
                  </div>
                )}

                {/* Additional Services */}
                {(selectedEvent.eventDetails.additionalCards || selectedEvent.eventDetails.gateSupervisors || selectedEvent.eventDetails.fastDelivery) && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#C09B52]" />
                      الخدمات الإضافية
                    </h4>
                    <div className="bg-gray-800/50 rounded-xl p-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedEvent.eventDetails.additionalCards ? (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-[#C09B52]" />
                            <div>
                              <div className="text-sm text-gray-400">بطاقات إضافية</div>
                              <div className="text-white font-semibold">{selectedEvent.eventDetails.additionalCards}</div>
                            </div>
                          </div>
                        ) : null}
                        {selectedEvent.eventDetails.gateSupervisors ? (
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#C09B52]" />
                            <div>
                              <div className="text-sm text-gray-400">مشرفو البوابة</div>
                              <div className="text-white font-semibold">{selectedEvent.eventDetails.gateSupervisors}</div>
                            </div>
                          </div>
                        ) : null}
                        {selectedEvent.eventDetails.fastDelivery && (
                          <div className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-green-400" />
                            <div>
                              <div className="text-sm text-gray-400">التوصيل السريع</div>
                              <div className="text-green-400 font-semibold">مفعّل</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* User Details */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#C09B52]" />
                    بيانات المستخدم
                  </h4>
                  <div className="bg-gray-800/50 rounded-xl p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 font-medium">الاسم</label>
                        <div className="text-white font-semibold mt-1">{selectedEvent.user.name}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 font-medium">الإيميل</label>
                        <div className="text-white break-all mt-1">{selectedEvent.user.email}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 font-medium">الهاتف</label>
                        <div className="text-white font-mono text-right mt-1" dir="ltr">{selectedEvent.user.phone}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 font-medium">السعر الإجمالي</label>
                        <div className="text-[#C09B52] font-bold text-lg mt-1">
                          {selectedEvent.totalPrice.toLocaleString('ar-SA')} ر.س
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#C09B52]" />
                    معلومات الحالة والموافقة
                  </h4>
                  <div className="bg-gray-800/50 rounded-xl p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 font-medium">حالة الموافقة</label>
                        <div className="mt-1">{getApprovalStatusBadge(selectedEvent.approvalStatus)}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 font-medium">حالة المناسبة</label>
                        <div className="mt-1">{getStatusBadge(selectedEvent.status)}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 font-medium">تاريخ الدفع</label>
                        <div className="text-white mt-1">{formatDate(selectedEvent.paymentCompletedAt)}</div>
                      </div>
                      {selectedEvent.createdAt && (
                        <div>
                          <label className="text-sm text-gray-400 font-medium">تاريخ الإنشاء</label>
                          <div className="text-white mt-1">{formatDate(selectedEvent.createdAt)}</div>
                        </div>
                      )}
                      {selectedEvent.approvedBy && (
                        <div>
                          <label className="text-sm text-gray-400 font-medium">معتمد بواسطة</label>
                          <div className="text-green-400 font-semibold mt-1">{selectedEvent.approvedBy}</div>
                        </div>
                      )}
                      {selectedEvent.approvedAt && (
                        <div>
                          <label className="text-sm text-gray-400 font-medium">تاريخ الموافقة</label>
                          <div className="text-green-400 mt-1">{formatDate(selectedEvent.approvedAt)}</div>
                        </div>
                      )}
                      {selectedEvent.rejectedAt && (
                        <div>
                          <label className="text-sm text-gray-400 font-medium">تاريخ الرفض</label>
                          <div className="text-red-400 mt-1">{formatDate(selectedEvent.rejectedAt)}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Guest List Confirmation for VIP */}
                    {selectedEvent.eventDetails.packageType === 'vip' && selectedEvent.guestListConfirmed && (
                      <div className="pt-4 border-t border-gray-700">
                        <label className="text-sm text-gray-400 font-medium">تأكيد قائمة الضيوف</label>
                        <div className="mt-2 flex items-center gap-2">
                          {selectedEvent.guestListConfirmed.isConfirmed ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-400" />
                              <span className="text-green-400 font-semibold">تم التأكيد</span>
                              {selectedEvent.guestListConfirmed.confirmedAt && (
                                <span className="text-gray-400 text-sm">
                                  - {formatDate(selectedEvent.guestListConfirmed.confirmedAt)}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-yellow-400" />
                              <span className="text-yellow-400 font-semibold">في انتظار التأكيد</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invitation Card Image */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-400" />
                      بطاقة الدعوة
                    </div>
                    {!editingEventImage && (
                      <button
                        onClick={() => {
                          setEditingEventImage(true);
                          setEventImageFile(null);
                          setEventImagePreview(null);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        {selectedEvent.invitationCardImage ? 'تعديل الصورة' : 'رفع صورة'}
                      </button>
                    )}
                  </h4>
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-5">
                    {editingEventImage ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            {selectedEvent.invitationCardImage ? 'صورة جديدة' : 'صورة بطاقة الدعوة'}
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setEventImageFile(file);
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEventImagePreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              } else {
                                setEventImagePreview(null);
                              }
                            }}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#C09B52] file:text-white hover:file:bg-[#A0884A] cursor-pointer"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            الصيغ المدعومة: JPG, PNG, WebP (الحد الأقصى: 10 ميجابايت)
                          </p>
                        </div>
                        {eventImagePreview && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-2">معاينة الصورة:</p>
                            <div className="relative border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
                              <img
                                src={eventImagePreview}
                                alt="Preview"
                                className="w-full h-auto max-h-64 object-contain"
                              />
                            </div>
                            {eventImageFile && (
                              <p className="text-xs text-gray-500 mt-2">
                                الملف: {eventImageFile.name} ({(eventImageFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            )}
                          </div>
                        )}
                        {selectedEvent.invitationCardImage && !eventImagePreview && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-2">الصورة الحالية:</p>
                            <div className="relative border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
                              <img
                                src={selectedEvent.invitationCardImage.secure_url || selectedEvent.invitationCardImage.url}
                                alt="Current Invitation Card"
                                className="w-full h-auto max-h-64 object-contain"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleUpdateEventImage}
                            disabled={uploadingEventImage || !eventImageFile}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 font-medium"
                          >
                            {uploadingEventImage ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                جاري الرفع...
                              </div>
                            ) : (
                              'حفظ الصورة'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingEventImage(false);
                              setEventImageFile(null);
                              setEventImagePreview(null);
                            }}
                            disabled={uploadingEventImage}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : selectedEvent.invitationCardImage ? (
                      <div className="space-y-4">
                        <div className="relative border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
                          <img
                            src={selectedEvent.invitationCardImage.secure_url || selectedEvent.invitationCardImage.url}
                            alt="Invitation Card"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                        <a
                          href={selectedEvent.invitationCardImage.secure_url || selectedEvent.invitationCardImage.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          فتح الصورة في علامة تبويب جديدة
                        </a>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>لا توجد صورة بطاقة دعوة</p>
                        <p className="text-sm mt-1">انقر على "رفع صورة" لإضافة صورة</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Reader URL */}
                {selectedEvent.qrCodeReaderUrl && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-cyan-400" />
                      ماسح QR Code
                    </h4>
                    <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-xl p-5">
                      <p className="text-cyan-200 text-sm mb-4">
                        استخدم هذا الرابط لفتح تطبيق الماسح على البوابة لمسح QR codes الخاصة بالضيوف
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-cyan-100 text-sm mb-2">رابط تطبيق الماسح:</p>
                          <a
                            href={selectedEvent.qrCodeReaderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-300 hover:text-cyan-200 text-sm block truncate"
                            title={selectedEvent.qrCodeReaderUrl}
                            dir="ltr"
                          >
                            {selectedEvent.qrCodeReaderUrl}
                          </a>
                        </div>
                        <a
                          href={selectedEvent.qrCodeReaderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
                        >
                          <ExternalLink className="w-4 h-4" />
                          فتح الماسح
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedEvent.adminNotes && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-amber-400" />
                      ملاحظات الإدارة
                    </h4>
                    <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-5">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedEvent.adminNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && selectedEvent && approvalAction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    {approvalAction === 'approve' ? 'موافقة على الحدث' : 'رفض الحدث'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setApprovalAction(null);
                      setApprovalNotes('');
                      setInvitationCardImage(null);
                      setInvitationCardImagePreview(null);
                      setQrCodeReaderUrl('');
                    }}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {selectedEvent.eventDetails.eventName && (
                  <div>
                    <label className="text-sm text-gray-400 font-medium">اسم المناسبة</label>
                    <div className="text-white font-bold text-lg">{selectedEvent.eventDetails.eventName}</div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-gray-400 font-medium">المضيف</label>
                  <div className="text-white font-semibold">{selectedEvent.eventDetails.hostName}</div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 font-medium">المستخدم</label>
                  <div className="text-white">{selectedEvent.user.name}</div>
                  <div className="text-gray-400 text-right text-sm font-mono mt-1" dir="ltr">{selectedEvent.user.phone}</div>
                </div>

                {approvalAction === 'approve' && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      صورة بطاقة الدعوة *
                    </label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setInvitationCardImage(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setInvitationCardImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            setInvitationCardImagePreview(null);
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#C09B52] file:text-white hover:file:bg-[#A0884A] cursor-pointer"
                        required
                      />
                      {invitationCardImagePreview && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-400 mb-2">معاينة الصورة:</p>
                          <div className="relative border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
                            <img
                              src={invitationCardImagePreview}
                              alt="Preview"
                              className="w-full h-auto max-h-64 object-contain"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            الملف: {invitationCardImage?.name} ({invitationCardImage ? ((invitationCardImage.size / 1024 / 1024).toFixed(2)) : '0.00'} MB)
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      الصيغ المدعومة: JPG, PNG, WebP (الحد الأقصى: 10 ميجابايت)
                    </p>
                  </div>
                )}

                {approvalAction === 'approve' && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      رابط تطبيق ماسح QR Code (اختياري)
                    </label>
                    <input
                      type="url"
                      value={qrCodeReaderUrl}
                      onChange={(e) => setQrCodeReaderUrl(e.target.value)}
                      placeholder="https://example.com/qr-scanner..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      رابط تطبيق المسح الذي سيستخدمه المشرفون على البوابة
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    {approvalAction === 'approve' ? 'ملاحظات (اختياري)' : 'سبب الرفض *'}
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder={approvalAction === 'approve' ? 'أضف ملاحظات إضافية...' : 'يرجى إدخال سبب الرفض...'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52] resize-none"
                    rows={3}
                    required={approvalAction === 'reject'}
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={processApproval}
                    disabled={processingApproval || 
                      (approvalAction === 'reject' && !approvalNotes.trim()) ||
                      (approvalAction === 'approve' && !invitationCardImage)
                    }
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      approvalAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                        : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                    }`}
                  >
                    {processingApproval ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري المعالجة...
                      </div>
                    ) : (
                      approvalAction === 'approve' ? 'موافقة' : 'رفض'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setApprovalAction(null);
                      setApprovalNotes('');
                      setInvitationCardImage(null);
                      setInvitationCardImagePreview(null);
                      setQrCodeReaderUrl('');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guests Management Modal */}
        {showGuestsModal && selectedEventForGuests && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">إدارة ضيوف المناسبة</h2>
                  <button
                    onClick={handleCloseGuestsModal}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <AdminEventGuests 
                  eventId={selectedEventForGuests} 
                  onBack={handleCloseGuestsModal}
                />
              </div>
            </div>
          </div>
        )}
      </>
    </AdminSidebar>
  );
}
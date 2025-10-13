'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminEventGuests } from '@/components/admin/AdminEventGuests';
import { Calendar, Search, Check, X, Clock, Eye, CheckCircle, XCircle, MessageSquare, Users } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';

interface Event {
  id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  eventDetails: {
    hostName: string;
    eventDate: string;
    eventLocation: string;
    inviteCount: number;
    packageType: string;
  };
  totalPrice: number;
  status: string;
  approvalStatus: string;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  paymentCompletedAt: string;
  guests?: any[];
  guestListConfirmed?: {
    isConfirmed: boolean;
    confirmedAt?: string;
    confirmedBy?: string;
  };
  guestCount?: number;
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
  const [invitationCardUrl, setInvitationCardUrl] = useState('');
  const [qrCodeReaderUrl, setQrCodeReaderUrl] = useState('');
  const [processingApproval, setProcessingApproval] = useState(false);
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
    setInvitationCardUrl('');
    setShowApprovalModal(true);
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
        // For approval, Google Drive URL is required
        if (!invitationCardUrl.trim()) {
          toast({
            title: "خطأ",
            description: "يرجى إدخال رابط بطاقة الدعوة من Google Drive",
            variant: "destructive"
          });
          return;
        }

        // Validate Google Drive URL
        if (!invitationCardUrl.includes('drive.google.com') && !invitationCardUrl.includes('docs.google.com')) {
          toast({
            title: "خطأ",
            description: "يجب أن يكون رابط البطاقة من Google Drive",
            variant: "destructive"
          });
          return;
        }

        await adminAPI.approveEvent(selectedEvent.id, approvalNotes || undefined, invitationCardUrl, qrCodeReaderUrl.trim() || undefined);
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
      setInvitationCardUrl('');
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
                    <div className="text-right">الحدث</div>
                    <div className="text-right">المضيف</div>
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
                          <div className="text-white font-medium text-sm">
                            {event.eventDetails.hostName}
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            {event.eventDetails.packageType}
                          </div>
                        </div>

                        {/* Host Info */}
                        <div className="min-w-0 text-right">
                          <div className="text-gray-300 text-sm truncate">
                            {event.user.name}
                          </div>
                          <div className="text-gray-500 text-xs font-mono" dir="ltr">
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
                          
                          {/* VIP Guests Management Button */}
                          {event.eventDetails.packageType === 'vip' && event.approvalStatus === 'approved' && (
                            <button
                              onClick={() => handleViewGuests(event.id)}
                              className={`p-2.5 text-white rounded-lg transition-colors duration-200 ${
                                event.guestListConfirmed?.isConfirmed 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-yellow-600 hover:bg-yellow-700'
                              }`}
                              title={
                                event.guestListConfirmed?.isConfirmed 
                                  ? `إدارة ضيوف VIP (${event.guestCount || 0} ضيف مؤكد)` 
                                  : `إدارة ضيوف VIP (${event.guestCount || 0} ضيف في انتظار التأكيد)`
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
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">تفاصيل الحدث</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Event Details */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">بيانات الحدث</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">اسم الحدث</label>
                      <div className="text-white">{selectedEvent.eventDetails.hostName}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">نوع الحزمة</label>
                      <div className="text-white">{selectedEvent.eventDetails.packageType}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">تاريخ الحدث</label>
                      <div className="text-white">{formatDate(selectedEvent.eventDetails.eventDate)}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">عدد الدعوات</label>
                      <div className="text-white">{selectedEvent.eventDetails.inviteCount}</div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-400">موقع الحدث</label>
                      <div className="text-white">{selectedEvent.eventDetails.eventLocation}</div>
                    </div>
                  </div>
                </div>

                {/* Host Details */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">بيانات المضيف</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">الاسم</label>
                      <div className="text-white">{selectedEvent.user.name}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">الإيميل</label>
                      <div className="text-white break-all">{selectedEvent.user.email}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">الهاتف</label>
                      <div className="text-white">{selectedEvent.user.phone}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">السعر الإجمالي</label>
                      <div className="text-[#C09B52] font-bold">
                        {selectedEvent.totalPrice.toLocaleString('ar-SA')} ر.س
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">معلومات الحالة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">حالة الموافقة</label>
                      <div>{getApprovalStatusBadge(selectedEvent.approvalStatus)}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">حالة الحدث</label>
                      <div>{getStatusBadge(selectedEvent.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">تاريخ الدفع</label>
                      <div className="text-white">{formatDate(selectedEvent.paymentCompletedAt)}</div>
                    </div>
                    {selectedEvent.approvedBy && (
                      <div>
                        <label className="text-sm text-gray-400">معتمد بواسطة</label>
                        <div className="text-white">{selectedEvent.approvedBy}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                {selectedEvent.adminNotes && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">ملاحظات الإدارة</h4>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                      <p className="text-gray-300">{selectedEvent.adminNotes}</p>
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
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    {approvalAction === 'approve' ? 'موافقة على الحدث' : 'رفض الحدث'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setApprovalAction(null);
                      setApprovalNotes('');
                      setInvitationCardUrl('');
                      setQrCodeReaderUrl('');
                    }}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400">اسم الحدث</label>
                  <div className="text-white font-medium">{selectedEvent.eventDetails.hostName}</div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">المضيف</label>
                  <div className="text-white">{selectedEvent.user.name}</div>
                </div>

                {approvalAction === 'approve' && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      رابط بطاقة الدعوة من Google Drive *
                    </label>
                    <input
                      type="url"
                      value={invitationCardUrl}
                      onChange={(e) => setInvitationCardUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52]"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      يجب أن يكون الرابط من Google Drive أو Google Docs
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
                      (approvalAction === 'approve' && !invitationCardUrl.trim())
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
                      setInvitationCardUrl('');
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
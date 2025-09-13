// src/app/events/[id]/page.tsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { eventsAPI, EventItem, GuestStats } from '@/lib/api/events';
import { useToast } from '@/hooks/useToast';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './phone-input.css';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  ArrowLeft,
  Plus,
  Send,
  Check,
  Trash2,
  Loader2,
  Package,
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  CheckSquare,
  Users2
} from 'lucide-react';
import Link from 'next/link';

interface Guest {
  _id?: string;
  name: string;
  phone: string;
  numberOfAccompanyingGuests: number;
  whatsappMessageSent: boolean;
}

const EventDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = params?.id;
  const { toast } = useToast();
  
  const [event, setEvent] = useState<EventItem | null>(null);
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingGuest, setAddingGuest] = useState(false);
  const [confirmingGuestList, setConfirmingGuestList] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  
  // New guest form
  const [newGuest, setNewGuest] = useState<Guest>({
    name: '',
    phone: '',
    numberOfAccompanyingGuests: 1,
    whatsappMessageSent: false
  });

  const loadEventDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEventDetails(eventId);
      
      if (response.success) {
        setEvent(response.event!);
        setGuestStats(response.guestStats!);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل تفاصيل المناسبة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
      router.push('/events');
    } finally {
      setLoading(false);
    }
  }, [eventId, toast, router]);

  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);

  const handleAddGuest = async () => {
    if (!newGuest.name.trim() || !newGuest.phone.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم الضيف ورقم الهاتف",
        variant: "destructive"
      });
      return;
    }

    // Validate phone number
    if (!isValidPhoneNumber(newGuest.phone)) {
      setPhoneError(true);
      toast({
        title: "رقم هاتف غير صحيح",
        description: "يرجى إدخال رقم هاتف صحيح",
        variant: "destructive"
      });
      return;
    }

    if (newGuest.numberOfAccompanyingGuests < 1 || newGuest.numberOfAccompanyingGuests > 10) {
      toast({
        title: "خطأ في عدد الضيوف",
        description: "عدد الضيوف يجب أن يكون بين 1 و 10",
        variant: "destructive"
      });
      return;
    }

    const currentTotalInvited = guestStats?.totalInvited || 0;
    const maxInvites = event?.details.inviteCount || 0;
    
    if (currentTotalInvited + newGuest.numberOfAccompanyingGuests > maxInvites) {
      toast({
        title: "تجاوز الحد الأقصى",
        description: `المتبقي: ${maxInvites - currentTotalInvited} دعوة فقط`,
        variant: "destructive"
      });
      return;
    }

    try {
      setAddingGuest(true);
      const response = await eventsAPI.addGuest(eventId, {
        name: newGuest.name.trim(),
        phone: newGuest.phone, // Keep the full international format
        numberOfAccompanyingGuests: newGuest.numberOfAccompanyingGuests
      });
      
      if (response.success) {
        await loadEventDetails();
        setNewGuest({
          name: '',
          phone: '',
          numberOfAccompanyingGuests: 1,
          whatsappMessageSent: false
        });
        setPhoneError(false);
        
        toast({
          title: "تم إضافة الضيف",
          description: "تم إضافة الضيف بنجاح",
          variant: "default"
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة الضيف",
        description: error.message || "فشل في إضافة الضيف",
        variant: "destructive"
      });
    } finally {
      setAddingGuest(false);
    }
  };

  const handleSendWhatsapp = async (guest: Guest) => {
    if (!guest._id || !event) return;

    let message = `بسم الله الرحمن الرحيم

دعوة كريمة

السلام عليكم ورحمة الله وبركاته الأستاذ الفاضل/ ${guest.name}

${event.details.invitationText}

تفاصيل المناسبة:
- المضيف: ${event.details.hostName}
- التاريخ: ${formatEventDate(event.details.eventDate)}
- الوقت: من ${event.details.startTime} إلى ${event.details.endTime}
- المكان: ${event.details.eventLocation}
- عدد الأشخاص المدعوين: ${guest.numberOfAccompanyingGuests}`;

    // Add invitation URL for all packages
    if (event.invitationCardUrl) {
      message += `\n\nرابط الدعوة: ${event.invitationCardUrl}`;
    } else {
      message += `\n\nرابط الدعوة سيتم إرساله قريباً بعد موافقة الإدارة`;
    }

    message += `\n\nنتشرف بحضوركم الكريم وننتظركم معنا في هذه المناسبة المباركة`;

    const whatsappUrl = `https://wa.me/${guest.phone.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`;
    
    try {
      // Mark as sent in backend
      await eventsAPI.markWhatsappSent(eventId, guest._id!);
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Reload to update UI
      await loadEventDetails();
      
      toast({
        title: "تم إرسال الرسالة",
        description: "تم تحديث حالة الرسالة بنجاح",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث حالة الرسالة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    try {
      await eventsAPI.removeGuest(eventId, guestId);
      await loadEventDetails();
      
      toast({
        title: "تم حذف الضيف",
        description: "تم حذف الضيف بنجاح",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الضيف",
        description: error.message || "فشل في حذف الضيف",
        variant: "destructive"
      });
    }
  };

  const handleConfirmGuestList = async () => {
    if (!event || event.guests.length === 0) {
      toast({
        title: "قائمة الضيوف فارغة",
        description: "يرجى إضافة ضيوف قبل تأكيد القائمة",
        variant: "destructive"
      });
      return;
    }

    try {
      setConfirmingGuestList(true);
      
      // Call the API to confirm the guest list
      await eventsAPI.confirmGuestList(eventId);
      
      // Reload event details to get updated confirmation status
      await loadEventDetails();
      
      toast({
        title: "تم تأكيد قائمة الضيوف",
        description: "سيقوم فريقنا بإرسال الدعوات للضيوف قريباً",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تأكيد القائمة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setConfirmingGuestList(false);
    }
  };

  const getPackageDetails = (packageType: string) => {
    switch (packageType) {
      case 'classic':
        return { name: 'كلاسيك', color: 'from-blue-600 to-blue-700' };
      case 'premium':
        return { name: 'بريميوم', color: 'from-purple-600 to-purple-700' };
      case 'vip':
        return { name: 'VIP', color: 'from-yellow-600 to-yellow-700' };
      default:
        return { name: 'غير محدد', color: 'from-gray-600 to-gray-700' };
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

  const getApprovalStatusDetails = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'pending':
        return { 
          name: 'في انتظار الموافقة', 
          color: 'text-yellow-400', 
          bgColor: 'bg-yellow-500/20',
          icon: AlertCircle
        };
      case 'approved':
        return { 
          name: 'معتمد', 
          color: 'text-green-400', 
          bgColor: 'bg-green-500/20',
          icon: CheckCircle
        };
      case 'rejected':
        return { 
          name: 'مرفوض', 
          color: 'text-red-400', 
          bgColor: 'bg-red-500/20',
          icon: XCircle
        };
      default:
        return { 
          name: 'غير محدد', 
          color: 'text-gray-400', 
          bgColor: 'bg-gray-500/20',
          icon: AlertCircle
        };
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory' // Force Gregorian calendar
    });
  };

  const getCountryFromPhone = (phone: string) => {
    try {
      const phoneNumber = parsePhoneNumber(phone);
      return phoneNumber?.country || 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#C09B52]" />
          <p className="text-white">جاري تحميل تفاصيل المناسبة...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">المناسبة غير موجودة</h2>
          <p className="text-gray-400 mb-6">المناسبة المطلوبة غير متاحة أو تم حذفها</p>
          <Link 
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C09B52] text-white font-medium rounded-lg hover:bg-[#B8935A] transition-colors"
          >
            العودة للمناسبات
          </Link>
        </div>
      </div>
    );
  }

  const packageDetails = getPackageDetails(event.packageType);
  const statusDetails = getStatusDetails(event.status);
  const approvalStatusDetails = getApprovalStatusDetails(event.approvalStatus);
  const ApprovalIcon = approvalStatusDetails.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/events"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة للمناسبات
            </Link>
            <div className="w-px h-6 bg-white/20"></div>
            <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${packageDetails.color} text-white text-sm font-medium`}>
              {packageDetails.name}
            </div>
            <div className="flex gap-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusDetails.bgColor} ${statusDetails.color}`}>
                {statusDetails.name}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${approvalStatusDetails.bgColor} ${approvalStatusDetails.color} flex items-center gap-1`}>
                <ApprovalIcon className="w-3 h-3" />
                {approvalStatusDetails.name}
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">{event.details.hostName}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Info */}
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-6">تفاصيل المناسبة</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#C09B52]" />
                    <div>
                      <div className="text-white font-medium">التاريخ</div>
                      <div className="text-gray-300 text-sm">
                        {formatEventDate(event.details.eventDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#C09B52]" />
                    <div>
                      <div className="text-white font-medium">الوقت</div>
                      <div className="text-gray-300 text-sm">
                        من {event.details.startTime} إلى {event.details.endTime}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#C09B52]" />
                    <div>
                      <div className="text-white font-medium">المكان</div>
                      <div className="text-gray-300 text-sm">{event.details.eventLocation}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#C09B52]" />
                    <div>
                      <div className="text-white font-medium">عدد الدعوات</div>
                      <div className="text-gray-300 text-sm">
                        {guestStats?.totalInvited || 0} من {event.details.inviteCount} دعوة
                      </div>
                    </div>
                  </div>
                  
                  {event.details.qrCode && (
                    <div className="flex items-center gap-3">
                      <QrCode className="w-5 h-5 text-[#C09B52]" />
                      <div>
                        <div className="text-white font-medium">كود QR</div>
                        <div className="text-gray-300 text-sm">مُفعل للدعوة</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-[#C09B52]" />
                    <div>
                      <div className="text-white font-medium">السعر الإجمالي</div>
                      <div className="text-[#C09B52] text-lg font-bold">
                        {event.totalPrice.toLocaleString('ar-SA')} ر.س
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invitation Text */}
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">نص الدعوة</h3>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-300 leading-relaxed">{event.details.invitationText}</p>
              </div>
            </div>

            {/* Admin Notes */}
            {event.adminNotes && event.adminNotes.trim() && (
              <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-2xl border border-red-700/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-bold text-white">ملاحظات الإدارة</h3>
                </div>
                <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4">
                  <p className="text-red-100 leading-relaxed">{event.adminNotes}</p>
                </div>
              </div>
            )}

            {/* Invitation Card URL */}
            {event.invitationCardUrl && (
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-2xl border border-blue-700/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ExternalLink className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">بطاقة الدعوة</h3>
                </div>
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 max-w-xs">
                      <p className="text-blue-100 text-sm mb-2">رابط بطاقة الدعوة:</p>
                      <a
                        href={event.invitationCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 text-sm block truncate text-left"
                        title={event.invitationCardUrl}
                        dir="ltr"
                      >
                        {event.invitationCardUrl}
                      </a>
                    </div>
                    <a
                      href={event.invitationCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      عرض البطاقة
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Guest List */}
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">قائمة الضيوف</h3>
                <div className="text-sm text-gray-400">
                  {event.guests.length} ضيف مضاف • {guestStats?.totalInvited || 0} من {event.details.inviteCount} دعوة
                </div>
              </div>

              {/* VIP Package Notice */}
              {event.packageType === 'vip' && (
                <div className={`rounded-xl p-4 mb-6 ${
                  event.guestListConfirmed.isConfirmed 
                    ? 'bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-700' 
                    : 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border border-yellow-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <Users2 className={`w-5 h-5 ${
                      event.guestListConfirmed.isConfirmed ? 'text-green-400' : 'text-yellow-400'
                    }`} />
                    <div>
                      <h4 className={`font-medium ${
                        event.guestListConfirmed.isConfirmed ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        حزمة VIP
                      </h4>
                      <p className={`text-sm ${
                        event.guestListConfirmed.isConfirmed ? 'text-green-100' : 'text-yellow-100'
                      }`}>
                        {event.guestListConfirmed.isConfirmed 
                          ? `تم تأكيد قائمة الضيوف. سيتم إرسال الدعوات قريباً (${event.guestListConfirmed.confirmedAt ? new Date(event.guestListConfirmed.confirmedAt).toLocaleDateString('ar-SA', { calendar: 'gregory' }) : ''})`
                          : 'فريقنا سيتولى إرسال الدعوات للضيوف نيابة عنك. أضف جميع الضيوف ثم اضغط على &quot;تأكيد القائمة النهائية&quot;'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add New Guest Form */}
              <div className={`rounded-xl p-4 mb-6 ${
                event.packageType === 'vip' && event.guestListConfirmed.isConfirmed 
                  ? 'bg-red-900/20 border border-red-700/30' 
                  : 'bg-white/5'
              }`}>
                <h4 className="text-white font-medium mb-4">إضافة ضيف جديد</h4>
                
                {/* VIP Confirmation Warning */}
                {event.packageType === 'vip' && event.guestListConfirmed.isConfirmed && (
                  <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <p className="text-red-200 text-sm">
                        تم تأكيد قائمة الضيوف. لا يمكن إضافة أو تعديل الضيوف بعد التأكيد.
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="اسم الضيف"
                    disabled={event.packageType === 'vip' && event.guestListConfirmed.isConfirmed}
                    className={`px-3 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                      event.packageType === 'vip' && event.guestListConfirmed.isConfirmed
                        ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 border-white/20 focus:border-[#C09B52]'
                    }`}
                  />
                  
                  <PhoneInput
                    value={newGuest.phone}
                    onChange={(value) => {
                      if (event.packageType === 'vip' && event.guestListConfirmed.isConfirmed) return;
                      setNewGuest(prev => ({ ...prev, phone: value || '' }));
                      // Validate phone number on change
                      if (value) {
                        setPhoneError(!isValidPhoneNumber(value));
                      } else {
                        setPhoneError(false);
                      }
                    }}
                    placeholder="رقم الهاتف"
                    defaultCountry="SA"
                    international
                    countryCallingCodeEditable={false}
                    disabled={event.packageType === 'vip' && event.guestListConfirmed.isConfirmed}
                    className={`phone-input-custom ${phoneError ? 'phone-input-error' : ''} ${
                      event.packageType === 'vip' && event.guestListConfirmed.isConfirmed ? 'phone-input-disabled' : ''
                    }`}
                  />
                  {phoneError && (
                    <p className="text-red-400 text-xs mt-1">رقم هاتف غير صحيح</p>
                  )}
                  
                  <select
                    value={newGuest.numberOfAccompanyingGuests}
                    onChange={(e) => setNewGuest(prev => ({ ...prev, numberOfAccompanyingGuests: parseInt(e.target.value) }))}
                    disabled={event.packageType === 'vip' && event.guestListConfirmed.isConfirmed}
                    className={`px-3 py-2 border rounded-lg text-white focus:outline-none transition-colors ${
                      event.packageType === 'vip' && event.guestListConfirmed.isConfirmed
                        ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 border-white/20 focus:border-[#C09B52]'
                    }`}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num} className="bg-gray-800">
                        {num} {num === 1 ? 'شخص' : 'أشخاص'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleAddGuest}
                  disabled={addingGuest || (guestStats?.remainingInvites || 0) <= 0 || (event.packageType === 'vip' && event.guestListConfirmed.isConfirmed)}
                  className={`w-full md:w-auto px-6 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    event.packageType === 'vip' && event.guestListConfirmed.isConfirmed
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-[#C09B52] text-white hover:bg-[#B8935A] disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {addingGuest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      إضافة ضيف
                    </>
                  )}
                </button>
              </div>

              {/* Guests List */}
              {event.guests.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">لم تقم بإضافة أي ضيوف بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {event.guests.map((guest, index) => (
                    <div key={guest._id || index} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h5 className="text-white font-medium">{guest.name}</h5>
                            <span className="text-sm text-gray-400">
                              {guest.numberOfAccompanyingGuests} {guest.numberOfAccompanyingGuests === 1 ? 'شخص' : 'أشخاص'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300">
                            {guest.phone}
                            <span className="ml-2 text-xs text-gray-400">
                              ({getCountryFromPhone(guest.phone)})
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Show WhatsApp button only for classic and premium packages */}
                          {(event.packageType === 'classic' || event.packageType === 'premium') && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSendWhatsapp(guest)}
                                className={`flex items-center gap-1 px-3 py-1 text-white text-sm rounded-lg transition-colors ${
                                  event.invitationCardUrl 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-yellow-600 hover:bg-yellow-700'
                                }`}
                                title={event.invitationCardUrl ? 'إرسال دعوة مع رابط الدعوة' : 'إرسال دعوة (رابط الدعوة سيتم إضافته لاحقاً)'}
                              >
                                <Send className="w-4 h-4" />
                                {event.invitationCardUrl ? 'إرسال دعوة' : 'إرسال دعوة'}
                              </button>
                              
                              {guest.whatsappMessageSent && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                  <Check className="w-3 h-3" />
                                  تم الإرسال
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* For VIP packages, show a different status */}
                          {event.packageType === 'vip' && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-lg">
                              <Users2 className="w-4 h-4" />
                              في انتظار الإرسال
                            </div>
                          )}
                          
                          <button
                            onClick={() => guest._id && handleRemoveGuest(guest._id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* VIP Package - Confirm Final Guest List Button */}
              {event.packageType === 'vip' && event.guests.length > 0 && !event.guestListConfirmed.isConfirmed && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 border border-yellow-700/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-yellow-400 font-medium mb-1">تأكيد القائمة النهائية</h4>
                        <p className="text-yellow-100 text-sm mb-2">
                          بعد التأكيد، سيقوم فريقنا بإرسال الدعوات لجميع الضيوف
                        </p>
                        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                          <p className="text-red-300 text-xs font-medium">
                            ⚠️ تحذير: بعد النقر على تأكيد القائمة، ستكون القائمة نهائية ولن يمكن تعديلها أو إضافة/حذف ضيوف
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleConfirmGuestList}
                        disabled={confirmingGuestList}
                        className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                      >
                        {confirmingGuestList ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            جاري التأكيد...
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4" />
                            تأكيد القائمة النهائية
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Stats */}
            <div className="bg-gradient-to-br from-[#C09B52]/10 via-[#C09B52]/5 to-transparent rounded-2xl border border-[#C09B52]/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">إحصائيات المناسبة</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">إجمالي الضيوف</span>
                  <span className="text-white font-semibold">{guestStats?.totalGuests || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">إجمالي المدعوين</span>
                  <span className="text-white font-semibold">{guestStats?.totalInvited || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">رسائل واتساب</span>
                  <span className="text-green-400 font-semibold">{guestStats?.whatsappMessagesSent || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">دعوات متبقية</span>
                  <span className="text-[#C09B52] font-semibold">{guestStats?.remainingInvites || 0}</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>التقدم</span>
                  <span>{Math.round(((guestStats?.totalInvited || 0) / event.details.inviteCount) * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#C09B52] to-[#B8935A] h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(((guestStats?.totalInvited || 0) / event.details.inviteCount) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Approval Status Info */}
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">حالة الموافقة</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">الحالة</span>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${approvalStatusDetails.bgColor} ${approvalStatusDetails.color} flex items-center gap-2`}>
                    <ApprovalIcon className="w-4 h-4" />
                    {approvalStatusDetails.name}
                  </div>
                </div>
                
                {event.approvalStatus === 'approved' && event.invitationCardUrl && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">بطاقة الدعوة</span>
                      <a
                        href={event.invitationCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        متوفرة
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Timeline */}
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">الجدول الزمني</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">تم إتمام الدفع</div>
                    <div className="text-gray-400">
                      {new Date(event.paymentCompletedAt).toLocaleDateString('ar-SA', {
                        calendar: 'gregory'
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-3 h-3 bg-[#C09B52] rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">تاريخ المناسبة</div>
                    <div className="text-gray-400">
                      {formatEventDate(event.details.eventDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Management Info */}
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">إدارة الضيوف</h3>
              
              <div className="space-y-3 text-sm">
                {event.packageType === 'vip' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Users2 className="w-4 h-4" />
                      <span className="font-medium">خدمة VIP</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      فريقنا سيتولى إرسال الدعوات للضيوف نيابة عنك. أضف جميع الضيوف ثم اضغط على &quot;تأكيد القائمة النهائية&quot;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400">
                      <Send className="w-4 h-4" />
                      <span className="font-medium">إرسال شخصي</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      يمكنك إرسال الدعوات للضيوف مباشرة عبر واتساب. ستتضمن الرسائل رابط الدعوة تلقائياً
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Services */}
            {(event.details.additionalCards > 0 || event.details.gateSupervisors || event.details.fastDelivery) && (
              <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">الخدمات الإضافية</h3>
                
                <div className="space-y-3 text-sm">
                  {event.details.additionalCards > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">كروت إضافية</span>
                      <span className="text-white">{event.details.additionalCards}</span>
                    </div>
                  )}
                  
                  {event.details.gateSupervisors && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">مشرفين البوابة</span>
                      <span className="text-white text-xs">{event.details.gateSupervisors}</span>
                    </div>
                  )}
                  
                  {event.details.fastDelivery && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">تسريع التنفيذ</span>
                      <span className="text-green-400">مُفعل</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
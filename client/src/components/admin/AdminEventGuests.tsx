'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Send, 
  Check, 
  X, 
  Calendar, 
  MapPin, 
  Clock,
  ArrowLeft,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertCircle,
  ExternalLink,
  UserPlus,
  Image as ImageIcon
} from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';
import ConfirmationModal from '@/components/cart/CartModal/components/ConfirmationModal';
import { GuestInviteCards } from './GuestInviteCards';
import { AddGuestModal } from './AddGuestModal';
import { InvitationCardModal } from './InvitationCardModal';
import { getMissingCardCount, hasAllCards } from '@/utils/guestCards';

interface Guest {
  _id: string;
  name: string;
  phone: string;
  numberOfAccompanyingGuests: number;
  whatsappMessageSent: boolean;
  whatsappSentAt?: string;
  rsvpStatus?: 'pending' | 'accepted' | 'declined';
  rsvpResponse?: string;
  rsvpRespondedAt?: string;
  conversationStage?: 'awaiting_rsvp' | 'awaiting_accompanying_count' | 'completed';
  confirmedAccompanyingGuests?: number;
  accompanyingCountResponse?: string;
  addedAt: string;
  updatedAt: string;
  individualInviteImage?: {
    public_id: string;
    secure_url: string;
    url: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    created_at: string;
  };
  // One entry card per person on the invitation (index 0 is the guest)
  individualInviteImages?: Array<{
    public_id?: string;
    secure_url?: string;
    url?: string;
  }>;
  cardsRequired?: number;
  cardsUploaded?: number;
  actuallyAttended?: boolean;
  attendanceMarkedAt?: string;
  attendanceMarkedBy?: string;
}

interface EventDetails {
  id: string;
  eventName?: string;
  hostName: string;
  eventDate: string;
  eventLocation: string;
  displayName?: string;
  packageType: string;
  invitationText: string;
  startTime: string;
  endTime: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  guestListConfirmed?: {
    isConfirmed: boolean;
    confirmedAt?: string;
    confirmedBy?: string;
    reopenedAt?: string;
    reopenedBy?: string;
    reopenCount?: number;
  };
  inviteCount?: number;
  invitationCardUrl?: string;
  invitationCardImage?: {
    secure_url?: string;
    url?: string;
    resource_type?: string;
    bytes?: number;
    whatsapp_bytes?: number;
    duration?: number;
  };
  // Classic packages only: the cards are handed to the customer as a whole,
  // so delivery is tracked once per event instead of per guest.
  classicInvitationsDelivered?: {
    isDelivered: boolean;
    deliveredAt?: string;
  };
}

interface GuestStats {
  totalGuests: number;
  totalInvited: number;
  whatsappMessagesSent: number;
  remainingInvites: number;
  actualGuestCount?: number;
}

interface AdminEventGuestsProps {
  eventId: string;
  onBack: () => void;
}

function AccompanyingCountBadge({ guest }: { guest: Guest }) {
  if (guest.rsvpStatus !== 'accepted' || guest.numberOfAccompanyingGuests <= 1) {
    return null;
  }

  if (guest.conversationStage === 'awaiting_accompanying_count') {
    return (
      <span className="flex items-center space-x-1 px-2 py-1 bg-yellow-900/20 text-yellow-300 rounded text-xs">
        <span>بانتظار تأكيد عدد الحاضرين</span>
      </span>
    );
  }

  if (guest.confirmedAccompanyingGuests !== undefined) {
    const isDefaulted = guest.accompanyingCountResponse === 'auto_defaulted_no_reply';
    return (
      <span className="flex items-center space-x-1 px-2 py-1 bg-blue-900/20 text-blue-300 rounded text-xs">
        <span>
          أكّد {guest.confirmedAccompanyingGuests} من {guest.numberOfAccompanyingGuests}
          {isDefaulted && ' (بدون رد)'}
        </span>
      </span>
    );
  }

  return null;
}

export function AdminEventGuests({ eventId, onBack }: AdminEventGuestsProps) {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [showReopenConfirmation, setShowReopenConfirmation] = useState(false);
  const [showSendRemindersConfirmation, setShowSendRemindersConfirmation] = useState(false);
  const [showSendThankYouConfirmation, setShowSendThankYouConfirmation] = useState(false);
  const [updatingDelivery, setUpdatingDelivery] = useState(false);
  const [bulkSending, setBulkSending] = useState<null | 'invitations' | 'reminders' | 'thank-you'>(null);
  const [bulkProgress, setBulkProgress] = useState<{ sent: number; total: number } | null>(null);
  const [showSendInvitationsConfirmation, setShowSendInvitationsConfirmation] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEventGuests();
  }, [eventId]);

  const loadEventGuests = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getEventGuests(eventId);
      setEvent(data.event);
      setGuests(data.guests);
      setGuestStats(data.guestStats);
    } catch (error: any) {
      toast({
        title: "خطأ في جلب البيانات",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      calendar: 'gregory' // Force Gregorian calendar
    });
  };

  const handleSendWhatsapp = async (guest: Guest) => {
    if (!event) return;

    console.log('=== FRONTEND: Starting handleSendWhatsapp ===', {
      eventId,
      guestId: guest._id,
      guestName: guest.name,
      guestPhone: guest.phone,
      packageType: event.packageType,
      hasIndividualImage: !!guest.individualInviteImage
    });

    setSendingMessage(guest._id);

    try {
      // For VIP packages, use WhatsApp Business API
      if (event.packageType === 'vip') {
        console.log('FRONTEND: VIP package - using WhatsApp API', {
          apiUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/whatsapp/send-invitation`,
          hasToken: !!localStorage.getItem('access_token')
        });

        const requestBody = { eventId, guestId: guest._id };
        console.log('FRONTEND: Sending API request', { requestBody });

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/whatsapp/send-invitation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('FRONTEND: API response received', {
          status: response.status,
          ok: response.ok
        });

        const result = await response.json();
        console.log('FRONTEND: Response data', result);

        if (!response.ok) {
          console.error('FRONTEND: API request failed', {
            status: response.status,
            error: result.error
          });
          throw new Error(result.error?.message || 'فشل في إرسال الدعوة');
        }

        console.log('FRONTEND: Invitation sent successfully via API', {
          messageId: result.data?.messageId
        });

        toast({
          title: "تم إرسال الدعوة",
          description: "تم إرسال دعوة تفاعلية عبر واتساب",
          variant: "default"
        });
      } else {
        // For Classic packages - use manual wa.me link (admins send to user, not to guests)
        console.log('FRONTEND: Classic/Premium package - using manual wa.me link');

        let message = `بسم الله الرحمن الرحيم

دعوة كريمة

السلام عليكم ورحمة الله وبركاته الأستاذ الفاضل/ ${guest.name}

${event.invitationText}

تفاصيل المناسبة:
- المضيف: ${event.hostName}
- التاريخ: ${formatEventDate(event.eventDate)}
- الوقت: من ${event.startTime} إلى ${event.endTime}
- المكان: ${event.displayName || event.eventLocation}
- عدد الأشخاص المدعوين: ${guest.numberOfAccompanyingGuests}`;

        message += `\n\nنتشرف بحضوركم الكريم وننتظركم معنا في هذه المناسبة المباركة`;

        const whatsappUrl = `https://wa.me/${guest.phone.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`;
        
        console.log('FRONTEND: WhatsApp URL generated', {
          phone: guest.phone,
          messageLength: message.length
        });

        // Mark as sent in backend
        console.log('FRONTEND: Marking as sent in backend...');
        await adminAPI.markGuestWhatsappSent(eventId, guest._id);
        console.log('FRONTEND: Marked as sent successfully');
        
        // Open WhatsApp
        console.log('FRONTEND: Opening WhatsApp...');
        window.open(whatsappUrl, '_blank');
        
        toast({
          title: "تم فتح واتساب",
          description: "تم تحديث حالة الرسالة",
          variant: "default"
        });
      }
      
      // Reload to update UI
      console.log('FRONTEND: Reloading event guests...');
      await loadEventGuests();
      console.log('=== FRONTEND: handleSendWhatsapp complete ===');
      
    } catch (error: any) {
      console.error('=== FRONTEND: ERROR in handleSendWhatsapp ===', {
        error: error.message,
        stack: error.stack,
        guestId: guest._id,
        packageType: event.packageType
      });
      toast({
        title: "خطأ في إرسال الدعوة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(null);
    }
  };

  const handleConfirmReopenGuestList = async () => {
    try {
      await adminAPI.reopenGuestList(eventId);
      toast({
        title: "تم إعادة فتح القائمة",
        description: "يمكن للمستخدم الآن إضافة وتعديل الضيوف",
        variant: "default"
      });
      setShowReopenConfirmation(false);
      loadEventGuests();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  /**
   * Bulk sends run a chunk per request, so the summary only arrives once every
   * chunk is done. Progress is surfaced on the button while it runs.
   */
  const runBulkSend = async (
    kind: 'invitations' | 'reminders' | 'thank-you',
    send: (onProgress: (p: { sent: number; total: number }) => void) => Promise<{
      sent: number;
      failed: number;
      total: number;
      failures: Array<{ guestId: string; error?: string }>;
    }>,
    labels: { done: string; partial: string; failed: string; unit: string }
  ) => {
    try {
      setBulkSending(kind);
      setBulkProgress({ sent: 0, total: 0 });

      const summary = await send(p => setBulkProgress({ sent: p.sent, total: p.total }));

      if (summary.total === 0) {
        toast({
          title: "لا يوجد ضيوف",
          description: `لا يوجد ضيوف مؤهلين لإرسال ${labels.unit}`,
          variant: "default"
        });
      } else if (summary.failed === 0) {
        toast({
          title: labels.done,
          description: `تم إرسال ${summary.sent} ${labels.unit}`,
          variant: "default"
        });
      } else {
        toast({
          title: summary.sent > 0 ? labels.partial : labels.failed,
          description: `تم إرسال ${summary.sent} من ${summary.total}. فشل ${summary.failed}: ${
            summary.failures[0]?.error || 'خطأ غير معروف'
          }`,
          variant: summary.sent > 0 ? "default" : "destructive"
        });
      }

      await loadEventGuests();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || `فشل في إرسال ${labels.unit}`,
        variant: "destructive"
      });
    } finally {
      setBulkSending(null);
      setBulkProgress(null);
    }
  };

  const handleConfirmSendInvitations = async () => {
    setShowSendInvitationsConfirmation(false);
    await runBulkSend(
      'invitations',
      onProgress => adminAPI.sendEventInvitations(eventId, onProgress),
      { done: "تم إرسال الدعوات", partial: "تم إرسال بعض الدعوات", failed: "فشل إرسال الدعوات", unit: "دعوة" }
    );
  };

  const handleConfirmSendReminders = async () => {
    setShowSendRemindersConfirmation(false);
    await runBulkSend(
      'reminders',
      onProgress => adminAPI.sendEventReminders(eventId, onProgress),
      { done: "تم إرسال التذكيرات", partial: "تم إرسال بعض التذكيرات", failed: "فشل إرسال التذكيرات", unit: "تذكير" }
    );
  };

  const handleConfirmSendThankYou = async () => {
    setShowSendThankYouConfirmation(false);
    await runBulkSend(
      'thank-you',
      onProgress => adminAPI.sendThankYouMessages(eventId, onProgress),
      { done: "تم إرسال رسائل الشكر", partial: "تم إرسال بعض الرسائل", failed: "فشل إرسال رسائل الشكر", unit: "رسالة شكر" }
    );
  };

  const handleToggleClassicDelivery = async (delivered: boolean) => {
    try {
      setUpdatingDelivery(true);
      await adminAPI.setClassicInvitationsDelivered(eventId, delivered);
      await loadEventGuests();
      toast({
        title: delivered ? "تم تسجيل التسليم" : "تم إلغاء التسجيل",
        description: delivered
          ? "تم تسجيل تسليم الدعوات للعميل"
          : "تم إلغاء تسجيل تسليم الدعوات",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة التسليم",
        variant: "destructive"
      });
    } finally {
      setUpdatingDelivery(false);
    }
  };

  const filteredGuests = showVipOnly
    ? guests.filter(guest => !guest.whatsappMessageSent)
    : guests;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#C09B52]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">المناسبة غير موجودة</p>
      </div>
    );
  }

  const isClassic = event.packageType === 'classic';
  const isClassicDelivered = !!event.classicInvitationsDelivered?.isDelivered;
  // Classic events created before guest entry was removed may still carry
  // guests, so their list stays visible to admins.
  const hasLegacyClassicGuests = isClassic && guests.length > 0;

  return (
    <div className="space-y-6">

      {/* Event Details */}
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{event.eventName || event.hostName}</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center space-x-2 ">
                <Calendar className="h-4 w-4 text-[#C09B52]" />
                <span>{formatEventDate(event.eventDate)}</span>
              </div>
              <div className="flex items-center space-x-2 ">
                <Clock className="h-4 w-4 text-[#C09B52]" />
                <span>من {event.startTime} إلى {event.endTime}</span>
              </div>
              <div className="flex items-center space-x-2 ">
                <MapPin className="h-4 w-4 text-[#C09B52]" />
                <span>{event.displayName || event.eventLocation}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">معلومات المضيف</h4>
            <div className="space-y-1 text-gray-300">
              <p><span className="text-gray-400">الاسم:</span> {event.user.name}</p>
              <p><span className="text-gray-400">البريد:</span> {event.user.email}</p>
              <p><span  className="text-gray-400">الهاتف:</span> {event.user.phone}</p>
              <p><span className="text-gray-400">نوع الباقة:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  event.packageType === 'vip' ? 'bg-purple-900/20 text-purple-300' :
                  event.packageType === 'premium' ? 'bg-blue-900/20 text-blue-300' :
                  'bg-green-900/20 text-green-300'
                }`}>
                  {event.packageType === 'vip' ? 'VIP' :
                   event.packageType === 'premium' ? 'Premium' : 'Classic'}
                </span>
              </p>
              
              {/* Guest List Confirmation Status - Packages with a guest list */}
              {!isClassic && (
              <p><span className="text-gray-400">حالة قائمة الضيوف:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  event.guestListConfirmed?.isConfirmed 
                    ? 'bg-green-900/20 text-green-300' 
                    : 'bg-yellow-900/20 text-yellow-300'
                }`}>
                  {event.guestListConfirmed?.isConfirmed 
                    ? `مؤكدة (${event.guestListConfirmed.confirmedAt ? new Date(event.guestListConfirmed.confirmedAt).toLocaleDateString('ar-SA', { calendar: 'gregory', year: 'numeric', month: 'numeric', day: 'numeric' }) : ''})` 
                    : 'في انتظار التأكيد'
                  }
                </span>
              </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* The event's own invitation card, managed from the same screen as the
          per-guest cards below rather than from the events list. */}
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 border border-gray-600 flex items-center justify-center shrink-0">
              {event.invitationCardImage?.secure_url || event.invitationCardImage?.url ? (
                event.invitationCardImage?.resource_type === 'video' ? (
                  <video
                    src={event.invitationCardImage.secure_url || event.invitationCardImage.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={event.invitationCardImage.secure_url || event.invitationCardImage.url}
                    alt="بطاقة الدعوة"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-600" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">بطاقة الدعوة الرئيسية</h3>
              <p className="text-sm text-gray-400 mt-1">
                {event.invitationCardImage
                  ? event.invitationCardImage.resource_type === 'video'
                    ? 'فيديو — تُرسل مع الدعوة الأولى لكل ضيف'
                    : 'صورة — تُرسل مع الدعوة الأولى لكل ضيف'
                  : 'لم يتم رفع بطاقة دعوة بعد'}
              </p>
              {event.invitationCardImage?.resource_type === 'video' && event.invitationCardImage?.whatsapp_bytes ? (
                <p className="text-xs text-gray-500 mt-1">
                  النسخة المرسلة عبر الواتساب: {(event.invitationCardImage.whatsapp_bytes / 1024 / 1024).toFixed(1)} ميجابايت
                </p>
              ) : null}
            </div>
          </div>

          <button
            onClick={() => setShowCardModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm transition-colors ${
              event.invitationCardImage
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            {event.invitationCardImage ? 'عرض أو تغيير البطاقة' : 'رفع بطاقة الدعوة'}
          </button>
        </div>
      </div>

      {/* Classic Package - Invitation delivery to the customer.
          Classic events have no guest list: the cards are handed to the
          customer over WhatsApp and the customer distributes them. */}
      {isClassic && (
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">تسليم الدعوات للعميل</h3>
            <p className="text-sm text-gray-400 mt-1">
              الباقة الكلاسيكية لا تحتوي على قائمة ضيوف. يتم إرسال بطاقات الدعوة إلى العميل
              عبر الواتساب، ويقوم هو بتوزيعها على ضيوفه.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-2">واتساب العميل</div>
              <div className="text-white text-sm mb-3">{event.user.name}</div>
              <a
                href={`https://wa.me/${event.user.phone.replace(/^\+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span dir="ltr">+{event.user.phone.replace(/^\+/, '')}</span>
              </a>
            </div>

            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-2">بطاقة الدعوة</div>
              {event.invitationCardUrl ? (
                <a
                  href={event.invitationCardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>فتح البطاقة</span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 text-yellow-300 text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <span>لم يتم رفع بطاقة الدعوة بعد</span>
                </span>
              )}
            </div>

            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-2">عدد الدعوات في الباقة</div>
              <div className="text-2xl font-bold text-white">{event.inviteCount ?? 0}</div>
            </div>
          </div>

          <div
            className={`rounded-lg p-4 border ${
              isClassicDelivered
                ? 'bg-green-900/20 border-green-700/30'
                : 'bg-yellow-900/20 border-yellow-700/30'
            }`}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {isClassicDelivered ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                )}
                <div>
                  <h4 className={`font-medium ${isClassicDelivered ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isClassicDelivered ? 'تم تسليم الدعوات للعميل' : 'لم يتم تسليم الدعوات بعد'}
                  </h4>
                  <p className={`text-sm mt-1 ${isClassicDelivered ? 'text-green-100' : 'text-yellow-100'}`}>
                    {isClassicDelivered
                      ? event.classicInvitationsDelivered?.deliveredAt
                        ? `تم التسليم في ${new Date(event.classicInvitationsDelivered.deliveredAt).toLocaleDateString('ar-SA', { calendar: 'gregory' })}`
                        : 'تم تسجيل التسليم'
                      : 'أرسل بطاقات الدعوة إلى العميل عبر الواتساب ثم سجّل التسليم هنا'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleToggleClassicDelivery(!isClassicDelivered)}
                disabled={updatingDelivery || (!isClassicDelivered && !event.invitationCardUrl)}
                title={
                  !isClassicDelivered && !event.invitationCardUrl
                    ? 'يجب رفع بطاقة الدعوة أولاً'
                    : undefined
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isClassicDelivered
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-[#C09B52] hover:bg-[#A0884A]'
                }`}
              >
                {updatingDelivery ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isClassicDelivered ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>{isClassicDelivered ? 'إلغاء تسجيل التسليم' : 'تسجيل تسليم الدعوات'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Stats */}
      {guestStats && (!isClassic || hasLegacyClassicGuests) && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 text-center">
              <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{guestStats.totalGuests}</div>
              <div className="text-sm text-gray-400">إجمالي الضيوف</div>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 text-center">
              <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{guestStats.totalInvited}</div>
              <div className="text-sm text-gray-400">إجمالي المدعوين</div>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-[#C09B52] mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{guestStats.whatsappMessagesSent}</div>
              <div className="text-sm text-gray-400">رسائل مرسلة</div>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 text-center">
              <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{guestStats.remainingInvites}</div>
              <div className="text-sm text-gray-400">دعوات متبقية</div>
            </div>
          </div>
          
          {/* VIP Package - Attendance Statistics */}
          {event.packageType === 'vip' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {guests.filter(g => g.actuallyAttended === true).length}
                </div>
                <div className="text-sm text-gray-400">حضر فعلياً</div>
              </div>
              
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
                <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {guests.filter(g => g.actuallyAttended === false).length}
                </div>
                <div className="text-sm text-gray-400">لم يحضر</div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-center">
                <UserCheck className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {guests.filter(g => g.rsvpStatus === 'accepted').length}
                </div>
                <div className="text-sm text-gray-400">قبل الدعوة</div>
              </div>
              
              <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 text-center">
                <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {guests.filter(g => g.actuallyAttended === true || g.actuallyAttended === false).length > 0 
                    ? `${Math.round((guests.filter(g => g.actuallyAttended === true).length / guests.filter(g => g.actuallyAttended === true || g.actuallyAttended === false).length) * 100)}%`
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-gray-400">نسبة الحضور</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Premium/VIP Bulk Actions */}
      {(event.packageType === 'premium' || event.packageType === 'vip') && event.guestListConfirmed?.isConfirmed && (
        <div className="space-y-4 mb-6">
          {/* Send All Invitations. Guests already sent are skipped, so this can
              be run again safely to pick up whoever is left. */}
          {(() => {
            const unsentGuests = guests.filter(g => !g.whatsappMessageSent);
            const guestsWithoutLinks = unsentGuests.filter(g => !hasAllCards(g));
            const missingCards = guestsWithoutLinks.reduce((sum, g) => sum + getMissingCardCount(g), 0);
            const sendingInvitations = bulkSending === 'invitations';

            if (unsentGuests.length === 0) {
              return (
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-100 text-sm">تم إرسال الدعوات لجميع الضيوف</p>
                </div>
              );
            }

            if (guestsWithoutLinks.length > 0) {
              return (
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <p className="text-yellow-100 text-sm">
                    يجب إضافة بطاقة دخول لكل شخص ({guestsWithoutLinks.length} ضيف — {missingCards} بطاقة ناقصة) قبل إرسال الدعوات
                  </p>
                </div>
              );
            }

            return (
              <button
                onClick={() => setShowSendInvitationsConfirmation(true)}
                disabled={!!bulkSending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
              >
                {sendingInvitations ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {bulkProgress && bulkProgress.total > 0
                      ? `جاري الإرسال... ${bulkProgress.sent} من ${bulkProgress.total}`
                      : 'جاري الإرسال...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    إرسال جميع الدعوات عبر الواتساب ({unsentGuests.length} دعوة)
                  </>
                )}
              </button>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Send Reminders Button */}
            <button
              onClick={() => setShowSendRemindersConfirmation(true)}
              disabled={!!bulkSending}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
            >
              {bulkSending === 'reminders' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {bulkProgress && bulkProgress.total > 0
                    ? `جاري الإرسال... ${bulkProgress.sent} من ${bulkProgress.total}`
                    : 'جاري الإرسال...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  إرسال تذكيرات للضيوف
                </>
              )}
            </button>

            {/* Send Thank You Messages Button (VIP only) */}
            {event.packageType === 'vip' && (
              <button
                onClick={() => setShowSendThankYouConfirmation(true)}
                disabled={!!bulkSending}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
              >
                {bulkSending === 'thank-you' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {bulkProgress && bulkProgress.total > 0
                      ? `جاري الإرسال... ${bulkProgress.sent} من ${bulkProgress.total}`
                      : 'جاري الإرسال...'}
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    إرسال رسائل شكر
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Guest List Status Warning/Actions */}
      {!isClassic && (!event.guestListConfirmed?.isConfirmed ? (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-yellow-400" />
            <div>
              <h4 className="text-yellow-400 font-medium">قائمة الضيوف غير مؤكدة</h4>
              <p className="text-yellow-100 text-sm mt-1">
                المستخدم لم يؤكد قائمة الضيوف النهائية بعد. 
                {event.packageType === 'vip' && ' لا يمكن إرسال الدعوات حتى يتم التأكيد.'}
                {event.packageType === 'premium' && ' بعد التأكيد يمكنك إضافة الروابط الفردية.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <h4 className="text-green-400 font-medium">قائمة الضيوف مؤكدة</h4>
                <p className="text-green-100 text-sm mt-1">
                  تم تأكيد القائمة في {new Date(event.guestListConfirmed.confirmedAt!).toLocaleDateString('ar-SA', { calendar: 'gregory' })}
                  {event.guestListConfirmed.reopenCount && event.guestListConfirmed.reopenCount > 0 && (
                    <span className="mr-2 text-xs">
                      (تم إعادة الفتح {event.guestListConfirmed.reopenCount} مرة)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowReopenConfirmation(true)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              إعادة فتح القائمة
            </button>
          </div>
        </div>
      ))}

      {/* Guests List */}
      {(!isClassic || hasLegacyClassicGuests) && (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex items-start justify-between gap-4 flex-wrap">
          <div>
          <h3 className="text-lg font-semibold text-white">قائمة الضيوف</h3>
          <p className="text-sm text-gray-400 mt-1">
            {event.packageType === 'vip' && !event.guestListConfirmed?.isConfirmed 
              ? `لا يمكن عرض الضيوف حتى يتم تأكيد القائمة (${guestStats?.actualGuestCount || 0} ضيف في انتظار التأكيد)`
              : `${filteredGuests.length} من أصل ${guests.length} ضيف`
            }
          </p>
          {hasLegacyClassicGuests && (
            <p className="text-xs text-yellow-300 mt-1">
              ضيوف مُدخلون قبل إلغاء إدخال بيانات الضيوف في الباقة الكلاسيكية
            </p>
          )}
          </div>

          {/* Admins can add guests for premium/VIP customers, including after
              the customer has confirmed their list. */}
          {(event.packageType === 'premium' || event.packageType === 'vip') && (
            <button
              onClick={() => setShowAddGuestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#C09B52] hover:bg-[#A0884A] text-white rounded-lg text-sm transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              إضافة ضيف
            </button>
          )}
        </div>
        
        <div className="divide-y divide-gray-700">
          {filteredGuests.map((guest) => (
            <div key={guest._id} className="px-6 py-4 hover:bg-gray-800/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center space-x-3 ">
                      <h4 className="text-white font-medium">{guest.name}</h4>
                      <span className="text-gray-400 text-sm">+{guest.phone}</span>
                      <span className="text-gray-500 text-sm">
                        ({guest.numberOfAccompanyingGuests} {guest.numberOfAccompanyingGuests === 1 ? 'شخص' : 'أشخاص'})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2  mt-1">
                      <span className="text-xs text-gray-500">
                        أضيف في: {new Date(guest.addedAt).toLocaleDateString('ar-SA', { calendar: 'gregory', year: 'numeric', month: 'numeric', day: 'numeric' })}
                      </span>
                      {guest.whatsappMessageSent && (
                        <span className="flex items-center space-x-1  text-xs text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>تم الإرسال</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Entry cards, one per person on the invitation (Premium & VIP only) */}
                  {(event.packageType === 'premium' || event.packageType === 'vip') && (
                    <GuestInviteCards
                      eventId={eventId}
                      guest={guest}
                      onChanged={loadEventGuests}
                    />
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ">
                  {/* Classic Package - Admin view only */}
                  {event.packageType === 'classic' && (
                    <div className="flex items-center space-x-2  flex-wrap gap-2">
                      {guest.whatsappMessageSent ? (
                        <span className="flex items-center space-x-1  px-2 py-1 bg-green-900/20 text-green-300 rounded text-xs">
                          <CheckCircle className="h-3 w-3" />
                          <span>تم الإرسال للمستخدم</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 px-3 py-2 bg-gray-700/50 text-gray-400 rounded-lg text-xs">
                          <AlertCircle className="h-4 w-4" />
                          <span>سيتم الإرسال للمستخدم</span>
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Premium Package Actions */}
                  {event.packageType === 'premium' && (
                    <div className="flex items-center space-x-2  flex-wrap gap-2">
                      {/* RSVP Status Display */}
                      {guest.rsvpStatus && guest.rsvpStatus !== 'pending' && (
                        <span className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                          guest.rsvpStatus === 'accepted' 
                            ? 'bg-blue-900/20 text-blue-300' 
                            : 'bg-red-900/20 text-red-300'
                        }`}>
                          {guest.rsvpStatus === 'accepted' ? 'قبل الدعوة' : 'اعتذر'}
                        </span>
                      )}

                      <AccompanyingCountBadge guest={guest} />

                      {guest.whatsappMessageSent && (
                        <span className="flex items-center space-x-1  px-2 py-1 bg-green-900/20 text-green-300 rounded text-xs">
                          <CheckCircle className="h-3 w-3" />
                          <span>تم الإرسال بواسطة المستخدم</span>
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* VIP Package Actions */}
                  {event.packageType === 'vip' && (
                    <div className="flex items-center space-x-2  flex-wrap gap-2">
                      {/* Only show send button if guest list is confirmed AND individual invite link is added */}
                      {event.guestListConfirmed?.isConfirmed ? (
                        guest.individualInviteImage ? (
                          <button
                            onClick={() => handleSendWhatsapp(guest)}
                            disabled={sendingMessage === guest._id}
                            className="flex items-center space-x-2  px-4 py-2 bg-[#C09B52] text-white rounded-lg hover:bg-[#A0884A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingMessage === guest._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            <span>إرسال واتساب</span>
                          </button>
                        ) : (
                          <span className="flex items-center space-x-1 px-3 py-2 bg-yellow-900/20 text-yellow-300 rounded-lg text-xs border border-yellow-700/30">
                            <AlertCircle className="h-4 w-4" />
                            <span>في انتظار الرابط الفردي</span>
                          </span>
                        )
                      ) : (
                        <span className="flex items-center space-x-1 px-3 py-2 bg-orange-900/20 text-orange-300 rounded-lg text-xs border border-orange-700/30">
                          <AlertCircle className="h-4 w-4" />
                          <span>في انتظار تأكيد القائمة</span>
                        </span>
                      )}
                      
                      {guest.whatsappMessageSent && (
                        <span className="flex items-center space-x-1  px-2 py-1 bg-green-900/20 text-green-300 rounded text-xs">
                          <CheckCircle className="h-3 w-3" />
                          <span>تم الإرسال</span>
                        </span>
                      )}
                      
                      {/* RSVP Status Display */}
                      {guest.rsvpStatus && guest.rsvpStatus !== 'pending' && (
                        <span className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                          guest.rsvpStatus === 'accepted' 
                            ? 'bg-blue-900/20 text-blue-300' 
                            : 'bg-red-900/20 text-red-300'
                        }`}>
                          {guest.rsvpStatus === 'accepted' ? 'قبل الدعوة' : 'اعتذر'}
                        </span>
                      )}

                      <AccompanyingCountBadge guest={guest} />

                      {/* Post-Event Attendance Tracking */}
                      <div className="flex items-center space-x-2  bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700">
                        <span className="text-xs text-gray-400">الحضور الفعلي:</span>
                        <button
                          onClick={async () => {
                            try {
                              await adminAPI.markGuestAttendance(eventId, guest._id, true);
                              toast({
                                title: "تم التسجيل",
                                description: "تم تسجيل حضور الضيف",
                                variant: "default"
                              });
                              loadEventGuests();
                            } catch (error: any) {
                              toast({
                                title: "خطأ",
                                description: error.message || "فشل في تسجيل الحضور",
                                variant: "destructive"
                              });
                            }
                          }}
                          className={`p-1 rounded transition-colors ${
                            guest.actuallyAttended === true
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                          title="حضر"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await adminAPI.markGuestAttendance(eventId, guest._id, false);
                              toast({
                                title: "تم التسجيل",
                                description: "تم تسجيل عدم حضور الضيف",
                                variant: "default"
                              });
                              loadEventGuests();
                            } catch (error: any) {
                              toast({
                                title: "خطأ",
                                description: error.message || "فشل في تسجيل الحضور",
                                variant: "destructive"
                              });
                            }
                          }}
                          className={`p-1 rounded transition-colors ${
                            guest.actuallyAttended === false
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                          title="لم يحضر"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredGuests.length === 0 && (
          <div className="px-6 py-8 text-center">
            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">
              {showVipOnly ? 'لا توجد دعوات VIP متبقية' : 'لا توجد ضيوف في هذه المناسبة'}
            </p>
          </div>
        )}
      </div>
      )}

      {/* Reopen Guest List Confirmation Modal */}
      <ConfirmationModal
        isOpen={showReopenConfirmation}
        onConfirm={handleConfirmReopenGuestList}
        onCancel={() => setShowReopenConfirmation(false)}
        title="إعادة فتح قائمة الضيوف"
        message="هل أنت متأكد من إعادة فتح قائمة الضيوف؟ سيتمكن المستخدم من إضافة وتعديل وحذف الضيوف بعد إعادة الفتح."
        confirmText="نعم، إعادة الفتح"
        cancelText="إلغاء"
        variant="warning"
      />

      {showCardModal && (
        <InvitationCardModal
          eventId={eventId}
          eventName={event.eventName || event.hostName}
          card={event.invitationCardImage}
          onClose={() => setShowCardModal(false)}
          onUpdated={loadEventGuests}
        />
      )}

      {showAddGuestModal && (
        <AddGuestModal
          eventId={eventId}
          remainingInvites={guestStats?.remainingInvites ?? 0}
          onClose={() => setShowAddGuestModal(false)}
          onAdded={loadEventGuests}
        />
      )}

      <ConfirmationModal
        isOpen={showSendInvitationsConfirmation}
        onConfirm={handleConfirmSendInvitations}
        onCancel={() => setShowSendInvitationsConfirmation(false)}
        title="إرسال جميع الدعوات"
        message="هل تريد إرسال الدعوات عبر الواتساب لجميع الضيوف الذين لم تُرسل لهم دعوات بعد؟"
        confirmText="نعم، إرسال"
        cancelText="إلغاء"
        variant="warning"
      />

      <ConfirmationModal
        isOpen={showSendRemindersConfirmation}
        onConfirm={handleConfirmSendReminders}
        onCancel={() => setShowSendRemindersConfirmation(false)}
        title="إرسال تذكيرات"
        message="هل تريد إرسال تذكيرات لجميع الضيوف الذين قبلوا الدعوة؟"
        confirmText="نعم، إرسال"
        cancelText="إلغاء"
        variant="warning"
      />

      <ConfirmationModal
        isOpen={showSendThankYouConfirmation}
        onConfirm={handleConfirmSendThankYou}
        onCancel={() => setShowSendThankYouConfirmation(false)}
        title="إرسال رسائل شكر"
        message="هل تريد إرسال رسائل شكر لجميع الضيوف الذين حضروا؟"
        confirmText="نعم، إرسال"
        cancelText="إلغاء"
        variant="warning"
      />
    </div>
  );
}

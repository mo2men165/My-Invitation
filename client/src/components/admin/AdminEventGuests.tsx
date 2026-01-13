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
  AlertCircle
} from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';
import ConfirmationModal from '@/components/cart/CartModal/components/ConfirmationModal';

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

export function AdminEventGuests({ eventId, onBack }: AdminEventGuestsProps) {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [editingImageForGuest, setEditingImageForGuest] = useState<string | null>(null);
  const [inviteImageFile, setInviteImageFile] = useState<File | null>(null);
  const [inviteImagePreview, setInviteImagePreview] = useState<string | null>(null);
  const [updatingImage, setUpdatingImage] = useState(false);
  const [showReopenConfirmation, setShowReopenConfirmation] = useState(false);
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

  const handleUpdateInviteImage = async (guest: Guest) => {
    if (!event) return;

    if (!inviteImageFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(inviteImageFile.type)) {
      toast({
        title: "خطأ",
        description: "نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG أو PNG فقط",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB)
    if (inviteImageFile.size > 10 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    try {
      setUpdatingImage(true);
      await adminAPI.updateGuestInviteImage(eventId, guest._id, inviteImageFile);
      
      // Reload to update UI
      await loadEventGuests();
      
      // Reset editing state
      setEditingImageForGuest(null);
      setInviteImageFile(null);
      setInviteImagePreview(null);
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث صورة الدعوة الفردية بنجاح",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الصورة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setUpdatingImage(false);
    }
  };

  const handleDeleteInviteImage = async (guest: Guest) => {
    if (!event) return;

    if (!confirm('هل أنت متأكد من حذف صورة الدعوة الفردية؟')) {
      return;
    }

    try {
      setUpdatingImage(true);
      await adminAPI.updateGuestInviteImage(eventId, guest._id, null);
      
      // Reload to update UI
      await loadEventGuests();
      
      toast({
        title: "تم الحذف",
        description: "تم حذف صورة الدعوة الفردية بنجاح",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الصورة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setUpdatingImage(false);
    }
  };

  const handleStartEditingImage = (guest: Guest) => {
    setEditingImageForGuest(guest._id);
    setInviteImageFile(null);
    setInviteImagePreview(null);
  };

  const handleCancelEditingImage = () => {
    setEditingImageForGuest(null);
    setInviteImageFile(null);
    setInviteImagePreview(null);
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
              
              {/* Guest List Confirmation Status - All Packages */}
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
            </div>
          </div>
        </div>
      </div>

      {/* Guest Stats */}
      {guestStats && (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Send Reminders Button */}
          <button
            onClick={async () => {
              if (confirm(`هل تريد إرسال تذكيرات لجميع الضيوف الذين قبلوا الدعوة؟`)) {
                try {
                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/events/${eventId}/send-reminders`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                  });

                  const result = await response.json();

                  if (response.ok) {
                    toast({
                      title: "تم إرسال التذكيرات",
                      description: result.message,
                      variant: "default"
                    });
                  } else {
                    throw new Error(result.error?.message);
                  }
                } catch (error: any) {
                  toast({
                    title: "خطأ",
                    description: error.message || "فشل في إرسال التذكيرات",
                    variant: "destructive"
                  });
                }
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <Send className="w-4 h-4" />
            إرسال تذكيرات للضيوف
          </button>

          {/* Send Thank You Messages Button (VIP only) */}
          {event.packageType === 'vip' && (
            <button
              onClick={async () => {
                if (confirm(`هل تريد إرسال رسائل شكر لجميع الضيوف الذين حضروا؟`)) {
                  try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/events/${eventId}/send-thank-you`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                      }
                    });

                    const result = await response.json();

                    if (response.ok) {
                      toast({
                        title: "تم إرسال رسائل الشكر",
                        description: result.message,
                        variant: "default"
                      });
                    } else {
                      throw new Error(result.error?.message);
                    }
                  } catch (error: any) {
                    toast({
                      title: "خطأ",
                      description: error.message || "فشل في إرسال رسائل الشكر",
                      variant: "destructive"
                    });
                  }
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              إرسال رسائل شكر
            </button>
          )}
        </div>
      )}

      {/* Guest List Status Warning/Actions */}
      {!event.guestListConfirmed?.isConfirmed ? (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-yellow-400" />
            <div>
              <h4 className="text-yellow-400 font-medium">قائمة الضيوف غير مؤكدة</h4>
              <p className="text-yellow-100 text-sm mt-1">
                المستخدم لم يؤكد قائمة الضيوف النهائية بعد. 
                {event.packageType === 'vip' && ' لا يمكن إرسال الدعوات حتى يتم التأكيد.'}
                {event.packageType === 'premium' && ' بعد التأكيد يمكنك إضافة الروابط الفردية.'}
                {event.packageType === 'classic' && ' بعد التأكيد يمكنك إرسال الدعوات للمستخدم.'}
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
      )}

      {/* Guests List */}
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">قائمة الضيوف</h3>
          <p className="text-sm text-gray-400 mt-1">
            {event.packageType === 'vip' && !event.guestListConfirmed?.isConfirmed 
              ? `لا يمكن عرض الضيوف حتى يتم تأكيد القائمة (${guestStats?.actualGuestCount || 0} ضيف في انتظار التأكيد)`
              : `${filteredGuests.length} من أصل ${guests.length} ضيف`
            }
          </p>
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
                        ({guest.numberOfAccompanyingGuests} مرافق)
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

                  {/* Individual Invite Link Section (Premium & VIP only) */}
                  {(event.packageType === 'premium' || event.packageType === 'vip') && (
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                      {editingImageForGuest === guest._id ? (
                        <div className="space-y-3">
                          <label className="text-xs text-gray-400 block">صورة الدعوة الفردية</label>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (file) {
                                // Validate file type
                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                                if (!allowedTypes.includes(file.type)) {
                                  toast({
                                    title: "خطأ",
                                    description: "نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG أو PNG فقط",
                                    variant: "destructive"
                                  });
                                  e.target.value = ''; // Clear the input
                                  setInviteImageFile(null);
                                  setInviteImagePreview(null);
                                  return;
                                }
                                
                                // Validate file size (10MB)
                                if (file.size > 10 * 1024 * 1024) {
                                  toast({
                                    title: "خطأ",
                                    description: "حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت",
                                    variant: "destructive"
                                  });
                                  e.target.value = ''; // Clear the input
                                  setInviteImageFile(null);
                                  setInviteImagePreview(null);
                                  return;
                                }
                                
                                setInviteImageFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setInviteImagePreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              } else {
                                setInviteImageFile(null);
                                setInviteImagePreview(null);
                              }
                            }}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#C09B52] file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#C09B52] file:text-white hover:file:bg-[#A0884A] cursor-pointer"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            الصيغ المدعومة: JPEG, PNG فقط (الحد الأقصى: 10 ميجابايت)
                          </p>
                          {inviteImagePreview && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-400 mb-2">معاينة الصورة:</p>
                              <div className="relative border border-gray-600 rounded-lg overflow-hidden bg-gray-700">
                                <img
                                  src={inviteImagePreview}
                                  alt="Preview"
                                  className="w-full h-auto max-h-32 object-contain"
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateInviteImage(guest)}
                              disabled={updatingImage || !inviteImageFile}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {updatingImage ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEditingImage}
                              disabled={updatingImage}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">صورة الدعوة الفردية</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleStartEditingImage(guest)}
                                className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                              >
                                {guest.individualInviteImage ? 'تعديل' : 'إضافة'}
                              </button>
                              {guest.individualInviteImage && (
                                <button
                                  onClick={() => handleDeleteInviteImage(guest)}
                                  disabled={updatingImage}
                                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  حذف
                                </button>
                              )}
                            </div>
                          </div>
                          {guest.individualInviteImage ? (
                            <div className="mt-2">
                              <div className="relative border border-gray-600 rounded-lg overflow-hidden bg-gray-700">
                                <img
                                  src={guest.individualInviteImage.secure_url || guest.individualInviteImage.url}
                                  alt="Invite Card"
                                  className="w-full h-auto max-h-32 object-contain"
                                />
                              </div>
                              <a
                                href={guest.individualInviteImage.secure_url || guest.individualInviteImage.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
                              >
                                فتح الصورة
                              </a>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">لم يتم تعيين صورة</span>
                          )}
                        </div>
                      )}
                    </div>
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
    </div>
  );
}

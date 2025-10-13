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
  XCircle
} from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';
import { formatPhoneForDisplay } from '@/utils/phoneValidation';

interface Guest {
  _id: string;
  name: string;
  phone: string;
  numberOfAccompanyingGuests: number;
  whatsappMessageSent: boolean;
  addedAt: string;
  updatedAt: string;
  individualInviteLink?: string;
}

interface EventDetails {
  id: string;
  hostName: string;
  eventDate: string;
  eventLocation: string;
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
  const [editingLinkForGuest, setEditingLinkForGuest] = useState<string | null>(null);
  const [inviteLinkInput, setInviteLinkInput] = useState<string>('');
  const [updatingLink, setUpdatingLink] = useState(false);
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
      weekday: 'long'
    });
  };

  const handleSendWhatsapp = async (guest: Guest) => {
    if (!event) return;

    setSendingMessage(guest._id);

    let message = `بسم الله الرحمن الرحيم

دعوة كريمة

السلام عليكم ورحمة الله وبركاته الأستاذ الفاضل/ ${guest.name}

${event.invitationText}

تفاصيل المناسبة:
- المضيف: ${event.hostName}
- التاريخ: ${formatEventDate(event.eventDate)}
- الوقت: من ${event.startTime} إلى ${event.endTime}
- المكان: ${event.eventLocation}
- عدد الأشخاص المدعوين: ${guest.numberOfAccompanyingGuests}`;

    // Add invitation URL for classic and premium packages
    if (event.packageType === 'classic' || event.packageType === 'premium') {
      message += `\n\nرابط الدعوة سيتم إرساله قريباً بعد موافقة الإدارة`;
    }

    message += `\n\nنتشرف بحضوركم الكريم وننتظركم معنا في هذه المناسبة المباركة`;

    const whatsappUrl = `https://wa.me/${guest.phone.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`;
    
    try {
      // Mark as sent in backend
      await adminAPI.markGuestWhatsappSent(eventId, guest._id);
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Reload to update UI
      await loadEventGuests();
      
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
    } finally {
      setSendingMessage(null);
    }
  };

  const handleUpdateInviteLink = async (guest: Guest) => {
    if (!event) return;

    try {
      setUpdatingLink(true);
      await adminAPI.updateGuestInviteLink(eventId, guest._id, inviteLinkInput);
      
      // Reload to update UI
      await loadEventGuests();
      
      // Reset editing state
      setEditingLinkForGuest(null);
      setInviteLinkInput('');
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث رابط الدعوة الفردي بنجاح",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الرابط",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setUpdatingLink(false);
    }
  };

  const handleStartEditingLink = (guest: Guest) => {
    setEditingLinkForGuest(guest._id);
    setInviteLinkInput(guest.individualInviteLink || '');
  };

  const handleCancelEditingLink = () => {
    setEditingLinkForGuest(null);
    setInviteLinkInput('');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 space-x-reverse text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>العودة</span>
          </button>
          <h2 className="text-2xl font-bold text-white">إدارة ضيوف المناسبة</h2>
        </div>
        
        {/* VIP Filter */}
        {event.packageType === 'vip' && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <label className="text-sm text-gray-300">عرض VIP فقط</label>
            <input
              type="checkbox"
              checked={showVipOnly}
              onChange={(e) => setShowVipOnly(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-[#C09B52] focus:ring-[#C09B52]"
            />
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{event.hostName}</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Calendar className="h-4 w-4 text-[#C09B52]" />
                <span>{formatEventDate(event.eventDate)}</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Clock className="h-4 w-4 text-[#C09B52]" />
                <span>من {event.startTime} إلى {event.endTime}</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <MapPin className="h-4 w-4 text-[#C09B52]" />
                <span>{event.eventLocation}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">معلومات المضيف</h4>
            <div className="space-y-1 text-gray-300">
              <p><span className="text-gray-400">الاسم:</span> {event.user.name}</p>
              <p><span className="text-gray-400">البريد:</span> {event.user.email}</p>
              <p><span className="text-gray-400">الهاتف:</span> {event.user.phone}</p>
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
              
              {/* VIP Confirmation Status */}
              {event.packageType === 'vip' && (
                <p><span className="text-gray-400">حالة قائمة الضيوف:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    event.guestListConfirmed?.isConfirmed 
                      ? 'bg-green-900/20 text-green-300' 
                      : 'bg-yellow-900/20 text-yellow-300'
                  }`}>
                    {event.guestListConfirmed?.isConfirmed 
                      ? `مؤكدة (${event.guestListConfirmed.confirmedAt ? new Date(event.guestListConfirmed.confirmedAt).toLocaleDateString('ar-SA', { calendar: 'gregory' }) : ''})` 
                      : 'في انتظار التأكيد'
                    }
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guest Stats */}
      {guestStats && (
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
      )}

      {/* VIP Confirmation Warning */}
      {event.packageType === 'vip' && !event.guestListConfirmed?.isConfirmed && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-yellow-400" />
            <div>
              <h4 className="text-yellow-400 font-medium">قائمة الضيوف غير مؤكدة</h4>
              <p className="text-yellow-100 text-sm mt-1">
                المستخدم لم يؤكد قائمة الضيوف النهائية بعد. لا يمكن إرسال الدعوات حتى يتم التأكيد.
              </p>
            </div>
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
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <h4 className="text-white font-medium">{guest.name}</h4>
                      <span className="text-gray-400 text-sm">+{guest.phone}</span>
                      <span className="text-gray-500 text-sm">
                        ({guest.numberOfAccompanyingGuests} مرافق)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse mt-1">
                      <span className="text-xs text-gray-500">
                        أضيف في: {new Date(guest.addedAt).toLocaleDateString('ar-SA')}
                      </span>
                      {guest.whatsappMessageSent && (
                        <span className="flex items-center space-x-1 space-x-reverse text-xs text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>تم الإرسال</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Individual Invite Link Section (Premium & VIP only) */}
                  {(event.packageType === 'premium' || event.packageType === 'vip') && (
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                      {editingLinkForGuest === guest._id ? (
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 block">رابط الدعوة الفردي</label>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="text"
                              value={inviteLinkInput}
                              onChange={(e) => setInviteLinkInput(e.target.value)}
                              placeholder="أدخل رابط الدعوة الفردي"
                              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#C09B52]"
                            />
                            <button
                              onClick={() => handleUpdateInviteLink(guest)}
                              disabled={updatingLink}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingLink ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEditingLink}
                              disabled={updatingLink}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="text-xs text-gray-400 block mb-1">رابط الدعوة الفردي</span>
                            {guest.individualInviteLink ? (
                              <a 
                                href={guest.individualInviteLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
                              >
                                {guest.individualInviteLink}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-500">لم يتم تعيين رابط</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleStartEditingLink(guest)}
                            className="mr-3 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                          >
                            {guest.individualInviteLink ? 'تعديل' : 'إضافة'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  {event.packageType === 'vip' && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleSendWhatsapp(guest)}
                        disabled={sendingMessage === guest._id}
                        className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-[#C09B52] text-white rounded-lg hover:bg-[#A0884A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage === guest._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span>إرسال واتساب</span>
                      </button>
                      
                      {guest.whatsappMessageSent && (
                        <span className="flex items-center space-x-1 space-x-reverse px-2 py-1 bg-green-900/20 text-green-300 rounded text-xs">
                          <CheckCircle className="h-3 w-3" />
                          <span>تم الإرسال</span>
                        </span>
                      )}
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
    </div>
  );
}

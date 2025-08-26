// src/app/events/[id]/page.tsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { eventsAPI, EventItem, GuestStats } from '@/lib/api/events';
import { useToast } from '@/hooks/useToast';
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
  QrCode
} from 'lucide-react';
import Link from 'next/link';

interface Guest {
  _id?: string;
  name: string;
  phone: string;
  numberOfAccompanyingGuests: number;
  whatsappMessageSent: boolean;
}

const EventDetailPage: React.FC<{ params: { id: string } }> = ({ params }) => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<EventItem | null>(null);
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingGuest, setAddingGuest] = useState(false);
  
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
      const response = await eventsAPI.getEventDetails(params.id);
      
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
  }, [params.id, toast, router]);

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
      const response = await eventsAPI.addGuest(params.id, {
        name: newGuest.name.trim(),
        phone: newGuest.phone.replace(/^\+966/, ''),
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

    const message = `السلام عليكم ${guest.name},

يسعدنا دعوتكم لحضور: ${event.details.hostName}

📅 التاريخ: ${new Date(event.details.eventDate).toLocaleDateString('ar-SA')}
🕐 الوقت: من ${event.details.startTime} إلى ${event.details.endTime}
📍 المكان: ${event.details.eventLocation}
👥 عدد الأشخاص المدعوين: ${guest.numberOfAccompanyingGuests}

${event.details.invitationText}

نتطلع لرؤيتكم معنا!`;

    const whatsappUrl = `https://wa.me/${guest.phone.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`;
    
    try {
      // Mark as sent in backend
      await eventsAPI.markWhatsappSent(params.id, guest._id!);
      
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
      await eventsAPI.removeGuest(params.id, guestId);
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
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusDetails.bgColor} ${statusDetails.color}`}>
              {statusDetails.name}
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
                        {new Date(event.details.eventDate).toLocaleDateString('ar-SA', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
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

            {/* Guest List */}
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">قائمة الضيوف</h3>
                <div className="text-sm text-gray-400">
                  {event.guests.length} ضيف مضاف • {guestStats?.totalInvited || 0} من {event.details.inviteCount} دعوة
                </div>
              </div>

              {/* Add New Guest Form */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h4 className="text-white font-medium mb-4">إضافة ضيف جديد</h4>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="اسم الضيف"
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#C09B52] transition-colors"
                  />
                  
                  <input
                    type="tel"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="رقم الهاتف (5xxxxxxxx)"
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#C09B52] transition-colors"
                  />
                  
                  <select
                    value={newGuest.numberOfAccompanyingGuests}
                    onChange={(e) => setNewGuest(prev => ({ ...prev, numberOfAccompanyingGuests: parseInt(e.target.value) }))}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#C09B52] transition-colors"
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
                  disabled={addingGuest || (guestStats?.remainingInvites || 0) <= 0}
                  className="w-full md:w-auto px-6 py-2 bg-[#C09B52] text-white font-medium rounded-lg hover:bg-[#B8935A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                          <div className="text-sm text-gray-300">{guest.phone}</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {guest.whatsappMessageSent ? (
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-lg">
                              <Check className="w-4 h-4" />
                              تم الإرسال
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSendWhatsapp(guest)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              إرسال دعوة
                            </button>
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

            {/* Event Timeline */}
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">الجدول الزمني</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">تم إتمام الدفع</div>
                    <div className="text-gray-400">
                      {new Date(event.paymentCompletedAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-3 h-3 bg-[#C09B52] rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">تاريخ المناسبة</div>
                    <div className="text-gray-400">
                      {new Date(event.details.eventDate).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
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
// src/app/events/[id]/page.tsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { eventsAPI, EventItem, GuestStats } from '@/lib/api/events';
import { useToast } from '@/hooks/useToast';
import { Guest } from '@/types/event';
import { 
  getPackageDetails, 
  getStatusDetails, 
  getApprovalStatusDetails, 
  formatEventDate, 
  getCountryFromPhone 
} from '@/utils/eventUtils';
import { validatePhoneNumber, ALLOWED_COUNTRY_CODES, isCountryAllowed, getDisallowedCountryError } from '@/utils/phoneValidation';
import { Loader2, Package } from 'lucide-react';
import Link from 'next/link';

// Import components
import { EventHeader } from '@/components/events/EventHeader';
import { EventDetails } from '@/components/events/EventDetails';
import { GuestManagement } from '@/components/events/GuestManagement';
import { EventSidebar } from '@/components/events/EventSidebar';
import { CollaborationManagement } from '@/components/collaboration/CollaborationManagement';

// Import CSS
import 'react-phone-number-input/style.css';
import './phone-input.css';

const EventDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = params?.id;
  const { toast } = useToast();
  
  const [event, setEvent] = useState<EventItem | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'collaborator'>('owner');
  const [permissions, setPermissions] = useState<any>(null);
  const [totalInvitesForView, setTotalInvitesForView] = useState<number>(0);
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
        setGuests(response.guests || []);
        setGuestStats(response.guestStats!);
        setUserRole(response.userRole || 'owner');
        setPermissions(response.permissions || null);
        
        // For collaborators, ensure we use their allocated invites
        if (response.userRole === 'collaborator') {
          const allocatedInvites = response.totalInvitesForView || 0;
          if (allocatedInvites === 0) {
            toast({
              title: "تحذير",
              description: "لم يتم تخصيص دعوات لك. يرجى التواصل مع مالك المناسبة.",
              variant: "destructive"
            });
          }
          setTotalInvitesForView(allocatedInvites);
        } else {
          setTotalInvitesForView(response.event?.details?.inviteCount || 0);
        }
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

    // Validate phone number using our custom validation
    if (!validatePhoneNumber(newGuest.phone)) {
      setPhoneError(true);
      toast({
        title: "رقم هاتف غير صحيح",
        description: getDisallowedCountryError(),
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
        phone: newGuest.phone,
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

    // Add QR Code URL if available
    if (event.qrCodeUrl) {
      message += `\n\nرابط QR Code: ${event.qrCodeUrl}`;
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

  const handleUpdateGuest = async (guestId: string, updates: Partial<Guest>) => {
    try {
      // Validate phone number if being updated
      if (updates.phone && !validatePhoneNumber(updates.phone)) {
        toast({
          title: "رقم هاتف غير صحيح",
          description: getDisallowedCountryError(),
          variant: "destructive"
        });
        return;
      }

      await eventsAPI.updateGuest(eventId, guestId, updates);
      await loadEventDetails();
      
      toast({
        title: "تم تحديث بيانات الضيف",
        description: "تم تحديث بيانات الضيف بنجاح",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث بيانات الضيف",
        description: error.message || "فشل في تحديث بيانات الضيف",
        variant: "destructive"
      });
    }
  };

  const handleCountryChange = (country: string) => {
    toast({
      title: "دولة غير مسموحة",
      description: getDisallowedCountryError(),
      variant: "destructive"
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <EventHeader
        eventName={event.details.eventName}
        hostName={event.details.hostName}
        packageDetails={packageDetails}
        statusDetails={statusDetails}
        approvalStatusDetails={approvalStatusDetails}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <EventDetails
              event={event}
              guestStats={guestStats}
              totalInvitesForView={totalInvitesForView}
              formatEventDate={formatEventDate}
            />

            {/* Collaboration Management - Only for owners */}
            {userRole === 'owner' && (event.packageType === 'premium' || event.packageType === 'vip') && (
              <CollaborationManagement
                eventId={eventId}
                packageType={event.packageType}
                totalInvites={event.details.inviteCount}
              />
            )}

            {/* Guest Management */}
            <GuestManagement
              event={event}
              guests={guests}
              userRole={userRole}
              guestStats={guestStats}
              newGuest={newGuest}
              setNewGuest={setNewGuest}
              phoneError={phoneError}
              addingGuest={addingGuest}
              confirmingGuestList={confirmingGuestList}
              onAddGuest={handleAddGuest}
              onSendWhatsapp={handleSendWhatsapp}
              onRemoveGuest={handleRemoveGuest}
              onUpdateGuest={handleUpdateGuest}
              onConfirmGuestList={handleConfirmGuestList}
              getCountryFromPhone={getCountryFromPhone}
              onCountryChange={handleCountryChange}
              remainingInvites={guestStats?.remainingInvites || 0}
            />
          </div>

          {/* Sidebar */}
          <EventSidebar
            guestStats={guestStats}
            event={event}
            totalInvitesForView={totalInvitesForView}
            approvalStatusDetails={approvalStatusDetails}
            formatEventDate={formatEventDate}
          />
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;

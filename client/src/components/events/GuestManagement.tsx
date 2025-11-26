import React from 'react';
import { Users2, AlertCircle, CheckSquare, Loader2, Send } from 'lucide-react';
import { Guest } from '@/types/event';
import { GuestForm } from './GuestForm';
import { GuestList } from './GuestList';

interface GuestManagementProps {
  event: {
    guests: Guest[];
    packageType: string;
    guestListConfirmed: {
      isConfirmed: boolean;
      confirmedAt?: string;
    };
    invitationCardUrl?: string;
    details?: {
      inviteCount: number;
    };
  };
  guests: Guest[]; // Add filtered guests prop
  userRole: 'owner' | 'collaborator'; // Add user role prop
  guestStats?: {
    totalInvited: number;
  } | null;
  newGuest: Guest;
  setNewGuest: React.Dispatch<React.SetStateAction<Guest>>;
  phoneError: boolean;
  addingGuest: boolean;
  confirmingGuestList: boolean;
  onAddGuest: () => Promise<void>;
  onSendWhatsapp: (guest: Guest) => Promise<void>;
  onSendWhatsappAPI?: (guest: Guest) => Promise<void>;
  onSendBulkWhatsapp?: () => Promise<void>;
  onRemoveGuest: (guestId: string) => Promise<void>;
  onUpdateGuest: (guestId: string, updates: Partial<Guest>) => Promise<void>;
  onConfirmGuestList: () => Promise<void>;
  sendingWhatsapp?: string | null;
  sendingBulkWhatsapp?: boolean;
  getCountryFromPhone: (phone: string) => string;
  onCountryChange?: (country: string) => void;
  remainingInvites: number;
}

export const GuestManagement: React.FC<GuestManagementProps> = ({
  event,
  guests,
  userRole,
  guestStats,
  newGuest,
  setNewGuest,
  phoneError,
  addingGuest,
  confirmingGuestList,
  onAddGuest,
  onSendWhatsapp,
  onSendWhatsappAPI,
  onSendBulkWhatsapp,
  onRemoveGuest,
  onUpdateGuest,
  onConfirmGuestList,
  sendingWhatsapp,
  sendingBulkWhatsapp,
  getCountryFromPhone,
  onCountryChange,
  remainingInvites
}) => {
  const isVipConfirmed = event.packageType === 'vip' && event.guestListConfirmed.isConfirmed;

  return (
    <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <h3 className="text-base sm:text-lg font-bold text-white">قائمة الضيوف</h3>
        <div className="text-xs sm:text-sm text-gray-400">
          {event.guests.length} ضيف مضاف • {guestStats?.totalInvited || 0} من {event.details?.inviteCount || 0} دعوة
        </div>
      </div>

      {/* WhatsApp Bulk Send Button for Premium packages */}
      {event.packageType === 'premium' && guests.length > 0 && (
        event.guestListConfirmed.isConfirmed ? (
        <div className="mb-6">
          {/* Check if all guests have individual invite links */}
          {(() => {
            const guestsWithoutLinks = guests.filter(g => !g.individualInviteImage);
            const canSendBulk = guestsWithoutLinks.length === 0;
            
            return canSendBulk ? (
              <>
                <button
                  onClick={onSendBulkWhatsapp}
                  disabled={sendingBulkWhatsapp || !onSendBulkWhatsapp}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {sendingBulkWhatsapp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      إرسال جميع الدعوات عبر الواتساب ({guests.filter(g => !g.whatsappMessageSent).length} دعوة)
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-400 mt-2 text-center">
                  سيتم إرسال دعوات تفاعلية مع أزرار القبول/الاعتذار
                </p>
              </>
            ) : (
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <div className="flex-1">
                    <h4 className="text-yellow-400 font-medium text-sm">في انتظار الروابط الفردية</h4>
                    <p className="text-yellow-100 text-xs mt-1">
                      يجب إضافة روابط فردية لجميع الضيوف ({guestsWithoutLinks.length} ضيف في انتظار الرابط) قبل إرسال الدعوات
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        ) : (
          <div className="mb-6">
            <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <div className="flex-1">
                  <h4 className="text-orange-400 font-medium text-sm">قم بتأكيد قائمة الضيوف أولاً</h4>
                  <p className="text-orange-100 text-xs mt-1">
                    بعد تأكيد القائمة، سيتم إضافة الروابط الفردية ويمكنك إرسال الدعوات
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Package-specific Notice */}
      {event.guestListConfirmed.isConfirmed ? (
        <div className="rounded-xl p-4 mb-6 bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-700">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-green-400" />
            <div>
              <h4 className="font-medium text-green-400">تم تأكيد قائمة الضيوف</h4>
              <p className="text-sm text-green-100">
                {event.packageType === 'classic' && 'سنقوم بإرسال الدعوات إليك عبر الواتساب قريباً'}
                {event.packageType === 'premium' && 'بعد إضافة الروابط الفردية يمكنك إرسال الدعوات'}
                {event.packageType === 'vip' && 'فريقنا سيتولى إرسال الدعوات للضيوف قريباً'}
                {event.guestListConfirmed.confirmedAt && 
                  ` (${new Date(event.guestListConfirmed.confirmedAt).toLocaleDateString('ar-SA', { calendar: 'gregory' })})`
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-4 mb-6 bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border border-yellow-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <div>
              <h4 className="font-medium text-yellow-400">
                {event.packageType === 'classic' && 'باقة كلاسيك'}
                {event.packageType === 'premium' && 'باقة بريميوم'}
                {event.packageType === 'vip' && 'باقة VIP'}
              </h4>
              <p className="text-sm text-yellow-100">
                {event.packageType === 'classic' && 'أضف جميع ضيوفك ثم قم بتأكيد القائمة. سنقوم بإرسال الدعوات إليك عبر الواتساب'}
                {event.packageType === 'premium' && 'أضف جميع ضيوفك وقم بتأكيد القائمة. بعدها سيتم إضافة الروابط الفردية لكل ضيف ويمكنك إرسال الدعوات'}
                {event.packageType === 'vip' && 'أضف جميع ضيوفك ثم قم بتأكيد القائمة. فريقنا سيتولى إرسال الدعوات للضيوف نيابة عنك'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Guest Form */}
      <GuestForm
        newGuest={newGuest}
        setNewGuest={setNewGuest}
        phoneError={phoneError}
        addingGuest={addingGuest}
        isVipConfirmed={isVipConfirmed}
        remainingInvites={remainingInvites}
        onAddGuest={onAddGuest}
      />

      {/* Guests List */}
      <GuestList
        guests={guests}
        userRole={userRole}
        packageType={event.packageType}
        invitationCardUrl={event.invitationCardUrl}
        isVipConfirmed={isVipConfirmed}
        onSendWhatsapp={onSendWhatsapp}
        onSendWhatsappAPI={onSendWhatsappAPI}
        onRemoveGuest={onRemoveGuest}
        onUpdateGuest={onUpdateGuest}
        getCountryFromPhone={getCountryFromPhone}
        onCountryChange={onCountryChange}
        sendingWhatsapp={sendingWhatsapp}
      />

      {/* Confirm Final Guest List Button - For all packages - Only for owners */}
      {userRole === 'owner' && guests.length > 0 && !event.guestListConfirmed.isConfirmed && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 border border-yellow-700/30 rounded-xl p-4">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h4 className="text-yellow-400 font-medium mb-1">تأكيد القائمة النهائية</h4>
                <p className="text-yellow-100 text-sm mb-2">
                  {event.packageType === 'classic' && 'بعد التأكيد، سنقوم بإرسال الدعوات إليك عبر الواتساب'}
                  {event.packageType === 'premium' && 'بعد التأكيد، سيتم إضافة الروابط الفردية لكل ضيف'}
                  {event.packageType === 'vip' && 'بعد التأكيد، سيقوم فريقنا بإرسال الدعوات لجميع الضيوف'}
                </p>
                <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-3 mt-2">
                  <p className="text-orange-300 text-xs font-medium">
                    ⚠️ ملاحظة: بعد تأكيد القائمة، يمكن للإدارة إعادة فتحها إذا احتجت لإضافة أو تعديل ضيوف
                  </p>
                </div>
              </div>
              <button
                onClick={onConfirmGuestList}
                disabled={confirmingGuestList}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                {confirmingGuestList ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التأكيد...
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    تأكيد القائمة
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

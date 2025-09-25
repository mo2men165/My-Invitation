import React from 'react';
import { Users2, AlertCircle, CheckSquare, Loader2 } from 'lucide-react';
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
  onRemoveGuest: (guestId: string) => Promise<void>;
  onUpdateGuest: (guestId: string, updates: Partial<Guest>) => Promise<void>;
  onConfirmGuestList: () => Promise<void>;
  getCountryFromPhone: (phone: string) => string;
  onCountryChange?: (country: string) => void;
  remainingInvites: number;
}

export const GuestManagement: React.FC<GuestManagementProps> = ({
  event,
  guestStats,
  newGuest,
  setNewGuest,
  phoneError,
  addingGuest,
  confirmingGuestList,
  onAddGuest,
  onSendWhatsapp,
  onRemoveGuest,
  onUpdateGuest,
  onConfirmGuestList,
  getCountryFromPhone,
  onCountryChange,
  remainingInvites
}) => {
  const isVipConfirmed = event.packageType === 'vip' && event.guestListConfirmed.isConfirmed;

  return (
    <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">قائمة الضيوف</h3>
        <div className="text-sm text-gray-400">
          {event.guests.length} ضيف مضاف • {guestStats?.totalInvited || 0} من {event.details?.inviteCount || 0} دعوة
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
                  : 'فريقنا سيتولى إرسال الدعوات للضيوف نيابة عنك. أضف جميع الضيوف ثم اضغط على "تأكيد القائمة النهائية"'
                }
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
        guests={event.guests}
        packageType={event.packageType}
        invitationCardUrl={event.invitationCardUrl}
        isVipConfirmed={isVipConfirmed}
        onSendWhatsapp={onSendWhatsapp}
        onRemoveGuest={onRemoveGuest}
        onUpdateGuest={onUpdateGuest}
        getCountryFromPhone={getCountryFromPhone}
        onCountryChange={onCountryChange}
      />

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
                onClick={onConfirmGuestList}
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
  );
};

import React from 'react';
import { Users } from 'lucide-react';
import { Guest } from '@/types/event';
import { EditableGuest } from './EditableGuest';

interface GuestListProps {
  guests: Guest[];
  userRole: 'owner' | 'collaborator';
  packageType: string;
  invitationCardUrl?: string;
  isVipConfirmed: boolean;
  onSendWhatsapp: (guest: Guest) => Promise<void>;
  onRemoveGuest: (guestId: string) => Promise<void>;
  onUpdateGuest: (guestId: string, updates: Partial<Guest>) => Promise<void>;
  getCountryFromPhone: (phone: string) => string;
  onCountryChange?: (country: string) => void;
}

export const GuestList: React.FC<GuestListProps> = ({
  guests,
  userRole,
  packageType,
  invitationCardUrl,
  isVipConfirmed,
  onSendWhatsapp,
  onRemoveGuest,
  onUpdateGuest,
  getCountryFromPhone,
  onCountryChange
}) => {
  if (guests.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">لم تقم بإضافة أي ضيوف بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {guests.map((guest, index) => (
        <EditableGuest
          key={guest._id || index}
          guest={guest}
          userRole={userRole}
          packageType={packageType}
          invitationCardUrl={invitationCardUrl}
          isVipConfirmed={isVipConfirmed}
          onSendWhatsapp={onSendWhatsapp}
          onRemoveGuest={onRemoveGuest}
          onUpdateGuest={onUpdateGuest}
          getCountryFromPhone={getCountryFromPhone}
          onCountryChange={onCountryChange}
        />
      ))}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Send, Check, Trash2, Users2, Edit2, X, Save } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Guest } from '@/types/event';
import { ALLOWED_COUNTRY_CODES, validatePhoneNumber, isCountryAllowed } from '@/utils/phoneValidation';

interface EditableGuestProps {
  guest: Guest;
  userRole: 'owner' | 'collaborator';
  packageType: string;
  invitationCardUrl?: string;
  isVipConfirmed: boolean;
  onSendWhatsapp: (guest: Guest) => Promise<void>;
  onSendWhatsappAPI?: (guest: Guest) => Promise<void>;
  onRemoveGuest: (guestId: string) => Promise<void>;
  onUpdateGuest: (guestId: string, updates: Partial<Guest>) => Promise<void>;
  sendingWhatsapp?: string | null;
  getCountryFromPhone: (phone: string) => string;
  onCountryChange?: (country: string) => void;
}

export const EditableGuest: React.FC<EditableGuestProps> = ({
  guest,
  userRole,
  packageType,
  invitationCardUrl,
  isVipConfirmed,
  onSendWhatsapp,
  onSendWhatsappAPI,
  onRemoveGuest,
  onUpdateGuest,
  sendingWhatsapp,
  getCountryFromPhone,
  onCountryChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: guest.name,
    phone: guest.phone,
    numberOfAccompanyingGuests: guest.numberOfAccompanyingGuests
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<any>(null);

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (isVipConfirmed) return;
    setEditData({
      name: guest.name,
      phone: guest.phone,
      numberOfAccompanyingGuests: guest.numberOfAccompanyingGuests
    });
    setIsEditing(true);
    setPhoneError(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: guest.name,
      phone: guest.phone,
      numberOfAccompanyingGuests: guest.numberOfAccompanyingGuests
    });
    setPhoneError(false);
  };

  const handleSave = async () => {
    if (!editData.name.trim()) {
      return;
    }

    // Check if phone number has changed and validate it
    if (editData.phone !== guest.phone) {
      // Use the same validation as when adding guests
      if (!validatePhoneNumber(editData.phone)) {
        setPhoneError(true);
        return;
      }
    }

    try {
      setIsUpdating(true);
      await onUpdateGuest(guest._id!, {
        name: editData.name.trim(),
        phone: editData.phone,
        numberOfAccompanyingGuests: editData.numberOfAccompanyingGuests
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating guest:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              {/* Editable Name */}
              <div>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:border-[#C09B52] transition-colors"
                  placeholder="اسم الضيف"
                />
              </div>

              {/* Editable Phone */}
              <div>
                <PhoneInput
                  ref={phoneInputRef}
                  value={editData.phone}
                  onChange={(value) => {
                    setEditData(prev => ({ ...prev, phone: value || '' }));
                    setPhoneError(false);
                  }}
                  placeholder="رقم الهاتف"
                  defaultCountry="SA"
                  international
                  countryCallingCodeEditable={false}
                  countries={ALLOWED_COUNTRY_CODES}
                  onCountryChange={(country) => {
                    if (country && !isCountryAllowed(country)) {
                      onCountryChange?.(country);
                    }
                  }}
                  className="phone-input-custom"
                />
                {phoneError && (
                  <p className="text-red-400 text-xs mt-1">
                    رقم الهاتف غير صحيح
                  </p>
                )}
              </div>

              {/* Editable Guest Count */}
              <div>
                <select
                  value={editData.numberOfAccompanyingGuests}
                  onChange={(e) => setEditData(prev => ({ ...prev, numberOfAccompanyingGuests: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:border-[#C09B52] transition-colors"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num} className="bg-gray-800">
                      {num} {num === 1 ? 'شخص' : 'أشخاص'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={isUpdating || !editData.name.trim()}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  حفظ
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div>
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
              
              {/* Guest Attribution - Only show for owners */}
              {userRole === 'owner' && guest.addedBy && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    guest.addedBy.type === 'owner' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {guest.addedBy.type === 'owner' ? 'أضفته أنت' : 'أضافه متعاون'}
                    {guest.addedBy.type === 'collaborator' && (
                      <span className="ml-1 text-xs opacity-75">
                        ({(guest.addedBy.collaboratorName && guest.addedBy.collaboratorName.trim()) || guest.addedBy.collaboratorEmail || 'متعاون'})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Classic Package - No send button for users (admins handle sending) */}
          {packageType === 'classic' && !isEditing && guest.whatsappMessageSent && (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
              <Check className="w-3 h-3" />
              تم الإرسال
            </span>
          )}

          {/* Premium Package - Show send button only if guest list confirmed AND individual invite link is added */}
          {packageType === 'premium' && !isEditing && userRole === 'owner' && (
            <div className="flex items-center gap-2">
              {/* Show RSVP status if guest responded */}
              {guest.rsvpStatus && guest.rsvpStatus !== 'pending' && (
                <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  guest.rsvpStatus === 'accepted' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {guest.rsvpStatus === 'accepted' ? 'سيحضر' : 'اعتذر'}
                </span>
              )}
              
              {/* Show send button only if individual link is added */}
              {guest.individualInviteLink ? (
                <>
                  {/* WhatsApp API button */}
                  {onSendWhatsappAPI && (
                    <button
                      onClick={() => onSendWhatsappAPI(guest)}
                      disabled={sendingWhatsapp === guest._id}
                      className={`flex items-center gap-1 px-2 py-1 text-white text-xs rounded transition-colors ${
                        sendingWhatsapp === guest._id
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      title="إرسال دعوة تفاعلية عبر الواتساب"
                    >
                      {sendingWhatsapp === guest._id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      إرسال
                    </button>
                  )}
                  
                  {guest.whatsappMessageSent && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      <Check className="w-3 h-3" />
                      تم الإرسال
                    </span>
                  )}
                </>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                  في انتظار الرابط
                </span>
              )}
            </div>
          )}

          {/* VIP Package - Only admins send invitations */}
          {packageType === 'vip' && !isEditing && userRole === 'owner' && (
            <div className="flex items-center gap-2">
              {/* Show RSVP status if guest responded */}
              {guest.rsvpStatus && guest.rsvpStatus !== 'pending' && (
                <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  guest.rsvpStatus === 'accepted' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {guest.rsvpStatus === 'accepted' ? 'سيحضر' : 'اعتذر'}
                </span>
              )}
              
              {/* Show if invitation was sent by admin */}
              {guest.whatsappMessageSent ? (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  <Check className="w-3 h-3" />
                  تم الإرسال
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                  <Users2 className="w-4 h-4" />
                  في انتظار الإرسال
                </span>
              )}
            </div>
          )}
          
          {/* Edit button */}
          {!isVipConfirmed && !isEditing && (
            <button
              onClick={handleEdit}
              className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
              title="تعديل بيانات الضيف"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          
          {/* Delete button */}
          {!isVipConfirmed && !isEditing && (
            <button
              onClick={() => guest._id && onRemoveGuest(guest._id)}
              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              title="حذف الضيف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

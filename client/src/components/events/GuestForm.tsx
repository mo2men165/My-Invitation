import React from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Guest } from '@/types/event';
import { ALLOWED_COUNTRY_CODES } from '@/utils/phoneValidation';

interface GuestFormProps {
  newGuest: Guest;
  setNewGuest: React.Dispatch<React.SetStateAction<Guest>>;
  phoneError: boolean;
  addingGuest: boolean;
  isVipConfirmed: boolean;
  remainingInvites: number;
  onAddGuest: () => Promise<void>;
}

export const GuestForm: React.FC<GuestFormProps> = ({
  newGuest,
  setNewGuest,
  phoneError,
  addingGuest,
  isVipConfirmed,
  remainingInvites,
  onAddGuest
}) => {
  return (
    <div className={`rounded-xl p-4 mb-6 ${
      isVipConfirmed 
        ? 'bg-red-900/20 border border-red-700/30' 
        : 'bg-white/5'
    }`}>
      <h4 className="text-white font-medium mb-4">إضافة ضيف جديد</h4>
      
      {/* VIP Confirmation Warning */}
      {isVipConfirmed && (
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
          disabled={isVipConfirmed}
          className={`px-3 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
            isVipConfirmed
              ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-white/10 border-white/20 focus:border-[#C09B52]'
          }`}
        />
        
        <PhoneInput
          value={newGuest.phone}
          onChange={(value) => {
            if (isVipConfirmed) return;
            setNewGuest(prev => ({ ...prev, phone: value || '' }));
            // Clear error when user starts typing
            if (phoneError) {
              // This would need to be handled by parent component
            }
          }}
          placeholder="رقم الهاتف"
          defaultCountry="SA"
          international
          countryCallingCodeEditable={false}
          countries={ALLOWED_COUNTRY_CODES}
          disabled={isVipConfirmed}
          className="phone-input-custom"
        />
        {phoneError && (
          <p className="text-red-400 text-xs flex items-center gap-2">
            <span className="w-1 h-1 bg-red-400 rounded-full"></span>
            رقم الهاتف يجب أن يكون من إحدى الدول المسموحة
          </p>
        )}
        
        <select
          value={newGuest.numberOfAccompanyingGuests}
          onChange={(e) => setNewGuest(prev => ({ ...prev, numberOfAccompanyingGuests: parseInt(e.target.value) }))}
          disabled={isVipConfirmed}
          className={`px-3 py-2 border rounded-lg text-white focus:outline-none transition-colors ${
            isVipConfirmed
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
        onClick={onAddGuest}
        disabled={addingGuest || remainingInvites <= 0 || isVipConfirmed}
        className={`w-full md:w-auto px-6 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
          isVipConfirmed
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
  );
};

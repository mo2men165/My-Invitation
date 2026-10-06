'use client';

import { useState } from 'react';
import { X, Loader2, UserPlus } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { validatePhoneNumber, getDisallowedCountryError } from '@/utils/phoneValidation';

interface AddGuestModalProps {
  eventId: string;
  /** People still unassigned on the package, so we can stop an over-booking early. */
  remainingInvites: number;
  onClose: () => void;
  onAdded: () => void | Promise<void>;
}

/**
 * Lets an admin add a guest to a premium/VIP event on the customer's behalf.
 * numberOfAccompanyingGuests is the total number of people the invitation
 * covers, the guest included.
 */
export function AddGuestModal({ eventId, remainingInvites, onClose, onAdded }: AddGuestModalProps) {
  useBodyScrollLock(true);
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState<string | undefined>('');
  const [people, setPeople] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const maxPeople = Math.min(10, Math.max(1, remainingInvites));

  const handleSubmit = async () => {
    if (!name.trim() || !phone?.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم الضيف ورقم الهاتف",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhoneNumber(phone)) {
      toast({
        title: "رقم هاتف غير صحيح",
        description: getDisallowedCountryError(),
        variant: "destructive"
      });
      return;
    }

    if (people > remainingInvites) {
      toast({
        title: "تجاوز العدد المسموح",
        description: `المتبقي من الدعوات: ${remainingInvites}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      await adminAPI.addEventGuest(eventId, {
        name: name.trim(),
        phone,
        numberOfAccompanyingGuests: people
      });

      toast({
        title: "تم إضافة الضيف",
        description: `تم إضافة ${name.trim()} بنجاح`,
        variant: "default"
      });

      await onAdded();
      onClose();
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة الضيف",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#C09B52]" />
            إضافة ضيف
          </h3>
          <button onClick={onClose} disabled={submitting} className="text-gray-400 hover:text-white disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400">
          يُضاف الضيف نيابة عن العميل. المتبقي من الدعوات: {remainingInvites}
        </p>

        <div>
          <label className="text-sm text-gray-400 block mb-2">اسم الضيف</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="الاسم الكامل"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#C09B52]"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-2">رقم الهاتف</label>
          <div dir="ltr" className="phone-input-wrapper">
            <PhoneInput
              international
              defaultCountry="SA"
              value={phone}
              onChange={setPhone}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus-within:border-[#C09B52]"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-2">عدد الأشخاص (شامل الضيف)</label>
          <select
            value={people}
            onChange={e => setPeople(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#C09B52]"
          >
            {Array.from({ length: maxPeople }, (_, i) => i + 1).map(count => (
              <option key={count} value={count}>
                {count} {count === 1 ? 'شخص' : 'أشخاص'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            ستحتاج هذه الدعوة إلى {people} {people === 1 ? 'بطاقة دخول' : 'بطاقات دخول'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || remainingInvites < 1}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#C09B52] hover:bg-[#A0884A] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            إضافة الضيف
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

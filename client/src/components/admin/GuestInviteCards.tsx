'use client';

import { useState } from 'react';
import { Check, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';

export interface InviteCardImage {
  public_id?: string;
  secure_url?: string;
  url?: string;
}

interface GuestInviteCardsProps {
  eventId: string;
  guest: {
    _id: string;
    name: string;
    numberOfAccompanyingGuests: number;
    individualInviteImage?: InviteCardImage;
    individualInviteImages?: InviteCardImage[];
    confirmedAccompanyingGuests?: number;
  };
  onChanged: () => void | Promise<void>;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_BYTES = 10 * 1024 * 1024;

const cardUrl = (card?: InviteCardImage) => card?.secure_url || card?.url || '';

/**
 * A guest's entry cards, one per person the invitation covers:
 * numberOfAccompanyingGuests is that total, the guest included, so slot 0 is the
 * guest's own card and the rest belong to their accompanying guests. Guests
 * added before cards were per-person only carry the single individualInviteImage,
 * which is read as slot 0.
 */
export function GuestInviteCards({ eventId, guest, onChanged }: GuestInviteCardsProps) {
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();

  const invitationSize = Math.max(1, guest.numberOfAccompanyingGuests || 1);
  const storedCards = guest.individualInviteImages?.length
    ? guest.individualInviteImages
    : guest.individualInviteImage
      ? [guest.individualInviteImage]
      : [];
  const uploadedCount = storedCards.filter(card => !!cardUrl(card)).length;
  const isComplete = uploadedCount >= invitationSize;

  const slotLabel = (slot: number) =>
    slot === 0 ? `بطاقة الضيف — ${guest.name}` : `بطاقة مرافق ${slot}`;

  const resetEditing = () => {
    setEditingSlot(null);
    setFile(null);
    setPreview(null);
  };

  const handleFileChange = (input: HTMLInputElement) => {
    const selected = input.files?.[0] || null;

    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast({
        title: "خطأ",
        description: "نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG أو PNG فقط",
        variant: "destructive"
      });
      input.value = '';
      setFile(null);
      setPreview(null);
      return;
    }

    if (selected.size > MAX_BYTES) {
      toast({
        title: "خطأ",
        description: "حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت",
        variant: "destructive"
      });
      input.value = '';
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async (slot: number) => {
    if (!file) {
      toast({ title: "خطأ", description: "يرجى اختيار صورة", variant: "destructive" });
      return;
    }

    try {
      setBusySlot(slot);
      setUploadProgress(0);
      await adminAPI.updateGuestInviteImage(eventId, guest._id, file, slot, setUploadProgress);
      resetEditing();
      await onChanged();
      toast({ title: "تم التحديث", description: `تم تحديث ${slotLabel(slot)}`, variant: "default" });
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الصورة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setBusySlot(null);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (slot: number) => {
    try {
      setBusySlot(slot);
      await adminAPI.updateGuestInviteImage(eventId, guest._id, null, slot);
      await onChanged();
      toast({ title: "تم الحذف", description: `تم حذف ${slotLabel(slot)}`, variant: "default" });
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الصورة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setBusySlot(null);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-gray-400">
          بطاقات الدخول ({invitationSize} {invitationSize === 1 ? 'شخص' : 'أشخاص'})
        </span>
        <span
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
            isComplete ? 'bg-green-900/20 text-green-300' : 'bg-yellow-900/20 text-yellow-300'
          }`}
        >
          {isComplete ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {uploadedCount} من {invitationSize} بطاقة
        </span>
      </div>

      {guest.confirmedAccompanyingGuests !== undefined && (
        <p className="text-xs text-gray-500">
          أكّد الضيف حضور {guest.confirmedAccompanyingGuests} من {invitationSize}؛ ترسل {guest.confirmedAccompanyingGuests} بطاقة
        </p>
      )}

      <div className="space-y-2">
        {Array.from({ length: invitationSize }, (_, slot) => {
          const card = storedCards[slot];
          const url = cardUrl(card);
          const isEditing = editingSlot === slot;
          const isBusy = busySlot === slot;
          // Cards are stored densely, so only the next empty slot can be filled.
          const isLocked = !url && slot > uploadedCount;

          return (
            <div key={slot} className="border border-gray-700 rounded-lg p-2 bg-gray-900/40">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-white">{slotLabel(slot)}</span>

                {isEditing ? null : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingSlot(slot);
                        setFile(null);
                        setPreview(null);
                      }}
                      disabled={isBusy || isLocked}
                      title={isLocked ? 'أضف البطاقة السابقة أولاً' : undefined}
                      className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {url ? 'تعديل' : 'إضافة'}
                    </button>
                    {url && (
                      <button
                        onClick={() => handleDelete(slot)}
                        disabled={isBusy}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : 'حذف'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2 mt-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={e => handleFileChange(e.target)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#C09B52] file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#C09B52] file:text-white hover:file:bg-[#A0884A] cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    الصيغ المدعومة: JPEG, PNG فقط (الحد الأقصى: 10 ميجابايت)
                  </p>
                  {preview && (
                    <div className="relative border border-gray-600 rounded-lg overflow-hidden bg-gray-700">
                      <img src={preview} alt="Preview" className="w-full h-auto max-h-32 object-contain" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpload(slot)}
                      disabled={isBusy || !file}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isBusy ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {uploadProgress !== null && uploadProgress < 100 ? `${uploadProgress}%` : ''}
                        </span>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={resetEditing}
                      disabled={isBusy}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : url ? (
                <div className="mt-2">
                  <div className="relative border border-gray-600 rounded-lg overflow-hidden bg-gray-700">
                    <img src={url} alt={slotLabel(slot)} className="w-full h-auto max-h-32 object-contain" />
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
                  >
                    فتح الصورة
                  </a>
                </div>
              ) : (
                <span className="text-sm text-gray-500 mt-2 block">
                  {isLocked ? 'أضف البطاقة السابقة أولاً' : 'لم يتم تعيين صورة'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

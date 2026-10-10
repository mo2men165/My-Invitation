'use client';

import { useState } from 'react';
import { X, Loader2, Upload, ExternalLink, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  validateInvitationCard,
  isVideoFile,
  formatBytes,
  formatDuration,
  IMAGE_TYPES,
  VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS
} from '@/lib/uploadMedia';

export interface InvitationCard {
  secure_url?: string;
  url?: string;
  resource_type?: string;
  bytes?: number;
  whatsapp_bytes?: number;
  duration?: number;
}

interface InvitationCardModalProps {
  eventId: string;
  eventName: string;
  card?: InvitationCard;
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
}

/**
 * View and replace an event's invitation card. The card used to be set once at
 * approval with no way back to it, so this is reachable directly from the
 * events list rather than only from deep inside the event details.
 */
export function InvitationCardModal({
  eventId,
  eventName,
  card,
  onClose,
  onUpdated
}: InvitationCardModalProps) {
  useBodyScrollLock(true);
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const currentUrl = card?.secure_url || card?.url || '';
  const currentIsVideo = card?.resource_type === 'video';

  const handleFileChange = async (input: HTMLInputElement) => {
    const selected = input.files?.[0] || null;

    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }

    // Checked before the upload starts: a video that cannot fit WhatsApp's
    // ceiling should not cost the admin a long upload first.
    const validation = await validateInvitationCard(selected);
    if (!validation.valid) {
      toast({ title: 'لا يمكن استخدام هذا الملف', description: validation.error, variant: 'destructive' });
      input.value = '';
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);
      await adminAPI.updateEventImage(eventId, file, setProgress);

      toast({
        title: 'تم التحديث',
        description: isVideoFile(file) ? 'تم تحديث فيديو بطاقة الدعوة' : 'تم تحديث صورة بطاقة الدعوة',
        variant: 'default'
      });

      setFile(null);
      setPreview(null);
      await onUpdated();
    } catch (error: any) {
      toast({
        title: 'خطأ في تحديث البطاقة',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#C09B52]" />
              بطاقة الدعوة
            </h3>
            <p className="text-xs text-gray-400 mt-1">{eventName}</p>
          </div>
          <button onClick={onClose} disabled={uploading} className="text-gray-400 hover:text-white disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current card */}
        <div>
          <p className="text-xs text-gray-400 mb-2">البطاقة الحالية</p>
          {currentUrl ? (
            <div className="space-y-2">
              <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
                {currentIsVideo ? (
                  <video src={currentUrl} controls className="w-full h-auto max-h-64" />
                ) : (
                  <img src={currentUrl} alt="بطاقة الدعوة" className="w-full h-auto max-h-64 object-contain" />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-gray-400">
                <span>
                  {currentIsVideo ? 'فيديو' : 'صورة'}
                  {card?.bytes ? ` • ${formatBytes(card.bytes)}` : ''}
                  {currentIsVideo && card?.duration ? ` • ${formatDuration(card.duration)}` : ''}
                </span>
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  فتح
                </a>
              </div>
              {currentIsVideo && card?.whatsapp_bytes ? (
                <p className="text-xs text-gray-500">
                  النسخة المرسلة عبر الواتساب: {formatBytes(card.whatsapp_bytes)}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-300 text-sm bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4" />
              لم يتم رفع بطاقة دعوة لهذه المناسبة
            </div>
          )}
        </div>

        {/* Replacement */}
        <div className="border-t border-gray-700 pt-4 space-y-3">
          <label className="text-sm text-gray-400 block">
            {currentUrl ? 'استبدال البطاقة' : 'رفع بطاقة'}
          </label>
          <input
            type="file"
            accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(',')}
            onChange={e => handleFileChange(e.target)}
            disabled={uploading}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#C09B52] file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#C09B52] file:text-white hover:file:bg-[#A0884A] cursor-pointer disabled:opacity-50"
          />
          <p className="text-xs text-gray-500">
            الصور: JPEG, PNG, WebP (حتى {formatBytes(MAX_IMAGE_BYTES)})
            <br />
            الفيديو: MP4, MOV, WebM (حتى {formatBytes(MAX_VIDEO_BYTES)}، وبحد أقصى {formatDuration(MAX_VIDEO_SECONDS)} حتى يبقى داخل حد الواتساب)
          </p>

          {preview && file && (
            <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
              {isVideoFile(file) ? (
                <video src={preview} controls className="w-full h-auto max-h-48" />
              ) : (
                <img src={preview} alt="معاينة" className="w-full h-auto max-h-48 object-contain" />
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progress !== null && progress < 100 ? `جاري الرفع... ${progress}%` : 'جاري المعالجة...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  حفظ البطاقة
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              إغلاق
            </button>
          </div>

          {uploading && progress === 100 && (
            <p className="text-xs text-gray-400">
              يتم الآن تجهيز نسخة متوافقة مع الواتساب، قد يستغرق ذلك بضع ثوانٍ للفيديو
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

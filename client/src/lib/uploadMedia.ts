// client/src/lib/uploadMedia.ts
// Uploads a file straight to Cloudinary using a signature issued by our API.
//
// Files do not go through the API: a serverless request body is capped at 4.5MB
// on Vercel, which an invitation video passes immediately. The browser uploads
// to Cloudinary and then sends the API only the resulting metadata.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface UploadedMedia {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  resource_type: 'image' | 'video';
  duration?: number;
  // Video only: the H.264/AAC rendition Cloudinary transcodes at upload, which
  // is what WhatsApp is given. The original stays for the website and download.
  whatsapp_url?: string;
  whatsapp_bytes?: number;
}

export const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];

// Cloudinary's own ceilings on most plans; the API never sees these bytes.
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
// Transcoding shrinks this a lot, so the original can be larger than the 16MB
// WhatsApp itself accepts; the ceiling is about keeping transcode time sane.
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const isVideoFile = (file: File) => file.type.startsWith('video/');

// WhatsApp refuses video over 16MB. Invitation videos are transcoded to roughly
// 1Mbps, so duration is what decides whether the result fits - about two and a
// half minutes. Checking it here means an admin is told before spending minutes
// uploading something that can never be sent.
export const WHATSAPP_VIDEO_MAX_BYTES = 16 * 1024 * 1024;
const TRANSCODE_BITS_PER_SECOND = 1_000_000;
export const MAX_VIDEO_SECONDS = Math.floor(
  (WHATSAPP_VIDEO_MAX_BYTES * 8) / TRANSCODE_BITS_PER_SECOND
);

export const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')} دقيقة` : `${secs} ثانية`;
};

/** Reads a video's duration in the browser, without uploading it. */
export function readVideoDuration(file: File): Promise<number> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const probe = document.createElement('video');

    const done = (duration: number) => {
      URL.revokeObjectURL(url);
      resolve(duration);
    };

    probe.preload = 'metadata';
    // An unreadable duration should not block the upload; the server still
    // checks the transcoded size before the card is saved.
    probe.onloadedmetadata = () => done(Number.isFinite(probe.duration) ? probe.duration : 0);
    probe.onerror = () => done(0);
    probe.src = url;
  });
}

/**
 * Full pre-upload check for an invitation card: type, size, and for video the
 * duration that decides whether the transcoded result fits WhatsApp's ceiling.
 */
export async function validateInvitationCard(file: File): Promise<{ valid: boolean; error?: string }> {
  const basic = validateMediaFile(file);
  if (!basic.valid) {
    return basic;
  }

  if (!isVideoFile(file)) {
    return { valid: true };
  }

  const duration = await readVideoDuration(file);
  if (duration > MAX_VIDEO_SECONDS) {
    return {
      valid: false,
      error: `الفيديو طويل جداً (${formatDuration(duration)}). الحد الأقصى ${formatDuration(MAX_VIDEO_SECONDS)} حتى يبقى داخل حد الواتساب (16 ميجابايت)`
    };
  }

  return { valid: true };
}

export const formatBytes = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} ميجابايت`;
  }
  return `${Math.round(bytes / 1024)} كيلوبايت`;
};

/** Checks a file against what we accept, before any network call. */
export function validateMediaFile(
  file: File,
  { allowVideo = true }: { allowVideo?: boolean } = {}
): { valid: boolean; error?: string } {
  const video = isVideoFile(file);

  if (video && !allowVideo) {
    return { valid: false, error: 'هذا الحقل يقبل الصور فقط' };
  }

  const allowed = video ? VIDEO_TYPES : IMAGE_TYPES;
  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      error: video
        ? 'صيغة الفيديو غير مدعومة. الصيغ المدعومة: MP4, MOV, WebM'
        : 'صيغة الصورة غير مدعومة. الصيغ المدعومة: JPEG, PNG, WebP'
    };
  }

  const maxBytes = video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `حجم الملف كبير جداً (${formatBytes(file.size)}). الحد الأقصى ${formatBytes(maxBytes)}`
    };
  }

  return { valid: true };
}

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json'
});

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: 'image' | 'video';
  uploadUrl: string;
  eager?: string;
  eagerAsync?: boolean;
}

async function getUploadSignature(folder: string, resourceType: 'image' | 'video'): Promise<UploadSignature> {
  const response = await fetch(`${API_URL}/api/admin/uploads/signature`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ folder, resourceType })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || 'فشل في تجهيز الرفع');
  }

  return result.data as UploadSignature;
}

/**
 * Upload a file to Cloudinary and return its metadata. onProgress reports
 * 0..100 as the bytes go up, which matters for videos.
 */
export async function uploadMedia(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void
): Promise<UploadedMedia> {
  const resourceType: 'image' | 'video' = isVideoFile(file) ? 'video' : 'image';
  const signature = await getUploadSignature(folder, resourceType);

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);

  // Videos are transcoded to a WhatsApp-safe rendition during the upload. These
  // have to match what the server signed, exactly.
  if (signature.eager) {
    form.append('eager', signature.eager);
    form.append('eager_async', String(signature.eagerAsync ?? false));
  }

  // XMLHttpRequest rather than fetch: it reports upload progress, which a
  // 100MB video needs.
  return new Promise<UploadedMedia>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', signature.uploadUrl);

    request.upload.onprogress = event => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      let payload: any;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        reject(new Error('رد غير متوقع من خدمة الرفع'));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(payload?.error?.message || 'فشل رفع الملف'));
        return;
      }

      const rendition = payload.eager?.[0];

      resolve({
        public_id: payload.public_id,
        secure_url: payload.secure_url,
        url: payload.url,
        format: payload.format || '',
        width: payload.width || 0,
        height: payload.height || 0,
        bytes: payload.bytes || 0,
        created_at: payload.created_at || new Date().toISOString(),
        resource_type: payload.resource_type === 'video' ? 'video' : 'image',
        ...(payload.duration ? { duration: payload.duration } : {}),
        ...(rendition?.secure_url
          ? { whatsapp_url: rendition.secure_url, whatsapp_bytes: rendition.bytes || 0 }
          : {})
      });
    };

    request.onerror = () => reject(new Error('تعذر الاتصال بخدمة الرفع'));
    request.send(form);
  });
}

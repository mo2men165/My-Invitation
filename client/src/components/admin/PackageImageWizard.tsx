'use client';

import { useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';

interface PackageImageWizardProps {
  onClose: () => void;
  onCreated: () => void;
}

type TagMode = 'tier' | 'category';

const tierOptions = [
  { value: 'classic', label: 'كلاسيك' },
  { value: 'premium', label: 'بريميوم' },
  { value: 'vip', label: 'VIP' },
];

const categoryOptions = [
  { value: 'عيد ميلاد', label: 'عيد ميلاد' },
  { value: 'حفل تخرج', label: 'حفل تخرج' },
  { value: 'حفل زفاف', label: 'حفل زفاف' },
];

export function PackageImageWizard({ onClose, onCreated }: PackageImageWizardProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [tagMode, setTagMode] = useState<TagMode>('tier');
  const [tagValue, setTagValue] = useState('classic');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selected.type)) {
      toast({ title: 'خطأ', description: 'نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG أو PNG فقط', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast({ title: 'خطأ', description: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: 'خطأ', description: 'يرجى اختيار صورة', variant: 'destructive' });
      return;
    }
    if (!name.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال اسم التصميم', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', name.trim());
    if (tagMode === 'tier') {
      formData.append('packageTier', tagValue);
    } else {
      formData.append('category', tagValue);
    }

    try {
      setSubmitting(true);
      await adminAPI.createPackageImage(formData);
      toast({ title: 'تم', description: 'تم إضافة التصميم بنجاح', variant: 'default' });
      onCreated();
      onClose();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message || 'فشل إضافة التصميم', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const options = tagMode === 'tier' ? tierOptions : categoryOptions;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">إضافة تصميم جديد</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-2">الصورة</label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#C09B52] file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#C09B52] file:text-white hover:file:bg-[#A0884A] cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-1">الصيغ المدعومة: JPEG, PNG فقط (الحد الأقصى: 10 ميجابايت)</p>
          {preview && (
            <div className="mt-2 border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
              <img src={preview} alt="معاينة" className="w-full h-auto max-h-48 object-contain" />
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-2">اسم التصميم</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#C09B52]"
            placeholder="اسم التصميم"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-2">نوع التصنيف</label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => { setTagMode('tier'); setTagValue('classic'); }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${tagMode === 'tier' ? 'bg-[#C09B52] text-white border-[#C09B52]' : 'bg-gray-800 text-gray-300 border-gray-600'}`}
            >
              حسب الباقة
            </button>
            <button
              onClick={() => { setTagMode('category'); setTagValue('عيد ميلاد'); }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${tagMode === 'category' ? 'bg-[#C09B52] text-white border-[#C09B52]' : 'bg-gray-800 text-gray-300 border-gray-600'}`}
            >
              حسب نوع المناسبة
            </button>
          </div>
          <select
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#C09B52]"
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#C09B52] text-white rounded-lg hover:bg-[#A0884A] transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            إضافة
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

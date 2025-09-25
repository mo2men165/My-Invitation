// client/src/components/cart/CartModal/components/CustomDesignSection.tsx - Custom design notes section
import React from 'react';
import { CartFormData, FormErrors } from '../types';

interface CustomDesignSectionProps {
  formData: CartFormData;
  errors: FormErrors;
  onInputChange: (field: string, value: any) => void;
}

export default function CustomDesignSection({ 
  formData, 
  errors, 
  onInputChange 
}: CustomDesignSectionProps) {
  // Only show if custom design is selected
  if (!formData.isCustomDesign) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-[#C09B52]/10 to-amber-600/5 rounded-2xl border border-[#C09B52]/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🎨</span>
        <h3 className="text-lg font-semibold text-[#C09B52]">
          تصميم مخصص
        </h3>
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl flex-shrink-0">ℹ️</span>
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">سيتم التواصل معك خلال 24 ساعة</p>
            <p className="text-blue-300">
              سيقوم فريقنا بالتواصل معك لمناقشة التفاصيل وتصميم دعوة فريدة تناسب مناسبتك
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          ملاحظات التصميم المخصص
          <span className="text-gray-500 text-xs mr-2">(اختياري)</span>
        </label>
        <textarea
          value={formData.customDesignNotes || ''}
          onChange={(e) => onInputChange('customDesignNotes', e.target.value)}
          placeholder="اكتب هنا أي تفاصيل أو أفكار خاصة لتصميم دعوتك... مثل: الألوان المفضلة، الطراز المطلوب، عناصر معينة تريد إضافتها، إلخ"
          className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
            errors.customDesignNotes 
              ? 'border-red-500/50 focus:border-red-500' 
              : 'border-white/10 focus:border-[#C09B52]/50'
          } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/20 transition-all duration-200 resize-none`}
          rows={4}
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-2">
          {errors.customDesignNotes && (
            <p className="text-red-400 text-xs">{errors.customDesignNotes}</p>
          )}
          <p className="text-gray-500 text-xs mr-auto">
            {(formData.customDesignNotes || '').length}/500
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-300">
          <span className="text-green-400">✓</span>
          <span>تصميم فريد خاص بك</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <span className="text-green-400">✓</span>
          <span>استشارة مجانية</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <span className="text-green-400">✓</span>
          <span>مراجعات غير محدودة</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <span className="text-green-400">✓</span>
          <span>تسليم خلال 3-5 أيام</span>
        </div>
      </div>
    </div>
  );
}

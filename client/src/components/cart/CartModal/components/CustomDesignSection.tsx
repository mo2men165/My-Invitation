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
    <div className="bg-gradient-to-br from-[#C09B52]/10 to-amber-600/5 rounded-xl sm:rounded-2xl border border-[#C09B52]/20 p-3 sm:p-4 md:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <span className="text-lg sm:text-xl md:text-2xl">🎨</span>
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-[#C09B52]">
          تصميم مخصص
        </h3>
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <span className="text-blue-400 text-base sm:text-lg md:text-xl flex-shrink-0">ℹ️</span>
          <div className="text-xs sm:text-sm text-blue-200 min-w-0">
            <p className="font-medium mb-1">سيتم التواصل معك خلال 24 ساعة</p>
            <p className="text-blue-300">
              سيقوم فريقنا بالتواصل معك لمناقشة التفاصيل وتصميم دعوة فريدة تناسب مناسبتك
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
          ملاحظات التصميم المخصص
          <span className="text-gray-500 text-[10px] sm:text-xs mr-2">(اختياري)</span>
        </label>
        <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">
          سيتم تصميم الدعوة حسب طلبك. يرجى إضافة أي ملاحظات خاصة في الحقل أدناه.
        </p>
        <textarea
          value={formData.customDesignNotes || ''}
          onChange={(e) => onInputChange('customDesignNotes', e.target.value)}
          placeholder="اكتب هنا أي تفاصيل أو أفكار خاصة لتصميم دعوتك... مثل: الألوان المفضلة، الطراز المطلوب، عناصر معينة تريد إضافتها، إلخ"
          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-white/5 border text-sm sm:text-base ${
            errors.customDesignNotes 
              ? 'border-red-500/50 focus:border-red-500' 
              : 'border-white/10 focus:border-[#C09B52]/50'
          } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/20 transition-all duration-200 resize-none`}
          rows={3}
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-1.5 sm:mt-2">
          {errors.customDesignNotes && (
            <p className="text-red-400 text-[10px] sm:text-xs">{errors.customDesignNotes}</p>
          )}
          <p className="text-gray-500 text-[10px] sm:text-xs mr-auto">
            {(formData.customDesignNotes || '').length}/500
          </p>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
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
          <span>تسليم خلال 3-5 أيام</span>
        </div>
      </div>
    </div>
  );
}

import React, { memo } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface CartActionsProps {
  onAddToCart: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
  hasErrors?: boolean;
  errorCount?: number;
  termsAccepted?: boolean;
  onTermsChange?: (accepted: boolean) => void;
  termsError?: string;
}

const CartActions = memo<CartActionsProps>(({
  onAddToCart,
  onCancel,
  isLoading = false,
  isEditMode = false,
  hasErrors = false,
  errorCount = 0,
  termsAccepted = false,
  onTermsChange,
  termsError
}) => {
  return (
    <div className="space-y-4">
      {/* Terms and Conditions Checkbox */}
      {!isEditMode && (
        <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-xl border border-white/10 p-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => onTermsChange?.(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-400 bg-gray-800 text-[#C09B52] focus:ring-2 focus:ring-[#C09B52] focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer transition-all"
            />
            <div className="flex-1">
              <span className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors">
                أوافق على{' '}
                <Link 
                  href="/terms" 
                  target="_blank"
                  className="text-[#C09B52] hover:text-[#B8935A] underline font-medium transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  الشروط والأحكام
                </Link>
                {' '}وقبول جميع البنود المذكورة
              </span>
              {termsError && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                  {termsError}
                </p>
              )}
            </div>
          </label>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="button"
        onClick={onAddToCart}
        disabled={isLoading || hasErrors || (!isEditMode && !termsAccepted)}
        className="w-full py-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
        <span className="relative z-10">
          {isLoading
            ? (isEditMode ? 'جاري التحديث...' : 'جاري الإضافة...')
            : (isEditMode ? 'حفظ التعديلات' : 'إضافة للسلة')
          }
        </span>
      </Button>

      {/* Cancel Button */}
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
        className="w-full py-3 border-2 border-gray-500/30 text-gray-300 hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 bg-gray-500/10"
      >
        إلغاء
      </Button>

      {/* Info Text */}
      {!isEditMode && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            سيتم إنشاء المناسبة بعد إتمام عملية الدفع
          </p>
        </div>
      )}

      {/* Error Summary */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-400 mb-1">
          الحقول المطلوبة: <span className="text-red-400">*</span>
        </div>
        {hasErrors && errorCount > 0 && (
          <div className="flex items-center justify-center gap-1 text-xs text-red-400">
            <div className="w-1 h-1 bg-red-400 rounded-full"></div>
            {errorCount} خطأ يحتاج إلى تصحيح
          </div>
        )}
      </div>
    </div>
  );
});

CartActions.displayName = 'CartActions';
export default CartActions;

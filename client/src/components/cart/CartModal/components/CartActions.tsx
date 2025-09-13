import React, { memo } from 'react';
import { Button } from '@/components/ui/Button';

interface CartActionsProps {
  onAddToCart: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
  hasErrors?: boolean;
  errorCount?: number;
}

const CartActions = memo<CartActionsProps>(({
  onAddToCart,
  onCancel,
  isLoading = false,
  isEditMode = false,
  hasErrors = false,
  errorCount = 0
}) => {
  return (
    <div className="space-y-4">
      {/* Submit Button */}
      <Button
        type="button"
        onClick={onAddToCart}
        disabled={isLoading || hasErrors}
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
        className="w-full py-3 border-2 border-gray-500/30 text-gray-300 hover:bg-gray-500/10 transition-all duration-300 disabled:opacity-50"
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

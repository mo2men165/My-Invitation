'use client';
import React, { memo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PackageData, CartForm } from '@/types';
import { packageData, additionalServices } from '@/constants';
import { formatCurrency } from '@/utils/calculations';

interface PricingSummaryProps {
  selectedPackage: keyof PackageData;
  cartForm: CartForm;
  totalPrice: number;
  onAddToCart: () => void;
  isLoading: boolean;
  hasErrors: boolean;
}

const PricingSummary = memo<PricingSummaryProps>(({
  selectedPackage,
  cartForm,
  totalPrice,
  onAddToCart,
  isLoading,
  hasErrors
}) => {
  const currentPackage = packageData[selectedPackage];
  const gateSupervisorService = additionalServices.find(s => s.id === 'gate-supervisors');

  return (
    <div className="bg-gradient-to-br from-[#C09B52]/10 via-[#C09B52]/5 to-transparent rounded-2xl border border-[#C09B52]/20 p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-[#C09B52]" />
        ملخص الطلب
      </h3>
      
      {/* Price Breakdown */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
          <span className="text-gray-300">باقة {currentPackage.name} ({cartForm.inviteCount} دعوة)</span>
          <span className="text-white font-semibold">
            {formatCurrency(currentPackage.pricing.find(p => p.invites === cartForm.inviteCount)?.price || 0)}
          </span>
        </div>
        
        {cartForm.additionalCards > 0 && (
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-gray-300">كروت إضافية ({cartForm.additionalCards})</span>
            <span className="text-white font-semibold">
              {formatCurrency(cartForm.additionalCards * 30)}
            </span>
          </div>
        )}
        
        {cartForm.gateSupervisors && (
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-gray-300">مشرفين البوابة</span>
            <span className="text-white font-semibold">
              {formatCurrency(gateSupervisorService?.options?.find(opt => opt.range === cartForm.gateSupervisors)?.price || 0)}
            </span>
          </div>
        )}
        
        {cartForm.fastDelivery && (
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-gray-300">تسريع التنفيذ</span>
            <span className="text-white font-semibold">3,000 ر.س</span>
          </div>
        )}
      </div>

      {/* Total Price */}
      <div className="border-t border-[#C09B52]/30 pt-4 mb-6">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#C09B52]/20 to-[#C09B52]/10 rounded-xl">
          <span className="text-xl font-bold text-white">الإجمالي</span>
          <span className="text-3xl font-bold text-[#C09B52]">
            {formatCurrency(totalPrice)}
          </span>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        type="button"
        onClick={onAddToCart}
        disabled={isLoading}
        className={`w-full py-4 bg-gradient-to-r ${currentPackage.color} text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
        <ShoppingCart className="w-6 h-6 relative z-10" />
        <span className="relative z-10">{isLoading ? 'جاري الإضافة...' : 'إضافة للسلة'}</span>
      </Button>

      {/* Form Progress */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-400 mb-1">
          الحقول المطلوبة: <span className="text-red-400">*</span>
        </div>
        {hasErrors && (
          <div className="flex items-center justify-center gap-1 text-xs text-red-400">
            <div className="w-1 h-1 bg-red-400 rounded-full"></div>
            خطأ يحتاج إلى تصحيح
          </div>
        )}
      </div>
    </div>
  );
});

PricingSummary.displayName = 'PricingSummary';
export default PricingSummary;

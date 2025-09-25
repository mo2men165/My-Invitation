import React, { memo, useMemo } from 'react';
import { CartFormData } from '../types';
import { formatCurrency } from '@/utils/calculations';
import { CART_MODAL_CONSTANTS } from '@/constants/cartModalConstants';

interface CartSummaryProps {
  formData: CartFormData;
  currentPackage: any;
  packageType: string;
  isUpdating?: boolean;
}

const CartSummary = memo<CartSummaryProps>(({
  formData,
  currentPackage,
  packageType,
  isUpdating = false
}) => {
  // Memoized pricing calculations
  const pricing = useMemo(() => {
    const getExtraCardPrice = (pkgType: string) => {
      return CART_MODAL_CONSTANTS.EXTRA_CARD_PRICES[pkgType as keyof typeof CART_MODAL_CONSTANTS.EXTRA_CARD_PRICES] || CART_MODAL_CONSTANTS.EXTRA_CARD_PRICES.classic;
    };

    const basePrice = currentPackage?.pricing?.find((p: any) => p.invites === formData.inviteCount)?.price || 0;
    const extraCardsPrice = (formData.additionalCards || 0) * getExtraCardPrice(packageType);
    const extraHoursPrice = (formData.extraHours || 0) * CART_MODAL_CONSTANTS.EXTRA_HOUR_COST;
    const gateSupervisorsPrice = (typeof formData.gateSupervisors === 'number' ? formData.gateSupervisors : 0) * CART_MODAL_CONSTANTS.GATE_SUPERVISOR_COST;
    // Get expedited delivery price based on package type
    const getExpeditedDeliveryPrice = (pkgType: string, isExpedited: boolean) => {
      if (!isExpedited) return 0;
      return CART_MODAL_CONSTANTS.EXPEDITED_DELIVERY_COST[pkgType as keyof typeof CART_MODAL_CONSTANTS.EXPEDITED_DELIVERY_COST] || CART_MODAL_CONSTANTS.EXPEDITED_DELIVERY_COST.classic;
    };
    
    const expeditedDeliveryPrice = getExpeditedDeliveryPrice(packageType, formData.expeditedDelivery);
    
    const subtotal = basePrice + extraCardsPrice + extraHoursPrice + gateSupervisorsPrice + expeditedDeliveryPrice;
    const total = subtotal;

    return {
      basePrice,
      extraCardsPrice,
      extraHoursPrice,
      gateSupervisorsPrice,
      expeditedDeliveryPrice,
      subtotal,
      total
    };
  }, [formData, currentPackage, packageType]);

  return (
    <div className="bg-gradient-to-br from-[#C09B52]/10 via-[#C09B52]/5 to-transparent rounded-2xl border border-[#C09B52]/20 p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span>ملخص الطلب</span>
        {isUpdating && (
          <div className="w-4 h-4 border-2 border-[#C09B52] border-t-transparent rounded-full animate-spin"></div>
        )}
      </h3>
      
      <div className="space-y-4 mb-6">
        {/* Base Package */}
        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
          <span className="text-gray-300">باقة {currentPackage?.name} ({formData.inviteCount} دعوة)</span>
          <span className="text-white font-semibold">
            {formatCurrency(pricing.basePrice)}
          </span>
        </div>
        
        {/* Additional Cards */}
        {formData.additionalCards > 0 && (
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-gray-300">كروت إضافية ({formData.additionalCards})</span>
            <span className="text-white font-semibold">
              {formatCurrency(pricing.extraCardsPrice)}
            </span>
          </div>
        )}

        {/* Extra Hours */}
        {formData.extraHours > 0 && (
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-gray-300">ساعات إضافية ({formData.extraHours})</span>
            <span className="text-white font-semibold">
              {formatCurrency(pricing.extraHoursPrice)}
            </span>
          </div>
        )}
        
        {/* Gate Supervisors */}
        {formData.gateSupervisors > 0 && (
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-gray-300">مشرفين البوابة ({formData.gateSupervisors})</span>
            <span className="text-white font-semibold">
              {formatCurrency(pricing.gateSupervisorsPrice)}
            </span>
          </div>
        )}

        {/* Expedited Delivery */}
        {formData.expeditedDelivery && (
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
            <span className="text-gray-300">نسليم سريع</span>
            <span className="text-white font-semibold">
              {formatCurrency(pricing.expeditedDeliveryPrice)}
            </span>
          </div>
        )}

      </div>

      {/* Total */}
      <div className="border-t border-[#C09B52]/30 pt-4 mb-6">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#C09B52]/20 to-[#C09B52]/10 rounded-xl">
          <span className="text-xl font-bold text-white">الإجمالي</span>
          <span className="text-3xl font-bold text-[#C09B52]">
            {formatCurrency(pricing.total)}
          </span>
        </div>
      </div>
    </div>
  );
});

CartSummary.displayName = 'CartSummary';
export default CartSummary;

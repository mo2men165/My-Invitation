import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { Plus, Minus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CartFormData } from '../types';
import { LocationData } from '@/types/location';
import { CART_MODAL_CONSTANTS } from '@/constants/cartModalConstants';
import { SAUDI_CITIES } from '@/types/location';

interface AdditionalServicesProps {
  formData: CartFormData;
  onInputChange: (field: string, value: any) => void;
  packageType: string;
  locationData: LocationData;
}

const AdditionalServices = memo<AdditionalServicesProps>(({
  formData,
  onInputChange,
  packageType,
  locationData
}) => {
  // Check if location is selected and if it's in the main 6 Saudi cities
  const isLocationSelected = useMemo(() => {
    return locationData.city && locationData.city.trim() !== '';
  }, [locationData.city]);

  const isInMainSaudiCities = useMemo(() => {
    if (!isLocationSelected) return false;
    return SAUDI_CITIES.includes(locationData.city as typeof SAUDI_CITIES[number]);
  }, [locationData.city, isLocationSelected]);

  const canAddGateSupervisors = useMemo(() => {
    return isLocationSelected && isInMainSaudiCities;
  }, [isLocationSelected, isInMainSaudiCities]);

  // Reset gate supervisors to 0 if location is not in main cities
  useEffect(() => {
    if (isLocationSelected && !isInMainSaudiCities && formData.gateSupervisors > 0) {
      onInputChange('gateSupervisors', 0);
    }
  }, [isLocationSelected, isInMainSaudiCities, formData.gateSupervisors, onInputChange]);

  const getExtraCardPrice = useCallback((pkgType: string) => {
    return CART_MODAL_CONSTANTS.EXTRA_CARD_PRICES[pkgType as keyof typeof CART_MODAL_CONSTANTS.EXTRA_CARD_PRICES] || CART_MODAL_CONSTANTS.EXTRA_CARD_PRICES.classic;
  }, []);

  const extraCardPrice = getExtraCardPrice(packageType);

  const handleAdditionalCardsChange = useCallback((delta: number) => {
    const newValue = Math.max(0, formData.additionalCards + delta);
    onInputChange('additionalCards', newValue);
  }, [formData.additionalCards, onInputChange]);

  const handleGateSupervisorsChange = useCallback((delta: number) => {
    const currentValue = typeof formData.gateSupervisors === 'number' ? formData.gateSupervisors : 0;
    const newValue = Math.max(0, currentValue + delta);
    onInputChange('gateSupervisors', newValue);
  }, [formData.gateSupervisors, onInputChange]);

  const handleExpeditedDeliveryToggle = useCallback(() => {
    onInputChange('fastDelivery', !formData.fastDelivery);
  }, [formData.fastDelivery, onInputChange]);

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">خدمات إضافية</h3>
      
      {/* Extra Cards */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">كروت إضافية</span>
          <span className="text-[#C09B52]">{extraCardPrice} ر.س / كرت</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleAdditionalCardsChange(-1)}
            className="h-8 w-8"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-white min-w-[40px] text-center">{formData.additionalCards}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleAdditionalCardsChange(1)}
            className="h-8 w-8"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Gate Supervisors */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">مشرف البوابة</span>
          <span className="text-[#C09B52]">{CART_MODAL_CONSTANTS.GATE_SUPERVISOR_COST} ر.س / مشرف</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleGateSupervisorsChange(-1)}
            disabled={!canAddGateSupervisors}
            className="h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className={`min-w-[40px] text-center ${canAddGateSupervisors ? 'text-white' : 'text-gray-500'}`}>
            {typeof formData.gateSupervisors === 'number' ? formData.gateSupervisors : 0}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleGateSupervisorsChange(1)}
            disabled={!canAddGateSupervisors}
            className="h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {!isLocationSelected ? (
          <p className="text-gray-400 text-xs mt-2">يرجى تحديد موقع المناسبة أولاً</p>
        ) : !isInMainSaudiCities ? (
          <p className="text-gray-400 text-xs mt-2">متوفر فقط في المدن الرئيسية: {SAUDI_CITIES.join('، ')}</p>
        ) : (
          <p className="text-gray-400 text-xs mt-2">متوفر في المدن الرئيسية</p>
        )}
        {packageType === 'vip' && (
          <div className="mt-2 p-2 bg-[#C09B52]/10 rounded-lg border border-[#C09B52]/20">
            <p className="text-[#C09B52] text-xs">
              ℹ️ باقة VIP تتضمن مشرف بوابة واحد بالفعل
            </p>
          </div>
        )}
      </div>

      {/* Expedited Delivery */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#C09B52]" />
            <span className="text-white font-medium">نسليم سريع</span>
          </div>
          <span className="text-[#C09B52]">
            {CART_MODAL_CONSTANTS.EXPEDITED_DELIVERY_COST[packageType as keyof typeof CART_MODAL_CONSTANTS.EXPEDITED_DELIVERY_COST]?.toLocaleString() || CART_MODAL_CONSTANTS.EXPEDITED_DELIVERY_COST.classic.toLocaleString()} ر.س
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-gray-300 text-sm">
            تسليم خلال 48 ساعة عمل (يومين عمل) بدلاً من 4-7 أيام عمل
          </div>
          <button
            type="button"
            onClick={handleExpeditedDeliveryToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C09B52] focus:ring-offset-2 focus:ring-offset-gray-900 ${
              formData.fastDelivery ? 'bg-[#C09B52]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.fastDelivery ? '-translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {formData.fastDelivery && (
          <div className="mt-2 p-2 bg-[#C09B52]/10 rounded-lg">
            <p className="text-[#C09B52] text-xs">
              ✓ سيتم تسليم طلبك خلال 48 ساعة عمل (يومين عمل) من تأكيد الدفع
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

AdditionalServices.displayName = 'AdditionalServices';
export default AdditionalServices;

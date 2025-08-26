// client/src/components/packages/modals/AdditionalServicesSection.tsx
'use client';
import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CartForm } from '@/types';
import { additionalServices } from '@/constants';
import { formatCurrency } from '@/utils/calculations';

interface AdditionalServicesSectionProps {
  cartForm: CartForm;
  onInputChange: (field: string, value: any) => void;
}

const AdditionalServicesSection: React.FC<AdditionalServicesSectionProps> = ({
  cartForm,
  onInputChange
}) => {
  const gateSupervisorService = additionalServices.find(s => s.id === 'gate-supervisors');

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">خدمات إضافية</h3>
      
      {/* Extra Cards */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">كروت إضافية</span>
          <span className="text-[#C09B52]">30 ر.س / كرت</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onInputChange('additionalCards', Math.max(0, cartForm.additionalCards - 1))}
            className="h-8 w-8"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-white min-w-[40px] text-center">{cartForm.additionalCards}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onInputChange('additionalCards', cartForm.additionalCards + 1)}
            className="h-8 w-8"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Gate Supervisors */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="mb-2">
          <span className="text-white font-medium">مشرفين البوابة</span>
        </div>
        <select
          value={cartForm.gateSupervisors}
          onChange={(e) => onInputChange('gateSupervisors', e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#C09B52] transition-colors"
        >
          <option value="" className="bg-gray-800">بدون مشرفين</option>
          {gateSupervisorService?.options?.map((option, index) => (
            <option key={index} value={option.range} className="bg-gray-800">
              {option.range} - {option.supervisors} مشرفين - {formatCurrency(option.price)}
            </option>
          ))}
        </select>
      </div>

      {/* Fast Delivery */}
      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-medium">تسريع التنفيذ</span>
            <p className="text-gray-400 text-sm">يومين عمل بدلاً من 4-7 أيام</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#C09B52]">3000 ر.س</span>
            <button
              type="button"
              onClick={() => onInputChange('fastDelivery', !cartForm.fastDelivery)}
              className={`w-12 h-6 rounded-full transition-all duration-300 ${
                cartForm.fastDelivery ? 'bg-[#C09B52]' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                cartForm.fastDelivery ? '-translate-x-8' : 'translate-x-1'
              }`}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalServicesSection;
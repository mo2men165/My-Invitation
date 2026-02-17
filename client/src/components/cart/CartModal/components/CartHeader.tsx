import React, { memo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InvitationDesign, PackageData } from '@/types';
import { packageData } from '@/constants';

interface CartHeaderProps {
  selectedPackage: keyof PackageData;
  selectedDesign: InvitationDesign;
  onClose: () => void;
  isEditMode?: boolean;
}

const CartHeader = memo<CartHeaderProps>(({ 
  selectedPackage, 
  selectedDesign, 
  onClose,
  isEditMode = false 
}) => {
  const currentPackage = packageData[selectedPackage];

  return (
    <div className="relative p-3 sm:p-4 md:p-6 border-b border-white/10 bg-gradient-to-r from-[#C09B52]/10 to-transparent">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-[#C09B52]/20 rounded-full blur-lg"></div>
            <currentPackage.icon className="relative w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#C09B52]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate">
              {isEditMode ? 'تعديل' : 'باقة'} {currentPackage.name}
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">
              {selectedDesign.name}
              {isEditMode && <span className="text-[#C09B52] mr-2">• وضع التعديل</span>}
            </p>
          </div>
        </div>
        
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={onClose}
          className="rounded-full bg-red-500/20 hover:bg-red-500/30 border-red-500/30 z-10 flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10"
          aria-label="إغلاق النافذة"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </Button>
      </div>
      
      {/* Decorative Elements - Hidden on mobile for cleaner look */}
      <div className="absolute top-0 right-0 w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 bg-[#C09B52]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-12 sm:w-18 md:w-24 h-12 sm:h-18 md:h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
    </div>
  );
});

CartHeader.displayName = 'CartHeader';
export default CartHeader;

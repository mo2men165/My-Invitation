// Updated CartHeader.tsx - Supports Edit Mode
'use client';
import React, { memo, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InvitationDesign, PackageData } from '@/types';
import { packageData } from '@/constants';

interface CartHeaderProps {
  selectedPackage: keyof PackageData;
  selectedDesign: InvitationDesign;
  onClose: () => void;
  isEditMode?: boolean; // New prop to indicate edit mode
}

const CartHeader = memo<CartHeaderProps>(({ 
  selectedPackage, 
  selectedDesign, 
  onClose,
  isEditMode = false 
}) => {
  const currentPackage = packageData[selectedPackage];

  // Memoized handler to prevent event issues
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }, [onClose]);

  return (
    <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-[#C09B52]/10 to-transparent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#C09B52]/20 rounded-full blur-lg"></div>
            <currentPackage.icon className="relative w-10 h-10 text-[#C09B52]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {isEditMode ? 'تعديل' : 'باقة'} {currentPackage.name}
            </h2>
            <p className="text-gray-400 mt-1">
              {selectedDesign.name}
              {isEditMode && <span className="text-[#C09B52] mr-2">• وضع التعديل</span>}
            </p>
          </div>
        </div>
        
        {/* Fixed Close Button */}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={handleClose}
          className="rounded-full bg-red-500/20 hover:bg-red-500/30 border-red-500/30 z-10"
          aria-label="إغلاق النافذة"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C09B52]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
    </div>
  );
});

CartHeader.displayName = 'CartHeader';
export default CartHeader;
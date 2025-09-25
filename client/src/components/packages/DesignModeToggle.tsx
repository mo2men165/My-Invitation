// client/src/components/packages/DesignModeToggle.tsx - Toggle between regular designs and custom design
'use client';
import React from 'react';
import { PackageData } from '@/types';

interface DesignModeToggleProps {
  designMode: 'regular' | 'custom';
  onModeChange: (mode: 'regular' | 'custom') => void;
  packageType: keyof PackageData;
}

export default function DesignModeToggle({ 
  designMode, 
  onModeChange, 
  packageType 
}: DesignModeToggleProps) {
  // Only show for Premium and VIP packages
  if (packageType === 'classic') {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex justify-center">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange('regular')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                designMode === 'regular'
                  ? 'bg-[#C09B52] text-white shadow-lg transform scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              تصاميم جاهزة
            </button>
            <button
              onClick={() => onModeChange('custom')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                designMode === 'custom'
                  ? 'bg-[#C09B52] text-white shadow-lg transform scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🎨 تصميم مخصص
            </button>
          </div>
        </div>
      </div>
      
      {/* Description based on selected mode */}
      <p className="text-gray-400 text-center mt-3 text-sm">
        {designMode === 'regular' 
          ? 'اختر من تصاميمنا الجاهزة المتنوعة'
          : 'سيتم التواصل معك لتصميم دعوة خاصة بمناسبتك'
        }
      </p>
    </div>
  );
}

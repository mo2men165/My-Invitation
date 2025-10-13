// client/src/components/packages/CustomDesignView.tsx - Custom design selection view
'use client';
import React from 'react';
import { PackageData, InvitationDesign } from '@/types';
import Image from 'next/image';

interface CustomDesignViewProps {
  packageType: keyof PackageData;
  onAddToCart: (packageType: keyof PackageData, design: InvitationDesign) => void;
}

const customDesign: InvitationDesign = {
  id: "000000000000000000000001",
  name: 'تصميم مخصص',
  category: 'custom',
  image: '/custom-design.webp',
  isCustom: true,
  availableFor: ['premium', 'vip']
};

export default function CustomDesignView({ 
  packageType, 
  onAddToCart 
}: CustomDesignViewProps) {
  return (
    <div className="flex justify-center">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-[#C09B52]/30 p-8 text-center">
          {/* Custom Design Image */}
          <div className="relative w-full mb-6 rounded-xl overflow-hidden">
            <Image
              src={customDesign.image}
              alt={customDesign.name}
              width={400}
              height={600}
              className="w-full h-auto"
              style={{ 
                width: '100%', 
                height: 'auto',
                display: 'block'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-[#C09B52] mb-4">
            🎨 تصميم مخصص
          </h3>

          {/* Description */}
          <p className="text-gray-300 mb-6 leading-relaxed">
            صمم دعوتك بأسلوبك الخاص واجعل مناسبتك مميزة وفريدة
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-center gap-3 text-gray-300">
              <span className="text-[#C09B52]">✨</span>
              <span>تصميم فريد خاص بك</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-300">
              <span className="text-[#C09B52]">🎯</span>
              <span>حسب ذوقك واحتياجاتك</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-300">
              <span className="text-[#C09B52]">📞</span>
              <span>سيتم التواصل معك</span>
            </div>
            
          </div>

          {/* Action Button */}
          <button
            onClick={() => onAddToCart(packageType, customDesign)}
            className="w-full bg-gradient-to-r from-[#C09B52] to-amber-600 hover:from-[#C09B52]/90 hover:to-amber-600/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            اختر التصميم المخصص
          </button>

          {/* Note */}
          <p className="text-xs text-gray-500 mt-4">
            * سيتم التواصل معك خلال 24 ساعة لمناقشة التفاصيل
          </p>
        </div>
      </div>
    </div>
  );
}

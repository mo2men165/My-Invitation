'use client';
import React, { memo, useCallback } from 'react';
import { Heart, ShoppingCart, Eye, GitCompare, Check } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { InvitationDesign, PackageData } from '@/types';
import { packageData } from '@/constants';

interface DesignCardProps {
  design: InvitationDesign;
  packageType: keyof PackageData;
  onAddToCart: (packageType: keyof PackageData, design: InvitationDesign) => void;
  onToggleWishlist: (designId: string) => void;
  onToggleCompare: (designId: string) => void;
  onViewImage: (design: InvitationDesign) => void;
  isInWishlist: boolean;
  isInCompare: boolean;
  isLoading: boolean;
}

const DesignCard = memo<DesignCardProps>(({ 
  design, 
  packageType, 
  onAddToCart,
  onToggleWishlist,
  onToggleCompare,
  onViewImage,
  isInWishlist,
  isInCompare,
  isLoading
}) => {
  const currentPackage = packageData[packageType];
  
  const handleWishlistClick = useCallback(() => {
    onToggleWishlist(design.id, packageType);
  }, [design.id, packageType, onToggleWishlist]);

  const handleCompareClick = useCallback(() => {
    onToggleCompare(design.id, packageType);
  }, [design.id, packageType, onToggleCompare]);

  const handleImageClick = useCallback(() => {
    onViewImage(design);
  }, [design, onViewImage]);

  const handleCartClick = useCallback(() => {
    onAddToCart(packageType, design);
  }, [packageType, design, onAddToCart]);

  return (
    <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500 overflow-hidden break-inside-avoid mb-6">
      
      {/* Image Section */}
      <div className="relative">
        <Image 
          src={design.image} 
          alt={design.name}
          width={400}
          height={600}
          className="w-full h-auto"
          style={{ 
            width: '100%', 
            height: 'auto',
            display: 'block'
          }}
          onError={() => {
          }}
          priority={false}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <button
              onClick={handleImageClick}
              className="w-12 h-12 bg-white/20 hover:bg-[#C09B52] rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
            >
              <Eye className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={handleWishlistClick}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${
                isInWishlist 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 hover:bg-red-500 text-white'
              }`}
            >
              <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleCompareClick}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${
                isInCompare 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/20 hover:bg-blue-500 text-white'
              }`}
            >
              <GitCompare className="w-6 h-6" />
            </button>
          </div>
        </div>

        <button
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isInWishlist 
              ? 'bg-red-500 text-white' 
              : 'bg-black/50 hover:bg-red-500 text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-white mb-2">{design.name}</h3>
        <span className="px-3 py-1 bg-[#C09B52]/20 text-[#C09B52] text-xs rounded-full border border-[#C09B52]/30 mb-4 inline-block">
          {design.category}
        </span>

        {/* <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <currentPackage.icon className="w-5 h-5 text-[#C09B52]" />
            <span className="text-white font-medium">مميزات باقة {currentPackage.name}</span>
          </div>
          <div className="space-y-1">
            {currentPackage.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-400" />
                <span>{feature}</span>
              </div>
            ))}
            {currentPackage.features.length > 3 && (
              <span className="text-xs text-gray-400">+{currentPackage.features.length - 3} مميزات أخرى</span>
            )}
          </div>
        </div> */}

        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">يبدأ من:</div>
          <div className="text-2xl font-bold text-[#C09B52]">
            {currentPackage.pricing[0].price.toLocaleString('ar-SA')} ر.س
          </div>
          <div className="text-sm text-gray-400">
            لـ {currentPackage.pricing[0].invites} دعوة
          </div>
        </div>

        <Button
          onClick={handleCartClick}
          disabled={isLoading}
          className={`w-full py-3 bg-gradient-to-r ${currentPackage.color} text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{isLoading ? 'جاري الإضافة...' : 'اختيار الباقة'}</span>
        </Button>
      </div>
    </div>
  );
});

DesignCard.displayName = 'DesignCard';

export default DesignCard;
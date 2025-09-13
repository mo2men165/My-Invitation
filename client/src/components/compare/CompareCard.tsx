'use client';
import React, { memo, useCallback } from 'react';
import { X, Heart, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { InvitationDesign, PackageData } from '@/types';
import { formatAddedDate } from '@/utils/designHelpers';
import { packageData } from '@/constants';

interface CompareCardProps {
  design: InvitationDesign;
  addedDate: string;
  packageType: keyof PackageData; // Package type for this comparison item
  onRemove: (designId: string) => void;
  onAddToWishlist: (designId: string, packageType?: keyof PackageData) => void;
  onSelectPackage: (design: InvitationDesign, packageType: keyof PackageData) => void;
  isLoading: boolean;
  isInWishlist: boolean;
}

const CompareCard = memo<CompareCardProps>(({
  design,
  addedDate,
  packageType,
  onRemove,
  onAddToWishlist,
  onSelectPackage,
  isLoading,
  isInWishlist
}) => {
  const packageInfo = packageData[packageType];
  
  const handleRemove = useCallback(() => {
    onRemove(design.id);
  }, [design.id, onRemove]);

  const handleAddToWishlist = useCallback(() => {
    onAddToWishlist(design.id, packageType);
  }, [design.id, packageType, onAddToWishlist]);

  const handleSelectPackage = useCallback(() => {
    onSelectPackage(design, packageType);
  }, [design, packageType, onSelectPackage]);

  return (
    <div className="group relative">
      {/* Remove Button */}
      <button
        onClick={handleRemove}
        disabled={isLoading}
        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center z-10 transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      {/* Package Card */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-[#C09B52]/30 transition-all duration-500 overflow-hidden">
        
        {/* Badge */}
        <div className={`bg-gradient-to-r ${packageInfo.color} text-white text-center py-2 text-sm font-medium`}>
          باقة {packageInfo.name}
        </div>

        {/* Package Image */}
        <div className="relative overflow-hidden">
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
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => {
            }}
          />
          <div className="absolute top-4 right-4 w-2 h-2 bg-[#C09B52] rounded-full animate-pulse"></div>
        </div>

        {/* Package Info */}
        <div className="p-6">
          <span className="px-3 py-1 bg-[#C09B52]/20 text-[#C09B52] text-xs rounded-full border border-[#C09B52]/30 mb-3 inline-block">
            {design.category}
          </span>
          
          <h3 className="text-xl font-bold text-white mb-2">{design.name}</h3>
          
          {/* Package Price */}
          <div className="mb-2">
            <span className="text-2xl font-bold text-[#C09B52]">
              {packageInfo.pricing[0].price.toLocaleString('ar-SA')} ر.س
            </span>
            <span className="text-sm text-gray-400 block">
              من {packageInfo.pricing[0].invites} دعوة
            </span>
          </div>

          {/* Added Date */}
          <p className="text-xs text-gray-500 mb-4">
            أضيف في {formatAddedDate(addedDate)}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSelectPackage}
              disabled={isLoading}
              className={`w-full bg-gradient-to-r ${packageInfo.color} text-black font-bold hover:shadow-lg`}
            >
              اختيار الباقة
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleAddToWishlist}
                variant="outline"
                size="sm"
                className={`flex-1 border-white/20 text-white hover:bg-white/20 ${
                  isInWishlist 
                    ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                    : 'bg-white/10'
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isInWishlist ? 'fill-current' : ''}`} />
                {isInWishlist ? 'في المفضلة' : 'المفضلة'}
              </Button>
              <Button
                onClick={handleSelectPackage}
                variant="outline"
                size="sm"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                السلة
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CompareCard.displayName = 'CompareCard';

export default CompareCard;

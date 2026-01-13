'use client';
import React from 'react';
import DesignCard from './DesignCard';
import { InvitationDesign, PackageData } from '@/types';

interface DesignGridProps {
  designs: InvitationDesign[];
  packageType: keyof PackageData;
  onAddToCart: (packageType: keyof PackageData, design: InvitationDesign) => void;
  onToggleWishlist: (designId: string, packageType?: keyof PackageData) => void;
  onToggleCompare: (designId: string, packageType?: keyof PackageData) => void;
  onViewImage: (design: InvitationDesign) => void;
  isInWishlist: (designId: string) => boolean;
  isInCompare: (designId: string) => boolean;
  isLoading: boolean;
}

const DesignGrid: React.FC<DesignGridProps> = ({
  designs,
  packageType,
  onAddToCart,
  onToggleWishlist,
  onToggleCompare,
  onViewImage,
  isInWishlist,
  isInCompare,
  isLoading
}) => {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        اختر <span className="text-[#C09B52]">تصميمك</span> المفضل
      </h2>
      
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {designs.map((design) => (
          <DesignCard 
            key={design.id} 
            design={design} 
            packageType={packageType}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            onToggleCompare={onToggleCompare}
            onViewImage={onViewImage}
            isInWishlist={isInWishlist(design.id)}
            isInCompare={isInCompare(design.id)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};

export default DesignGrid;

'use client';
import React from 'react';
import WishlistCard from './WishlistCard';
import { InvitationDesign } from '@/types';
import { WishlistItem } from '@/lib/api/wishlist';
import { CompareItem } from '@/lib/api/compare';
import { getDesignById } from '@/utils/designHelpers';

interface WishlistGridProps {
  items: WishlistItem[];
  compareItems: CompareItem[]; // Add compare items to check status
  onRemove: (designId: string) => void;
  onViewImage: (design: InvitationDesign) => void;
  onAddToCompare: (designId: string) => void;
  onSelectPackage: (design: InvitationDesign) => void;
  isLoading: boolean;
}

const WishlistGrid: React.FC<WishlistGridProps> = ({
  items,
  compareItems,
  onRemove,
  onViewImage,
  onAddToCompare,
  onSelectPackage,
  isLoading
}) => {
  const compareDesignIds = new Set(compareItems.map(item => item.designId));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {items.map((item) => {
        const design = getDesignById(item.designId);
        if (!design) return null;

        return (
          <WishlistCard
            key={item.designId}
            design={design}
            addedDate={item.addedAt || new Date().toISOString()}
            onRemove={onRemove}
            onViewImage={onViewImage}
            onAddToCompare={onAddToCompare}
            onSelectPackage={onSelectPackage}
            isLoading={isLoading}
            isInCompare={compareDesignIds.has(item.designId)}
          />
        );
      })}
    </div>
  );
};

export default WishlistGrid;

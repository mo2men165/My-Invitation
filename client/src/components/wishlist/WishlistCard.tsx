'use client';
import React, { memo, useCallback } from 'react';
import { Heart, ShoppingCart, Eye, X, GitCompare, Calendar, Check } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { InvitationDesign } from '@/types';
import { formatAddedDate } from '@/utils/designHelpers';

interface WishlistCardProps {
  design: InvitationDesign;
  addedDate: string;
  onRemove: (designId: string) => void;
  onViewImage: (design: InvitationDesign) => void;
  onAddToCompare: (designId: string) => void;
  onSelectPackage: (design: InvitationDesign) => void;
  isLoading: boolean;
  isInCompare: boolean;
}

const WishlistCard = memo<WishlistCardProps>(({
  design,
  addedDate,
  onRemove,
  onViewImage,
  onAddToCompare,
  onSelectPackage,
  isLoading,
  isInCompare
}) => {
  const handleRemove = useCallback(() => {
    onRemove(design.id);
  }, [design.id, onRemove]);

  const handleViewImage = useCallback(() => {
    onViewImage(design);
  }, [design, onViewImage]);

  const handleAddToCompare = useCallback(() => {
    onAddToCompare(design.id);
  }, [design.id, onAddToCompare]);

  const handleSelectPackage = useCallback(() => {
    onSelectPackage(design);
  }, [design, onSelectPackage]);

  return (
    <div className="group relative">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-red-400/30 transition-all duration-500 overflow-hidden group-hover:transform group-hover:scale-105">
        
        {/* Image Section */}
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

          {/* Remove Button - Always visible */}
          <button
            onClick={handleRemove}
            disabled={isLoading}
            className="absolute top-3 left-3 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 z-30"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-20">
            <button
              onClick={handleViewImage}
              className="w-10 h-10 bg-white/20 hover:bg-[#C09B52] rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
            >
              <Eye className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={handleAddToCompare}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${
                isInCompare 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/20 hover:bg-blue-500 text-white'
              }`}
            >
              {isInCompare ? <Check className="w-5 h-5" /> : <GitCompare className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Category */}
          <span className="px-3 py-1 bg-[#C09B52]/20 text-[#C09B52] text-xs rounded-full border border-[#C09B52]/30 mb-3 inline-block">
            {design.category}
          </span>

          {/* Title */}
          <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors duration-300 mb-2 line-clamp-2">
            {design.name}
          </h3>

          {/* Added Date */}
          <p className="text-xs text-gray-500 mb-4">
            أضيف في {formatAddedDate(addedDate)}
          </p>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleSelectPackage}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold hover:from-amber-600 hover:to-[#C09B52]"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              اختيار الباقة
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewImage}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                مشاهدة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToCompare}
                className={`border-white/20 text-white hover:bg-white/20 ${
                  isInCompare 
                    ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                    : 'bg-white/10'
                }`}
              >
                {isInCompare ? 'في المقارنة' : 'مقارنة'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Heart */}
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg z-40">
        <Heart className="w-4 h-4 text-white fill-current" />
      </div>
    </div>
  );
});

WishlistCard.displayName = 'WishlistCard';

export default WishlistCard;

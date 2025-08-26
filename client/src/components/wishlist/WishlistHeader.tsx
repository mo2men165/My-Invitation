'use client';
import React from 'react';
import { Heart } from 'lucide-react';
import { getArabicItemCount } from '@/utils/designHelpers';

interface WishlistHeaderProps {
  itemCount: number;
}

const WishlistHeader: React.FC<WishlistHeaderProps> = ({ itemCount }) => {
  return (
    <div className="flex items-center justify-between mb-12">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
          <Heart className="w-6 h-6 text-white fill-current" />
        </div>
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white">
            قائمة <span className="text-red-400">المفضلة</span>
          </h1>
          <p className="text-gray-400 text-lg mt-2">
            {getArabicItemCount(itemCount)} محفوظ
          </p>
        </div>
      </div>
    </div>
  );
};

export default WishlistHeader;
'use client';
import React from 'react';
import { GitCompare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WishlistActionsProps {
  itemCount: number;
  onAddAllToCompare: () => void;
  onClearWishlist: () => void;
  isLoading: boolean;
  selectedPackageType: "classic" | "premium" | "vip";
  onPackageTypeChange: (type: "classic" | "premium" | "vip") => void;
}

const WishlistActions: React.FC<WishlistActionsProps> = ({
  itemCount,
  onAddAllToCompare,
  onClearWishlist,
  isLoading,
  selectedPackageType,
  onPackageTypeChange
}) => {
  if (itemCount === 0) return null;

  return (
    <div className="mt-16">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 max-w-md mx-auto">
        <h3 className="text-xl font-bold text-white mb-4 text-center">إجراءات سريعة</h3>
        
        {/* Package Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-2">نوع الباقة:</label>
          <select 
            value={selectedPackageType} 
            onChange={(e) => onPackageTypeChange(e.target.value as "classic" | "premium" | "vip")}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
          >
            <option value="classic">كلاسيك</option>
            <option value="premium">بريميوم</option>
            <option value="vip">VIP</option>
          </select>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={onAddAllToCompare}
            disabled={isLoading || itemCount === 0}
            variant="outline"
            className="w-full border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            إضافة للمقارنة (أول 3)
          </Button>
          <Button
            onClick={onClearWishlist}
            disabled={isLoading}
            variant="outline"
            className="w-full border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            مسح القائمة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WishlistActions;

'use client';
import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  addToWishlist, 
  removeFromWishlist, 
  optimisticAddToWishlist, 
  optimisticRemoveFromWishlist 
} from '@/store/wishlistSlice';
import { useToast } from '@/hooks/useToast';
import { invitationDesigns } from '@/constants';

export const useWishlist = () => {
  const dispatch = useAppDispatch();
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
  const { toast } = useToast();

  // Memoized set for O(1) lookup
  const wishlistSet = useMemo(() => 
    new Set(wishlistItems.map(item => item.designId)), 
    [wishlistItems]
  );

  const isInWishlist = useCallback((designId: string) => 
    wishlistSet.has(designId), 
    [wishlistSet]
  );

  // Updated toggleWishlist with packageType support
  const toggleWishlist = useCallback(async (designId: string, packageType?: 'classic' | 'premium' | 'vip') => {
    const design = invitationDesigns.find(d => d.id === designId);
    
    try {
      if (isInWishlist(designId)) {
        // Optimistic update first
        dispatch(optimisticRemoveFromWishlist(designId));
        await dispatch(removeFromWishlist(designId)).unwrap();
        toast({
          title: "تم حذف من المفضلة",
          description: `تم حذف "${design?.name}" من المفضلة`,
          variant: "wishlist",
          duration: 3000
        });
      } else {
        // Optimistic update first with packageType
        dispatch(optimisticAddToWishlist({ designId, packageType }));
        await dispatch(addToWishlist({ designId, packageType })).unwrap();
        toast({
          title: "تم إضافة للمفضلة",
          description: `تم إضافة "${design?.name}" للمفضلة`,
          variant: "wishlist",
          duration: 3000
        });
      }
    } catch (error: any) {
      // Revert optimistic update on error
      if (isInWishlist(designId)) {
        dispatch(optimisticAddToWishlist({ designId, packageType }));
      } else {
        dispatch(optimisticRemoveFromWishlist(designId));
      }
      
      toast({
        title: "خطأ",
        description: error || "حدث خطأ غير متوقع",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [dispatch, isInWishlist, toast]);

  return {
    isInWishlist,
    toggleWishlist,
    wishlistItems
  };
};

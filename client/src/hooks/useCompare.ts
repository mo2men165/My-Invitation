'use client';
import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  addToCompare, 
  removeFromCompare, 
  optimisticAddToCompare, 
  optimisticRemoveFromCompare 
} from '@/store/compareSlice';
import { useToast } from '@/hooks/useToast';
import { invitationDesigns } from '@/constants';

export const useCompare = () => {
  const dispatch = useAppDispatch();
  const { items: compareItems } = useAppSelector((state) => state.compare);
  const { toast } = useToast();

  const compareSet = useMemo(() => 
    new Set(compareItems.map(item => item.designId)), 
    [compareItems]
  );

  const isInCompare = useCallback((designId: string) => 
    compareSet.has(designId), 
    [compareSet]
  );

  // Updated toggleCompare with packageType support
  const toggleCompare = useCallback(async (designId: string, packageType: 'classic' | 'premium' | 'vip' = 'classic') => {
    const design = invitationDesigns.find(d => d.id === designId);
    
    try {
      if (isInCompare(designId)) {
        // Optimistic update first
        dispatch(optimisticRemoveFromCompare(designId));
        await dispatch(removeFromCompare(designId)).unwrap();
        toast({
          title: "تم حذف من المقارنة",
          description: `تم حذف "${design?.name}" من المقارنة`,
          variant: "compare",
          duration: 3000
        });
      } else if (compareItems.length < 3) {
        // Optimistic update first with packageType
        dispatch(optimisticAddToCompare({ designId, packageType }));
        await dispatch(addToCompare({ designId, packageType })).unwrap();
        toast({
          title: "تم إضافة للمقارنة",
          description: `تم إضافة "${design?.name}" للمقارنة`,
          variant: "compare",
          duration: 3000
        });
      } else {
        toast({
          title: "تنبيه",
          description: "يمكنك مقارنة 3 تصاميم كحد أقصى",
          variant: "destructive",
          duration: 4000
        });
      }
    } catch (error: any) {
      // Revert optimistic update on error
      if (isInCompare(designId)) {
        dispatch(optimisticAddToCompare({ designId, packageType }));
      } else {
        dispatch(optimisticRemoveFromCompare(designId));
      }
      
      toast({
        title: "خطأ",
        description: error || "حدث خطأ غير متوقع",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [dispatch, isInCompare, compareItems.length, toast]);

  return {
    isInCompare,
    toggleCompare,
    compareItems
  };
}
// client/src/hooks/useItemManagement.ts - Shared hook for wishlist and compare functionality
'use client';
import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useToast } from '@/hooks/useToast';
import { invitationDesigns } from '@/constants';
import { addToWishlist, removeFromWishlist } from '@/store/wishlistSlice';
import { addToCompare, removeFromCompare } from '@/store/compareSlice';

// Generic types for item management
interface ItemManagementConfig {
  sliceName: 'wishlist' | 'compare';
  maxItems?: number;
  toastMessages: {
    add: { title: string; description: string; variant: string };
    remove: { title: string; description: string; variant: string };
    limit: { title: string; description: string; variant: string };
    error: { title: string; description: string; variant: string };
  };
}

// Generic item management hook
export const useItemManagement = (config: ItemManagementConfig) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Get state based on slice name
  const state = useAppSelector((state) => state[config.sliceName]);
  const items = state.items || [];
  const isLoading = state.isLoading || false;
  const error = state.error;

  // Memoized set for O(1) lookup
  const itemSet = useMemo(() => 
    new Set(items.map((item: any) => item.designId)), 
    [items]
  );

  const isInList = useCallback((designId: string) => 
    itemSet.has(designId), 
    [itemSet]
  );

  // Generic toggle function
  const toggleItem = useCallback(async (
    designId: string, 
    packageType?: 'classic' | 'premium' | 'vip'
  ) => {
    const design = invitationDesigns.find(d => d.id === designId);
    
    try {
      if (isInList(designId)) {
        // Remove item
        if (config.sliceName === 'wishlist') {
          await dispatch(removeFromWishlist(designId)).unwrap();
        } else {
          await dispatch(removeFromCompare(designId)).unwrap();
        }
        
        toast({
          title: config.toastMessages.remove.title,
          description: config.toastMessages.remove.description.replace('{name}', design?.name || ''),
          variant: config.toastMessages.remove.variant as any,
          duration: 3000
        });
      } else {
        // Check item limit
        if (config.maxItems && items.length >= config.maxItems) {
          toast({
            title: config.toastMessages.limit.title,
            description: config.toastMessages.limit.description,
            variant: config.toastMessages.limit.variant as any,
            duration: 4000
          });
          return;
        }

        // Add item
        if (config.sliceName === 'wishlist') {
          await dispatch(addToWishlist({ designId, packageType: packageType || 'classic' })).unwrap();
        } else {
          await dispatch(addToCompare({ designId, packageType: packageType || 'classic' })).unwrap();
        }
        
        toast({
          title: config.toastMessages.add.title,
          description: config.toastMessages.add.description.replace('{name}', design?.name || ''),
          variant: config.toastMessages.add.variant as any,
          duration: 3000
        });
      }
    } catch (error: any) {
      toast({
        title: config.toastMessages.error.title,
        description: error?.message || config.toastMessages.error.description,
        variant: config.toastMessages.error.variant as any,
        duration: 3000
      });
    }
  }, [dispatch, isInList, items.length, toast, config]);

  return {
    isInList,
    toggleItem,
    items,
    isLoading,
    error
  };
};

// Specific hooks using the generic hook
export const useWishlist = () => {
  return useItemManagement({
    sliceName: 'wishlist',
    toastMessages: {
      add: {
        title: "تم إضافة للمفضلة",
        description: "تم إضافة \"{name}\" للمفضلة",
        variant: "wishlist"
      },
      remove: {
        title: "تم حذف من المفضلة",
        description: "تم حذف \"{name}\" من المفضلة",
        variant: "wishlist"
      },
      limit: {
        title: "تنبيه",
        description: "يمكنك إضافة عناصر أكثر للمفضلة",
        variant: "destructive"
      },
      error: {
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      }
    }
  });
};

export const useCompare = () => {
  return useItemManagement({
    sliceName: 'compare',
    maxItems: 3,
    toastMessages: {
      add: {
        title: "تم إضافة للمقارنة",
        description: "تم إضافة \"{name}\" للمقارنة",
        variant: "compare"
      },
      remove: {
        title: "تم حذف من المقارنة",
        description: "تم حذف \"{name}\" من المقارنة",
        variant: "compare"
      },
      limit: {
        title: "تنبيه",
        description: "يمكنك مقارنة 3 تصاميم كحد أقصى",
        variant: "destructive"
      },
      error: {
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      }
    }
  });
};

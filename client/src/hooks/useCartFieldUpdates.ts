// src/hooks/useCartFieldUpdates.ts
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateCartItemField, optimisticUpdateField } from '@/store/cartSlice';
import { useToast } from '@/hooks/useToast';

export const useCartFieldUpdates = () => {
  const dispatch = useAppDispatch();
  const { fieldUpdateLoading } = useAppSelector((state) => state.cart);
  const { toast } = useToast();

  const updateField = useCallback(async (itemId: string, field: string, value: any) => {
    try {
      // Optimistic update for immediate UI feedback
      dispatch(optimisticUpdateField({ id: itemId, field, value }));

      // API call
      await dispatch(updateCartItemField({ id: itemId, field, value })).unwrap();

      toast({
        title: "تم التحديث",
        description: "تم تحديث الحقل بنجاح",
        variant: "default",
        duration: 2000
      });

      return true;
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث", 
        description: error || "فشل في تحديث الحقل",
        variant: "destructive",
        duration: 3000
      });
      
      return false;
    }
  }, [dispatch, toast]);

  const isFieldUpdating = useCallback((itemId: string) => {
    return fieldUpdateLoading[itemId] || false;
  }, [fieldUpdateLoading]);

  const updatePackageType = useCallback((itemId: string, packageType: 'classic' | 'premium' | 'vip') => {
    return updateField(itemId, 'packageType', packageType);
  }, [updateField]);

  const updateInviteCount = useCallback((itemId: string, count: number) => {
    return updateField(itemId, 'details.inviteCount', count);
  }, [updateField]);

  const updateTotalPrice = useCallback((itemId: string, price: number) => {
    return updateField(itemId, 'totalPrice', price);
  }, [updateField]);

  const updateEventDate = useCallback((itemId: string, date: string) => {
    return updateField(itemId, 'details.eventDate', date);
  }, [updateField]);

  const updateHostName = useCallback((itemId: string, name: string) => {
    return updateField(itemId, 'details.hostName', name);
  }, [updateField]);

  const updateEventLocation = useCallback((itemId: string, location: string) => {
    return updateField(itemId, 'details.eventLocation', location);
  }, [updateField]);

  const updateInvitationText = useCallback((itemId: string, text: string) => {
    return updateField(itemId, 'details.invitationText', text);
  }, [updateField]);

  return {
    updateField,
    isFieldUpdating,
    // Specific field updaters
    updatePackageType,
    updateInviteCount,
    updateTotalPrice,
    updateEventDate,
    updateHostName,
    updateEventLocation,
    updateInvitationText
  };
};

export default useCartFieldUpdates;
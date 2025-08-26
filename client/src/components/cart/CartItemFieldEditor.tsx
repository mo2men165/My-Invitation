// src/components/cart/CartItemFieldEditor.tsx
'use client';
import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateCartItemField, optimisticUpdateField } from '@/store/cartSlice';
import { useToast } from '@/hooks/useToast';
import { CartItem } from '@/lib/api/cart';

interface CartItemFieldEditorProps {
  item: CartItem;
  onUpdate?: (updatedItem: CartItem) => void;
}

const CartItemFieldEditor: React.FC<CartItemFieldEditorProps> = ({
  item,
  onUpdate
}) => {
  const dispatch = useAppDispatch();
  const { fieldUpdateLoading } = useAppSelector((state) => state.cart);
  const { toast } = useToast();
  
  const [localValues, setLocalValues] = useState({
    inviteCount: item.details.inviteCount,
    hostName: item.details.hostName,
    eventLocation: item.details.eventLocation,
    packageType: item.packageType,
    totalPrice: item.totalPrice
  });

  const isFieldUpdating = (field: string) => {
    return fieldUpdateLoading[item._id!] || false;
  };

  const updateField = useCallback(async (field: string, value: any) => {
    if (!item._id) return;

    try {
      // Optimistic update for immediate UI feedback
      dispatch(optimisticUpdateField({ 
        id: item._id, 
        field, 
        value 
      }));

      // API call
      const result = await dispatch(updateCartItemField({ 
        id: item._id, 
        field, 
        value 
      })).unwrap();

      onUpdate?.(result.cartItem);

      toast({
        title: "تم التحديث",
        description: "تم تحديث الحقل بنجاح",
        variant: "default",
        duration: 2000
      });

    } catch (error: any) {
      // Revert optimistic update on error by refetching
      // Or implement proper optimistic update revert logic
      
      toast({
        title: "خطأ في التحديث",
        description: error || "فشل في تحديث الحقل",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [item._id, dispatch, onUpdate, toast]);

  const handleInviteCountChange = useCallback((newCount: number) => {
    if (newCount >= 100 && newCount <= 700 && newCount !== item.details.inviteCount) {
      setLocalValues(prev => ({ ...prev, inviteCount: newCount }));
      updateField('details.inviteCount', newCount);
    }
  }, [item.details.inviteCount, updateField]);

  const handlePackageTypeChange = useCallback((newPackage: 'classic' | 'premium' | 'vip') => {
    if (newPackage !== item.packageType) {
      setLocalValues(prev => ({ ...prev, packageType: newPackage }));
      updateField('packageType', newPackage);
    }
  }, [item.packageType, updateField]);

  const handleHostNameBlur = useCallback(() => {
    if (localValues.hostName !== item.details.hostName && localValues.hostName.trim()) {
      updateField('details.hostName', localValues.hostName.trim());
    }
  }, [localValues.hostName, item.details.hostName, updateField]);

  const handleEventLocationBlur = useCallback(() => {
    if (localValues.eventLocation !== item.details.eventLocation && localValues.eventLocation.trim()) {
      updateField('details.eventLocation', localValues.eventLocation.trim());
    }
  }, [localValues.eventLocation, item.details.eventLocation, updateField]);

  return (
    <div className="bg-white/5 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">تعديل سريع</h3>
      
      {/* Package Type Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">نوع الباقة</label>
        <div className="flex gap-2">
          {['classic', 'premium', 'vip'].map((pkg) => (
            <button
              key={pkg}
              onClick={() => handlePackageTypeChange(pkg as any)}
              disabled={isFieldUpdating('packageType')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                localValues.packageType === pkg
                  ? 'bg-[#C09B52] text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              } disabled:opacity-50`}
            >
              {pkg === 'classic' ? 'كلاسيك' : pkg === 'premium' ? 'بريميوم' : 'VIP'}
            </button>
          ))}
        </div>
      </div>

      {/* Invite Count Slider */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          عدد المدعوين ({localValues.inviteCount})
        </label>
        <input
          type="range"
          min="100"
          max="700"
          step="50"
          value={localValues.inviteCount}
          onChange={(e) => {
            const newCount = parseInt(e.target.value);
            setLocalValues(prev => ({ ...prev, inviteCount: newCount }));
          }}
          onMouseUp={(e) => {
            const newCount = parseInt((e.target as HTMLInputElement).value);
            handleInviteCountChange(newCount);
          }}
          disabled={isFieldUpdating('details.inviteCount')}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>100</span>
          <span>400</span>
          <span>700</span>
        </div>
      </div>

      {/* Host Name Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">اسم المضيف</label>
        <input
          type="text"
          value={localValues.hostName}
          onChange={(e) => setLocalValues(prev => ({ ...prev, hostName: e.target.value }))}
          onBlur={handleHostNameBlur}
          disabled={isFieldUpdating('details.hostName')}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 disabled:opacity-50"
          placeholder="أدخل اسم المضيف"
        />
      </div>

      {/* Event Location Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">موقع المناسبة</label>
        <input
          type="text"
          value={localValues.eventLocation}
          onChange={(e) => setLocalValues(prev => ({ ...prev, eventLocation: e.target.value }))}
          onBlur={handleEventLocationBlur}
          disabled={isFieldUpdating('details.eventLocation')}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 disabled:opacity-50"
          placeholder="أدخل موقع المناسبة"
        />
      </div>

      {/* Loading Indicator */}
      {Object.keys(fieldUpdateLoading).includes(item._id!) && (
        <div className="flex items-center gap-2 text-sm text-[#C09B52]">
          <div className="animate-spin w-4 h-4 border-2 border-[#C09B52] border-t-transparent rounded-full"></div>
          <span>جاري التحديث...</span>
        </div>
      )}
    </div>
  );
};

export default CartItemFieldEditor;
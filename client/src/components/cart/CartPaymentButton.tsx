// src/components/cart/CartPaymentButton.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { CreditCard, ShoppingBag } from 'lucide-react';

const CartPaymentButton: React.FC = () => {
  const router = useRouter();
  const { items, isLoading } = useAppSelector((state) => state.cart);
  
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.length;

  const handleProceedToPayment = () => {
    if (itemCount === 0) return;
    router.push('/payment');
  };

  if (itemCount === 0) {
    return (
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6 text-center">
        <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">السلة فارغة</h3>
        <p className="text-gray-400 text-sm">أضف بعض العناصر لإتمام عملية الدفع</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#C09B52]/10 via-[#C09B52]/5 to-transparent rounded-2xl border border-[#C09B52]/20 p-6">
      <h3 className="text-xl font-bold text-white mb-4">ملخص السلة</h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center text-gray-300">
          <span>عدد العناصر</span>
          <span>{itemCount}</span>
        </div>
        
        <div className="flex justify-between items-center text-gray-300">
          <span>المجموع الفرعي</span>
          <span>{totalAmount.toLocaleString('ar-SA')} ر.س</span>
        </div>
        
        <div className="flex justify-between items-center text-gray-300">
          <span>ضريبة القيمة المضافة (15%)</span>
          <span>{(totalAmount * 0.15).toLocaleString('ar-SA')} ر.س</span>
        </div>
        
        <div className="border-t border-[#C09B52]/30 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-white">الإجمالي</span>
            <span className="text-2xl font-bold text-[#C09B52]">
              {(totalAmount * 1.15).toLocaleString('ar-SA')} ر.س
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleProceedToPayment}
        disabled={isLoading || itemCount === 0}
        className="w-full py-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <CreditCard className="w-5 h-5" />
        متابعة للدفع
      </button>
      
      <p className="text-xs text-gray-400 text-center mt-3">
        سيتم إنشاء المناسبات بعد إتمام الدفع
      </p>
    </div>
  );
};

export default CartPaymentButton;
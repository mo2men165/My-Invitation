// Optimized Cart Page - Performance and Organization Improvements
'use client';
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import '@/components/cart/cart-scroll.css';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCart, removeFromCart } from '@/store/cartSlice';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import { formatCurrency } from '@/utils/calculations';
import { invitationDesigns, packageData } from '@/constants';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import { CartModal } from '@/components/cart/CartModal';
import OptimizedVirtualizedList from '@/components/cart/OptimizedVirtualizedList';
import ScrollPerformanceMonitor from '@/components/cart/ScrollPerformanceMonitor';
import { Button } from '@/components/ui/Button';

// Memoized components for better performance
const CartHeader = React.memo(() => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-[#C09B52]/20 rounded-full blur-lg"></div>
        <ShoppingCart className="relative w-12 h-12 text-[#C09B52]" />
      </div>
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          سلة التسوق
        </h1>
        <p className="text-gray-400 mt-2">إدارة طلباتك والمناسبات</p>
      </div>
    </div>
  </div>
));

const CartSummary = React.memo<{ total: number; itemCount: number }>(({ total, itemCount }) => (
  <div className="bg-gradient-to-br from-[#C09B52]/10 via-[#C09B52]/5 to-transparent rounded-2xl border border-[#C09B52]/20 p-6 mb-8">
    <h3 className="text-xl font-bold text-white mb-4">ملخص الطلب</h3>
    
    <div className="space-y-3 mb-6">
      <div className="flex justify-between items-center text-gray-300">
        <span>عدد العناصر</span>
        <span>{itemCount}</span>
      </div>
      
      <div className="flex justify-between items-center text-gray-300">
        <span>المجموع الفرعي</span>
        <span>{formatCurrency(total)}</span>
      </div>
      
      
      <div className="border-t border-[#C09B52]/30 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-white">الإجمالي</span>
          <span className="text-2xl font-bold text-[#C09B52]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>

    <Button
      onClick={() => window.location.href = '/payment'}
      disabled={itemCount === 0}
      className="w-full py-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      متابعة للدفع
    </Button>
  </div>
));

const LoadingState = React.memo(() => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-[#C09B52] mx-auto mb-4 animate-spin" />
      <p className="text-white text-lg">جاري تحميل السلة...</p>
    </div>
  </div>
));

const ErrorState = React.memo<{ error: string; onRetry: () => void }>(({ error, onRetry }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <ShoppingCart className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">خطأ في تحميل السلة</h3>
      <p className="text-gray-400 text-sm mb-4">{error}</p>
      <Button onClick={onRetry} variant="outline">
        المحاولة مرة أخرى
      </Button>
    </div>
  </div>
));

function CartPageContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items: cartItems, isLoading, error } = useAppSelector((state) => state.cart);
  const { toast } = useToast();
  
  // Modal states
  const {
    isCartModalOpen,
    selectedDesign,
    selectedPackage,
    openCartModal,
    closeModals
  } = useModal();
  
  const [itemToEdit, setItemToEdit] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Fetch cart data on component mount
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated, authLoading]);

  // Memoized calculations
  const pricing = useMemo(() => {
    const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    return { total };
  }, [cartItems]);

  const itemCount = useMemo(() => cartItems.length, [cartItems.length]);

  // Memoized cart item enhancement
  const enhancedCartItems = useMemo(() => {
    return cartItems.map(item => {
      const design = invitationDesigns.find(d => d.id === item.designId);
      const packageInfo = packageData[item.packageType as keyof typeof packageData];
      
      return {
        ...item,
        designName: design?.name || 'تصميم غير معروف',
        designCategory: design?.category || '',
        packageName: packageInfo?.name || item.packageType,
        packageIcon: packageInfo?.icon,
        packageColor: packageInfo?.color || 'from-gray-500 to-gray-600',
        features: packageInfo?.features || []
      };
    });
  }, [cartItems]);

  // Event handlers
  const handleEditItem = useCallback((item: any) => {
    const design = invitationDesigns.find(d => d.id === item.designId);
    if (design) {
      setItemToEdit(item);
      openCartModal(item.packageType, design);
    }
  }, [openCartModal]);

  const handleDeleteItem = useCallback((itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteConfirmation(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    
    try {
      await dispatch(removeFromCart(itemToDelete)).unwrap();
      toast({
        title: "تم الحذف",
        description: "تم حذف العنصر من السلة بنجاح",
        variant: "default",
        duration: 3000
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error?.message || "فشل في حذف العنصر",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setShowDeleteConfirmation(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, dispatch, toast]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirmation(false);
    setItemToDelete(null);
  }, []);

  const handleRetry = useCallback(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Loading state
  if (authLoading || isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <ScrollPerformanceMonitor enabled={true} threshold={30} />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <CartHeader />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items - Takes 2/3 of the space */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">عناصر السلة</h2>
              
              <div className="cart-scroll-container">
                <OptimizedVirtualizedList
                  items={enhancedCartItems}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  height={600}
                  itemHeight={200}
                />
              </div>
            </div>
          </div>

          {/* Cart Summary - Takes 1/3 of the space */}
          <div className="lg:col-span-1">
            <CartSummary total={pricing.total} itemCount={itemCount} />
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
        </div>
      </div>

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={closeModals}
        selectedPackage={selectedPackage}
        selectedDesign={selectedDesign}
        editItem={itemToEdit}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/20 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">تأكيد الحذف</h3>
            <p className="text-gray-300 mb-6">
              هل أنت متأكد من حذف هذا العنصر من السلة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                حذف
              </Button>
              <Button
                onClick={cancelDelete}
                variant="outline"
                className="flex-1 py-3 border-gray-500/30 text-gray-300 rounded-xl font-medium hover:bg-gray-500/10 transition-colors"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  return (
    <InstantRouteGuard>
      <CartPageContent />
    </InstantRouteGuard>
  );
}

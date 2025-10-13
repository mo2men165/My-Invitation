// client/src/app/cart/page.tsx - All Issues Fixed
'use client';
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, Calendar, Shield, Star, CreditCard, ArrowLeft, AlertCircle, Loader2, Edit3 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCart, removeFromCart } from '@/store/cartSlice';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import { formatCurrency } from '@/utils/calculations';
import { invitationDesigns, packageData } from '@/constants';
import { CartModal } from '@/components/cart/CartModal';
import ConfirmationModal from '@/components/cart/CartModal/components/ConfirmationModal';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import Image from 'next/image';

// Helper function to format date in Arabic
const formatArabicDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', options).format(date);
};

// Helper function to format time in Arabic
const formatArabicTime = (timeString: string) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'مساءً' : 'صباحاً';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes.padStart(2, '0')} ${period}`;
};

function CartPageContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
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
  
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Fetch cart data on component mount
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated, authLoading]);

  // Calculate pricing with memoization
  const pricing = useMemo(() => {
    const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    return {total };
  }, [cartItems]);

  // Memoized cart item enhancement (add design and package details)
  const enhancedCartItems = useMemo(() => {
    return cartItems.map(item => {
      const design = invitationDesigns.find(d => d.id === item.designId);
      const packageInfo = packageData[item.packageType];
      
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

  // Edit item handler - opens cart modal with existing data
  const handleEditItem = useCallback((item: any) => {
    const design = invitationDesigns.find(d => d.id === item.designId);
    if (design) {
      // Store the item to edit
      setItemToEdit(item);
      openCartModal(item.packageType, design);
    }
  }, [openCartModal]);

  // State for item being edited
  const [itemToEdit, setItemToEdit] = useState<any>(null);

  // Remove item handler with custom confirmation
  const handleRemoveItem = useCallback((itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteConfirmation(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await dispatch(removeFromCart(itemToDelete)).unwrap();
      toast({
        title: "تم حذف العنصر",
        description: "تم حذف العنصر من السلة",
        variant: "default",
        duration: 2000
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error || "فشل في حذف العنصر",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setItemToDelete(null);
      setShowDeleteConfirmation(false);
    }
  }, [dispatch, toast, itemToDelete]);

  const cancelDelete = useCallback(() => {
    setItemToDelete(null);
    setShowDeleteConfirmation(false);
  }, []);

  // Checkout handler
  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      toast({
        title: "السلة فارغة",
        description: "يرجى إضافة عناصر للسلة قبل المتابعة",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    router.push('/payment');
  }, [cartItems.length, router, toast]);

  // Loading state
  if (authLoading || (isLoading && cartItems.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#C09B52] mx-auto mb-4 animate-spin" />
          <p className="text-white text-lg">جاري تحميل السلة...</p>
        </div>
      </div>
    );
  }


  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center py-20">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10 max-w-2xl mx-auto">
            <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">خطأ في تحميل السلة</h2>
            <p className="text-gray-400 mb-8 text-lg">{error}</p>
            <button
              onClick={() => dispatch(fetchCart())}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300 transform hover:scale-105"
            >
              <span>إعادة المحاولة</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="container mx-auto px-8 py-12">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white">
                سلة <span className="text-[#C09B52]">التسوق</span>
              </h1>
              <p className="text-gray-400 text-lg mt-2">
                {cartItems.length} {cartItems.length === 1 ? 'مناسبة' : 'مناسبة'} في السلة
              </p>
            </div>
          </div>

          {cartItems.length === 0 ? (
            /* Empty Cart */
            <div className="text-center py-20">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10 max-w-2xl mx-auto">
                <ShoppingCart className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">سلة التسوق فارغة</h2>
                <p className="text-gray-400 mb-8 text-lg">
                  ابدأ بإضافة الباقات التي تناسب مناسبتك
                </p>
                <button
                  onClick={() => router.push('/packages')}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300 transform hover:scale-105"
                >
                  <span>تصفح الباقات</span>
                  <Calendar className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* Cart Content */
            <div className="grid lg:grid-cols-3 gap-12">
              
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                {enhancedCartItems.map((item) => (
                  <div key={item._id} className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-[#C09B52]/30 transition-all duration-500 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-6">
                        
                        {/* Design Image */}
                        <div className="relative w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden flex-shrink-0">
                          {item.designName !== 'تصميم غير معروف' ? (
                            <Image 
                              src={invitationDesigns.find(d => d.id === item.designId)?.image || '/placeholder-design.jpg'} 
                              alt={item.designName}
                              height={200}
                              width={150}
                              className="w-full h-full object-cover"
                              // onClick={}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${item.designName !== 'تصميم غير معروف' ? 'hidden' : ''}`}>
                            <Calendar className="w-10 h-10 text-[#C09B52]" />
                          </div>
                          <div className="absolute top-2 right-2 w-2 h-2 bg-[#C09B52] rounded-full animate-pulse"></div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                            <span className="text-white text-xs font-medium">{item.designCategory}</span>
                          </div>
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-white group-hover:text-[#C09B52] transition-colors duration-300">
                                باقة {item.packageName} - {item.details.eventName}
                              </h3>
                              <div className="mt-3 space-y-2">
                                <p className="text-gray-400 text-sm flex items-center gap-2">
                                  <span className="font-medium text-[#C09B52]">المضيف:</span> 
                                  <span>{item.details.hostName}</span>
                                </p>
                                
                                <p className="text-gray-400 text-sm flex items-center gap-2">
                                  <span className="font-medium text-[#C09B52]">التاريخ:</span> 
                                  <span>{formatArabicDate(item.details.eventDate)}</span>
                                </p>
                                
                                <p className="text-gray-400 text-sm flex items-center gap-2">
                                  <span className="font-medium text-[#C09B52]">الوقت:</span> 
                                  <span>{formatArabicTime(item.details.startTime)} - {formatArabicTime(item.details.endTime)}</span>
                                </p>
                                
                                <p className="text-gray-400 text-sm flex items-start gap-2">
                                  <span className="font-medium text-[#C09B52] flex-shrink-0">الموقع:</span> 
                                  <span className="break-words">{item.details.displayName || item.details.eventLocation}</span>
                                </p>
                                
                                <p className="text-gray-400 text-sm flex items-center gap-2">
                                  <span className="font-medium text-[#C09B52]">عدد الدعوات:</span> 
                                  <span>{item.details.inviteCount.toLocaleString('ar-SA')}</span>
                                </p>

                                {/* Location Coordinates if available */}
                                {/* {item.details.locationCoordinates && (
                                  <p className="text-gray-500 text-xs flex items-center gap-2">
                                    <span className="font-medium">المدينة:</span> 
                                    <span>{item.details.detectedCity}</span>
                                  </p>
                                )} */}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 ml-4 flex-shrink-0">
                              <button
                                onClick={() => handleEditItem(item)}
                                disabled={isLoading}
                                className="w-8 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                                title="تعديل المناسبة"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (item._id) {
                                    handleRemoveItem(item._id);
                                  } else {
                                    // Optionally show a toast notification
                                    toast({
                                      title: "خطأ",
                                      description: "لا يمكن حذف هذا العنصر (معرف غير صحيح)",
                                      variant: "destructive",
                                      duration: 3000
                                    });
                                  }
                                }}
                                disabled={isLoading}
                                className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                                title="حذف من السلة"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Additional Services */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {item.details.additionalCards > 0 && (
                              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                                {item.details.additionalCards.toLocaleString('ar-SA')} كرت إضافي
                              </span>
                            )}
                            {item.details.gateSupervisors > 0 && (
                              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                                مشرفين بوابة: {item.details.gateSupervisors}
                              </span>
                            )}
                            {item.details.extraHours > 0 && (
                              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                                ساعات إضافية: {item.details.extraHours}
                              </span>
                            )}
                            {item.details.fastDelivery && (
                              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                                تسليم سريع
                              </span>
                            )}
                          </div>

                          {/* Invitation Text Preview */}
                          {item.details.invitationText && (
                            <div className="bg-white/5 rounded-lg p-3 mb-4">
                              <p className="text-[#C09B52] text-sm font-medium mb-1">نص الدعوة:</p>
                              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                                {item.details.invitationText}
                              </p>
                            </div>
                          )}

                          {/* Price */}
                          <div className="flex items-center justify-between pt-2">
                            <div>
                              <span className="text-2xl font-bold text-[#C09B52]">
                                {formatCurrency(item.totalPrice)}
                              </span>
                              <p className="text-gray-500 text-sm">شامل جميع الخدمات</p>
                            </div>

                            {/* Added date */}
                            <div className="text-left">
                            <p className="text-gray-500 text-xs">
                              أُضيف في {formatArabicDate(item.addedAt || new Date().toISOString())}
                            </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary - Same as before */}
              <div className="space-y-6">
                
                {/* Summary Card */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-[#C09B52]" />
                      <span>ملخص الطلب</span>
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">المجموع الفرعي ({cartItems.length} مناسبة)</span>
                      <span className="text-white font-medium">
                        {formatCurrency(pricing.total)}
                      </span>
                    </div>

                  

                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-white">الإجمالي</span>
                        <span className="text-2xl font-bold text-[#C09B52]">
                          {formatCurrency(pricing.total)}
                        </span>
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 rounded-lg p-3">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>دفع آمن ومحمي</span>
                    </div>

                    {/* Checkout Button */}
                    <button 
                      onClick={handleCheckout}
                      disabled={isLoading || cartItems.length === 0}
                      className="w-full py-4 bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#C09B52]/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>جاري التحميل...</span>
                        </>
                      ) : (
                        <>
                          <span>إتمام الطلب</span>
                          <ArrowLeft className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    {/* Continue Shopping */}
                    <button
                      onClick={() => router.push('/packages')}
                      className="block w-full py-3 text-center border border-[#C09B52] text-[#C09B52] rounded-xl font-medium hover:bg-[#C09B52] hover:text-black transition-all duration-300"
                    >
                      متابعة التسوق
                    </button>
                  </div>
                </div>

               

                {/* Customer Reviews */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">آراء العملاء</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">4.8 من 5</span>
                    </div>
                    <p className="text-gray-300 text-sm italic">
                      &quot;خدمة ممتازة وتصاميم رائعة. أنصح الجميع بتجربتها&quot;
                    </p>
                    <span className="text-gray-500 text-xs">- أحمد محمد</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cart Modal for Editing */}
      {isCartModalOpen && (
        <CartModal
          isOpen={isCartModalOpen}
          onClose={() => {
            closeModals();
            setItemToEdit(null);
          }}
          selectedPackage={selectedPackage}
          selectedDesign={selectedDesign}
          editItem={itemToEdit} // Pass the item to edit
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="تأكيد حذف المناسبة"
        message="هل تريد حذف هذه المناسبة من السلة؟ لن يمكن التراجع عن هذا الإجراء."
      />
    </>
  );
}

export default function CartPage() {
  return (
    <InstantRouteGuard allowedRoles={['user']}>
      <CartPageContent />
    </InstantRouteGuard>
  );
}
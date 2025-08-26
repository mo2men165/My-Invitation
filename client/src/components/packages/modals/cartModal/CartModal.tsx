// Updated CartModal.tsx - Complete component with cart-only flow
'use client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { InvitationDesign, PackageData } from '@/types';
import { packageData } from '@/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToCart, updateCartItem } from '@/store/cartSlice';
import { useToast } from '@/hooks/useToast';
import { useCartFormValidation } from '@/hooks/useCartFormValidation';
import { useCartForm } from '@/hooks/useCartForm';
import { usePricing } from '@/hooks/usePricing';
import { formUtils } from '@/utils/formUtils';

// Import components
import CartHeader from './CartHeader';
import PackageFeatures from './PackageFeatures';
import EventDetailsForm from './EventDetailsForm';
import LocationMapSection from './LocationMapSection';
import AdditionalServicesSection from './AdditionalServicesSection';
import LazyGoogleMaps from './LazyGoogleMaps';
import ConfirmationModal from './ConfirmationModal';
import { useCartFieldUpdates } from '@/hooks/useCartFieldUpdates';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: keyof PackageData | null;
  selectedDesign: InvitationDesign | null;
  editItem?: any; // Existing cart item to edit
}

const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  selectedPackage,
  selectedDesign,
  editItem = null
}) => {
  const dispatch = useAppDispatch();
  const { isLoading: cartLoading } = useAppSelector((state) => state.cart);
  const cartItems = useAppSelector((state) => state.cart.items);
  const { toast } = useToast();
  
  const {
    cartForm,
    locationData,
    handleInputChange,
    handleLocationSelect,
    resetForm,
    setCartForm,
    setLocationData
  } = useCartForm();
  
  const { errors, validateAllFields, clearErrors } = useCartFormValidation();

  // UI state
  const [showMap, setShowMap] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const { updateField, isFieldUpdating, updatePackageType, updateInviteCount } = useCartFieldUpdates();

  // Get current package type - use updated cart item data in edit mode
  const currentSelectedPackage = useMemo(() => {
    if (isEditMode && editItem) {
      // Find the updated cart item from Redux state
      const updatedItem = cartItems.find(item => item._id === editItem._id);
      return updatedItem ? updatedItem.packageType : selectedPackage;
    }
    return selectedPackage;
  }, [isEditMode, editItem, selectedPackage, cartItems]);

  // Memoized values
  const currentPackage = useMemo(() => {
    return currentSelectedPackage ? packageData[currentSelectedPackage] : null;
  }, [currentSelectedPackage]);

  const { totalPrice } = usePricing(currentSelectedPackage, cartForm);

  const hasFormData = useMemo(() => {
    return formUtils.hasFormData(cartForm);
  }, [cartForm]);

  const hasLocationCoords = useMemo(() => {
    return locationData.coordinates.lat !== 24.7136 || locationData.coordinates.lng !== 46.6753;
  }, [locationData.coordinates]);

  // Check if any field is being updated
  const isUpdatingFields = useMemo(() => {
    return editItem?._id && isFieldUpdating(editItem._id);
  }, [editItem?._id, isFieldUpdating]);

  // Pre-populate form when editing
  useEffect(() => {
    if (editItem && isOpen) {
      setIsEditMode(true);
      
      setCartForm({
        inviteCount: editItem.details.inviteCount || 100,
        qrCode: editItem.details.qrCode ?? true,
        eventDate: editItem.details.eventDate ? editItem.details.eventDate.split('T')[0] : '',
        startTime: editItem.details.startTime || '',
        endTime: editItem.details.endTime || '',
        invitationText: editItem.details.invitationText || '',
        hostName: editItem.details.hostName || '',
        eventLocation: editItem.details.eventLocation || '',
        additionalCards: editItem.details.additionalCards || 0,
        gateSupervisors: editItem.details.gateSupervisors || '',
        fastDelivery: editItem.details.fastDelivery || false
      });

      if (editItem.details.locationCoordinates) {
        setLocationData({
          address: editItem.details.eventLocation || '',
          coordinates: editItem.details.locationCoordinates,
          city: editItem.details.detectedCity || ''
        });
        setShowMap(true);
      }

      clearErrors();
    } else if (isOpen && !editItem) {
      setIsEditMode(false);
      resetForm();
      clearErrors();
    }
  }, [editItem, isOpen, setCartForm, setLocationData, resetForm, clearErrors]);

  const handleLocationChange = useCallback((value: string) => {
    handleInputChange('eventLocation', value);
    // Real-time update for edit mode
    if (isEditMode && editItem?._id) {
      const timeoutId = setTimeout(() => {
        updateField(editItem._id, 'details.eventLocation', value);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [handleInputChange, isEditMode, editItem?._id, updateField]);

  // Enhanced input change handler with real-time updates
  const handleEnhancedInputChange = useCallback((field: string, value: any) => {
    handleInputChange(field, value);
    
    // Real-time updates for edit mode with debouncing
    if (isEditMode && editItem?._id) {
      const timeoutId = setTimeout(() => {
        if (field === 'inviteCount') {
          updateInviteCount(editItem._id, value);
        } else if (['hostName', 'invitationText'].includes(field)) {
          updateField(editItem._id, `details.${field}`, value);
        } else if (field === 'packageType') {
          updatePackageType(editItem._id, value);
        } else if (field.startsWith('details.')) {
          updateField(editItem._id, field, value);
        } else {
          updateField(editItem._id, `details.${field}`, value);
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [handleInputChange, isEditMode, editItem?._id, updateField, updateInviteCount, updatePackageType]);

  const handleQuickPackageChange = useCallback(async (newPackage: 'classic' | 'premium' | 'vip') => {
    if (isEditMode && editItem?._id && newPackage !== currentSelectedPackage) {
      const success = await updatePackageType(editItem._id, newPackage);
      if (success) {
        toast({
          title: "تم تغيير الباقة",
          description: `تم التحديث إلى باقة ${newPackage}`,
          variant: "default",
          duration: 2000
        });
      }
    }
  }, [isEditMode, editItem, currentSelectedPackage, updatePackageType, toast]);

  const handleAddToCart = useCallback(async () => {
    if (!currentSelectedPackage || !selectedDesign) return;
    
    if (!validateAllFields(cartForm, showMap, hasLocationCoords)) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى تصحيح الأخطاء المذكورة في النموذج",
        variant: "destructive",
        duration: 4000
      });
      return;
    }
  
    // Prepare the data with ALL required fields and proper defaults
    const details: any = {
      // Include ALL required fields from cartItemDetailsSchema
      inviteCount: cartForm.inviteCount || 100,
      qrCode: cartForm.qrCode !== undefined ? cartForm.qrCode : true,
      eventDate: cartForm.eventDate ? new Date(cartForm.eventDate).toISOString() : new Date().toISOString(),
      startTime: cartForm.startTime || '12:00',
      endTime: cartForm.endTime || '13:00',
      invitationText: cartForm.invitationText || '',
      hostName: cartForm.hostName || '',
      eventLocation: cartForm.eventLocation || '',
      additionalCards: cartForm.additionalCards || 0,
      gateSupervisors: cartForm.gateSupervisors || '',
      fastDelivery: cartForm.fastDelivery || false,
      // Use undefined instead of null for optional fields
      locationCoordinates: locationData.coordinates,
      detectedCity: locationData.city 
    };
  
    // Only include detectedCity if it has a value
    if (showMap && hasLocationCoords && locationData.city) {
      details.detectedCity = locationData.city;
    }
  
    const itemData = {
      designId: selectedDesign.id,
      packageType: currentSelectedPackage,
      details,
      totalPrice
    };
  
    console.log('Final payload to API:', JSON.stringify(itemData, null, 2));
  
    try {
      if (isEditMode && editItem) {
        await dispatch(updateCartItem({ 
          id: editItem._id, 
          updates: itemData 
        })).unwrap();
        
        toast({
          title: "تم تحديث العنصر",
          description: "تم تحديث العنصر في السلة بنجاح",
          variant: "default",
          duration: 3000
        });
      } else {
        await dispatch(addToCart(itemData)).unwrap();
        
        toast({
          title: "تم إضافة للسلة",
          description: "تم إضافة العنصر للسلة. يمكنك المتابعة للدفع لإنشاء المناسبة.",
          variant: "default",
          duration: 3000
        });
      }
      
      resetForm();
      clearErrors();
      onClose();
    } catch (error: any) {
      console.error('API Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      toast({
        title: isEditMode ? "خطأ في التحديث" : "خطأ في الإضافة",
        description: error?.response?.data?.error?.message || error?.message || (isEditMode ? "فشل في تحديث العنصر" : "فشل في إضافة العنصر للسلة"),
        variant: "destructive",
        duration: 3000
      });
    }
  }, [
    currentSelectedPackage,
    selectedDesign,
    cartForm,
    showMap,
    hasLocationCoords,
    locationData,
    totalPrice,
    isEditMode,
    editItem,
    dispatch,
    toast,
    resetForm,
    clearErrors,
    onClose,
    validateAllFields
  ]);

  const handleClose = useCallback(() => {
    if (hasFormData && !isEditMode) {
      setShowConfirmation(true);
    } else if (isEditMode) {
      setShowConfirmation(true);
    } else {
      resetForm();
      clearErrors();
      setShowMap(false);
      setMapSearchQuery('');
      onClose();
    }
  }, [hasFormData, isEditMode, resetForm, clearErrors, onClose]);

  const handleConfirmClose = useCallback(() => {
    setShowConfirmation(false);
    resetForm();
    clearErrors();
    setShowMap(false);
    setMapSearchQuery('');
    setIsEditMode(false);
    onClose();
  }, [resetForm, clearErrors, onClose]);

  const handleCancelClose = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  const handleToggleMap = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);

  const handleMapSearchQueryChange = useCallback((query: string) => {
    setMapSearchQuery(query);
  }, []);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showConfirmation) {
          setShowConfirmation(false);
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, showConfirmation, handleClose]);

  if (!isOpen || !selectedPackage || !selectedDesign || !currentPackage) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl border border-white/20 shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
          
          <CartHeader
            selectedPackage={currentSelectedPackage!}
            selectedDesign={selectedDesign}
            onClose={handleClose}
            isEditMode={isEditMode}
          />

          <div className="p-6 grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              
              {/* Enhanced PackageFeatures with quick switcher for edit mode */}
              <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">نوع الباقة</h3>
                
                {/* Quick Package Switcher for Edit Mode */}
                {isEditMode && (
                  <div className="mb-4 p-3 bg-[#C09B52]/10 rounded-lg border border-[#C09B52]/30">
                    <p className="text-sm text-[#C09B52] mb-2">تحديث سريع:</p>
                    <div className="flex gap-2">
                      {['classic', 'premium', 'vip'].map((pkg) => (
                        <button
                          key={pkg}
                          onClick={() => handleQuickPackageChange(pkg as any)}
                          disabled={isUpdatingFields}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            currentSelectedPackage === pkg
                              ? 'bg-[#C09B52] text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          } disabled:opacity-50 flex items-center gap-1`}
                        >
                          {pkg === 'classic' ? 'كلاسيك' : pkg === 'premium' ? 'بريميوم' : 'VIP'}
                          {isUpdatingFields && (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <PackageFeatures selectedPackage={currentSelectedPackage!} />
              </div>
              
              <EventDetailsForm
                cartForm={cartForm}
                onInputChange={handleEnhancedInputChange}
                errors={errors}
                currentPackage={currentPackage}
                isEditMode={isEditMode}
                isUpdating={isUpdatingFields}
              />
              
              <LocationMapSection
                eventLocation={cartForm.eventLocation}
                onLocationChange={handleLocationChange}
                locationError={errors.eventLocation}
                showMap={showMap}
                onToggleMap={handleToggleMap}
                mapComponent={showMap ? (
                  <LazyGoogleMaps
                    locationData={locationData}
                    onLocationSelect={handleLocationSelect}
                    errors={errors}
                    searchQuery={mapSearchQuery}
                    onSearchQueryChange={handleMapSearchQueryChange}
                  />
                ) : undefined}
              />
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
                <AdditionalServicesSection
                  cartForm={cartForm}
                  onInputChange={handleEnhancedInputChange}
                />
              </div>
              
              <div className="bg-gradient-to-br from-[#C09B52]/10 via-[#C09B52]/5 to-transparent rounded-2xl border border-[#C09B52]/20 p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>ملخص الطلب</span>
                  {isUpdatingFields && (
                    <div className="w-4 h-4 border-2 border-[#C09B52] border-t-transparent rounded-full animate-spin"></div>
                  )}
                </h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-300">باقة {currentPackage.name} ({cartForm.inviteCount} دعوة)</span>
                    <span className="text-white font-semibold">
                      {currentPackage.pricing.find(p => p.invites === cartForm.inviteCount)?.price.toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                  
                  {cartForm.additionalCards > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <span className="text-gray-300">كروت إضافية ({cartForm.additionalCards})</span>
                      <span className="text-white font-semibold">
                        {(cartForm.additionalCards * 30).toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  )}
                  
                  {cartForm.gateSupervisors && (
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <span className="text-gray-300">مشرفين البوابة</span>
                      <span className="text-white font-semibold">حسب الاختيار</span>
                    </div>
                  )}
                  
                  {cartForm.fastDelivery && (
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <span className="text-gray-300">تسريع التنفيذ</span>
                      <span className="text-white font-semibold">3,000 ر.س</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#C09B52]/30 pt-4 mb-6">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#C09B52]/20 to-[#C09B52]/10 rounded-xl">
                    <span className="text-xl font-bold text-white">الإجمالي</span>
                    <span className="text-3xl font-bold text-[#C09B52]">
                      {totalPrice.toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={cartLoading || isUpdatingFields}
                  className={`w-full py-4 bg-gradient-to-r ${currentPackage.color} text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10">
                    {(cartLoading || isUpdatingFields)
                      ? (isEditMode ? 'جاري التحديث...' : 'جاري الإضافة...')
                      : (isEditMode ? 'حفظ التعديلات' : 'إضافة للسلة')
                    }
                  </span>
                </button>

                {/* Info text for new flow */}
                {!isEditMode && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">
                      سيتم إنشاء المناسبة بعد إتمام عملية الدفع
                    </p>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">
                    الحقول المطلوبة: <span className="text-red-400">*</span>
                  </div>
                  {Object.keys(errors).length > 0 && (
                    <div className="flex items-center justify-center gap-1 text-xs text-red-400">
                      <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                      {Object.keys(errors).length} خطأ يحتاج إلى تصحيح
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        title={isEditMode ? "تأكيد إلغاء التعديلات" : "تأكيد الإغلاق"}
        message={isEditMode 
          ? "سيتم فقدان التعديلات المدخلة. هل تريد المتابعة؟"
          : "سيتم فقدان البيانات المدخلة. هل تريد المتابعة؟"
        }
      />
    </>
  );
};

export default CartModal;
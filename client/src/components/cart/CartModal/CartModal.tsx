import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { packageData } from '@/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToCart, updateCartItem } from '@/store/cartSlice';
import { useToast } from '@/hooks/useToast';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useAuth } from '@/hooks/useAuth';
import { calculatePackagePrice } from '@/utils/calculations';
import { useCartModalState } from './hooks/useCartModalState';
import { CartModalProps } from './types';
import { CITY_COORDINATES, DEFAULT_LOCATION } from '@/constants/cartModalConstants';
import '../cart-scroll.css';

// Components
import CartHeader from './components/CartHeader';
import EventDetailsForm from './components/EventDetailsForm';
import LocationSection from './components/LocationSection';
import AdditionalServices from './components/AdditionalServices';
import CartSummary from './components/CartSummary';
import CartActions from './components/CartActions';
import PackageFeatures from './components/PackageFeatures';
import ConfirmationModal from './components/ConfirmationModal';

// Lazy load heavy components
import LazyGoogleMaps from './components/LazyGoogleMaps';

const CartModal = memo<CartModalProps>(({
  isOpen,
  onClose,
  selectedPackage,
  selectedDesign,
  editItem = null
}) => {
  const dispatch = useAppDispatch();
  const { isLoading: cartLoading } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const {
    state,
    formData,
    locationData,
    errors,
    actions
  } = useCartModalState(editItem);

  // Extract individual functions to avoid dependency issues
  const {
    updateFormField,
    updateLocation,
    toggleMap,
    setEditMode,
    resetForm,
    validateForm,
    toggleConfirmation
  } = actions;

  // Track if we've already populated user data
  const hasPopulatedUserData = useRef(false);

  // Block body scroll when modal is open
  useBodyScrollLock(isOpen);

  // Memoized values to prevent unnecessary re-renders
  const currentPackage = useMemo(() => {
    return selectedPackage ? packageData[selectedPackage] : null;
  }, [selectedPackage]);

  const hasFormData = useMemo(() => {
    return Object.values(formData).some(value => 
      value !== '' && value !== 0 && value !== false
    );
  }, [formData]);

  const hasLocationCoords = useMemo(() => {
    return locationData.coordinates.lat !== 24.7136 || locationData.coordinates.lng !== 46.6753;
  }, [locationData.coordinates]);

  const errorCount = useMemo(() => {
    return Object.keys(errors).filter(key => errors[key]).length;
  }, [errors]);

  // Pre-populate form when editing
  useEffect(() => {
    if (isOpen && editItem && !state.isEditMode) {
      setEditMode(true);
      
      updateFormField('inviteCount', editItem.details.inviteCount || 100);
      updateFormField('eventDate', editItem.details.eventDate ? editItem.details.eventDate.split('T')[0] : '');
      updateFormField('startTime', editItem.details.startTime || '');
      updateFormField('endTime', editItem.details.endTime || '');
      updateFormField('invitationText', editItem.details.invitationText || '');
      updateFormField('hostName', editItem.details.hostName || '');
      updateFormField('eventLocation', editItem.details.eventLocation || '');
      updateFormField('additionalCards', editItem.details.additionalCards || 0);
      updateFormField('gateSupervisors', typeof editItem.details.gateSupervisors === 'number' ? editItem.details.gateSupervisors : 0);
      updateFormField('extraHours', editItem.details.extraHours || 0);
      updateFormField('expeditedDelivery', editItem.details.expeditedDelivery || false);

      if (editItem.details.locationCoordinates) {
        updateLocation(
          editItem.details.locationCoordinates.lat,
          editItem.details.locationCoordinates.lng,
          editItem.details.eventLocation || '',
          editItem.details.detectedCity || 'الرياض'
        );
        toggleMap();
      }
    }
  }, [editItem, isOpen, state.isEditMode, setEditMode, updateFormField, updateLocation, toggleMap]);

  // Pre-populate user data when opening for new item
  useEffect(() => {
    if (isOpen && !editItem && !hasPopulatedUserData.current) {
      if (user && isAuthenticated) {
        // Small delay to ensure all data is properly loaded
        const timer = setTimeout(() => {
          // Priority: name > firstName + lastName > firstName > lastName
          const userName = user.name || 
            (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
            user.firstName ||
            user.lastName ||
            '';
          
          if (userName) {
            updateFormField('hostName', userName);
            hasPopulatedUserData.current = true;
          }
        }, 100); // Small delay to ensure sync
        
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, editItem, user, isAuthenticated, updateFormField]);

  // Set location based on user city
  useEffect(() => {
    if (isOpen && !editItem && user?.city) {
      const coords = CITY_COORDINATES[user.city as keyof typeof CITY_COORDINATES] || DEFAULT_LOCATION;
      updateLocation(coords.lat, coords.lng, '', user.city);
    }
  }, [isOpen, editItem, user?.city, updateLocation]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditMode(false);
      resetForm();
      hasPopulatedUserData.current = false;
    }
  }, [isOpen, setEditMode, resetForm]);

  // Prepare the data with ALL required fields and proper defaults
  const details = useMemo(() => ({
    inviteCount: formData.inviteCount || 100,
    eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : new Date().toISOString(),
    startTime: formData.startTime || '12:00',
    endTime: formData.endTime || '13:00',
    invitationText: formData.invitationText || '',
    hostName: formData.hostName || '',
    eventLocation: formData.eventLocation || '',
    additionalCards: formData.additionalCards || 0,
    gateSupervisors: typeof formData.gateSupervisors === 'number' ? formData.gateSupervisors : 0,
    extraHours: formData.extraHours || 0,
    expeditedDelivery: formData.expeditedDelivery || false,
    locationCoordinates: locationData.coordinates,
    detectedCity: locationData.city || 'الرياض' // Always pass city, default to Riyadh if empty
  }), [formData, locationData]);

  const itemData = useMemo(() => {
    // Only calculate price if we have valid package and design
    if (!selectedPackage || !selectedDesign || !isOpen) {
      return {
        designId: '',
        packageType: 'classic' as 'classic' | 'premium' | 'vip',
        details,
        totalPrice: 0
      };
    }

    // Validate that the package exists in packageData
    if (!packageData[selectedPackage]) {
      console.warn(`Package ${selectedPackage} not found in packageData`);
      return {
        designId: selectedDesign.id,
        packageType: selectedPackage as 'classic' | 'premium' | 'vip',
        details,
        totalPrice: 0
      };
    }

    const calculatedPrice = calculatePackagePrice(
      selectedPackage,
      formData
    );
    
    return {
      designId: selectedDesign.id,
      packageType: selectedPackage as 'classic' | 'premium' | 'vip',
      details,
      totalPrice: calculatedPrice
    };
  }, [selectedDesign, selectedPackage, details, formData, isOpen]);

  const handleAddToCart = useCallback(async () => {
    if (!selectedPackage || !selectedDesign) return;
    
    if (!validateForm()) {
      toast({
        title: "يرجى تصحيح الأخطاء التالية",
        description: "يرجى مراجعة البيانات المدخلة",
        variant: "destructive",
        duration: 5000
      });
      return;
    }

    try {
      if (state.isEditMode && editItem) {
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
      onClose();
    } catch (error: any) {
      toast({
        title: state.isEditMode ? "خطأ في التحديث" : "خطأ في الإضافة",
        description: error?.response?.data?.error?.message || error?.message || (state.isEditMode ? "فشل في تحديث العنصر" : "فشل في إضافة العنصر للسلة"),
        variant: "destructive",
        duration: 3000
      });
    }
  }, [
    selectedPackage,
    selectedDesign,
    validateForm,
    state.isEditMode,
    editItem,
    dispatch,
    toast,
    resetForm,
    onClose,
    details,
    itemData
  ]);

  const handleClose = useCallback(() => {
    if (hasFormData && !state.isEditMode) {
      toggleConfirmation();
    } else if (state.isEditMode) {
      toggleConfirmation();
    } else {
      resetForm();
      onClose();
    }
  }, [hasFormData, state.isEditMode, toggleConfirmation, resetForm, onClose]);

  const handleConfirmClose = useCallback(() => {
    toggleConfirmation();
    resetForm();
    onClose();
  }, [toggleConfirmation, resetForm, onClose]);

  const handleCancelClose = useCallback(() => {
    toggleConfirmation();
  }, [toggleConfirmation]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (state.showConfirmation) {
          toggleConfirmation();
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, state.showConfirmation, handleClose, toggleConfirmation]);

  if (!isOpen || !selectedPackage || !selectedDesign || !currentPackage) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div 
          className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl border border-white/20 shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto modal-scroll-container"
        >
          
          <CartHeader
            selectedPackage={selectedPackage}
            selectedDesign={selectedDesign}
            onClose={handleClose}
            isEditMode={state.isEditMode}
          />

          <div className="p-6 grid lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <EventDetailsForm
                formData={formData}
                onInputChange={updateFormField}
                errors={errors}
                currentPackage={currentPackage}
                isEditMode={state.isEditMode}
                isUpdating={state.isUpdating}
              />
              
              <LocationSection
                eventLocation={formData.eventLocation}
                onLocationChange={(value) => updateFormField('eventLocation', value)}
                onToggleMap={toggleMap}
                showMap={state.showMap}
                locationError={errors.eventLocation}
                mapComponent={
                  <div className={`mt-4 ${state.showMap ? 'block' : 'hidden'}`}>
                    <LazyGoogleMaps
                      locationData={locationData}
                      onLocationSelect={updateLocation}
                      errors={errors}
                      searchQuery={state.mapSearchQuery}
                      onSearchQueryChange={(query) => updateFormField('mapSearchQuery', query)}
                    />
                  </div>
                }
              />
            </div>

            {/* Right Column - Summary and Actions */}
            <div className="space-y-6">
              {/* Package Features */}
              {selectedPackage && (
                <PackageFeatures selectedPackage={selectedPackage} />
              )}
              
              <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
                <AdditionalServices
                  formData={formData}
                  onInputChange={updateFormField}
                  packageType={selectedPackage}
                />
              </div>
              
              <CartSummary
                formData={formData}
                currentPackage={currentPackage}
                packageType={selectedPackage}
                isUpdating={state.isUpdating}
              />

              <CartActions
                onAddToCart={handleAddToCart}
                onCancel={handleClose}
                isLoading={cartLoading || state.isUpdating}
                isEditMode={state.isEditMode}
                hasErrors={errorCount > 0}
                errorCount={errorCount}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={state.showConfirmation}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        title={state.isEditMode ? "تأكيد إلغاء التعديلات" : "تأكيد الإغلاق"}
        message={state.isEditMode 
                ? "سيتم فقدان التعديلات المدخلة. هل تريد المتابعة؟"
                : "سيتم فقدان البيانات المدخلة. هل تريد المتابعة؟"
              }
        confirmText="متابعة"
        cancelText="إلغاء"
        variant="warning"
      />
    </>
  );
});

CartModal.displayName = 'CartModal';
export default CartModal;

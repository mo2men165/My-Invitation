import { useState, useCallback, useMemo, useEffect } from 'react';
import { CartModalState, CartFormData, LocationData, FormErrors } from '../types';

const initialFormData: CartFormData = {
  eventName: '',
  inviteCount: 100,
  eventDate: '',
  startTime: '',
  endTime: '',
  invitationText: '',
  hostName: '',
  eventLocation: '',
  additionalCards: 0,
  gateSupervisors: 0,
  extraHours: 0,
  qrCode: true,
  fastDelivery: false,
  expeditedDelivery: false,
  isCustomDesign: false,
  customDesignNotes: '',
};

const initialLocationData: LocationData = {
  address: '',
  coordinates: { lat: 24.7136, lng: 46.6753 },
  city: '',
};

export const useCartModalState = (editItem?: any) => {
  const [state, setState] = useState<CartModalState>({
    isEditMode: false,
    showMap: false,
    showConfirmation: false,
    mapSearchQuery: '',
    isUpdating: false,
  });

  const [formData, setFormData] = useState<CartFormData>(initialFormData);
  const [locationData, setLocationData] = useState<LocationData>(initialLocationData);
  const [errors, setErrors] = useState<FormErrors>({});

  // Real-time validation - clear errors when fields become valid
  useEffect(() => {
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      let hasChanges = false;

      // Check each field and clear error if it's now valid
      if (prevErrors.hostName && formData.hostName?.trim()) {
        delete newErrors.hostName;
        hasChanges = true;
      }

      if (prevErrors.eventDate && formData.eventDate) {
        delete newErrors.eventDate;
        hasChanges = true;
      }

      if (prevErrors.startTime && formData.startTime) {
        delete newErrors.startTime;
        hasChanges = true;
      }

      if (prevErrors.eventLocation && formData.eventLocation?.trim()) {
        delete newErrors.eventLocation;
        hasChanges = true;
      }

      if (prevErrors.invitationText && formData.invitationText?.trim()) {
        delete newErrors.invitationText;
        hasChanges = true;
      }

      return hasChanges ? newErrors : prevErrors;
    });
  }, [formData]);

  // Memoized actions to prevent unnecessary re-renders
  const updateFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const updateLocation = useCallback((lat: number, lng: number, address: string, city?: string) => {
    setLocationData({
      address,
      coordinates: { lat, lng },
      city: city || '', // Will be detected separately
    });
    setFormData(prev => ({ ...prev, eventLocation: address }));
    
    // Clear eventLocation error when location is updated
    setErrors(prev => {
      if (prev.eventLocation) {
        const newErrors = { ...prev };
        delete newErrors.eventLocation;
        return newErrors;
      }
      return prev;
    });
  }, []);

  const toggleMap = useCallback(() => {
    setState(prev => ({ ...prev, showMap: !prev.showMap }));
  }, []);

  const updateMapSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, mapSearchQuery: query }));
  }, []);

  const toggleConfirmation = useCallback(() => {
    setState(prev => ({ ...prev, showConfirmation: !prev.showConfirmation }));
  }, []);

  const setEditMode = useCallback((mode: boolean) => {
    setState(prev => ({ ...prev, isEditMode: mode }));
  }, []);

  const setUpdating = useCallback((updating: boolean) => {
    setState(prev => ({ ...prev, isUpdating: updating }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setLocationData(initialLocationData);
    setErrors({});
    setState(prev => ({
      ...prev,
      isEditMode: false,
      showMap: false,
      showConfirmation: false,
      isUpdating: false,
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Required field validation
    if (!formData.hostName?.trim()) {
      newErrors.hostName = 'اسم المضيف مطلوب';
      isValid = false;
    }

    if (!formData.eventDate) {
      newErrors.eventDate = 'تاريخ المناسبة مطلوب';
      isValid = false;
    }

    if (!formData.startTime) {
      newErrors.startTime = 'وقت البداية مطلوب';
      isValid = false;
    }

    if (!formData.eventLocation?.trim()) {
      newErrors.eventLocation = 'موقع المناسبة مطلوب';
      isValid = false;
    }

    if (!formData.invitationText?.trim()) {
      newErrors.invitationText = 'نص الدعوة مطلوب';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getErrorSummary = useCallback(() => {
    const errorCount = Object.keys(errors).length;
    return errorCount > 0 ? `يوجد ${errorCount} خطأ يحتاج إلى تصحيح` : '';
  }, [errors]);

  // Create actions object
  const actions = useMemo(() => ({
    updateFormField,
    updateLocation,
    toggleMap,
    updateMapSearchQuery,
    toggleConfirmation,
    setEditMode,
    setUpdating,
    resetForm,
    validateForm,
    clearErrors,
    getErrorSummary
  }), [updateFormField, updateLocation, toggleMap, updateMapSearchQuery, toggleConfirmation, setEditMode, setUpdating, resetForm, validateForm, clearErrors, getErrorSummary]);

  return {
    state,
    formData,
    locationData,
    errors,
    actions,
  };
};

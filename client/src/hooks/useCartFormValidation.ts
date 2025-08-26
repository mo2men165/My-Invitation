import { useState, useCallback, useMemo } from 'react';
import { CartForm } from '@/types';

interface FormErrors {
  [key: string]: string;
}

export const useCartFormValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Validation rules
  const validationRules = useMemo(() => ({
    hostName: (value: string) => {
      if (!value?.trim()) return 'اسم المضيف مطلوب';
      if (value.trim().length < 2) return 'اسم المضيف يجب أن يكون على الأقل حرفين';
      return null;
    },
    eventDate: (value: string) => {
      if (!value) return 'تاريخ المناسبة مطلوب';
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) return 'لا يمكن اختيار تاريخ في الماضي';
      return null;
    },
    startTime: (value: string) => {
      if (!value) return 'وقت البداية مطلوب';
      return null;
    },
    endTime: (value: string, form: CartForm) => {
      if (!value) return 'وقت النهاية مطلوب';
      if (form.startTime && value <= form.startTime) {
        return 'وقت النهاية يجب أن يكون بعد وقت البداية';
      }
      return null;
    },
    eventLocation: (value: string) => {
      if (!value?.trim()) return 'موقع المناسبة مطلوب';
      if (value.trim().length < 3) return 'يرجى إدخال عنوان مفصل';
      return null;
    },
    invitationText: (value: string) => {
      if (!value?.trim()) return 'نص الدعوة مطلوب';
      if (value.trim().length < 10) return 'نص الدعوة قصير جداً';
      if (value.length > 1000) return 'نص الدعوة طويل جداً';
      return null;
    }
  }), []);

  const validateField = useCallback((field: string, value: any, form?: CartForm) => {
    const rule = validationRules[field as keyof typeof validationRules];
    if (!rule) return null;
    
    // Check if the rule needs the form parameter (like endTime validation)
    if (field === 'endTime' && form) {
      return (rule as (value: string, form: CartForm) => string | null)(value, form);
    }
    
    // For other rules that only need the value
    return (rule as (value: string) => string | null)(value);
  }, [validationRules]);

  const validateFieldWithTouch = useCallback((field: string, value: any, form?: CartForm) => {
    setTouchedFields(prev => new Set(prev).add(field));
    
    const error = validateField(field, value, form);
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
    
    // Clear error if validation passes
    if (!error) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    return !error;
  }, [validateField]);

  const validateAllFields = useCallback((form: CartForm, showMap: boolean, hasLocationCoords: boolean) => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate all required fields
    const fieldsToValidate = ['hostName', 'eventDate', 'startTime', 'endTime', 'eventLocation', 'invitationText'];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, form[field as keyof CartForm], form);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    // Special validation for map location if map is shown
    if (showMap && !hasLocationCoords) {
      newErrors.location = 'يرجى تحديد الموقع على الخريطة';
      isValid = false;
    }

    setErrors(newErrors);
    setTouchedFields(new Set(fieldsToValidate));
    
    return isValid;
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouchedFields(new Set());
  }, []);

  const clearLocationError = useCallback(() => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.location;
      return newErrors;
    });
  }, []);

  return {
    errors,
    touchedFields,
    validateField,
    validateFieldWithTouch,
    validateAllFields,
    clearErrors,
    clearLocationError
  };
};

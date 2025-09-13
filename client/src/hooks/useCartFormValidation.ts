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
      
      // Calculate minimum date (7 days from now)
      const minDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
      minDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < minDate) return 'يجب حجز المناسبة قبل 7 أيام على الأقل';
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
    },
    // Add extra hours validation
    extraHours: (value: number, form: CartForm) => {
      if (value < 0 || value > 2) return 'الساعات الإضافية يجب أن تكون بين 0 و 2';
      return null;
    }
  }), []);

  const validateField = useCallback((field: string, value: any, form?: CartForm) => {
    const rule = validationRules[field as keyof typeof validationRules];
    if (!rule) return null;
    
    // Check if the rule needs the form parameter
    if (['endTime', 'extraHours'].includes(field) && form) {
      return (rule as (value: any, form: CartForm) => string | null)(value, form);
    }
    
    // For other rules that only need the value
    return (rule as (value: any) => string | null)(value);
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

    // Validate extra hours if present
    if (form.extraHours !== undefined) {
      const extraHoursError = validateField('extraHours', form.extraHours, form);
      if (extraHoursError) {
        newErrors.extraHours = extraHoursError;
        isValid = false;
      }
    }

    // Enhanced location validation with specific error messages
    if (!form.eventLocation?.trim()) {
      newErrors.eventLocation = 'موقع المناسبة مطلوب';
      isValid = false;
    } else if (form.eventLocation.trim().length < 3) {
      newErrors.eventLocation = 'يرجى إدخال عنوان مفصل';
      isValid = false;
    } else if (showMap && !hasLocationCoords) {
      // This is specifically for when map is shown but no coordinates are selected
      newErrors.eventLocation = 'يرجى تحديد الموقع الدقيق على الخريطة';
      newErrors.mapLocation = 'يرجى النقر على الخريطة لتحديد الموقع الدقيق';
      isValid = false;
    }

    setErrors(newErrors);
    setTouchedFields(new Set([...fieldsToValidate, 'extraHours']));
    
    return isValid;
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouchedFields(new Set());
  }, []);

  const clearLocationError = useCallback(() => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.eventLocation;
      delete newErrors.mapLocation;
      return newErrors;
    });
  }, []);

  // Get user-friendly error summary for toast messages
  const getErrorSummary = useCallback(() => {
    const errorFields = Object.keys(errors).filter(key => errors[key]);
    if (errorFields.length === 0) return null;

    const fieldNames: Record<string, string> = {
      hostName: 'اسم المضيف',
      eventDate: 'تاريخ المناسبة',
      startTime: 'وقت البداية',
      endTime: 'وقت النهاية',
      eventLocation: 'موقع المناسبة',
      invitationText: 'نص الدعوة',
      extraHours: 'الساعات الإضافية',
      mapLocation: 'تحديد الموقع على الخريطة'
    };

    if (errorFields.length === 1) {
      const field = errorFields[0];
      return `خطأ في ${fieldNames[field] || field}: ${errors[field]}`;
    }

    return `يوجد ${errorFields.length} أخطاء تحتاج إلى تصحيح: ${errorFields.map(f => fieldNames[f] || f).join('، ')}`;
  }, [errors]);

  return {
    errors,
    touchedFields,
    validateField,
    validateFieldWithTouch,
    validateAllFields,
    clearErrors,
    clearLocationError,
    getErrorSummary
  };
};
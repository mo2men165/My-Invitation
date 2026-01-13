// server/src/utils/phoneValidation.ts
import { z } from 'zod';

// Allowed countries with their country codes and phone number patterns
export const ALLOWED_COUNTRIES = {
  'SA': {
    name: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    countryCode: '+966',
    pattern: /^(\+966|966)?[5][0-9]{8}$/, // Saudi mobile numbers start with 5 (most common)
    example: '+966501234567'
  },
  'AE': {
    name: 'UAE', 
    nameAr: 'دولة الإمارات العربية المتحدة',
    countryCode: '+971',
    pattern: /^(\+971|971)?[5][0-9]{8}$/, // UAE mobile numbers start with 5
    example: '+971501234567'
  },
  'SY': {
    name: 'Syria',
    nameAr: 'الجمهورية العربية السورية',
    countryCode: '+963',
    pattern: /^(\+963|963)?[9][0-9]{8}$/, // Syrian mobile numbers start with 9
    example: '+963901234567'
  },
  'BH': {
    name: 'Bahrain',
    nameAr: 'مملكة البحرين',
    countryCode: '+973',
    pattern: /^(\+973|973)?[3-9][0-9]{7}$/, // Bahrain mobile numbers start with 3-9
    example: '+97336123456'
  },
  'QA': {
    name: 'Qatar',
    nameAr: 'دولة قطر',
    countryCode: '+974',
    pattern: /^(\+974|974)?[3357][0-9]{7}$/, // Qatar mobile numbers start with 3,5,7
    example: '+97450123456'
  },
  'KW': {
    name: 'Kuwait',
    nameAr: 'دولة الكويت',
    countryCode: '+965',
    pattern: /^(\+965|965)?[569][0-9]{7}$/, // Kuwait mobile numbers start with 5,6,9
    example: '+96550123456'
  },
  'OM': {
    name: 'Oman',
    nameAr: 'سلطنة عمان',
    countryCode: '+968',
    pattern: /^(\+968|968)?[79][0-9]{7}$/, // Oman mobile numbers start with 7,9
    example: '+96870123456'
  },
  'EG': {
    name: 'Egypt',
    nameAr: 'جمهورية مصر العربية',
    countryCode: '+20',
    pattern: /^(\+20|20)?1[0-9]{9}$/, // Egyptian mobile numbers start with 1 (10,11,12,15)
    example: '+201012345678'
  }
} as const;

// Create a combined regex pattern for all allowed countries
const createCombinedPattern = (): RegExp => {
  const patterns = Object.values(ALLOWED_COUNTRIES).map(country => 
    country.pattern.source.replace(/^\^|\$$/g, '')
  );
  return new RegExp(`^(${patterns.join('|')})$`);
};

export const ALLOWED_PHONE_PATTERN = createCombinedPattern();

// Function to validate phone number
export const validatePhoneNumber = (phone: string): { 
  isValid: boolean; 
  country?: keyof typeof ALLOWED_COUNTRIES;
  normalizedPhone?: string;
  error?: string;
} => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'رقم الهاتف مطلوب' };
  }

  // Remove all spaces and special characters except + and numbers
  const cleanPhone = phone.replace(/[^\+\d]/g, '');
  
  if (!cleanPhone) {
    return { isValid: false, error: 'رقم الهاتف غير صحيح' };
  }

  // Check each country pattern
  for (const [countryCode, countryInfo] of Object.entries(ALLOWED_COUNTRIES)) {
    if (countryInfo.pattern.test(cleanPhone)) {
      // Normalize the phone number to international format
      let normalizedPhone = cleanPhone;
      
      // Add country code if missing
      if (!normalizedPhone.startsWith('+')) {
        if (normalizedPhone.startsWith(countryInfo.countryCode.slice(1))) {
          normalizedPhone = '+' + normalizedPhone;
        } else {
          normalizedPhone = countryInfo.countryCode + normalizedPhone;
        }
      }
      
      return { 
        isValid: true, 
        country: countryCode as keyof typeof ALLOWED_COUNTRIES,
        normalizedPhone,
      };
    }
  }

  // Create error message with allowed countries
  const allowedCountriesAr = Object.values(ALLOWED_COUNTRIES)
    .map(country => country.nameAr)
    .join('، ');

  return { 
    isValid: false, 
    error: `رقم الهاتف يجب أن يكون من إحدى الدول المسموحة: ${allowedCountriesAr}` 
  };
};

// Zod schema for phone validation
export const phoneValidationSchema = z.string().refine((phone: string) => {
  const validation = validatePhoneNumber(phone);
  return validation.isValid;
}, {
  message: 'رقم الهاتف يجب أن يكون من إحدى الدول المسموحة'
});

// Transform function to normalize phone number
export const normalizePhoneNumber = (phone: string): string => {
  const validation = validatePhoneNumber(phone);
  return validation.normalizedPhone || phone;
};

// Function to get country info from phone number
export const getCountryFromPhone = (phone: string): typeof ALLOWED_COUNTRIES[keyof typeof ALLOWED_COUNTRIES] | null => {
  const validation = validatePhoneNumber(phone);
  if (validation.isValid && validation.country) {
    return ALLOWED_COUNTRIES[validation.country];
  }
  return null;
};

// Function to format phone number for display
export const formatPhoneForDisplay = (phone: string): string => {
  const validation = validatePhoneNumber(phone);
  if (!validation.isValid || !validation.normalizedPhone) {
    return phone;
  }
  
  const normalized = validation.normalizedPhone;
  const country = getCountryFromPhone(normalized);
  
  if (!country) return normalized;
  
  // Format based on country
  switch (country.countryCode) {
    case '+966': // Saudi Arabia
      return normalized.replace(/^(\+966)(\d{1})(\d{4})(\d{4})$/, '$1 $2 $3 $4');
    case '+971': // UAE
      return normalized.replace(/^(\+971)(\d{1})(\d{4})(\d{4})$/, '$1 $2 $3 $4');
    case '+963': // Syria
      return normalized.replace(/^(\+963)(\d{1})(\d{4})(\d{4})$/, '$1 $2 $3 $4');
    case '+973': // Bahrain
      return normalized.replace(/^(\+973)(\d{4})(\d{4})$/, '$1 $2 $3');
    case '+974': // Qatar
      return normalized.replace(/^(\+974)(\d{4})(\d{4})$/, '$1 $2 $3');
    case '+965': // Kuwait
      return normalized.replace(/^(\+965)(\d{4})(\d{4})$/, '$1 $2 $3');
    case '+968': // Oman
      return normalized.replace(/^(\+968)(\d{4})(\d{4})$/, '$1 $2 $3');
    case '+20': // Egypt
      return normalized.replace(/^(\+20)(\d{2})(\d{4})(\d{4})$/, '$1 $2 $3 $4');
    default:
      return normalized;
  }
};

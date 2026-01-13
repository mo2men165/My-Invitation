// server/src/utils/validation.ts
import { z } from 'zod';
import { phoneValidationSchema, normalizePhoneNumber } from './phoneValidation';

// Saudi cities enum
const saudiCities = [
  'جدة',
  'الرياض', 
  'الدمام',
  'مكة المكرمة',
  'الطائف',
  'المدينة المنورة',
  'اخري'
] as const;

// Location coordinate validation
const locationCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
}).optional();

// Auth schemas
export const registerSchema = z.object({
  firstName: z.string()
    .min(2, 'الاسم الأول يجب أن يكون أكثر من حرفين')
    .max(25, 'الاسم الأول طويل جداً')
    .regex(/^[a-zA-Z\u0600-\u06FF\s]+$/, 'الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط')
    .trim(),
  lastName: z.string()
    .min(2, 'الاسم الأخير يجب أن يكون أكثر من حرفين')
    .max(25, 'الاسم الأخير طويل جداً')
    .regex(/^[a-zA-Z\u0600-\u06FF\s]+$/, 'الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط')
    .trim(),
  phone: phoneValidationSchema,
  email: z.string()
    .email('عنوان البريد الإلكتروني غير صحيح')
    .toLowerCase(),
  city: z.enum(saudiCities, {
    message: 'يجب اختيار مدينة من القائمة المحددة'
  }),
  customCity: z.string()
    .min(2, 'اسم المدينة يجب أن يكون حرفين على الأقل')
    .max(50, 'اسم المدينة طويل جداً')
    .trim()
    .optional(),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/^(?=.*[a-z])/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/^(?=.*[A-Z])/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/^(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل')
}).refine((data) => {
  // If city is 'اخري', customCity must be provided
  if (data.city === 'اخري' && (!data.customCity || data.customCity.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'يجب إدخال اسم المدينة عند اختيار "أخرى"',
  path: ['customCity']
});

export const loginSchema = z.object({
  identifier: z.string()
    .min(1, 'البريد الإلكتروني أو رقم الهاتف مطلوب')
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(val)) return true;
      
      // Use our custom phone validation
      const phoneValidation = phoneValidationSchema.safeParse(val);
      return phoneValidation.success;
    }, 'يجب إدخال بريد إلكتروني صحيح أو رقم هاتف من الدول المسموحة'),
  password: z.string().min(1, 'كلمة المرور مطلوبة')
});

export const resetPasswordSchema = z.object({
  email: z.string()
    .email('عنوان البريد الإلكتروني غير صحيح')
    .toLowerCase()
});

// Cart item details schema with location support
const cartItemDetailsSchema = z.object({
  eventName: z.string()
    .min(2, 'اسم المناسبة يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم المناسبة لا يجب أن يتجاوز 100 حرف'),
  inviteCount: z.number().int().min(100).max(700),
  eventDate: z.string().transform((str) => {
    const date = new Date(str);
    if (isNaN(date.getTime())) {
      throw new Error('تاريخ المناسبة غير صحيح');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      throw new Error('تاريخ المناسبة يجب أن يكون في المستقبل');
    }
    return date;
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة الوقت غير صحيحة'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة الوقت غير صحيحة'),
  invitationText: z.string()
    .min(10, 'نص الدعوة يجب أن يكون 10 أحرف على الأقل')
    .max(1000, 'نص الدعوة لا يجب أن يتجاوز 1000 حرف'),
  hostName: z.string()
    .min(2, 'اسم المضيف يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم المضيف لا يجب أن يتجاوز 100 حرف'),
  eventLocation: z.string()
    .min(1, 'عنوان المناسبة مطلوب')
    .max(200, 'عنوان المناسبة لا يجب أن يتجاوز 200 حرف'),
  additionalCards: z.number().int().min(0).max(100).default(0),
  gateSupervisors: z.union([
    z.number().int().min(0).max(10),
    z.string().transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return 0;
      return Math.max(0, Math.min(10, parsed));
    })
  ]).default(0),
  extraHours: z.number().int().min(0).max(3).default(0),
  fastDelivery: z.boolean().default(false),
  // Location fields
  placeId: z.string().optional(),
  displayName: z.string().max(200).optional(),
  formattedAddress: z.string().max(500).optional(),
  locationCoordinates: locationCoordinatesSchema,
  detectedCity: z.string()
    .min(2, 'اسم المدينة يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم المدينة طويل جداً')
    .trim(),
  googleMapsUrl: z.string().optional(),
  // Custom design fields
  isCustomDesign: z.boolean().default(false).optional(),
  customDesignNotes: z.string().max(500).optional()
}).refine((data) => {
  if (data.locationCoordinates && !data.detectedCity) {
    return false;
  }
  return true;
}, {
  message: 'يجب تحديد المدينة عند توفير الإحداثيات',
  path: ['detectedCity']
});

// Main cart item schema
export const cartItemSchema = z.object({
  designId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'معرف التصميم غير صحيح'),
  packageType: z.enum(['classic', 'premium', 'vip']),
  details: cartItemDetailsSchema,
  totalPrice: z.number().min(0, 'السعر يجب أن يكون موجب')
});

// Update cart item schema
export const updateCartItemSchema = cartItemSchema.partial();

// Wishlist and Compare schemas
export const wishlistItemSchema = z.object({
  designId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'معرف التصميم غير صحيح'),
  packageType: z.enum(['classic', 'premium', 'vip']).optional()
});

export const compareItemSchema = z.object({
  designId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'معرف التصميم غير صحيح'),
  packageType: z.enum(['classic', 'premium', 'vip'])
});

// Bulk schemas
export const bulkWishlistSchema = z.object({
  items: z.array(wishlistItemSchema).min(1).max(50)
});

export const bulkCompareSchema = z.object({
  items: z.array(compareItemSchema).min(1).max(3)
});

// Parameter schemas
export const mongoIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'المعرف غير صحيح')
});

export const designIdSchema = z.object({
  designId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'معرف التصميم غير صحيح')
});

// Gulf countries boundaries (approximate)
const GULF_COUNTRIES_BOUNDARIES = [
  // Saudi Arabia
  { minLat: 16, maxLat: 32, minLng: 34, maxLng: 55, name: 'Saudi Arabia' },
  // UAE
  { minLat: 22, maxLat: 26, minLng: 51, maxLng: 56, name: 'UAE' },
  // Kuwait
  { minLat: 28.5, maxLat: 30.1, minLng: 46.5, maxLng: 48.5, name: 'Kuwait' },
  // Qatar
  { minLat: 24.4, maxLat: 26.2, minLng: 50.7, maxLng: 51.7, name: 'Qatar' },
  // Bahrain
  { minLat: 25.8, maxLat: 26.3, minLng: 50.4, maxLng: 50.7, name: 'Bahrain' },
  // Oman
  { minLat: 16.6, maxLat: 26.4, minLng: 51.9, maxLng: 59.8, name: 'Oman' }
];

// Location validation utility - Check if coordinates are within Gulf countries
export const validateGulfCountryBoundary = (lat: number, lng: number): boolean => {
  return GULF_COUNTRIES_BOUNDARIES.some(country => 
    lat >= country.minLat && 
    lat <= country.maxLat && 
    lng >= country.minLng && 
    lng <= country.maxLng
  );
};

// Legacy function for backward compatibility (now checks Gulf countries)
export const validateCityBoundary = (lat: number, lng: number): string | null => {
  // Check if coordinates are within Gulf countries
  if (validateGulfCountryBoundary(lat, lng)) {
    // Return a generic indicator that location is valid
    // The actual city name will be extracted from the place data
    return 'Gulf Country';
  }
  return null;
};

// Transform functions
export const transformRegisterData = (data: z.infer<typeof registerSchema>) => {
  return {
    ...data,
    name: `${data.firstName} ${data.lastName}`,
    phone: normalizePhoneNumber(data.phone) // Normalize to international format
  };
};

export const parseIdentifier = (identifier: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (emailRegex.test(identifier)) {
    return { type: 'email', value: identifier.toLowerCase() };
  } else {
    // Use our custom phone validation
    const phoneValidation = phoneValidationSchema.safeParse(identifier);
    if (phoneValidation.success) {
      return { type: 'phone', value: normalizePhoneNumber(identifier) };
    } else {
      throw new Error('نوع المعرف غير صحيح');
    }
  }
};

// Export schemas and types
export { cartItemDetailsSchema, locationCoordinatesSchema };

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type WishlistItemInput = z.infer<typeof wishlistItemSchema>;
export type CompareItemInput = z.infer<typeof compareItemSchema>;
export type BulkWishlistInput = z.infer<typeof bulkWishlistSchema>;
export type BulkCompareInput = z.infer<typeof bulkCompareSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
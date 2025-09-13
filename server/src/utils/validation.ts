// server/src/utils/validation.ts
import { z } from 'zod';

// Saudi cities enum
const saudiCities = [
  'جدة',
  'الرياض', 
  'الدمام',
  'مكة المكرمة',
  'الطائف',
  'المدينة المنورة'
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
  phone: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'رقم الهاتف يجب أن يكون بالصيغة الدولية (مثال: +966501234567)'),
  email: z.string()
    .email('عنوان البريد الإلكتروني غير صحيح')
    .toLowerCase(),
  city: z.enum(saudiCities, {
    message: 'يجب اختيار مدينة من القائمة المحددة'
  }),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/^(?=.*[a-z])/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/^(?=.*[A-Z])/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/^(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل')
});

export const loginSchema = z.object({
  identifier: z.string()
    .min(1, 'البريد الإلكتروني أو رقم الهاتف مطلوب')
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+[1-9]\d{1,14}$/; // International phone number format
      return emailRegex.test(val) || phoneRegex.test(val);
    }, 'يجب إدخال بريد إلكتروني صحيح أو رقم هاتف دولي صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة')
});

export const resetPasswordSchema = z.object({
  email: z.string()
    .email('عنوان البريد الإلكتروني غير صحيح')
    .toLowerCase()
});

// Cart item details schema with location support
const cartItemDetailsSchema = z.object({
  inviteCount: z.number().int().min(100).max(500), // Changed max from 700 to 500
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
  gateSupervisors: z.number().int().min(0).max(10).default(0), // Changed to number
  extraHours: z.number().int().min(0).max(3).default(0).optional(), // Added extraHours
  expeditedDelivery: z.boolean().default(false), // Added expeditedDelivery
  locationCoordinates: locationCoordinatesSchema,
  detectedCity: z.enum(saudiCities, {
    message: 'يجب اختيار مدينة صحيحة من القائمة المحددة'
  })
}).refine((data) => {
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes;
}, {
  message: 'وقت النهاية يجب أن يكون بعد وقت البداية',
  path: ['endTime']
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
  designId: z.string().min(1, 'معرف التصميم مطلوب'),
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

// Location validation utility
export const validateCityBoundary = (lat: number, lng: number): string | null => {
  const CITY_BOUNDARIES = {
    'جدة': { lat: 21.4858, lng: 39.1925, radius: 50 },
    'الرياض': { lat: 24.7136, lng: 46.6753, radius: 60 },
    'الدمام': { lat: 26.4207, lng: 50.0888, radius: 40 },
    'مكة المكرمة': { lat: 21.3891, lng: 39.8579, radius: 30 },
    'الطائف': { lat: 21.2703, lng: 40.4034, radius: 35 },
    'المدينة المنورة': { lat: 24.5247, lng: 39.5692, radius: 40 }
  };
  

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  for (const [cityName, boundary] of Object.entries(CITY_BOUNDARIES)) {
    const distance = calculateDistance(lat, lng, boundary.lat, boundary.lng);
    if (distance <= boundary.radius) {
      return cityName;
    }
  }
  
  return null;
};

// Transform functions
export const transformRegisterData = (data: z.infer<typeof registerSchema>) => {
  return {
    ...data,
    name: `${data.firstName} ${data.lastName}`,
    phone: data.phone // Already in international format
  };
};

export const parseIdentifier = (identifier: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+[1-9]\d{1,14}$/; // International phone number format
  
  if (emailRegex.test(identifier)) {
    return { type: 'email', value: identifier.toLowerCase() };
  } else if (phoneRegex.test(identifier)) {
    return { type: 'phone', value: identifier }; // Already in international format
  } else {
    throw new Error('نوع المعرف غير صحيح');
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
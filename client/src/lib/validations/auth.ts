// src/lib/validations/auth.ts
import { z } from 'zod';

// Saudi cities enum for validation
const saudiCities = [
  'جدة',
  'الرياض', 
  'الدمام',
  'مكة المكرمة',
  'الطائف',
  'المدينة المنورة',
  'اخري'
] as const;

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
    .regex(/^[5][0-9]{8}$/, 'رقم الهاتف السعودي يجب أن يبدأ بـ 5 ويتكون من 9 أرقام'),
  email: z.string()
    .email('عنوان البريد الإلكتروني غير صحيح')
    .toLowerCase(), // Email is now mandatory
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
    .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
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
      // Check if it's a valid email or Saudi phone number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[5][0-9]{8}$/;
      
      return emailRegex.test(val) || phoneRegex.test(val);
    }, 'يجب إدخال بريد إلكتروني صحيح أو رقم هاتف سعودي صحيح'),
  password: z.string()
    .min(1, 'كلمة المرور مطلوبة')
});

export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('عنوان البريد الإلكتروني غير صحيح')
    .toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'رمز إعادة التعيين مطلوب'),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/^(?=.*[a-z])/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/^(?=.*[A-Z])/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/^(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Helper function to determine if identifier is email or phone
export const parseIdentifier = (identifier: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[5][0-9]{8}$/;
  
  if (emailRegex.test(identifier)) {
    return { type: 'email' as const, value: identifier.toLowerCase() };
  } else if (phoneRegex.test(identifier)) {
    return { type: 'phone' as const, value: `+966${identifier}` };
  } else {
    throw new Error('نوع المعرف غير صحيح');
  }
};
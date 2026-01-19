'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '../../store';
import { registerUser, clearError } from '../../store/authSlice';
import { registerSchema, RegisterFormData } from '@/lib/validations/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Alert, AlertDescription } from '../ui/Alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Eye, EyeOff, Loader2, User, Mail, Phone, MapPin, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saudiCities, passwordStrengthChecks, passwordStrengthLevels } from '@/constants';

export function RegisterForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/packages');
      }
    }
  }, [isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    formState: { errors, isValid, isDirty, touchedFields },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'all', // Validate on change, blur, and submit to ensure proper validation on mobile
  });

  const watchedPassword = watch('password');
  const watchedCity = watch('city');
  const watchedValues = watch(); // Watch all form values to check if form is filled

  // Check if form has been filled (at least one field has a value)
  const hasFormData = watchedValues.firstName || watchedValues.lastName || watchedValues.email || 
                      watchedValues.phone || watchedValues.city || watchedValues.password;

  const onSubmit = async (data: RegisterFormData) => {
    dispatch(clearError());
    dispatch(registerUser(data));
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    
    passwordStrengthChecks.forEach(check => {
      if (check.regex.test(password)) score += check.point;
    });
    
    if (score <= 2) return passwordStrengthLevels.weak;
    if (score === 3) return passwordStrengthLevels.medium;
    if (score === 4) return passwordStrengthLevels.good;
    return passwordStrengthLevels.strong;
  };

  const passwordStrength = getPasswordStrength(watchedPassword || '');

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">إنشاء حساب جديد</h1>
        <p className="text-gray-300">أنشئ حسابك للبدء في إدارة دعواتك المميزة</p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-white font-medium">
              الاسم الأول <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="firstName"
                placeholder="أحمد"
                {...register('firstName')}
                className={`pl-12 pr-12 bg-white/10 mt-4 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 transition-all ${
                  errors.firstName ? 'border-red-500' : ''
                }`}
                style={{
                  '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
                } as React.CSSProperties}
              />
            </div>
            {errors.firstName && (
              <p className="text-sm text-red-300">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-white font-medium">
              الاسم الأخير <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="lastName"
                placeholder="المحمد"
                {...register('lastName')}
                className={`pl-12 pr-12 bg-white/10 mt-4 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 transition-all ${
                  errors.lastName ? 'border-red-500' : ''
                }`}
                style={{
                  '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
                } as React.CSSProperties}
              />
            </div>
            {errors.lastName && (
              <p className="text-sm text-red-300">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white font-medium">
            البريد الإلكتروني <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="ahmed@example.com"
              {...register('email')}
              className={`pl-12 pr-12 bg-white/10 mt-4 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 transition-all ${
                errors.email ? 'border-red-500' : ''
              }`}
              dir="ltr"
              style={{
                '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
              } as React.CSSProperties}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-300">{errors.email.message}</p>
          )}
          <p className="text-xs text-gray-400">
            مطلوب لإرسال رسائل إعادة تعيين كلمة المرور
          </p>
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white font-medium">
            رقم الهاتف <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="phone"
              placeholder="501234567"
              {...register('phone')}
              className={`pl-12 pr-12 bg-white/10 mt-4 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 transition-all ${
                errors.phone ? 'border-red-500' : ''
              }`}
              dir="ltr"
              maxLength={9}
              style={{
                '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
              } as React.CSSProperties}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-300">{errors.phone.message}</p>
          )}
          <p className="text-xs text-gray-400">
            يجب أن يبدأ الرقم بـ 5 (مثال: 501234567)
          </p>
        </div>

        {/* City Field */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-white font-medium">
            المدينة <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <Select 
                  value={field.value || ''} 
                  onValueChange={async (value) => {
                    field.onChange(value);
                    // Clear customCity when switching away from 'اخري'
                    if (value !== 'اخري') {
                      setValue('customCity', '');
                    }
                    // Explicitly trigger validation on mobile
                    await trigger('city');
                    if (value !== 'اخري') {
                      await trigger('customCity');
                    }
                  }}
                >
                  <SelectTrigger 
                    dir='rtl' 
                    className={`bg-white/10 mt-4 border-white/20 text-white backdrop-blur-sm focus:border-yellow-500 transition-all h-12 pr-12 ${
                      errors.city ? 'border-red-500' : ''
                    }`}
                  >
                    <SelectValue placeholder="اختر المدينة" className="text-gray-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                    {saudiCities.map((city) => (
                      <SelectItem 
                        key={city} 
                        value={city} 
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {errors.city && (
            <p className="text-sm text-red-300">{errors.city.message}</p>
          )}
          
          {/* Custom City Input - Show when 'اخري' is selected */}
          {watchedCity === 'اخري' && (
            <div className="mt-2 space-y-2">
              <Label htmlFor="customCity" className="text-white font-medium">
                اسم المدينة <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="customCity"
                  placeholder="أدخل اسم المدينة"
                  {...register('customCity')}
                  className={`pl-12 pr-12 bg-white/10 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 transition-all ${
                    errors.customCity ? 'border-red-500' : ''
                  }`}
                  style={{
                    '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
                  } as React.CSSProperties}
                />
              </div>
              {errors.customCity && (
                <p className="text-sm text-red-300">{errors.customCity.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white font-medium">
            كلمة المرور <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="كلمة المرور"
              {...register('password')}
              className={`pl-12 pr-12 mt-4 bg-white/10 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 transition-all ${
                errors.password ? 'border-red-500' : ''
              }`}
              style={{
                '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
              } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {watchedPassword && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 ">
                <span className="text-sm text-gray-400">قوة كلمة المرور:</span>
                <span className={`text-sm font-medium ${passwordStrength.color}`}>
                  {passwordStrength.text}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength.score <= 2 ? 'bg-red-500' :
                    passwordStrength.score === 3 ? 'bg-yellow-500' :
                    passwordStrength.score === 4 ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {errors.password && (
            <p className="text-sm text-red-300">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-white font-medium">
            تأكيد كلمة المرور <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="تأكيد كلمة المرور"
              {...register('confirmPassword')}
              className={`pl-12 pr-12 mt-4 bg-white/10 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 transition-all ${
                errors.confirmPassword ? 'border-red-500' : ''
              }`}
              style={{
                '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
              } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-300">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full text-black font-bold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 group disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed disabled:transform-none"
          disabled={isLoading || (hasFormData && (!isValid || Object.keys(errors).length > 0))}
          style={{ 
            backgroundColor: isLoading || (hasFormData && (!isValid || Object.keys(errors).length > 0)) ? '#9a7a42' : '#C09B52',
            boxShadow: isLoading || (hasFormData && (!isValid || Object.keys(errors).length > 0)) ? 'none' : '0 10px 30px rgba(192, 155, 82, 0.3)'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              جاري إنشاء الحساب...
            </>
          ) : (
            <>
              إنشاء الحساب
              <ArrowLeft className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-gray-400">أو</span>
          </div>
        </div>
        
        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-gray-300">
            لديك حساب بالفعل؟{' '}
            <Link 
              href="/login" 
              className="font-medium hover:underline transition-colors"
              style={{ color: '#C09B52' }}
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>

      {/* Security Information */}
      <div className="bg-white/5 rounded-xl p-4 space-y-2">
        <h3 className="text-white font-medium text-sm flex items-center space-x-2">
          <Lock className="w-4 h-4 text-yellow-500" />
          <span>التسجيل المبسط</span>
        </h3>
        <p className="text-xs text-gray-400">
          لن تحتاج إلى تأكيد البريد الإلكتروني. ستتمكن من تسجيل الدخول فوراً بعد إنشاء الحساب.
        </p>
      </div>

      {/* Password Requirements */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-2">
        <h3 className="text-blue-300 font-medium text-sm">متطلبات كلمة المرور:</h3>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>• لا تقل عن 8 أحرف</li>
          <li>• تحتوي على حرف كبير وحرف صغير</li>
          <li>• تحتوي على رقم واحد على الأقل</li>
          <li>• تحتوي على رمز خاص (!@#$%^&* إلخ)</li>
        </ul>
      </div>
    </div>
  );
}
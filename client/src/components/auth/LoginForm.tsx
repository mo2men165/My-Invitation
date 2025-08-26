'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, clearError } from '@/store/authSlice';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '../ui/Alert';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard'); // or wherever you want to redirect
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const watchedIdentifier = watch('identifier');

  const onSubmit = async (data: LoginFormData) => {
    dispatch(clearError());
    dispatch(loginUser(data));
  };

  // Determine if the identifier is email or phone for UI hints
  const getIdentifierType = (identifier: string) => {
    if (!identifier) return 'unknown';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[5][0-9]{8}$/;
    
    if (emailRegex.test(identifier)) return 'email';
    if (phoneRegex.test(identifier)) return 'phone';
    return 'unknown';
  };

  const identifierType = getIdentifierType(watchedIdentifier || '');

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">تسجيل الدخول</h1>
        <p className="text-gray-300">أدخل بياناتك للوصول إلى حسابك</p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identifier Field (Email or Phone) */}
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-white font-medium">
            البريد الإلكتروني أو رقم الهاتف
          </Label>
          <div className="relative">
            {identifierType === 'email' ? (
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            ) : identifierType === 'phone' ? (
              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            ) : (
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            )}
            <Input
              id="identifier"
              placeholder="البريد الإلكتروني أو رقم الهاتف"
              {...register('identifier')}
              className={`pl-12 bg-white/10 mt-4 pr-12 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 ${
                errors.identifier ? 'border-red-500' : ''
              }`}
              dir={identifierType === 'phone' ? 'ltr' : 'rtl'}
              style={{
                '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
              } as React.CSSProperties}
            />
          </div>
          {errors.identifier && (
            <p className="text-sm text-red-300">{errors.identifier.message}</p>
          )}
          <div className="text-xs text-gray-400 space-y-1">
            <p>• البريد الإلكتروني: ahmed@example.com</p>
            <p>• رقم الهاتف السعودي: 501234567 (بدون +966)</p>
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white font-medium">كلمة المرور</Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="كلمة المرور"
              {...register('password')}
              className={`pl-12 pr-12 bg-white/10 mt-4 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 ${
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
          {errors.password && (
            <p className="text-sm text-red-300">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full text-black font-bold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 group"
          disabled={isLoading}
          style={{ 
            backgroundColor: '#C09B52',
            boxShadow: '0 10px 30px rgba(192, 155, 82, 0.3)'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              جاري تسجيل الدخول...
            </>
          ) : (
            <>
              تسجيل الدخول
              <ArrowLeft className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="text-center">
          <Link 
            href="/forgot-password" 
            className="text-sm hover:underline transition-colors"
            style={{ color: '#C09B52' }}
          >
            نسيت كلمة المرور؟
          </Link>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-gray-400">أو</span>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-300">
            ليس لديك حساب؟{' '}
            <Link 
              href="/register" 
              className="font-medium hover:underline transition-colors"
              style={{ color: '#C09B52' }}
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </div>

      {/* Login Methods Information */}
      <div className="bg-white/5 rounded-xl p-4 space-y-2">
        <h3 className="text-white font-medium text-sm flex items-center space-x-2">
          <Lock className="w-4 h-4 text-yellow-500" />
          <span>طرق تسجيل الدخول</span>
        </h3>
        <p className="text-xs text-gray-400">
          يمكنك تسجيل الدخول باستخدام البريد الإلكتروني أو رقم الهاتف المسجل في حسابك
        </p>
      </div>
    </div>
  );
}
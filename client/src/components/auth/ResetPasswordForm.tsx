'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetPassword, clearError } from '@/store/authSlice';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/validations/auth';
import { authAPI } from '@/lib/api/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, KeyRound, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Helper to check if token reset is in progress or completed (uses sessionStorage to persist across HMR)
const isResetInProgressOrCompleted = (token: string): boolean => {
  if (typeof window === 'undefined') return false;
  const status = sessionStorage.getItem(`reset_status_${token}`);
  return status === 'in_progress' || status === 'completed';
};

const markResetInProgress = (token: string): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`reset_status_${token}`, 'in_progress');
};

const markResetCompleted = (token: string): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`reset_status_${token}`, 'completed');
};

const markResetFailed = (token: string): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`reset_status_${token}`);
};

const clearResetStatus = (token: string): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`reset_status_${token}`);
};

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Check if this token was already successfully reset (persists across remounts and HMR)
  const [isSuccess, setIsSuccess] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(`reset_status_${token}`) === 'completed';
  });
  
  // Clear any stale errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Sync isSuccess with sessionStorage on mount and periodically
  // This handles the case where the async reset completes after a remount
  useEffect(() => {
    // Check immediately on mount
    const checkStatus = () => {
      const status = sessionStorage.getItem(`reset_status_${token}`);
      if (status === 'completed' && !isSuccess) {
        setIsSuccess(true);
      }
    };
    
    checkStatus();
    
    // Poll every 100ms while reset is in progress (handles async completion after remount)
    const status = sessionStorage.getItem(`reset_status_${token}`);
    if (status === 'in_progress') {
      const interval = setInterval(checkStatus, 100);
      return () => clearInterval(interval);
    }
  }, [token, isSuccess]);

  // Verify token on component mount (only to validate before showing form)
  // Skip verification if reset is in progress or already completed
  useEffect(() => {
    // Don't verify if reset is in progress or completed for this token
    // But we need to set isTokenValid so the UI doesn't show loading forever
    if (isResetInProgressOrCompleted(token)) {
      setIsTokenValid(true); // Allow UI to proceed
      return;
    }

    if (!token) {
      setIsTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      // Double-check before making API call
      if (isResetInProgressOrCompleted(token)) {
        setIsTokenValid(true); // Allow UI to proceed
        return;
      }

      try {
        const response = await authAPI.verifyResetToken(token);
        if (response.valid) {
          setIsTokenValid(true);
          setUserEmail(response.email || '');
        } else {
          setIsTokenValid(false);
        }
      } catch (error) {
        setIsTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  // Auto-redirect to login after 2 seconds on success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        // Clean up sessionStorage before redirecting
        clearResetStatus(token);
        router.push('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router, token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
    },
  });

  const watchedPassword = watch('password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    dispatch(clearError());
    
    // Mark as in progress BEFORE the API call to prevent verification during remounts
    markResetInProgress(data.token);
    
    try {
      await dispatch(resetPassword({ token: data.token, password: data.password })).unwrap();
      markResetCompleted(data.token); // Mark token as completed
      setIsSuccess(true);
    } catch (error) {
      // Reset failed, allow verification again
      markResetFailed(data.token);
      // Error is handled by Redux
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    const checks = [
      { regex: /.{8,}/, point: 1 },
      { regex: /[a-z]/, point: 1 },
      { regex: /[A-Z]/, point: 1 },
      { regex: /\d/, point: 1 },
      { regex: /[!@#$%^&*(),.?":{}|<>]/, point: 1 },
    ];
    
    checks.forEach(check => {
      if (check.regex.test(password)) score += check.point;
    });
    
    if (score <= 2) return { score, text: 'ضعيفة', color: 'text-red-400' };
    if (score === 3) return { score, text: 'متوسطة', color: 'text-yellow-400' };
    if (score === 4) return { score, text: 'جيدة', color: 'text-blue-400' };
    return { score, text: 'قوية جداً', color: 'text-green-400' };
  };

  const passwordStrength = getPasswordStrength(watchedPassword || '');

  // Loading state while verifying token
  if (isTokenValid === null) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C09B52' }} />
          </div>
          <h1 className="text-3xl font-bold text-white">جاري التحقق...</h1>
          <p className="text-gray-300">يتم التحقق من صحة رابط إعادة التعيين</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (isTokenValid === false) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">رابط غير صالح</h1>
          <p className="text-gray-300">
            رابط إعادة تعيين كلمة المرور غير صحيح أو منتهي الصلاحية
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-2">
          <h3 className="text-red-300 font-medium text-sm">الأسباب المحتملة:</h3>
          <ul className="text-xs text-red-200 space-y-1">
            <li>• انتهت صلاحية الرابط (15 دقيقة)</li>
            <li>• تم استخدام الرابط مسبقاً</li>
            <li>• الرابط غير صحيح</li>
          </ul>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push('/forgot-password')}
            className="w-full text-black font-bold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            style={{ 
              backgroundColor: '#C09B52',
              boxShadow: '0 10px 30px rgba(192, 155, 82, 0.3)'
            }}
          >
            طلب رابط جديد
          </Button>

          <div className="text-center">
            <Link 
              href="/login" 
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state - auto-redirects after 2 seconds
  if (isSuccess) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-white">تم تغيير كلمة المرور!</h1>
          <p className="text-gray-300">
            تم تغيير كلمة المرور بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول...
          </p>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
          <KeyRound className="w-8 h-8" style={{ color: '#C09B52' }} />
        </div>
        
        <h1 className="text-3xl font-bold text-white">كلمة مرور جديدة</h1>
        <div className="space-y-2">
          <p className="text-gray-300">أدخل كلمة المرور الجديدة لحسابك</p>
          {userEmail && (
            <p className="text-sm text-gray-400">للحساب: {userEmail}</p>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register('token')} />

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white font-medium">كلمة المرور الجديدة</Label>
          <div className="relative">
            <KeyRound className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="كلمة المرور الجديدة"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-white font-medium">تأكيد كلمة المرور</Label>
          <div className="relative">
            <KeyRound className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="تأكيد كلمة المرور"
              {...register('confirmPassword')}
              className={`pl-12 pr-12 bg-white/10 mt-4 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 ${
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
              جاري الحفظ...
            </>
          ) : (
            <>
              تغيير كلمة المرور
              <ArrowLeft className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </form>

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
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/store';
import { requestPasswordReset, clearError } from '@/store/authSlice';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, Mail, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function ForgotPasswordForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    dispatch(clearError());
    
    try {
      await dispatch(requestPasswordReset(data.email)).unwrap();
      setEmailAddress(data.email);
      setIsEmailSent(true);
    } catch (error) {
      // Error is handled by Redux
    }
  };

  // Success state
  if (isEmailSent) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-white">تم إرسال الرابط!</h1>
          <div className="space-y-2">
            <p className="text-gray-300">
              تم إرسال رابط إعادة تعيين كلمة المرور إلى:
            </p>
            <p className="text-white font-medium bg-white/10 rounded-lg px-4 py-2 border border-white/20">
              {emailAddress}
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
          <h3 className="text-blue-300 font-medium text-sm flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>الخطوات التالية:</span>
          </h3>
          <ol className="text-sm text-blue-200 space-y-2">
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">1</span>
              <span>تفقد صندوق الوارد في بريدك الإلكتروني</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">2</span>
              <span>انقر على رابط إعادة تعيين كلمة المرور</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">3</span>
              <span>أدخل كلمة المرور الجديدة</span>
            </li>
          </ol>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 space-y-2">
          <h3 className="text-yellow-300 font-medium text-sm">لم تتلق الرسالة؟</h3>
          <ul className="text-xs text-yellow-200 space-y-1">
            <li>• تحقق من مجلد الرسائل غير المرغوب فيها (Spam)</li>
            <li>• تأكد من كتابة البريد الإلكتروني بشكل صحيح</li>
            <li>• انتظر بضع دقائق، قد تتأخر الرسالة أحياناً</li>
          </ul>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => {
              setIsEmailSent(false);
              setEmailAddress('');
              dispatch(clearError());
            }}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            إرسال إلى بريد إلكتروني آخر
          </Button>

          <div className="text-center">
            <Link 
              href="/login" 
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center space-x-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
              <span>العودة إلى تسجيل الدخول</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Email input form
  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
          <KeyRound className="w-8 h-8" style={{ color: '#C09B52' }} />
        </div>
        
        <h1 className="text-3xl font-bold text-white">نسيت كلمة المرور؟</h1>
        <p className="text-gray-300">
          أدخل عنوان بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white font-medium">البريد الإلكتروني</Label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="ahmed@example.com"
              {...register('email')}
              className={`pl-12 bg-white/10 mt-4 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 ${
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
            أدخل البريد الإلكتروني المسجل في حسابك
          </p>
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
              جاري الإرسال...
            </>
          ) : (
            <>
              إرسال رابط إعادة التعيين
              <ArrowLeft className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link 
          href="/login" 
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center space-x-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          <span>العودة إلى تسجيل الدخول</span>
        </Link>
      </div>

      {/* Email-Only Information */}
      <div className="bg-white/5 rounded-xl p-4 space-y-2">
        <h3 className="text-white font-medium text-sm flex items-center space-x-2">
          <Mail className="w-4 h-4 text-yellow-500" />
          <span>إعادة التعيين عبر البريد الإلكتروني</span>
        </h3>
        <p className="text-xs text-gray-400">
          يتم إرسال رابط إعادة تعيين كلمة المرور عبر البريد الإلكتروني فقط. تأكد من إدخال البريد الصحيح المسجل في حسابك.
        </p>
      </div>
    </div>
  );
}
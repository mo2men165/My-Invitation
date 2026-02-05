'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/store';
import { requestPasswordReset, clearError } from '@/store/authSlice';
import { 
  forgotPasswordSchema, 
  forgotPasswordPhoneSchema,
  forgotPasswordByPhoneSchema,
  ForgotPasswordFormData,
  ForgotPasswordPhoneFormData,
  ForgotPasswordByPhoneFormData
} from '@/lib/validations/auth';
import { authAPI, UserLookupResult } from '@/lib/api/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, Mail, ArrowLeft, KeyRound, CheckCircle, Phone, UserX, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Step = 
  | 'choose-method'      // Initial: choose email or phone
  | 'email-input'        // Enter email to find account
  | 'phone-input'        // Enter phone to find account  
  | 'phone-email-input'  // Phone user found, enter email for reset link
  | 'email-sent'         // Success: email sent
  | 'not-found';         // User not found, suggest register

interface FormState {
  step: Step;
  inputMethod: 'email' | 'phone' | null;
  emailAddress: string;
  phoneNumber: string;
  lookupError: string | null;
  isLookingUp: boolean;
}

export function ForgotPasswordForm() {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [formState, setFormState] = useState<FormState>({
    step: 'choose-method',
    inputMethod: null,
    emailAddress: '',
    phoneNumber: '',
    lookupError: null,
    isLookingUp: false,
  });

  // Clear any stale errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Email form
  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Phone form
  const phoneForm = useForm<ForgotPasswordPhoneFormData>({
    resolver: zodResolver(forgotPasswordPhoneSchema),
  });

  // Phone + Email form (for phone users who need to provide email)
  const phoneEmailForm = useForm<ForgotPasswordByPhoneFormData>({
    resolver: zodResolver(forgotPasswordByPhoneSchema),
    defaultValues: {
      phone: formState.phoneNumber,
    }
  });

  // Handle email submission - check if user exists
  const onEmailSubmit = async (data: ForgotPasswordFormData) => {
    dispatch(clearError());
    setFormState(prev => ({ ...prev, lookupError: null, isLookingUp: true }));
    
    try {
      // First lookup to check if user exists
      const lookupResult = await authAPI.lookupUser(data.email, 'email');
      
      if (!lookupResult.found) {
        // User not found
        setFormState(prev => ({ 
          ...prev, 
          step: 'not-found',
          inputMethod: 'email',
          emailAddress: data.email,
          isLookingUp: false 
        }));
        return;
      }

      // User found - proceed with normal password reset
      await dispatch(requestPasswordReset(data.email)).unwrap();
      setFormState(prev => ({ 
        ...prev, 
        step: 'email-sent',
        emailAddress: data.email,
        isLookingUp: false 
      }));
    } catch (err: any) {
      setFormState(prev => ({ 
        ...prev, 
        lookupError: err.message || 'حدث خطأ',
        isLookingUp: false 
      }));
    }
  };

  // Handle phone submission - lookup user
  const onPhoneSubmit = async (data: ForgotPasswordPhoneFormData) => {
    dispatch(clearError());
    setFormState(prev => ({ ...prev, lookupError: null, isLookingUp: true }));
    
    try {
      const lookupResult = await authAPI.lookupUser(data.phone, 'phone');
      
      if (!lookupResult.found) {
        // User not found
        setFormState(prev => ({ 
          ...prev, 
          step: 'not-found',
          inputMethod: 'phone',
          phoneNumber: data.phone,
          isLookingUp: false 
        }));
        return;
      }

      // User found - check if they have an email
      if (lookupResult.hasEmail && 'email' in lookupResult) {
        // User has email on file - send reset to that email
        await dispatch(requestPasswordReset(lookupResult.email)).unwrap();
        setFormState(prev => ({ 
          ...prev, 
          step: 'email-sent',
          emailAddress: lookupResult.email,
          phoneNumber: data.phone,
          isLookingUp: false 
        }));
      } else {
        // User found but no email - ask for email
        setFormState(prev => ({ 
          ...prev, 
          step: 'phone-email-input',
          phoneNumber: data.phone,
          isLookingUp: false 
        }));
        // Update the phone email form with the phone number
        phoneEmailForm.setValue('phone', data.phone);
      }
    } catch (err: any) {
      setFormState(prev => ({ 
        ...prev, 
        lookupError: err.message || 'حدث خطأ',
        isLookingUp: false 
      }));
    }
  };

  // Handle phone + email submission (for phone-only users)
  const onPhoneEmailSubmit = async (data: ForgotPasswordByPhoneFormData) => {
    dispatch(clearError());
    setFormState(prev => ({ ...prev, lookupError: null, isLookingUp: true }));
    
    try {
      await authAPI.forgotPasswordByPhone(data);
      setFormState(prev => ({ 
        ...prev, 
        step: 'email-sent',
        emailAddress: data.email,
        isLookingUp: false 
      }));
    } catch (err: any) {
      setFormState(prev => ({ 
        ...prev, 
        lookupError: err.message || 'حدث خطأ',
        isLookingUp: false 
      }));
    }
  };

  // Go back to method selection
  const goBack = () => {
    dispatch(clearError());
    setFormState({
      step: 'choose-method',
      inputMethod: null,
      emailAddress: '',
      phoneNumber: '',
      lookupError: null,
      isLookingUp: false,
    });
    emailForm.reset();
    phoneForm.reset();
    phoneEmailForm.reset();
  };

  // Select input method
  const selectMethod = (method: 'email' | 'phone') => {
    setFormState(prev => ({ 
      ...prev, 
      step: method === 'email' ? 'email-input' : 'phone-input',
      inputMethod: method 
    }));
  };

  // Reset to try again
  const resetForm = () => {
    goBack();
  };

  const displayError = formState.lookupError || error;
  const isProcessing = formState.isLookingUp || isLoading;

  // ============= RENDER DIFFERENT STEPS =============

  // Step: Choose method (email or phone)
  if (formState.step === 'choose-method') {
    return (
      <div className="w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8" style={{ color: '#C09B52' }} />
          </div>
          
          <h1 className="text-3xl font-bold text-white">نسيت كلمة المرور؟</h1>
          <p className="text-gray-300">
            اختر الطريقة التي تريد استخدامها للعثور على حسابك
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => selectMethod('email')}
            className="w-full py-6 text-lg rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-yellow-500/50 transition-all duration-300 text-white"
          >
            <Mail className="ml-3 w-6 h-6" style={{ color: '#C09B52' }} />
            البحث بالبريد الإلكتروني
          </Button>

          <Button
            onClick={() => selectMethod('phone')}
            className="w-full py-6 text-lg rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-yellow-500/50 transition-all duration-300 text-white"
          >
            <Phone className="ml-3 w-6 h-6" style={{ color: '#C09B52' }} />
            البحث برقم الهاتف
          </Button>
        </div>

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
    );
  }

  // Step: Email input
  if (formState.step === 'email-input') {
    return (
      <div className="w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8" style={{ color: '#C09B52' }} />
          </div>
          
          <h1 className="text-3xl font-bold text-white">البحث بالبريد الإلكتروني</h1>
          <p className="text-gray-300">
            أدخل عنوان بريدك الإلكتروني المسجل في حسابك
          </p>
        </div>

        {displayError && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
            <AlertDescription className="text-red-300">{displayError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white font-medium">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="ahmed@example.com"
                {...emailForm.register('email')}
                className={`pl-12 bg-white/10 mt-4 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 ${
                  emailForm.formState.errors.email ? 'border-red-500' : ''
                }`}
                dir="ltr"
                style={{
                  '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
                } as React.CSSProperties}
              />
            </div>
            {emailForm.formState.errors.email && (
              <p className="text-sm text-red-300">{emailForm.formState.errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full text-black font-bold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 group"
            disabled={isProcessing}
            style={{ 
              backgroundColor: '#C09B52',
              boxShadow: '0 10px 30px rgba(192, 155, 82, 0.3)'
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                جاري البحث...
              </>
            ) : (
              <>
                متابعة
                <ArrowLeft className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <button 
          onClick={goBack}
          className="w-full text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>اختيار طريقة أخرى</span>
        </button>
      </div>
    );
  }

  // Step: Phone input
  if (formState.step === 'phone-input') {
    return (
      <div className="w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <Phone className="w-8 h-8" style={{ color: '#C09B52' }} />
          </div>
          
          <h1 className="text-3xl font-bold text-white">البحث برقم الهاتف</h1>
          <p className="text-gray-300">
            أدخل رقم هاتفك المسجل في حسابك
          </p>
        </div>

        {displayError && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
            <AlertDescription className="text-red-300">{displayError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white font-medium">رقم الهاتف</Label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                966+
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="5XXXXXXXX"
                {...phoneForm.register('phone')}
                className={`pl-16 pr-12 bg-white/10 mt-4 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 ${
                  phoneForm.formState.errors.phone ? 'border-red-500' : ''
                }`}
                dir="ltr"
                style={{
                  '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
                } as React.CSSProperties}
              />
            </div>
            {phoneForm.formState.errors.phone && (
              <p className="text-sm text-red-300">{phoneForm.formState.errors.phone.message}</p>
            )}
            <p className="text-xs text-gray-400">
              أدخل رقم الهاتف بدون رمز الدولة (مثال: 512345678)
            </p>
          </div>

          <Button
            type="submit"
            className="w-full text-black font-bold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 group"
            disabled={isProcessing}
            style={{ 
              backgroundColor: '#C09B52',
              boxShadow: '0 10px 30px rgba(192, 155, 82, 0.3)'
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                جاري البحث...
              </>
            ) : (
              <>
                متابعة
                <ArrowLeft className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <button 
          onClick={goBack}
          className="w-full text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>اختيار طريقة أخرى</span>
        </button>
      </div>
    );
  }

  // Step: Phone user needs to provide email
  if (formState.step === 'phone-email-input') {
    return (
      <div className="w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-white">تم العثور على حسابك!</h1>
          <p className="text-gray-300">
            تم العثور على حساب مرتبط برقم الهاتف الخاص بك. نحتاج إلى بريد إلكتروني لإرسال رابط إعادة تعيين كلمة المرور
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-blue-200">
            <Phone className="inline w-4 h-4 ml-2" />
            رقم الهاتف: <span className="font-mono">{formState.phoneNumber}</span>
          </p>
        </div>

        {displayError && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
            <AlertDescription className="text-red-300">{displayError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={phoneEmailForm.handleSubmit(onPhoneEmailSubmit)} className="space-y-6">
          <input type="hidden" {...phoneEmailForm.register('phone')} />
          
          <div className="space-y-2">
            <Label htmlFor="newEmail" className="text-white font-medium">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="newEmail"
                type="email"
                placeholder="ahmed@example.com"
                {...phoneEmailForm.register('email')}
                className={`pl-12 bg-white/10 mt-4 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm focus:border-yellow-500 focus:ring-yellow-500/20 ${
                  phoneEmailForm.formState.errors.email ? 'border-red-500' : ''
                }`}
                dir="ltr"
                style={{
                  '--tw-ring-color': 'rgba(192, 155, 82, 0.2)'
                } as React.CSSProperties}
              />
            </div>
            {phoneEmailForm.formState.errors.email && (
              <p className="text-sm text-red-300">{phoneEmailForm.formState.errors.email.message}</p>
            )}
            <p className="text-xs text-gray-400">
              سيتم حفظ هذا البريد في حسابك وإرسال رابط إعادة التعيين إليه
            </p>
          </div>

          <Button
            type="submit"
            className="w-full text-black font-bold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 group"
            disabled={isProcessing}
            style={{ 
              backgroundColor: '#C09B52',
              boxShadow: '0 10px 30px rgba(192, 155, 82, 0.3)'
            }}
          >
            {isProcessing ? (
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

        <button 
          onClick={goBack}
          className="w-full text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>البدء من جديد</span>
        </button>
      </div>
    );
  }

  // Step: Email sent successfully
  if (formState.step === 'email-sent') {
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
              {formState.emailAddress}
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
            onClick={resetForm}
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

  // Step: User not found
  if (formState.step === 'not-found') {
    return (
      <div className="w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <UserX className="w-8 h-8 text-red-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-white">لم يتم العثور على حساب</h1>
          <p className="text-gray-300">
            {formState.inputMethod === 'email' 
              ? 'البريد الإلكتروني الذي أدخلته غير مسجل لدينا'
              : 'رقم الهاتف الذي أدخلته غير مسجل لدينا'
            }
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-sm text-gray-300">
            {formState.inputMethod === 'email' 
              ? `البريد الإلكتروني: ${formState.emailAddress}`
              : `رقم الهاتف: ${formState.phoneNumber}`
            }
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 space-y-3">
          <h3 className="text-yellow-300 font-medium text-sm">هل تريد إنشاء حساب جديد؟</h3>
          <p className="text-sm text-yellow-200">
            إذا لم يكن لديك حساب معنا، يمكنك إنشاء حساب جديد بسهولة والاستمتاع بخدماتنا.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/register">
            <Button
              className="w-full text-black font-bold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              style={{ 
                backgroundColor: '#C09B52',
                boxShadow: '0 10px 30px rgba(192, 155, 82, 0.3)'
              }}
            >
              إنشاء حساب جديد
              <ArrowLeft className="mr-2 w-5 h-5" />
            </Button>
          </Link>

          <Button
            onClick={resetForm}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            المحاولة مرة أخرى
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

  // Fallback - should not reach here
  return null;
}

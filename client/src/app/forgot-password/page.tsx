// src/app/forgot-password/page.tsx
import { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { GuestRoute } from '@/components/auth/GuestRoute';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'نسيت كلمة المرور - My Invitation',
  description: 'إعادة تعيين كلمة المرور لحسابك في My Invitation',
};

export default function ForgotPasswordPage() {
  return (
    <GuestRoute>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0">
          {/* Floating Particles */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-pulse"
              style={{
                backgroundColor: '#C09B52',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 min-h-screen flex">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
            <div className="max-w-lg text-center space-y-8">
              {/* Logo */}
              <div className="mb-8">
                <Image 
                  src="/logo.png" 
                  alt="Invitation Logo" 
                  width={200} 
                  height={80}
                  className="h-16 w-auto mx-auto"
                />
              </div>
              
              {/* Recovery Message */}
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                  استعادة الحساب
                  <br />
                  <span style={{ color: '#C09B52' }}>بسهولة وأمان</span>
                </h1>
                
                <p className="text-xl text-gray-300 leading-relaxed">
                  لا تقلق، سنساعدك في استعادة الوصول إلى حسابك بخطوات بسيطة وآمنة
                </p>
                
                {/* Security Features */}
                <div className="space-y-4 pt-8">
                  {[
                    'إعادة تعيين عبر البريد الإلكتروني',
                    'حماية متقدمة لبياناتك',
                    'استعادة سريعة للحساب',
                    'دعم فني على مدار الساعة'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 ">
                      <div 
                        className="w-2 h-2 rounded-full ml-2"
                        style={{ backgroundColor: '#C09B52' }}
                      />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <Image 
                  src="/logo.png" 
                  alt="Invitation Logo" 
                  width={160} 
                  height={60}
                  className="h-12 w-auto mx-auto"
                />
              </div>
              
              {/* Form Container */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
                <ForgotPasswordForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestRoute>
  );
}


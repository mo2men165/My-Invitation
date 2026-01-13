// src/app/reset-password/page.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import Image from 'next/image';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
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
            
            {/* Security Message */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                كلمة مرور
                <br />
                <span style={{ color: '#C09B52' }}>جديدة وآمنة</span>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                أنشئ كلمة مرور قوية وآمنة لحماية حسابك ومعلوماتك الشخصية
              </p>
              
              {/* Security Features */}
              <div className="space-y-4 pt-8">
                {[
                  'تشفير متقدم لحماية البيانات',
                  'كلمات مرور قوية ومعقدة',
                  'حماية شاملة للحساب',
                  'أمان على أعلى مستوى'
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
              <Suspense fallback={
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h1 className="text-3xl font-bold text-white">جاري التحميل...</h1>
                </div>
              }>
                <ResetPasswordContent />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
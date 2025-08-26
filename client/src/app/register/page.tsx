// src/app/register/page.tsx
import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { GuestRoute } from '@/components/auth/GuestRoute';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'إنشاء حساب جديد - My Invitation',
  description: 'أنشئ حسابك الجديد في My Invitation لبدء إدارة مناسباتك',
};

export default function RegisterPage() {
  return (
    <GuestRoute>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0">
          {/* Floating Particles */}
          {[...Array(25)].map((_, i) => (
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

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Logo Section - Centered at top */}
          <div className="flex items-center justify-center pt-12 pb-8">
            <div className="text-center space-y-6">
              
              {/* Welcome Message */}
              <div className="space-y-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                  ابدأ رحلتك مع
                  <br />
                  <span style={{ color: '#C09B52' }}>INVITATION</span>
                </h1>
                
                <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto px-4">
                  انضم إلى آلاف المستخدمين الذين يثقون بنا في إدارة مناسباتهم المميزة وإرسال دعوات لا تُنسى
                </p>
              </div>
            </div>
          </div>

          {/* Form Section - Centered with more width */}
          <div className="flex-1 flex items-center justify-center px-6 pb-12">
            <div className="w-full max-w-2xl">
              {/* Form Container */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20">
                <RegisterForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestRoute>
  );
}
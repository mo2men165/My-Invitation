'use client';

import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Home } from 'lucide-react';

interface AdminAccessDeniedProps {
  onGoBack?: () => void;
}

export function AdminAccessDenied({ onGoBack }: AdminAccessDeniedProps) {
  const router = useRouter();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center py-20">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">غير مسموح بالوصول</h2>
          <p className="text-gray-400 mb-8 text-lg">
            هذه الصفحة مخصصة للمديرين فقط. لا يمكنك الوصول إلى لوحة الإدارة.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-3 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة للصفحة السابقة
            </button>
            
            <button
              onClick={handleGoHome}
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300 transform hover:scale-105"
            >
              <Home className="w-5 h-5" />
              الصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// client/src/app/payment/error/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  ExternalLink,
  Home
} from 'lucide-react';
import Link from 'next/link';

interface PaymentErrorData {
  message?: string;
}

const PaymentErrorContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [errorData, setErrorData] = useState<PaymentErrorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadErrorData = async () => {
      try {
        setIsLoading(true);
        
        // Get error message from URL parameters
        const message = searchParams.get('message');
        
        setErrorData({
          message: message || 'حدث خطأ غير متوقع في عملية الدفع'
        });
        
        toast({
          title: "خطأ في الدفع",
          description: "حدث خطأ أثناء معالجة عملية الدفع",
          variant: "destructive",
          duration: 5000
        });
      } catch (error: any) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل بيانات الخطأ",
          variant: "destructive"
        });
        router.push('/cart');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadErrorData();
    }
  }, [isAuthenticated, searchParams, router, toast]);

  // Show loading while checking authentication
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">جاري التحميل...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">خطأ في الدفع</h1>
            <p className="text-gray-300 text-lg">
              حدث خطأ أثناء معالجة عملية الدفع
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Error Details */}
          <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              تفاصيل الخطأ
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <h3 className="text-red-400 font-semibold mb-2">رسالة الخطأ</h3>
                <p className="text-red-300/80 text-sm">
                  {errorData?.message || 'حدث خطأ غير متوقع في عملية الدفع'}
                </p>
              </div>
              
              <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <h3 className="text-orange-400 font-semibold mb-2">الوقت</h3>
                <p className="text-orange-300/80 text-sm">
                  {new Date().toLocaleString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* What You Can Do */}
          <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-blue-400" />
              ما يمكنك فعله
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-blue-400 font-semibold mb-1">المحاولة مرة أخرى</h3>
                  <p className="text-blue-300/80 text-sm">
                    يمكنك المحاولة مرة أخرى باستخدام نفس البطاقة أو بطاقة أخرى
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-green-400 font-semibold mb-1">التواصل معنا</h3>
                  <p className="text-green-300/80 text-sm">
                    يمكنك التواصل مع فريق الدعم للحصول على المساعدة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-purple-400 font-semibold mb-1">طريقة دفع أخرى</h3>
                  <p className="text-purple-300/80 text-sm">
                    يمكنك تجربة طريقة دفع مختلفة أو بطاقة أخرى
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/payment"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <RefreshCw className="w-5 h-5" />
            المحاولة مرة أخرى
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link 
            href="/cart"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-medium text-lg rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <ArrowRight className="w-4 h-4" />
            العودة إلى السلة
          </Link>
          
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-medium text-lg rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <Home className="w-5 h-5" />
            الصفحة الرئيسية
          </Link>
        </div>

        {/* Support Notice */}
        <div className="mt-8 bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-red-400 font-semibold mb-2">هل تحتاج مساعدة فورية؟</h3>
          <p className="text-red-300/80 text-sm mb-4">
            فريق الدعم متاح لمساعدتك في حل هذه المشكلة
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              اتصل بنا
            </Link>
            <Link 
              href="/packages"
              className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              تصفح الباقات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentErrorPage: React.FC = () => {
  return (
    <InstantRouteGuard allowedRoles={['user']}>
      <PaymentErrorContent />
    </InstantRouteGuard>
  );
};

export default PaymentErrorPage;

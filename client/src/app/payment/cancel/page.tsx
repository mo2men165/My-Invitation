// client/src/app/payment/cancel/page.tsx
'use client';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import { 
  XCircle, 
  ArrowLeft,
  RefreshCw,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

const PaymentCancelContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      toast({
        title: "تم إلغاء الدفع",
        description: "لم يتم إتمام عملية الدفع. يمكنك المحاولة مرة أخرى",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [isAuthenticated, toast]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">جاري التحميل...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const orderId = searchParams.get('order_id');
  const reason = searchParams.get('reason') || 'تم إلغاء العملية من قبل المستخدم';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">تم إلغاء الدفع</h1>
            <p className="text-gray-300 text-lg">
              لم يتم إتمام عملية الدفع. لا تقلق، لم يتم خصم أي مبلغ من حسابك
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Payment Details */}
          <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              تفاصيل الإلغاء
            </h2>

            <div className="space-y-4">
              {orderId && (
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-300">رقم الطلب</span>
                  <span className="text-white font-mono">{orderId}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-300">سبب الإلغاء</span>
                <span className="text-red-400">{reason}</span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-300">حالة الدفع</span>
                <span className="text-red-400 font-semibold">ملغي</span>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-[#C09B52]" />
              ما يحدث الآن
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <h3 className="text-green-400 font-semibold mb-1">لم يتم خصم أي مبلغ</h3>
                  <p className="text-green-300/80 text-sm">
                    لم يتم خصم أي مبلغ من حسابك أو بطاقتك الائتمانية
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <h3 className="text-blue-400 font-semibold mb-1">السلة محفوظة</h3>
                  <p className="text-blue-300/80 text-sm">
                    جميع العناصر في سلة التسوق الخاصة بك محفوظة ويمكنك المحاولة مرة أخرى
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h3 className="text-purple-400 font-semibold mb-1">يمكنك المحاولة مرة أخرى</h3>
                  <p className="text-purple-300/80 text-sm">
                    يمكنك العودة إلى سلة التسوق والمحاولة مرة أخرى في أي وقت
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/cart"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <ShoppingCart className="w-5 h-5" />
            العودة إلى السلة
            <ArrowLeft className="w-4 h-4" />
          </Link>
          
          <Link 
            href="/packages"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-medium text-lg rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <RefreshCw className="w-5 h-5" />
            تصفح الباقات
          </Link>
        </div>

        {/* Common Reasons */}
        <div className="mt-8 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-500/20 rounded-2xl p-6">
          <h3 className="text-yellow-400 font-semibold mb-4 text-center">أسباب شائعة لإلغاء الدفع</h3>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-300/80">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>مشاكل في الاتصال بالإنترنت</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300/80">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>إلغاء العملية من قبل المستخدم</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300/80">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>انتهاء صلاحية الجلسة</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-300/80">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>مشاكل في البطاقة الائتمانية</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300/80">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>عدم توفر رصيد كافي</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300/80">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>مشاكل تقنية مؤقتة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Support Notice */}
        <div className="mt-8 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-blue-400 font-semibold mb-2">هل تحتاج مساعدة؟</h3>
          <p className="text-blue-300/80 text-sm mb-4">
            إذا واجهت مشاكل متكررة في الدفع أو لديك استفسارات، لا تتردد في التواصل معنا
          </p>
          <Link 
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            اتصل بنا
          </Link>
        </div>
      </div>
    </div>
  );
};

const PaymentCancelPage: React.FC = () => {
  return (
    <InstantRouteGuard allowedRoles={['user']}>
      <PaymentCancelContent />
    </InstantRouteGuard>
  );
};

export default PaymentCancelPage;

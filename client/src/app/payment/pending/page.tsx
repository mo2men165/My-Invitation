// client/src/app/payment/pending/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import { 
  Clock, 
  RefreshCw, 
  ArrowRight, 
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface PaymentPendingData {
  orderId?: string;
  transactionId?: string;
  amount?: number;
  status?: string;
}

const PaymentPendingContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [paymentData, setPaymentData] = useState<PaymentPendingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setIsLoading(true);
        
        // Get payment data from URL parameters
        const orderId = searchParams.get('order_id');
        const transactionId = searchParams.get('transaction_id');
        const amount = searchParams.get('amount');
        const status = searchParams.get('status');
        
        if (orderId && transactionId) {
          setPaymentData({
            orderId,
            transactionId,
            amount: amount ? parseFloat(amount) : undefined,
            status: status || 'pending'
          });
          
          toast({
            title: "في انتظار التأكيد",
            description: "عملية الدفع قيد المراجعة والتأكيد",
            variant: "default",
            duration: 5000
          });
        } else {
          // If no payment data, redirect to events page
          router.push('/events');
        }
      } catch (error: any) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل بيانات الدفع",
          variant: "destructive"
        });
        router.push('/events');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadPaymentData();
    }
  }, [isAuthenticated, searchParams, router, toast]);

  // Show loading while checking authentication
  if (authLoading || isLoading) {
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

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">لم يتم العثور على بيانات الدفع</h2>
          <p className="text-gray-400 mb-6">يرجى التحقق من الرابط أو المحاولة مرة أخرى</p>
          <Link 
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C09B52] text-white font-medium rounded-lg hover:bg-[#B8935A] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            الانتقال إلى المناسبات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">في انتظار التأكيد</h1>
            <p className="text-gray-300 text-lg">
              عملية الدفع قيد المراجعة والتأكيد من البنك
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Payment Details */}
          <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-400" />
              تفاصيل المعاملة
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-300">رقم الطلب</span>
                <span className="text-white font-mono">{paymentData.orderId}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-300">رقم المعاملة</span>
                <span className="text-white font-mono">{paymentData.transactionId}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-300">المبلغ</span>
                <span className="text-yellow-400 font-bold text-lg">
                  {paymentData.amount?.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-300">الحالة</span>
                <span className="text-yellow-400 font-semibold">في الانتظار</span>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-yellow-400" />
              ما يحدث الآن
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-yellow-400 font-semibold mb-1">مراجعة البنك</h3>
                  <p className="text-yellow-300/80 text-sm">
                    البنك يقوم بمراجعة المعاملة والتأكد من صحة البيانات
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-blue-400 font-semibold mb-1">إشعار فوري</h3>
                  <p className="text-blue-300/80 text-sm">
                    ستتلقى إشعاراً فورياً عند تأكيد أو رفض المعاملة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-green-400 font-semibold mb-1">إنشاء المناسبات</h3>
                  <p className="text-green-300/80 text-sm">
                    عند التأكيد، ستتم إنشاء مناسباتك تلقائياً
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <RefreshCw className="w-5 h-5" />
            تحديث الحالة
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <Link 
            href="/events"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-medium text-lg rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <ArrowRight className="w-4 h-4" />
            عرض المناسبات
          </Link>
        </div>

        {/* Support Notice */}
        <div className="mt-8 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-yellow-400 font-semibold mb-2">هل تحتاج مساعدة؟</h3>
          <p className="text-yellow-300/80 text-sm mb-4">
            إذا استمر الانتظار لفترة طويلة، يرجى التواصل معنا للاستفسار
          </p>
          <Link 
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            اتصل بنا
          </Link>
        </div>
      </div>
    </div>
  );
};

const PaymentPendingPage: React.FC = () => {
  return (
    <InstantRouteGuard allowedRoles={['user']}>
      <PaymentPendingContent />
    </InstantRouteGuard>
  );
};

export default PaymentPendingPage;

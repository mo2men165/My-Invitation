// client/src/app/payment/success/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import { 
  CheckCircle, 
  Calendar, 
  Users, 
  Package,
  ArrowRight,
  Loader2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface PaymentSuccessData {
  orderId?: string;
  transactionId?: string;
  amount?: number;
  eventsCreated?: number;
}

const PaymentSuccessContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setIsLoading(true);
        
        // Get payment data from URL parameters
        const orderId = searchParams.get('order_id');
        const transactionId = searchParams.get('transaction_id');
        const amount = searchParams.get('amount');
        
        if (orderId && transactionId) {
          setPaymentData({
            orderId,
            transactionId,
            amount: amount ? parseFloat(amount) : undefined,
            eventsCreated: 1 // Default, will be updated by webhook
          });
          
          toast({
            title: "تم الدفع بنجاح!",
            description: "تم إنشاء مناسباتك بنجاح",
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
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-400" />
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
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">تم الدفع بنجاح!</h1>
            <p className="text-gray-300 text-lg">
              تم إنشاء مناسباتك بنجاح وستصلك رسالة تأكيد بالبريد الإلكتروني
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Payment Details */}
          <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-[#C09B52]" />
              تفاصيل الدفع
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
                <span className="text-gray-300">المبلغ المدفوع</span>
                <span className="text-[#C09B52] font-bold text-lg">
                  {paymentData.amount?.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-300">طريقة الدفع</span>
                <span className="text-white">Paymob</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#C09B52]" />
              الخطوات التالية
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-green-400 font-semibold mb-1">تم إنشاء المناسبات</h3>
                  <p className="text-green-300/80 text-sm">
                    تم إنشاء مناسباتك بنجاح وستظهر في لوحة التحكم
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-blue-400 font-semibold mb-1">مراجعة الإدارة</h3>
                  <p className="text-blue-300/80 text-sm">
                    ستتم مراجعة مناسباتك من قبل الإدارة خلال 24 ساعة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-purple-400 font-semibold mb-1">إرسال الدعوات</h3>
                  <p className="text-purple-300/80 text-sm">
                    بعد الموافقة، ستتمكن من إرسال الدعوات للضيوف
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/events"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <Calendar className="w-5 h-5" />
            عرض المناسبات
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-medium text-lg rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <Users className="w-5 h-5" />
            لوحة التحكم
          </Link>
        </div>

        {/* Support Notice */}
        <div className="mt-8 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-blue-400 font-semibold mb-2">هل تحتاج مساعدة؟</h3>
          <p className="text-blue-300/80 text-sm mb-4">
            إذا كان لديك أي استفسارات حول مناسباتك أو عملية الدفع، لا تتردد في التواصل معنا
          </p>
          <Link 
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            اتصل بنا
          </Link>
        </div>
      </div>
    </div>
  );
};

const PaymentSuccessPage: React.FC = () => {
  return (
    <InstantRouteGuard allowedRoles={['user']}>
      <PaymentSuccessContent />
    </InstantRouteGuard>
  );
};

export default PaymentSuccessPage;

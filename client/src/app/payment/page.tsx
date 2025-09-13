// src/app/payment/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store';
import { fetchCart } from '@/store/cartSlice';
import { paymentAPI } from '@/lib/api/payment';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import { 
  CreditCard, 
  Calendar, 
  MapPin, 
  Users, 
  Package, 
  CheckCircle,
  Loader2,
  ArrowLeft,
  Shield,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface PaymentSummary {
  itemCount: number;
  totalAmount: number;
  items: Array<{
    id: string;
    designId: string;
    packageType: 'classic' | 'premium' | 'vip';
    hostName: string;
    eventDate: string;
    eventLocation: string;
    inviteCount: number;
    price: number;
  }>;
}

const PaymentPageContent: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Load payment summary
  useEffect(() => {
    const loadPaymentSummary = async () => {
      try {
        setLoadingSummary(true);
        await dispatch(fetchCart()).unwrap();
        const response = await paymentAPI.getPaymentSummary();
        
        if (response.success && response.summary) {
          setPaymentSummary(response.summary);
        } else {
          toast({
            title: "خطأ",
            description: "لا توجد عناصر في السلة للدفع",
            variant: "destructive"
          });
          router.push('/cart');
        }
      } catch (error: any) {
        toast({
          title: "خطأ في تحميل بيانات الدفع",
          description: error.message || "حدث خطأ غير متوقع",
          variant: "destructive"
        });
        router.push('/cart');
      } finally {
        setLoadingSummary(false);
      }
    };

    loadPaymentSummary();
  }, [dispatch, router, toast]);

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

  const handlePayNow = async () => {
    if (!paymentSummary) return;

    setIsProcessingPayment(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Process successful payment
      const paymentResult = await paymentAPI.processPayment({
        paymentId: `PAY_${Date.now()}`,
        amount: paymentSummary.totalAmount,
        paymentMethod: 'credit_card',
        transactionId: `TXN_${Date.now()}`
      });

      if (paymentResult.success) {
        setPaymentSuccess(true);
        
        toast({
          title: "تم الدفع بنجاح",
          description: `تم إنشاء ${paymentResult.eventsCreated} مناسبة بنجاح`,
          variant: "default",
          duration: 4000
        });

        // Redirect after showing success message
        setTimeout(() => {
          router.push('/events');
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "فشل في معالجة الدفع",
        description: error.message || "حدث خطأ أثناء معالجة الدفع",
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getPackageDetails = (packageType: string) => {
    switch (packageType) {
      case 'classic':
        return { name: 'كلاسيك', color: 'from-blue-600 to-blue-700' };
      case 'premium':
        return { name: 'بريميوم', color: 'from-purple-600 to-purple-700' };
      case 'vip':
        return { name: 'VIP', color: 'from-yellow-600 to-yellow-700' };
      default:
        return { name: 'غير محدد', color: 'from-gray-600 to-gray-700' };
    }
  };

  if (loadingSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#C09B52]" />
          <p className="text-white">جاري تحميل بيانات الدفع...</p>
        </div>
      </div>
    );
  }

  if (!paymentSummary || paymentSummary.itemCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">السلة فارغة</h2>
          <p className="text-gray-400 mb-6">لا توجد عناصر للدفع</p>
          <Link 
            href="/packages"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C09B52] text-white font-medium rounded-lg hover:bg-[#B8935A] transition-colors"
          >
            تصفح الباقات
          </Link>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">تم الدفع بنجاح!</h2>
          <p className="text-gray-300 mb-6">
            تم إنشاء مناسباتك بنجاح. سيتم توجيهك إلى صفحة المناسبات.
          </p>
          <div className="flex items-center justify-center gap-2 text-[#C09B52]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري التحويل...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/cart"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة للسلة
            </Link>
            <div className="w-px h-6 bg-white/20"></div>
            <h1 className="text-2xl font-bold text-white">إتمام الدفع</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-[#C09B52]" />
                تفاصيل الطلب
              </h2>

              <div className="space-y-4">
                {paymentSummary.items.map((item, index) => {
                  const packageDetails = getPackageDetails(item.packageType);
                  const eventDate = new Date(item.eventDate);
                  
                  return (
                    <div key={item.id} className="bg-white/5 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${packageDetails.color} text-white text-sm font-medium`}>
                              {packageDetails.name}
                            </div>
                            <span className="text-gray-400 text-sm">#{index + 1}</span>
                          </div>
                          <h3 className="text-white font-semibold text-lg">{item.hostName}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#C09B52]">
                            {item.price.toLocaleString('ar-SA')} ر.س
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4 text-[#C09B52]" />
                          {eventDate.toLocaleDateString('ar-SA')}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-4 h-4 text-[#C09B52]" />
                          {item.eventLocation}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Users className="w-4 h-4 text-[#C09B52]" />
                          {item.inviteCount} دعوة
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-green-400 font-semibold mb-2">دفع آمن ومضمون</h3>
                  <p className="text-green-300/80 text-sm">
                    جميع المعاملات محمية بتشفير SSL وتتم معالجتها بأمان تام. 
                    بياناتك الشخصية ومعلومات الدفع محفوظة بسرية كاملة.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#C09B52]/10 via-[#C09B52]/5 to-transparent rounded-2xl border border-[#C09B52]/20 p-6 sticky top-4">
              <h2 className="text-xl font-bold text-white mb-6">ملخص الدفع</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-gray-300">
                  <span>عدد المناسبات</span>
                  <span>{paymentSummary.itemCount}</span>
                </div>
                
                <div className="flex justify-between items-center text-gray-300">
                  <span>المجموع الفرعي</span>
                  <span>{paymentSummary.totalAmount.toLocaleString('ar-SA')} ر.س</span>
                </div>
                
                
                <div className="border-t border-[#C09B52]/30 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">الإجمالي</span>
                    <span className="text-2xl font-bold text-[#C09B52]">
                      {paymentSummary.totalAmount.toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayNow}
                disabled={isProcessingPayment}
                className="w-full py-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري معالجة الدفع...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    ادفع الآن
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>سيتم إنشاء المناسبات فور إتمام الدفع</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentPage: React.FC = () => {
  return (
    <InstantRouteGuard allowedRoles={['user']}>
      <PaymentPageContent />
    </InstantRouteGuard>
  );
};

export default PaymentPage;
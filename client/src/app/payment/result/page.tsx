// client/src/app/payment/result/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Users, 
  Package,
  ArrowRight,
  Loader2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { paymentAPI } from '@/lib/api/payment';

interface OrderData {
  id: string;
  merchantOrderId: string;
  paymobOrderId: number;
  paymobTransactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  totalAmount: number;
  paymentMethod: string;
  eventsCreated: number;
  events: Array<{
    _id: string;
    details: {
      eventName: string;
      displayName?: string;
      eventLocation: string;
    };
    packageType: string;
    totalPrice: number;
  }>;
  selectedItems: Array<{
    cartItemId: string;
    hostName: string;
    packageType: string;
    eventDate: string;
    eventLocation: string;
    price: number;
  }>;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
}

const PaymentResultContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get parameters from URL
        const provider = searchParams.get('provider');
        const merchantOrderId = searchParams.get('order_id') || searchParams.get('merchant_order_id');
        const reason = searchParams.get('reason');
        const message = searchParams.get('message');
        const callbackId = searchParams.get('callback_id');
        const tabbyStatus = searchParams.get('status');
        
        // Handle Tamara payment redirections
        if (provider === 'tamara') {
          const tamaraStatus = searchParams.get('status');
          console.log(`🔔 TAMARA PAYMENT REDIRECT`, { tamaraStatus, merchantOrderId });
          
          if (tamaraStatus === 'cancel') {
            setOrderData({
              id: merchantOrderId || 'unknown',
              merchantOrderId: merchantOrderId || 'unknown',
              paymobOrderId: 0,
              status: 'cancelled',
              totalAmount: 0,
              paymentMethod: 'tamara',
              eventsCreated: 0,
              events: [],
              selectedItems: [],
              createdAt: new Date().toISOString()
            });
            
            toast({
              title: "تم إلغاء الدفع",
              description: "لم يتم إتمام عملية الدفع عبر تمارا. يمكنك المحاولة مرة أخرى",
              variant: "destructive",
              duration: 5000
            });
            return;
          }
          
          if (tamaraStatus === 'failure') {
            setOrderData({
              id: merchantOrderId || 'unknown',
              merchantOrderId: merchantOrderId || 'unknown',
              paymobOrderId: 0,
              status: 'failed',
              totalAmount: 0,
              paymentMethod: 'tamara',
              eventsCreated: 0,
              events: [],
              selectedItems: [],
              createdAt: new Date().toISOString()
            });
            
            toast({
              title: "فشل في الدفع",
              description: "لم يتم إتمام عملية الدفع عبر تمارا",
              variant: "destructive",
              duration: 5000
            });
            return;
          }
          
          if (tamaraStatus === 'success' && merchantOrderId) {
            console.log(`✅ TAMARA PAYMENT SUCCESS - POLLING FOR ORDER [${merchantOrderId}]`);
            
            let attempts = 0;
            const maxAttempts = 15;
            const pollInterval = 2000;
            
            const pollForOrder = async (): Promise<boolean> => {
              try {
                const response = await paymentAPI.getOrderByMerchantId(merchantOrderId);
                
                if (response.success && response.order) {
                  console.log(`📊 ORDER STATUS [${merchantOrderId}]`, {
                    status: response.order.status,
                    attempt: attempts + 1
                  });
                  
                  if (response.order.status === 'completed') {
                    setOrderData(response.order);
                    toast({
                      title: "تم الدفع بنجاح!",
                      description: `تم إنشاء ${response.order.eventsCreated} مناسبة بنجاح`,
                      variant: "default",
                      duration: 5000
                    });
                    return true;
                  } else if (response.order.status === 'failed') {
                    setOrderData(response.order);
                    toast({
                      title: "فشل في الدفع",
                      description: "لم يتم إتمام عملية الدفع بنجاح",
                      variant: "destructive",
                      duration: 5000
                    });
                    return true;
                  }
                }
                return false;
              } catch (err) {
                console.error('Error polling for order:', err);
                return false;
              }
            };
            
            if (await pollForOrder()) return;
            
            while (attempts < maxAttempts) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, pollInterval));
              if (await pollForOrder()) return;
            }
            
            const finalResponse = await paymentAPI.getOrderByMerchantId(merchantOrderId);
            if (finalResponse.success && finalResponse.order) {
              setOrderData(finalResponse.order);
              toast({
                title: "جاري معالجة الدفع",
                description: "سيتم تأكيد الدفع قريباً. يمكنك متابعة حالة الطلب من لوحة التحكم",
                variant: "default",
                duration: 7000
              });
            } else {
              setError('فشل في تحميل بيانات الطلب');
            }
            return;
          }
        }

        // Handle Tabby payment redirections
        if (provider === 'tabby') {
          console.log(`🔔 TABBY PAYMENT REDIRECT`, { tabbyStatus, merchantOrderId });
          
          if (tabbyStatus === 'cancel') {
            setOrderData({
              id: merchantOrderId || 'unknown',
              merchantOrderId: merchantOrderId || 'unknown',
              paymobOrderId: 0,
              status: 'cancelled',
              totalAmount: 0,
              paymentMethod: 'tabby',
              eventsCreated: 0,
              events: [],
              selectedItems: [],
              createdAt: new Date().toISOString()
            });
            
            toast({
              title: "تم إلغاء الدفع",
              description: "لم يتم إتمام عملية الدفع عبر تابي. يمكنك المحاولة مرة أخرى",
              variant: "destructive",
              duration: 5000
            });
            return;
          }
          
          if (tabbyStatus === 'failure') {
            setOrderData({
              id: merchantOrderId || 'unknown',
              merchantOrderId: merchantOrderId || 'unknown',
              paymobOrderId: 0,
              status: 'failed',
              totalAmount: 0,
              paymentMethod: 'tabby',
              eventsCreated: 0,
              events: [],
              selectedItems: [],
              createdAt: new Date().toISOString()
            });
            
            toast({
              title: "فشل في الدفع",
              description: "لم يتم إتمام عملية الدفع عبر تابي",
              variant: "destructive",
              duration: 5000
            });
            return;
          }
          
          // For success status, poll for order completion
          if (tabbyStatus === 'success' && merchantOrderId) {
            console.log(`✅ TABBY PAYMENT SUCCESS - POLLING FOR ORDER [${merchantOrderId}]`);
            
            // Poll for order completion (webhook should process it)
            let attempts = 0;
            const maxAttempts = 10;
            const pollInterval = 2000;
            
            const pollForOrder = async (): Promise<boolean> => {
              try {
                const response = await paymentAPI.getOrderByMerchantId(merchantOrderId);
                
                if (response.success && response.order) {
                  console.log(`📊 ORDER STATUS [${merchantOrderId}]`, {
                    status: response.order.status,
                    attempt: attempts + 1
                  });
                  
                  if (response.order.status === 'completed') {
                    setOrderData(response.order);
                    toast({
                      title: "تم الدفع بنجاح!",
                      description: `تم إنشاء ${response.order.eventsCreated} مناسبة بنجاح`,
                      variant: "default",
                      duration: 5000
                    });
                    return true;
                  } else if (response.order.status === 'failed') {
                    setOrderData(response.order);
                    toast({
                      title: "فشل في الدفع",
                      description: "لم يتم إتمام عملية الدفع بنجاح",
                      variant: "destructive",
                      duration: 5000
                    });
                    return true;
                  }
                }
                return false;
              } catch (err) {
                console.error('Error polling for order:', err);
                return false;
              }
            };
            
            // Try immediately first
            if (await pollForOrder()) return;
            
            // Then poll with interval
            while (attempts < maxAttempts) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, pollInterval));
              if (await pollForOrder()) return;
            }
            
            // If still pending after max attempts, show pending state
            const finalResponse = await paymentAPI.getOrderByMerchantId(merchantOrderId);
            if (finalResponse.success && finalResponse.order) {
              setOrderData(finalResponse.order);
              toast({
                title: "جاري معالجة الدفع",
                description: "سيتم تأكيد الدفع قريباً. يمكنك متابعة حالة الطلب من لوحة التحكم",
                variant: "default",
                duration: 7000
              });
            } else {
              setError('فشل في تحميل بيانات الطلب');
            }
            return;
          }
        }
        
        // Handle Paymob/default payment flow
        if (reason === 'cancelled' || reason === 'user_cancelled') {
          console.log(`🚫 PAYMENT CANCELLED [${merchantOrderId}]`, { reason, callbackId });
          setOrderData({
            id: merchantOrderId || 'unknown',
            merchantOrderId: merchantOrderId || 'unknown',
            paymobOrderId: 0,
            status: 'cancelled',
            totalAmount: 0,
            paymentMethod: 'paymob',
            eventsCreated: 0,
            events: [],
            selectedItems: [],
            createdAt: new Date().toISOString()
          });
          
          toast({
            title: "تم إلغاء الدفع",
            description: "لم يتم إتمام عملية الدفع. يمكنك المحاولة مرة أخرى",
            variant: "destructive",
            duration: 5000
          });
          return;
        }
        
        if (message || callbackId) {
          console.log(`💥 PAYMENT ERROR [${merchantOrderId}]`, { message, callbackId });
          setOrderData({
            id: merchantOrderId || 'unknown',
            merchantOrderId: merchantOrderId || 'unknown',
            paymobOrderId: 0,
            status: 'failed',
            totalAmount: 0,
            paymentMethod: 'paymob',
            eventsCreated: 0,
            events: [],
            selectedItems: [],
            createdAt: new Date().toISOString()
          });
          
          toast({
            title: "خطأ في الدفع",
            description: message || "حدث خطأ أثناء معالجة عملية الدفع",
            variant: "destructive",
            duration: 5000
          });
          return;
        }
        
        if (!merchantOrderId) {
          console.error('❌ NO MERCHANT ORDER ID PROVIDED');
          setError('معرف الطلب غير موجود');
          return;
        }

        console.log(`🔍 LOADING ORDER DATA [${merchantOrderId}]`, {
          merchantOrderId,
          timestamp: new Date().toISOString()
        });

        const response = await paymentAPI.getOrderByMerchantId(merchantOrderId);
        
        if (response.success && response.order) {
          console.log(`✅ ORDER DATA LOADED [${merchantOrderId}]`, {
            merchantOrderId,
            status: response.order.status,
            totalAmount: response.order.totalAmount,
            eventsCreated: response.order.eventsCreated
          });
          
          setOrderData(response.order);
          
          if (response.order.status === 'completed') {
            toast({
              title: "تم الدفع بنجاح!",
              description: `تم إنشاء ${response.order.eventsCreated} مناسبة بنجاح`,
              variant: "default",
              duration: 5000
            });
          } else if (response.order.status === 'failed') {
            toast({
              title: "فشل في الدفع",
              description: "لم يتم إتمام عملية الدفع بنجاح",
              variant: "destructive",
              duration: 5000
            });
          } else if (response.order.status === 'pending') {
            toast({
              title: "في انتظار التأكيد",
              description: "عملية الدفع قيد المراجعة والتأكيد",
              variant: "default",
              duration: 5000
            });
          }
        } else {
          console.error(`❌ FAILED TO LOAD ORDER [${merchantOrderId}]`, response);
          setError(response.error?.message || 'فشل في تحميل بيانات الطلب');
        }
      } catch (error: any) {
        console.error(`💥 ERROR LOADING ORDER DATA`, {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        
        setError('حدث خطأ أثناء تحميل بيانات الطلب');
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل بيانات الطلب",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadOrderData();
    }
  }, [isAuthenticated, searchParams, toast]);

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

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">خطأ في تحميل البيانات</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C09B52] text-white font-medium rounded-lg hover:bg-[#B8935A] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
            <Link 
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              الانتقال إلى المناسبات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">لم يتم العثور على بيانات الطلب</h2>
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

  // Determine status icon and colors
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-400',
          bgColor: 'bg-green-500/20',
          title: 'تم الدفع بنجاح!',
          description: 'تم إنشاء مناسباتك بنجاح وستصلك رسالة تأكيد بالبريد الإلكتروني'
        };
      case 'failed':
        return {
          icon: XCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/20',
          title: 'فشل في الدفع',
          description: 'لم يتم إتمام عملية الدفع بنجاح'
        };
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          title: 'في انتظار التأكيد',
          description: 'عملية الدفع قيد المراجعة والتأكيد'
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          title: 'حالة غير معروفة',
          description: 'حالة الطلب غير معروفة'
        };
    }
  };

  const statusConfig = getStatusConfig(orderData.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className={`w-20 h-20 ${statusConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <StatusIcon className={`w-12 h-12 ${statusConfig.iconColor}`} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{statusConfig.title}</h1>
            <p className="text-gray-300 text-lg">
              {statusConfig.description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Order Details */}
          <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-[#C09B52]" />
              تفاصيل الطلب
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-300">رقم الطلب</span>
                <span className="text-white font-mono">{orderData.merchantOrderId.substring(0, 20)}...</span>
              </div>
              
              {orderData.paymobTransactionId && (
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-300">رقم المعاملة</span>
                  <span className="text-white font-mono">{orderData.paymobTransactionId}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-300">المبلغ المدفوع</span>
                <span className="text-[#C09B52] font-bold text-lg">
                  {orderData.totalAmount.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-300">طريقة الدفع</span>
                <span className="text-white">{orderData.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-300">عدد العناصر</span>
                <span className="text-white">{orderData.selectedItems.length}</span>
              </div>

              {orderData.status === 'completed' && (
                <>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-300">المناسبات المنشأة</span>
                    <span className="text-green-400 font-bold">{orderData.eventsCreated}</span>
                  </div>
                  
                  {/* Bill Email Notification */}
                  {user?.email && user.email.trim() && (
                    <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-blue-300 text-sm">
                            سيتم إرسال فاتورة مفصلة إلى بريدك الإلكتروني: <span className="font-semibold">{user.email}</span>
                          </p>
                          <Link 
                            href="/dashboard?tab=bills"
                            className="inline-flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                          >
                            عرض جميع الفواتير
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(!user?.email || !user.email.trim()) && (
                    <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-amber-300 text-sm">
                            لم يتم العثور على بريد إلكتروني مسجل. يمكنك عرض جميع فواتيرك من لوحة التحكم.
                          </p>
                          <Link 
                            href="/dashboard?tab=bills"
                            className="inline-flex items-center gap-1 mt-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                          >
                            عرض جميع الفواتير
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status-specific content */}
          <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#C09B52]" />
              {orderData.status === 'completed' ? 'المناسبات المنشأة' : 'الخطوات التالية'}
            </h2>

            {orderData.status === 'completed' ? (
              <div className="space-y-4">
                {orderData.events.length > 0 ? (
                  orderData.events.map((event, index) => (
                    <div key={event._id} className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-green-400 font-semibold mb-1">{event.details.eventName}</h3>
                        <p className="text-green-300/80 text-sm">
                          {event.details.displayName || event.details.eventLocation}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-green-300/60 text-xs">
                            {event.packageType}
                          </p>
                          <p className="text-green-400 font-bold text-sm">
                            {event.totalPrice.toLocaleString('ar-SA')} ر.س
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">جاري تحميل تفاصيل المناسبات...</p>
                  </div>
                )}
              </div>
            ) : orderData.status === 'failed' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-red-400 font-semibold mb-1">فشل في الدفع</h3>
                    <p className="text-red-300/80 text-sm">
                      لم يتم إتمام عملية الدفع بنجاح
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-blue-400 font-semibold mb-1">إعادة المحاولة</h3>
                    <p className="text-blue-300/80 text-sm">
                      يمكنك إعادة المحاولة من صفحة السلة
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-yellow-400 font-semibold mb-1">في انتظار التأكيد</h3>
                    <p className="text-yellow-300/80 text-sm">
                      عملية الدفع قيد المراجعة والتأكيد
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
                      ستتم مراجعة طلبك من قبل الإدارة خلال 24 ساعة
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {orderData.status === 'completed' ? (
            <>
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
            </>
          ) : orderData.status === 'failed' ? (
            <>
              <Link 
                href="/cart"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <RefreshCw className="w-5 h-5" />
                إعادة المحاولة
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link 
                href="/events"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-medium text-lg rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <Calendar className="w-5 h-5" />
                عرض المناسبات
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Support Notice */}
        <div className="mt-8 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-blue-400 font-semibold mb-2">هل تحتاج مساعدة؟</h3>
          <p className="text-blue-300/80 text-sm mb-4">
            إذا كان لديك أي استفسارات حول طلبك أو عملية الدفع، لا تتردد في التواصل معنا
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

const PaymentResultPage: React.FC = () => {
  return (
    <InstantRouteGuard allowedRoles={['user']}>
      <PaymentResultContent />
    </InstantRouteGuard>
  );
};

export default PaymentResultPage;

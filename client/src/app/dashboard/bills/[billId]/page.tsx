// src/app/dashboard/bills/[billId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { dashboardAPI, Bill } from '@/lib/api/dashboard';
import { useToast } from '@/hooks/useToast';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';
import { 
  FileText, 
  Calendar,
  Package, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Receipt
} from 'lucide-react';
import Link from 'next/link';

export default function BillDetailsPage() {
  const params = useParams<{ billId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const billId = params?.billId;
  
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (billId) {
      loadBillDetails();
    }
  }, [billId]);

  const loadBillDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await dashboardAPI.getBillById(billId);
      
      if (response.success && response.data) {
        setBill(response.data);
      } else {
        throw new Error('فشل في جلب تفاصيل الفاتورة');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب تفاصيل الفاتورة');
      toast({
        title: "خطأ",
        description: err.message || 'حدث خطأ أثناء جلب تفاصيل الفاتورة',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'gregory'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const formatPackageType = (type: string) => {
    const types: Record<string, string> = {
      classic: 'كلاسيكي',
      premium: 'بريميوم',
      vip: 'VIP'
    };
    return types[type] || type;
  };

  const getPackageColor = (type: string) => {
    switch (type) {
      case 'classic':
        return 'bg-blue-500/20 text-blue-400';
      case 'premium':
        return 'bg-purple-500/20 text-purple-400';
      case 'vip':
        return 'bg-[#C09B52]/20 text-[#C09B52]';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <InstantRouteGuard 
      allowedRoles={['user']}
      fallback={<DashboardSkeleton />}
    >
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="container mx-auto px-8 py-12">
          
          {/* Back Button */}
          <Link
            href="/dashboard?tab=bills"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            العودة للفواتير
          </Link>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#C09B52] animate-spin" />
            </div>
          ) : error || !bill ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">الفاتورة غير موجودة</h2>
              <p className="text-gray-400 mb-6">{error || 'الفاتورة المطلوبة غير متاحة أو تم حذفها'}</p>
              <Link
                href="/dashboard?tab=bills"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#C09B52] text-white font-medium rounded-lg hover:bg-[#B8935A] transition-colors"
              >
                العودة للفواتير
              </Link>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Bill Header */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-[#C09B52]/20 flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-[#C09B52]" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-white">تفاصيل الفاتورة</h1>
                        <p className="text-gray-400">رقم الفاتورة: {bill.billNumber}</p>
                      </div>
                    </div>
                  </div>
                  {bill.emailSent && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">تم الإرسال</span>
                    </div>
                  )}
                </div>

                {/* Bill Info Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">تاريخ الدفع</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="text-white font-medium">{formatDate(bill.paymentDate)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">معرف الدفع</p>
                      <p className="text-white font-medium">{bill.paymentId}</p>
                    </div>
                    {bill.transactionId && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">معرف المعاملة</p>
                        <p className="text-white font-medium">{bill.transactionId}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">طريقة الدفع</p>
                      <p className="text-white font-medium">{bill.paymentMethod === 'paymob' ? 'باي موب' : bill.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">إجمالي المبلغ</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-[#C09B52]">
                          {bill.totalAmount.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-5 h-5 text-[#C09B52]" />
                  <h2 className="text-xl font-bold text-white">معلومات العميل</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">الاسم</p>
                    <p className="text-white font-medium">{bill.user.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">البريد الإلكتروني</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <p className="text-white font-medium">{bill.user.email || 'غير متوفر'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">رقم الهاتف</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-white font-medium">{bill.user.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">المدينة</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <p className="text-white font-medium">{bill.user.city}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Events List */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Package className="w-5 h-5 text-[#C09B52]" />
                  <h2 className="text-xl font-bold text-white">المناسبات ({bill.events.length})</h2>
                </div>
                <div className="space-y-4">
                  {bill.events.map((event, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {event.eventName || event.hostName}
                            </h3>
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getPackageColor(event.packageType)}`}>
                              {formatPackageType(event.packageType)}
                            </span>
                          </div>
                          {event.eventName && (
                            <p className="text-gray-400 text-sm mb-2">المضيف: {event.hostName}</p>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-[#C09B52]">
                            {event.price.toLocaleString('ar-SA')} ر.س
                          </p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-gray-400 text-xs">تاريخ المناسبة</p>
                            <p className="text-white text-sm font-medium">{formatDateShort(event.eventDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-gray-400 text-xs">المكان</p>
                            <p className="text-white text-sm font-medium">
                              {(event as any).simpleLocation || event.eventLocation}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-gray-400 text-xs">عدد الدعوات</p>
                            <p className="text-white text-sm font-medium">{event.inviteCount} دعوة</p>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Breakdown */}
                      {(event as any).pricingBreakdown && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-gray-400 text-sm font-medium mb-3">تفاصيل التسعير:</p>
                          <div className="space-y-2 bg-white/5 rounded-lg p-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">سعر الباقة الأساسي</span>
                              <span className="text-white font-medium">
                                {(event as any).pricingBreakdown.basePrice.toLocaleString('ar-SA')} ر.س
                              </span>
                            </div>
                            
                            {(event as any).pricingBreakdown.totalAdditionalCosts > 0 && (
                              <>
                                {(event as any).pricingBreakdown.additionalCards.count > 0 && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">
                                      بطاقات إضافية ({(event as any).pricingBreakdown.additionalCards.count} × {(event as any).pricingBreakdown.additionalCards.pricePerCard} ر.س)
                                    </span>
                                    <span className="text-white font-medium">
                                      +{(event as any).pricingBreakdown.additionalCards.total.toLocaleString('ar-SA')} ر.س
                                    </span>
                                  </div>
                                )}
                                
                                {(event as any).pricingBreakdown.gateSupervisors.count > 0 && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">
                                      مشرفين البوابة ({(event as any).pricingBreakdown.gateSupervisors.count} × {(event as any).pricingBreakdown.gateSupervisors.pricePerSupervisor} ر.س)
                                    </span>
                                    <span className="text-white font-medium">
                                      +{(event as any).pricingBreakdown.gateSupervisors.total.toLocaleString('ar-SA')} ر.س
                                    </span>
                                  </div>
                                )}
                                
                                {(event as any).pricingBreakdown.fastDelivery.enabled && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">تسليم سريع</span>
                                    <span className="text-white font-medium">
                                      +{(event as any).pricingBreakdown.fastDelivery.price.toLocaleString('ar-SA')} ر.س
                                    </span>
                                  </div>
                                )}
                                
                                {(event as any).pricingBreakdown.extraHours.count > 0 && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">
                                      ساعات إضافية ({(event as any).pricingBreakdown.extraHours.count} × {(event as any).pricingBreakdown.extraHours.pricePerHour} ر.س)
                                    </span>
                                    <span className="text-white font-medium">
                                      +{(event as any).pricingBreakdown.extraHours.total.toLocaleString('ar-SA')} ر.س
                                    </span>
                                  </div>
                                )}
                                
                                <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
                                  <span className="text-gray-300 font-medium">المجموع</span>
                                  <span className="text-[#C09B52] font-bold text-lg">
                                    {(event as any).pricingBreakdown.totalPrice.toLocaleString('ar-SA')} ر.س
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-[#C09B52]/20 to-[#C09B52]/10 backdrop-blur-sm rounded-2xl border border-[#C09B52]/30 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm mb-1">إجمالي المبلغ</p>
                    <p className="text-3xl font-bold text-white">
                      {bill.totalAmount.toLocaleString('ar-SA')} ر.س
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-300 text-sm mb-1">عدد المناسبات</p>
                    <p className="text-2xl font-bold text-[#C09B52]">{bill.events.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </InstantRouteGuard>
  );
}

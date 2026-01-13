// components/dashboard/UserBills.tsx
'use client';
import { useState, useEffect } from 'react';
import { FileText, Mail, Calendar, DollarSign, Package, Loader2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { dashboardAPI, Bill } from '@/lib/api/dashboard';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

export function UserBills() {
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    loadBills();
  }, [page]);

  const loadBills = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await dashboardAPI.getBills({ limit, page });
      
      if (response.success && response.data) {
        setBills(response.data.bills);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        throw new Error('فشل في جلب الفواتير');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب الفواتير');
      toast({
        title: "خطأ",
        description: err.message || 'حدث خطأ أثناء جلب الفواتير',
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

  if (error && !isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-lg font-medium text-white">خطأ في تحميل الفواتير</h3>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadBills}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">الفواتير</h2>
        <p className="text-gray-400">جميع فواتيرك السابقة والحالية</p>
      </div>

      {/* Bills List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#C09B52] animate-spin" />
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">لا توجد فواتير حالياً</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {bills.map((bill) => (
              <div
                key={bill._id}
                className="bg-white/5 rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#C09B52]/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#C09B52]" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">
                          فاتورة #{bill.billNumber}
                        </h3>
                        <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(bill.paymentDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">المبلغ الإجمالي</p>
                        <p className="text-[#C09B52] font-bold text-lg">
                          {bill.totalAmount.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">عدد المناسبات</p>
                        <p className="text-white font-semibold">{bill.events.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">طريقة الدفع</p>
                        <p className="text-white text-sm">{bill.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">حالة البريد</p>
                        <div className="flex items-center gap-2">
                          {bill.emailSent ? (
                            <>
                              <Mail className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 text-sm">تم الإرسال</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400 text-sm">لم يُرسل</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Events Preview */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-gray-400 text-sm mb-2">المناسبات:</p>
                      <div className="space-y-2">
                        {bill.events.slice(0, 2).map((event, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-300">{event.hostName}</span>
                              <span className="text-gray-500">-</span>
                              <span className="text-gray-400">{formatPackageType(event.packageType)}</span>
                            </div>
                            <span className="text-[#C09B52] font-semibold">
                              {event.price.toLocaleString('ar-SA')} ر.س
                            </span>
                          </div>
                        ))}
                        {bill.events.length > 2 && (
                          <p className="text-gray-500 text-xs">
                            +{bill.events.length - 2} مناسبة أخرى
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Details Link */}
                <Link
                  href={`/dashboard/bills/${bill._id}`}
                  className="inline-flex items-center gap-2 mt-4 text-[#C09B52] hover:text-[#B8935A] text-sm font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  عرض التفاصيل الكاملة
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>
              <span className="text-gray-400">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
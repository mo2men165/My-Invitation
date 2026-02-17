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
      <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-red-500/20 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-white">خطأ في تحميل الفواتير</h3>
              <p className="text-red-400 text-xs sm:text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadBills}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-xs sm:text-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">الفواتير</h2>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base">جميع فواتيرك السابقة والحالية</p>
      </div>

      {/* Bills List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#C09B52] animate-spin" />
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <FileText className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-500 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-400 text-sm sm:text-base md:text-lg">لا توجد فواتير حالياً</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {bills.map((bill) => (
              <div
                key={bill._id}
                className="bg-white/5 rounded-lg sm:rounded-xl border border-white/10 p-3 sm:p-4 md:p-5 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#C09B52]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#C09B52]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-sm sm:text-base md:text-lg truncate">
                          فاتورة #{bill.billNumber}
                        </h3>
                        <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="truncate">{formatDate(bill.paymentDate)}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4">
                      <div>
                        <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">المبلغ الإجمالي</p>
                        <p className="text-[#C09B52] font-bold text-sm sm:text-base md:text-lg">
                          {bill.totalAmount.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">عدد المناسبات</p>
                        <p className="text-white font-semibold text-sm sm:text-base">{bill.events.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">طريقة الدفع</p>
                        <p className="text-white text-xs sm:text-sm">{bill.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">حالة البريد</p>
                        <div className="flex items-center gap-1 sm:gap-2">
                          {bill.emailSent ? (
                            <>
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                              <span className="text-green-400 text-[10px] sm:text-xs md:text-sm">تم الإرسال</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm">لم يُرسل</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Events Preview */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                      <p className="text-gray-400 text-xs sm:text-sm mb-1.5 sm:mb-2">المناسبات:</p>
                      <div className="space-y-1.5 sm:space-y-2">
                        {bill.events.slice(0, 2).map((event, index) => (
                          <div key={index} className="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-xs md:text-sm">
                            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                              <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-gray-300 truncate">{event.hostName}</span>
                              <span className="text-gray-500 hidden xs:inline">-</span>
                              <span className="text-gray-400 hidden xs:inline">{formatPackageType(event.packageType)}</span>
                            </div>
                            <span className="text-[#C09B52] font-semibold whitespace-nowrap">
                              {event.price.toLocaleString('ar-SA')} ر.س
                            </span>
                          </div>
                        ))}
                        {bill.events.length > 2 && (
                          <p className="text-gray-500 text-[10px] sm:text-xs">
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
                  className="inline-flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-4 text-[#C09B52] hover:text-[#B8935A] text-xs sm:text-sm font-medium transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  عرض التفاصيل الكاملة
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              >
                السابق
              </button>
              <span className="text-gray-400 text-xs sm:text-sm">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
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
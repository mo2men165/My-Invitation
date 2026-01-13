// client/src/components/payment/PaymobPayment.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paymobAPI } from '@/lib/api/paymob';
import { useToast } from '@/hooks/useToast';
import { 
  CreditCard, 
  Loader2, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  X
} from 'lucide-react';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
}

interface PaymobPaymentProps {
  amount: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
  buttonText?: string;
  showCustomerForm?: boolean;
  customerInfo?: Partial<CustomerInfo>;
}

const PaymobPayment: React.FC<PaymobPaymentProps> = ({
  amount,
  onSuccess,
  onError,
  onCancel,
  className = '',
  buttonText = 'ادفع الآن',
  showCustomerForm = true,
  customerInfo: initialCustomerInfo = {}
}) => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: initialCustomerInfo.firstName || '',
    lastName: initialCustomerInfo.lastName || '',
    email: initialCustomerInfo.email || '',
    phone: initialCustomerInfo.phone || '',
    city: initialCustomerInfo.city || ''
  });

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      const error = 'المبلغ غير صحيح';
      onError?.(error);
      toast({
        title: "خطأ",
        description: error,
        variant: "destructive"
      });
      return;
    }

    // Check if customer info is complete
    if (showCustomerForm && (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone || !customerInfo.city)) {
      setShowForm(true);
      return;
    }

    setIsProcessing(true);

    try {
      const orderResult = await paymobAPI.createOrder({
        customerInfo: showCustomerForm ? customerInfo : {
          firstName: 'مستخدم',
          lastName: 'غير محدد',
          email: 'user@example.com',
          phone: '+966501234567',
          city: 'الرياض'
        }
      });

      if (orderResult.success) {
        // Redirect to Paymob iframe
        window.location.href = orderResult.iframeUrl;
      } else {
        throw new Error('فشل في إنشاء طلب الدفع');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'حدث خطأ أثناء إنشاء طلب الدفع';
      onError?.(errorMessage);
      toast({
        title: "فشل في إنشاء طلب الدفع",
        description: errorMessage,
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
    handlePayment();
  };

  const saudiCities = [
    'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام',
    'الخبر', 'الظهران', 'الطائف', 'بريدة', 'تبوك',
    'خميس مشيط', 'الهفوف', 'حائل', 'نجران', 'ينبع', 'أخرى'
  ];

  return (
    <div className={className}>
      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full py-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            جاري إنشاء طلب الدفع...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {buttonText}
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Shield className="w-3 h-3" />
        <span>دفع آمن ومضمون عبر Paymob</span>
      </div>

      {/* Customer Information Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">معلومات العميل</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">الاسم الأول</label>
                  <input
                    type="text"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]"
                    placeholder="أدخل الاسم الأول"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">الاسم الأخير</label>
                  <input
                    type="text"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]"
                    placeholder="أدخل الاسم الأخير"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]"
                  placeholder="أدخل البريد الإلكتروني"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]"
                  placeholder="+966501234567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">المدينة</label>
                <select
                  value={customerInfo.city}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C09B52]"
                  required
                >
                  <option value="">اختر المدينة</option>
                  {saudiCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Payment Summary */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">المبلغ الإجمالي</span>
                  <span className="text-[#C09B52] font-bold text-lg">
                    {amount.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-[#C09B52] to-[#B8935A] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري المعالجة...
                    </div>
                  ) : (
                    'متابعة الدفع'
                  )}
                </button>
              </div>
            </form>

            {/* Security Notice */}
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-300 text-xs">
                    جميع المعاملات محمية بتشفير SSL وتتم معالجتها بأمان تام عبر Paymob
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymobPayment;

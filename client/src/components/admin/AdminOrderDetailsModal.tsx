'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface OrderDetails {
  id: string;
  merchantOrderId: string;
  paymobOrderId: number;
  paymobTransactionId?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
  };
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  selectedCartItems: Array<{
    cartItemId: string;
    packageType: 'classic' | 'premium' | 'vip';
    eventName: string;
    hostName: string;
    eventDate: string;
    eventLocation: string;
    inviteCount: number;
    totalPrice: number;
    isCustomDesign: boolean;
    customDesignNotes?: string;
  }>;
  eventsCreated: Array<{
    id: string;
    eventName: string;
    hostName: string;
    eventDate: string;
    approvalStatus: string;
    status: string;
    packageType: string;
    guestCount: number;
  }>;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
}

interface AdminOrderDetailsModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminOrderDetailsModal({ orderId, isOpen, onClose }: AdminOrderDetailsModalProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Status change modals
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [reason, setReason] = useState('');
  
  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('فشل في جلب تفاصيل الطلب');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب التفاصيل');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        icon: CheckCircle,
        label: 'مكتمل'
      },
      pending: {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-400',
        icon: Clock,
        label: 'قيد الانتظار'
      },
      failed: {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        icon: XCircle,
        label: 'فشل'
      },
      cancelled: {
        bg: 'bg-gray-500/20',
        text: 'text-gray-400',
        icon: Ban,
        label: 'ملغي'
      },
      approved: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        icon: CheckCircle,
        label: 'موافق عليه'
      },
      rejected: {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        icon: XCircle,
        label: 'مرفوض'
      },
      upcoming: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        icon: Calendar,
        label: 'قادم'
      },
      done: {
        bg: 'bg-gray-500/20',
        text: 'text-gray-400',
        icon: CheckCircle,
        label: 'منتهي'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4 ml-1" />
        {config.label}
      </span>
    );
  };

  const getPackageBadge = (packageType: string) => {
    const packageConfig = {
      classic: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'كلاسيك' },
      premium: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'بريميوم' },
      vip: { bg: 'bg-[#C09B52]/20', text: 'text-[#C09B52]', label: 'في آي بي' }
    };

    const config = packageConfig[packageType as keyof typeof packageConfig] || packageConfig.classic;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      calendar: 'gregory',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCompleteOrder = async () => {
    if (!order) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ transactionId })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'فشل في تأكيد الطلب');
      }

      setSuccessMessage(`تم تأكيد الطلب بنجاح! تم إنشاء ${data.data.eventsCreated} حدث`);
      setShowCompleteModal(false);
      fetchOrderDetails(); // Refresh
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleFailOrder = async () => {
    if (!order) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}/fail`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'فشل في تحديث حالة الطلب');
      }

      setSuccessMessage('تم تحديد الطلب كفاشل');
      setShowFailModal(false);
      fetchOrderDetails(); // Refresh
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'فشل في إلغاء الطلب');
      }

      setSuccessMessage('تم إلغاء الطلب');
      setShowCancelModal(false);
      fetchOrderDetails(); // Refresh
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="hover:bg-green-700 rounded p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="hover:bg-red-700 rounded p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-white">
              تفاصيل الطلب
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C09B52]"></div>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
                  <p className="text-red-400">{error}</p>
                </div>
              </div>
            ) : order ? (
              <div className="p-6 space-y-6">
                
                {/* Order Info */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 ml-2 text-[#C09B52]" />
                    معلومات الطلب
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">رقم الطلب (Paymob)</p>
                      <p className="text-white font-medium">#{order.paymobOrderId}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">رقم الطلب (النظام)</p>
                      <p className="text-white font-medium break-all">{order.merchantOrderId}</p>
                    </div>
                    {order.paymobTransactionId && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">رقم المعاملة</p>
                        <p className="text-white font-medium">{order.paymobTransactionId}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-sm mb-1">طريقة الدفع</p>
                      <p className="text-white font-medium">{order.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">الحالة</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">المبلغ الإجمالي</p>
                      <p className="text-white font-bold text-xl">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">تاريخ الإنشاء</p>
                      <p className="text-white">{formatDate(order.createdAt)}</p>
                    </div>
                    {order.completedAt && (
                      <div>
                        <p className="text-gray-400 text-sm mb-1">تاريخ الاكتمال</p>
                        <p className="text-white">{formatDate(order.completedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <User className="w-5 h-5 ml-2 text-[#C09B52]" />
                    معلومات العميل
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 ml-2" />
                      <span className="text-white font-medium">{order.user.name}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 ml-2" />
                      <span className="text-white">{order.user.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 ml-2" />
                      <span className="text-white">{order.user.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 ml-2" />
                      <span className="text-white">{order.user.city}</span>
                    </div>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Package className="w-5 h-5 ml-2 text-[#C09B52]" />
                    العناصر المطلوبة ({order.selectedCartItems.length})
                  </h3>
                  <div className="space-y-4">
                    {order.selectedCartItems.map((item) => (
                      <div key={item.cartItemId} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-white font-medium">{item.hostName}</h4>
                              {getPackageBadge(item.packageType)}
                              {item.isCustomDesign && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-500/20 text-amber-400">
                                  تصميم خاص
                                </span>
                              )}
                            </div>
                            {item.eventName && (
                              <p className="text-gray-400 text-sm mb-1">{item.eventName}</p>
                            )}
                          </div>
                          <p className="text-white font-bold text-lg">{formatCurrency(item.totalPrice)}</p>
                        </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400">الموقع</p>
                            <p className="text-white">{item.eventLocation}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">تاريخ الحدث</p>
                            <p className="text-white">{new Date(item.eventDate).toLocaleDateString('ar-EG', { calendar: 'gregory' })}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">عدد الدعوات</p>
                            <p className="text-white">{item.inviteCount} دعوة</p>
                          </div>
                        </div>
                        {item.isCustomDesign && item.customDesignNotes && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-gray-400 text-sm mb-1">ملاحظات التصميم:</p>
                            <p className="text-white text-sm">{item.customDesignNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Created Events */}
                {order.eventsCreated.length > 0 && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Calendar className="w-5 h-5 ml-2 text-[#C09B52]" />
                      الأحداث المنشأة ({order.eventsCreated.length})
                    </h3>
                    <div className="space-y-3">
                      {order.eventsCreated.map((event) => (
                        <div key={event.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-white font-medium mb-1">{event.hostName}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                {getPackageBadge(event.packageType)}
                                {getStatusBadge(event.approvalStatus)}
                                {getStatusBadge(event.status)}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                            <div>
                              <p className="text-gray-400">تاريخ الحدث</p>
                              <p className="text-white">{new Date(event.eventDate).toLocaleDateString('ar-EG', { calendar: 'gregory' })}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">عدد الضيوف</p>
                              <p className="text-white">{event.guestCount} ضيف</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer with Actions */}
                {order && order.status === 'pending' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6 mt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-yellow-400 font-semibold mb-2">طلب معلق - يتطلب إجراء</h4>
                        <p className="text-yellow-200 text-sm mb-3">
                          هذا الطلب في حالة انتظار. يمكنك تأكيده يدوياً إذا تم الدفع أو تحديده كفاشل/ملغي.
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => setShowCompleteModal(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            تأكيد وإنشاء الأحداث
                          </button>
                          <button
                            onClick={() => setShowFailModal(true)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            تحديد كفاشل
                          </button>
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <Ban className="w-4 h-4" />
                            إلغاء
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : null}
          </div>

          {/* Close Button Footer */}
          <div className="bg-gray-900 border-t border-gray-700 px-6 py-4 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Complete Order Confirmation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => !processing && setShowCompleteModal(false)} />
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">تأكيد الطلب</h3>
            <p className="text-gray-300 mb-4">
              هل أنت متأكد من تأكيد هذا الطلب؟ سيتم إنشاء الأحداث من عناصر الطلب.
            </p>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">رقم المعاملة (اختياري)</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="أدخل رقم المعاملة من Paymob"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                disabled={processing}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCompleteOrder}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium"
              >
                {processing ? 'جاري المعالجة...' : 'تأكيد'}
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Order Confirmation Modal */}
      {showFailModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => !processing && setShowFailModal(false)} />
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">تحديد الطلب كفاشل</h3>
            <p className="text-gray-300 mb-4">
              سيتم تحديد هذا الطلب كفاشل. يمكنك إضافة سبب الفشل.
            </p>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">السبب (اختياري)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="أدخل سبب فشل الطلب"
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                disabled={processing}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleFailOrder}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium"
              >
                {processing ? 'جاري المعالجة...' : 'تحديد كفاشل'}
              </button>
              <button
                onClick={() => setShowFailModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => !processing && setShowCancelModal(false)} />
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">إلغاء الطلب</h3>
            <p className="text-gray-300 mb-4">
              سيتم إلغاء هذا الطلب. يمكنك إضافة سبب الإلغاء.
            </p>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">السبب (اختياري)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="أدخل سبب إلغاء الطلب"
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                disabled={processing}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelOrder}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium"
              >
                {processing ? 'جاري المعالجة...' : 'إلغاء الطلب'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Percent, X, Edit2, RotateCcw, Save, AlertCircle, Loader2, Tag } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { formatCurrency } from '@/utils/calculations';
import { invitationDesigns, packageData } from '@/constants';

interface AdminUserCartProps {
  userId: string;
  userName: string;
  userEmail: string;
  onClose: () => void;
}

interface CartItem {
  _id: string;
  designId: string;
  packageType: 'classic' | 'premium' | 'vip';
  details: {
    eventName: string;
    hostName: string;
    eventDate: string;
    inviteCount: number;
    eventLocation: string;
  };
  totalPrice: number;
  originalPrice?: number;
  adminModifiedPrice?: number;
  adminPriceModifiedAt?: string;
  adminPriceModifiedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  priceModificationReason?: string;
}

export function AdminUserCart({ userId, userName, userEmail, onClose }: AdminUserCartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchCart = async () => {
    if (!userId) {
      setError('معرف المستخدم غير صحيح');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getUserCart(userId);
      setCartItems(data.cart || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err instanceof Error ? err.message : 'فشل في جلب السلة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCart();
    } else {
      setLoading(false);
      setError('معرف المستخدم غير صحيح');
    }
  }, [userId]);

  const handleEditPrice = (item: CartItem) => {
    setEditingPrice(item._id);
    setPriceValue(item.totalPrice);
    setReason(item.priceModificationReason || '');
  };

  const handleSavePrice = async (itemId: string) => {
    try {
      setProcessing(itemId);
      setError(null);
      await adminAPI.updateCartItemPrice(userId, itemId, priceValue, reason);
      setSuccessMessage('تم تحديث السعر بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
      setEditingPrice(null);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحديث السعر');
    } finally {
      setProcessing(null);
    }
  };

  const handleApplyDiscount = async (itemId: string, percentage: number) => {
    try {
      setProcessing(itemId);
      setError(null);
      await adminAPI.applyCartItemDiscount(userId, itemId, percentage);
      setSuccessMessage(`تم تطبيق خصم ${percentage}% بنجاح`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تطبيق الخصم');
    } finally {
      setProcessing(null);
    }
  };

  const handleApplyDiscountAll = async (percentage: number) => {
    try {
      setProcessing('all');
      setError(null);
      await adminAPI.applyCartDiscountAll(userId, percentage);
      setSuccessMessage(`تم تطبيق خصم ${percentage}% على جميع العناصر بنجاح`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تطبيق الخصم');
    } finally {
      setProcessing(null);
    }
  };

  const handleRemoveModification = async (itemId: string) => {
    try {
      setProcessing(itemId);
      setError(null);
      await adminAPI.removeCartItemPriceModification(userId, itemId);
      setSuccessMessage('تم إعادة السعر الأصلي بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إعادة السعر الأصلي');
    } finally {
      setProcessing(null);
    }
  };

  const getDesignName = (designId: string) => {
    const design = invitationDesigns.find(d => d.id === designId);
    return design?.name || 'تصميم غير معروف';
  };

  const getPackageName = (packageType: string) => {
    return packageData[packageType as keyof typeof packageData]?.name || packageType;
  };

  const formatGregorianDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'تاريخ غير صحيح';
    return date.toLocaleDateString('ar-SA', {
      calendar: 'gregory',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const originalTotal = cartItems.reduce((sum, item) => sum + (item.originalPrice || item.totalPrice), 0);
  const totalDiscount = originalTotal - totalAmount;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-700">
          <Loader2 className="w-8 h-8 text-[#C09B52] mx-auto mb-4 animate-spin" />
          <p className="text-white text-center">جاري تحميل السلة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">سلة المستخدم</h2>
              <p className="text-gray-400">{userName} - {userEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 bg-green-900/30 border border-green-700 rounded-lg p-4 flex items-center gap-2 text-green-400">
            <span>{successMessage}</span>
          </div>
        )}

        {/* Quick Actions */}
        {cartItems.length > 0 && (
          <div className="p-6 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-gray-400 font-medium">إجراءات سريعة:</span>
              {[5, 10, 15, 20, 25].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleApplyDiscountAll(percent)}
                  disabled={processing === 'all'}
                  className="px-4 py-2 bg-[#C09B52] hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Percent className="w-4 h-4" />
                  خصم {percent}% على الكل
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">السلة فارغة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const isEditing = editingPrice === item._id;
                const hasModification = item.originalPrice !== undefined;
                const discountAmount = item.originalPrice ? item.originalPrice - item.totalPrice : 0;
                const discountPercent = item.originalPrice ? Math.round((discountAmount / item.originalPrice) * 100) : 0;

                return (
                  <div
                    key={item._id}
                    className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-[#C09B52]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold text-white">
                            {getPackageName(item.packageType)} - {item.details.eventName}
                          </h3>
                          {hasModification && (
                            <span className="px-2 py-1 bg-[#C09B52]/20 text-[#C09B52] text-xs rounded-full border border-[#C09B52]/30">
                              معدل
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-400 mb-4">
                          <p>المضيف: {item.details.hostName}</p>
                          <p>التاريخ: {new Date(item.details.eventDate).toLocaleDateString('ar-SA')}</p>
                          <p>عدد الدعوات: {item.details.inviteCount.toLocaleString('ar-SA')}</p>
                          <p>الموقع: {item.details.eventLocation}</p>
                        </div>

                        {/* Price Display */}
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">السعر الجديد</label>
                              <input
                                type="number"
                                value={priceValue}
                                onChange={(e) => setPriceValue(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52]"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">السبب (اختياري)</label>
                              <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="مثال: خصم خاص للعميل"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52]"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSavePrice(item._id)}
                                disabled={processing === item._id}
                                className="px-4 py-2 bg-[#C09B52] hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Save className="w-4 h-4" />
                                حفظ
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPrice(null);
                                  setPriceValue(item.totalPrice);
                                  setReason('');
                                }}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Price Display */}
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex-1 min-w-[200px]">
                                <p className="text-sm text-gray-400 mb-1">السعر الحالي</p>
                                <p className="text-2xl font-bold text-[#C09B52]">
                                  {formatCurrency(item.totalPrice)}
                                </p>
                              </div>
                              {hasModification && item.originalPrice && (
                                <>
                                  <div className="flex-1 min-w-[200px]">
                                    <p className="text-sm text-gray-400 mb-1">السعر الأصلي</p>
                                    <p className="text-lg text-gray-500 line-through">
                                      {formatCurrency(item.originalPrice)}
                                    </p>
                                  </div>
                                  {discountAmount > 0 && (
                                    <div className="flex-1 min-w-[200px]">
                                      <p className="text-sm text-gray-400 mb-1">الخصم</p>
                                      <p className="text-lg font-bold text-green-400">
                                        -{formatCurrency(discountAmount)} ({discountPercent}%)
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Admin Modification Info Card */}
                            {hasModification && (
                              <div className="bg-gradient-to-r from-[#C09B52]/10 via-[#C09B52]/5 to-transparent rounded-lg border border-[#C09B52]/20 p-4 space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Tag className="w-4 h-4 text-[#C09B52]" />
                                  <span className="text-sm font-medium text-[#C09B52]">تعديل إداري</span>
                                </div>
                                {item.priceModificationReason && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-xs text-gray-400 min-w-[50px]">السبب:</span>
                                    <span className="text-sm text-gray-300 flex-1">{item.priceModificationReason}</span>
                                  </div>
                                )}
                                {item.adminPriceModifiedBy && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-xs text-gray-400 min-w-[50px]">المعدل:</span>
                                    <span className="text-sm text-gray-300">
                                      {item.adminPriceModifiedBy.firstName} {item.adminPriceModifiedBy.lastName}
                                    </span>
                                  </div>
                                )}
                                {item.adminPriceModifiedAt && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-xs text-gray-400 min-w-[50px]">التاريخ:</span>
                                    <span className="text-sm text-gray-300">
                                      {formatGregorianDate(item.adminPriceModifiedAt)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleEditPrice(item)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            تعديل السعر
                          </button>
                          <div className="flex flex-col gap-1">
                            {[5, 10, 15, 20].map((percent) => (
                              <button
                                key={percent}
                                onClick={() => handleApplyDiscount(item._id, percent)}
                                disabled={processing === item._id}
                                className="px-3 py-1.5 bg-[#C09B52] hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-colors text-xs flex items-center gap-1"
                              >
                                <Percent className="w-3 h-3" />
                                {percent}%
                              </button>
                            ))}
                          </div>
                          {hasModification && (
                            <button
                              onClick={() => handleRemoveModification(item._id)}
                              disabled={processing === item._id}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                            >
                              <RotateCcw className="w-4 h-4" />
                              إعادة السعر الأصلي
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">عدد العناصر: {cartItems.length}</p>
                {originalTotal !== totalAmount && (
                  <p className="text-sm text-gray-500">
                    الإجمالي الأصلي: {formatCurrency(originalTotal)}
                  </p>
                )}
              </div>
              <div className="text-right">
                {totalDiscount > 0 && (
                  <p className="text-green-400 font-medium">
                    إجمالي الخصم: -{formatCurrency(totalDiscount)}
                  </p>
                )}
                <p className="text-2xl font-bold text-[#C09B52]">
                  الإجمالي: {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


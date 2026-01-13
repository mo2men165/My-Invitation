// client/src/components/collaboration/AddCollaboratorModal.tsx
'use client';

import React, { useState } from 'react';
import { X, UserPlus, Loader2, Mail, Phone, MapPin, Users } from 'lucide-react';
import { collaborationAPI, CollaboratorData } from '@/lib/api/collaboration';
import { useToast } from '@/hooks/useToast';

interface AddCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  packageType: 'premium' | 'vip';
  maxAllocation: number;
  currentAllocated: number;
  onSuccess: () => void;
}

export const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({
  isOpen,
  onClose,
  eventId,
  packageType,
  maxAllocation,
  currentAllocated,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CollaboratorData>({
    name: '',
    email: '',
    phone: '',
    city: 'الرياض',
    allocatedInvites: 10,
    permissions: {
      canAddGuests: true,
      canEditGuests: packageType === 'vip',
      canDeleteGuests: packageType === 'vip',
      canViewFullEvent: false
    }
  });

  const cities = [
    'المدينة المنورة',
    'جدة', 
    'الرياض',
    'الدمام',
    'مكة المكرمة',
    'الطائف'
  ];

  const remainingAllocation = maxAllocation - currentAllocated;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.allocatedInvites > maxAllocation) {
      toast({
        title: "خطأ في التخصيص",
        description: `لا يمكن تخصيص أكثر من ${maxAllocation} دعوة`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await collaborationAPI.addCollaborator(eventId, formData);
      
      toast({
        title: "تم إضافة المتعاون بنجاح",
        description: result.message || 'تم إرسال بيانات الدخول عبر البريد الإلكتروني',
        variant: "default"
      });

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        city: 'الرياض',
        allocatedInvites: 10,
        permissions: {
          canAddGuests: true,
          canEditGuests: packageType === 'vip',
          canDeleteGuests: packageType === 'vip',
          canViewFullEvent: false
        }
      });

    } catch (error: any) {
      toast({
        title: "خطأ في إضافة المتعاون",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C09B52]/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#C09B52]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">إضافة متعاون</h2>
              <p className="text-gray-400 text-sm">دعوة شخص للمساعدة في إدارة قائمة الضيوف</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Package Info */}
        <div className={`mx-6 mt-6 p-4 rounded-xl border ${
          packageType === 'vip' 
            ? 'bg-purple-900/20 border-purple-700/30' 
            : 'bg-yellow-900/20 border-yellow-700/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-medium ${packageType === 'vip' ? 'text-purple-400' : 'text-yellow-400'}`}>
                حزمة {packageType === 'vip' ? 'VIP' : 'بريميوم'}
              </h3>
              <p className="text-sm text-gray-300 mt-1">
                الحد الأقصى للمتعاونين: {packageType === 'vip' ? '10' : '2'} • 
                يمكن تخصيص حتى 100% من الدعوات
              </p>
            </div>
            <Users className={`w-6 h-6 ${packageType === 'vip' ? 'text-purple-400' : 'text-yellow-400'}`} />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">البيانات الشخصية</h3>
            
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52] focus:border-transparent"
                placeholder="مثال: أحمد محمد السعيد"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52] focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                رقم الجوال
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52] focus:border-transparent"
                placeholder="+966501234567"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                المدينة
              </label>
              <select
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C09B52] focus:border-transparent"
              >
                {cities.map((city) => (
                  <option key={city} value={city} className="bg-gray-800">
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allocation */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">تخصيص الدعوات</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                عدد الدعوات المخصصة
              </label>
              <input
                type="number"
                required
                min="1"
                max={maxAllocation}
                value={formData.allocatedInvites}
                onChange={(e) => setFormData({...formData, allocatedInvites: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52] focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                الحد الأقصى المتاح: {maxAllocation} دعوة (100% من إجمالي الدعوات)
              </p>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">الصلاحيات</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.permissions?.canAddGuests || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      canAddGuests: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-[#C09B52] bg-white/5 border-white/10 rounded focus:ring-[#C09B52] focus:ring-2"
                />
                <span className="text-white">إضافة ضيوف جدد</span>
              </label>

              {packageType === 'vip' && (
                <>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.permissions?.canEditGuests || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          canEditGuests: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-[#C09B52] bg-white/5 border-white/10 rounded focus:ring-[#C09B52] focus:ring-2"
                    />
                    <span className="text-white">تعديل بيانات الضيوف</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.permissions?.canDeleteGuests || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          canDeleteGuests: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-[#C09B52] bg-white/5 border-white/10 rounded focus:ring-[#C09B52] focus:ring-2"
                    />
                    <span className="text-white">حذف ضيوف</span>
                  </label>
                </>
              )}

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.permissions?.canViewFullEvent || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      canViewFullEvent: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-[#C09B52] bg-white/5 border-white/10 rounded focus:ring-[#C09B52] focus:ring-2"
                />
                <span className="text-white">عرض تفاصيل المناسبة كاملة</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#C09B52] to-[#B8935A] hover:from-[#B8935A] hover:to-[#A67C52] disabled:opacity-50 text-white rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإضافة...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  إضافة متعاون
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <div className="mx-6 mb-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
          <p className="text-blue-300 text-sm">
            💡 سيتم إنشاء حساب جديد للمتعاون تلقائياً وإرسال بيانات الدخول عبر البريد الإلكتروني
          </p>
        </div>
      </div>
    </div>
  );
};

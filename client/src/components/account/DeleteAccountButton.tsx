'use client';
import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface DeleteAccountButtonProps {
  onDelete: () => Promise<boolean>;
  isDeleting?: boolean;
}

const DeleteAccountButton: React.FC<DeleteAccountButtonProps> = ({
  onDelete,
  isDeleting = false
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { toast } = useToast();

  const handleDeleteClick = () => {
    setShowConfirmModal(true);
    setConfirmText('');
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmText('');
  };

  const handleConfirmDelete = async () => {
    if (confirmText.trim() !== 'حذف') {
      toast({
        title: "تأكيد غير صحيح",
        description: "يرجى كتابة 'حذف' للتأكيد",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    const success = await onDelete();
    if (success) {
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">منطقة الخطر</h3>
            <p className="text-gray-300 text-sm mb-4">
              بمجرد حذف حسابك، لن يمكنك الرجوع. يرجى التأكد من قرارك.
            </p>
            <Button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف الحساب
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-red-500/30 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">حذف الحساب</h3>
                <p className="text-gray-400 text-sm">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-300 leading-relaxed">
                هل أنت متأكد تماماً؟ سيؤدي هذا إلى حذف حسابك بشكل دائم وإزالة جميع بياناتك من خوادمنا.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  اكتب <span className="text-red-400 font-bold">حذف</span> للتأكيد:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="حذف"
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={handleCancel}
                disabled={isDeleting}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || confirmText.trim() !== 'حذف'}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'جاري الحذف...' : 'حذف الحساب'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAccountButton;


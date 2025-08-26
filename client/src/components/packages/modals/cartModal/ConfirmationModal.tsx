'use client';
import React, { memo } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

const ConfirmationModal = memo<ConfirmationModalProps>(({
  isOpen,
  onConfirm,
  onCancel,
  title = "تأكيد الإغلاق",
  message = "سيتم فقدان البيانات المدخلة. هل تريد المتابعة؟"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-white/20 shadow-2xl max-w-md w-full p-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-gray-300 mb-6 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-6 border-white/20 text-white hover:bg-white/10"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="px-6 bg-red-500 hover:bg-red-600 text-white"
          >
            نعم، إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
});

ConfirmationModal.displayName = 'ConfirmationModal';
export default ConfirmationModal;

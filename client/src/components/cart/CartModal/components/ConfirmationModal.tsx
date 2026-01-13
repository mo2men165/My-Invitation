import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'warning'
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/20 p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${isDanger ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <AlertTriangle className={`w-6 h-6 ${isDanger ? 'text-red-400' : 'text-yellow-400'}`} />
          </div>
          <h3 className="text-xl font-bold text-white">
            {title}
          </h3>
        </div>
        
        <p className="text-gray-300 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3">
          <Button
            onClick={onConfirm}
            className={`flex-1 py-3 font-medium transition-colors ${
              isDanger 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-[#C09B52] text-white hover:bg-[#C09B52]/90'
            }`}
          >
            {confirmText}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 py-3 font-medium"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

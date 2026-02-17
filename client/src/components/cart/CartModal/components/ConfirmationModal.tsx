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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gray-900 rounded-xl sm:rounded-2xl border border-white/20 p-4 sm:p-6 max-w-md w-full">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className={`p-1.5 sm:p-2 rounded-full ${isDanger ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <AlertTriangle className={`w-5 h-5 sm:w-6 sm:h-6 ${isDanger ? 'text-red-400' : 'text-yellow-400'}`} />
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">
            {title}
          </h3>
        </div>
        
        <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-2 sm:gap-3">
          <Button
            onClick={onConfirm}
            className={`flex-1 py-2.5 sm:py-3 font-medium text-sm sm:text-base transition-colors ${
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
            className="flex-1 py-2.5 sm:py-3 font-medium text-sm sm:text-base"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

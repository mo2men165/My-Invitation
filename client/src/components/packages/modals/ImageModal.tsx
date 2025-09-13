'use client';
import React from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { InvitationDesign } from '@/types';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  design: InvitationDesign | null;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, design }) => {
  if (!isOpen || !design) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close button - positioned in top right of screen */}
      <Button
        variant="destructive"
        size="lg"
        onClick={onClose}
        className="fixed top-6 right-6 z-10 rounded-full w-16 h-16 cursor-pointer shadow-lg"
      >
        <X className="w-16 h-16" />
      </Button>

      <div className="relative max-w-md w-full max-h-[85vh] overflow-auto">
        <div 
          className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full">
            <Image
              src={design.image} 
              alt={design.name}
              width={400}
              height={600}
              className="w-full h-auto"
              style={{ 
                width: '100%', 
                height: 'auto',
                display: 'block'
              }}
              onError={() => {
              }}
            />
          </div>
          <div className="p-6">
            <h3 className="text-2xl font-bold text-white mb-2">{design.name}</h3>
            <p className="text-gray-400">تصميم احترافي مناسب لجميع المناسبات</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;

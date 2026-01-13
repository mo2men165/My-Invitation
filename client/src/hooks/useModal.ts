'use client';
import { useState, useCallback } from 'react';
import { InvitationDesign, PackageData } from '@/types';

export const useModal = () => {
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<InvitationDesign | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<keyof PackageData | null>(null);

  const openCartModal = useCallback((packageType: keyof PackageData, design: InvitationDesign) => {
    setSelectedPackage(packageType);
    setSelectedDesign(design);
    setIsCartModalOpen(true);
  }, []);

  const openImageModal = useCallback((design: InvitationDesign) => {
    setSelectedDesign(design);
    setIsImageModalOpen(true);
  }, []);

  const closeModals = useCallback(() => {
    setIsCartModalOpen(false);
    setIsImageModalOpen(false);
    setSelectedDesign(null);
    setSelectedPackage(null);
  }, []);

  return {
    isCartModalOpen,
    isImageModalOpen,
    selectedDesign,
    selectedPackage,
    openCartModal,
    openImageModal,
    closeModals
  };
};

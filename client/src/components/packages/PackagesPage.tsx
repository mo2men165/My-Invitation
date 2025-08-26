'use client';
import React from 'react';
import { useAppSelector } from '@/store';
import { invitationDesigns } from '@/constants';

// Hooks
import { usePackages } from '@/hooks/usePackages';
import { useWishlist } from '@/hooks/useWishlist';
import { useCompare } from '@/hooks/useCompare';
import { useModal } from '@/hooks/useModal';

// Components
import PageHeader from './PageHeader';
import PackageTabs from './PackageTabs';
import PackageOverview from './PackageOverview';
import DesignGrid from './DesignGrid';
import CartModal from './modals/cartModal/CartModal';
import ImageModal from './modals/ImageModal';
import AdditionalServicesSection from './modals/cartModal/AdditionalServicesSection';
import AdditionalServices from './AdditionalServices';

export default function PackagesPage() {
  const { activeTab, setActiveTab, currentPackage, allPackages } = usePackages();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useCompare();
  const { isLoading: cartLoading } = useAppSelector((state) => state.cart);
  const { 
    isCartModalOpen, 
    isImageModalOpen, 
    selectedDesign,
    selectedPackage,
    openCartModal,
    openImageModal,
    closeModals 
  } = useModal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-8 py-12">
        <PageHeader />
        
        <PackageTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          packages={allPackages}
        />
        
        <PackageOverview package={currentPackage} />
        
        <DesignGrid
          designs={invitationDesigns}
          packageType={activeTab}
          onAddToCart={openCartModal}
          onToggleWishlist={toggleWishlist}
          onToggleCompare={toggleCompare}
          onViewImage={openImageModal}
          isInWishlist={isInWishlist}
          isInCompare={isInCompare}
          isLoading={cartLoading}
        />
        
        <AdditionalServices />
      </div>

      <CartModal 
        isOpen={isCartModalOpen}
        onClose={closeModals}
        selectedPackage={selectedPackage}
        selectedDesign={selectedDesign}
      />
      
      <ImageModal 
        isOpen={isImageModalOpen}
        onClose={closeModals}
        design={selectedDesign}
      />
    </div>
  );
}

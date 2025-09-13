'use client';
import React from 'react';

// Hooks
import { usePackages } from '@/hooks/usePackages';
import { useWishlist } from '@/hooks/useWishlist';
import { useCompare } from '@/hooks/useCompare';
import { useModal } from '@/hooks/useModal';
import { usePackagesLogic } from '@/hooks/usePackagesLogic';

// Components
import PageHeader from './PageHeader';
import PackageTabs from './PackageTabs';
import PackageOverview from './PackageOverview';
import DesignGrid from './DesignGrid';
import CategoryFilter from './CategoryFilter';
import { CartModal } from '@/components/cart/CartModal';
import ImageModal from './modals/ImageModal';
import AdditionalServices from './AdditionalServices';

export default function PackagesPage() {
  const { activeTab, setActiveTab, currentPackage, allPackages } = usePackages();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useCompare();
  const { 
    isCartModalOpen, 
    isImageModalOpen, 
    selectedDesign,
    selectedPackage,
    openCartModal,
    openImageModal,
    closeModals 
  } = useModal();

  // Business logic hook
  const {
    selectedCategories,
    filteredDesigns,
    isLoading,
    toggleCategory
  } = usePackagesLogic();

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
        
        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">
            اختر <span className="text-[#C09B52]">الفئات</span> المطلوبة
          </h3>
          <CategoryFilter
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            categories={[
              { value: 'عيد ميلاد', label: 'عيد ميلاد' },
              { value: 'حفل تخرج', label: 'حفل تخرج' },
              { value: 'حفل زفاف', label: 'حفل زفاف' }
            ]}
          />
          <p className="text-gray-400 text-center mt-2 text-sm">
            عدد التصاميم المعروضة: {filteredDesigns.length}
          </p>
        </div>
        
        <DesignGrid
          designs={filteredDesigns}
          packageType={activeTab}
          onAddToCart={openCartModal}
          onToggleWishlist={toggleWishlist}
          onToggleCompare={toggleCompare}
          onViewImage={openImageModal}
          isInWishlist={isInWishlist}
          isInCompare={isInCompare}
          isLoading={isLoading}
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
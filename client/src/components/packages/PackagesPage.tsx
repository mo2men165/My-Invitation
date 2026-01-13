'use client';
import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Hooks
import { usePackages } from '@/hooks/usePackages';
import { useWishlist } from '@/hooks/useWishlist';
import { useCompare } from '@/hooks/useCompare';
import { useModal } from '@/hooks/useModal';
import { usePackagesLogic } from '@/hooks/usePackagesLogic';
import { useAuth } from '@/hooks/useAuth';
import { PackageData, InvitationDesign } from '@/types';

// Components
import PageHeader from './PageHeader';
import PackageTabs from './PackageTabs';
import PackageOverview from './PackageOverview';
import DesignGrid from './DesignGrid';
import CategoryFilter from './CategoryFilter';
import DesignModeToggle from './DesignModeToggle';
import CustomDesignView from './CustomDesignView';
import { CartModal } from '@/components/cart/CartModal';
import ImageModal from './modals/ImageModal';
import AdditionalServices from './AdditionalServices';

export default function PackagesPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
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
    selectedCategory,
    filteredDesigns,
    isLoading,
    designMode,
    selectCategory,
    setDesignMode
  } = usePackagesLogic();

  // Reset design mode to regular when switching to Classic package
  useEffect(() => {
    if (activeTab === 'classic' && designMode === 'custom') {
      setDesignMode('regular');
    }
  }, [activeTab, designMode, setDesignMode]);

  // Wrapper function to check authentication before opening cart modal
  const handleAddToCart = useCallback((packageType: keyof PackageData, design: InvitationDesign) => {
    // Wait for auth to initialize
    if (!isInitialized) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // If authenticated, open the modal
    openCartModal(packageType, design);
  }, [isAuthenticated, isInitialized, router, openCartModal]);

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
        
        {/* Design Mode Toggle - Only for Premium/VIP */}
        <DesignModeToggle
          designMode={designMode}
          onModeChange={setDesignMode}
          packageType={activeTab}
        />
        
        {designMode === 'custom' && activeTab !== 'classic' ? (
          /* Custom Design View - Only for Premium/VIP */
          <CustomDesignView
            packageType={activeTab}
            onAddToCart={handleAddToCart}
          />
        ) : (
          /* Regular Design Selection */
          <>
            {/* Category Filter */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">
                اختر <span className="text-[#C09B52]">نوع الحدث</span> المطلوب
              </h3>
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={selectCategory}
                categories={[
                  { value: 'عيد ميلاد', label: 'عيد ميلاد' },
                  { value: 'حفل تخرج', label: 'حفل تخرج' },
                  { value: 'حفل زفاف', label: 'حفل زفاف' }
                ]}
              />
              <p className="text-gray-400 text-center mt-2 text-sm">
                {selectedCategory === null 
                  ? 'الرجاء اختيار نوع الحدث لعرض التصاميم المتاحة' 
                  : `عدد التصاميم المعروضة: ${filteredDesigns.length}`
                }
              </p>
            </div>
            
            <DesignGrid
              designs={filteredDesigns}
              packageType={activeTab}
              onAddToCart={handleAddToCart}
              onToggleWishlist={toggleWishlist}
              onToggleCompare={toggleCompare}
              onViewImage={openImageModal}
              isInWishlist={isInWishlist}
              isInCompare={isInCompare}
              isLoading={isLoading}
            />
          </>
        )}
        
        {/* <AdditionalServices /> */}
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
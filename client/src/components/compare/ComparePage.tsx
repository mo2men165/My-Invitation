'use client';
import React, { useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { useCompareData } from '@/hooks/useCompareData';
import { useWishlistData } from '@/hooks/useWishlistData';
import { useCompare } from '@/hooks/useCompare';
import { useWishlist } from '@/hooks/useWishlist';
import { useModal } from '@/hooks/useModal';
import { useAuth } from '@/hooks/useAuth';

// Components
import CompareHeader from './CompareHeader';
import CompareCard from './CompareCard';
import CompareTable from './CompareTable';
import CompareActions from './CompareActions';
import EmptyCompare from './EmptyCompare';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import CartModal from '@/components/packages/modals/cartModal/CartModal';

import { InvitationDesign, PackageData } from '@/types';
import { getDesignById } from '@/utils/designHelpers';

const ComparePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { items, isLoading, error, count, isEmpty, refetchCompare } = useCompareData();
  const { items: wishlistItems } = useWishlistData(); // Get wishlist items for status checking
  const { toggleCompare } = useCompare();
  const { toggleWishlist } = useWishlist();
  const { 
    isCartModalOpen,
    selectedDesign,
    selectedPackage,
    openCartModal,
    closeModals 
  } = useModal();
  const { toast } = useToast();

  const wishlistDesignIds = new Set(wishlistItems.map(item => item.designId));

  const handleRemoveFromCompare = useCallback(async (designId: string) => {
    try {
      await toggleCompare(designId);
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [toggleCompare]);

  const handleAddToWishlist = useCallback(async (designId: string) => {
    try {
      await toggleWishlist(designId);
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [toggleWishlist]);

  const handleSelectPackage = useCallback((design: InvitationDesign, packageType: keyof PackageData) => {
    // Open cart modal with the specific package type
    openCartModal(packageType, design);
  }, [openCartModal]);

  // Get designs from items with default package types
  // For now, we'll cycle through package types since we don't store them in the DB yet
  const compareItemsWithPackages = items.map((item, index) => {
    const packageTypes: (keyof PackageData)[] = ['classic', 'premium', 'vip'];
    return {
      ...item,
      packageType: packageTypes[index % 3] // Cycle through package types
    };
  });

  const packageTypes = compareItemsWithPackages.map(item => item.packageType);

  // Show loading state for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-8 py-12">
        
        <CompareHeader itemCount={count} />

        {/* Loading State */}
        {isLoading && !isEmpty && (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage 
            message={error}
            onRetry={refetchCompare}
            className="max-w-2xl mx-auto"
          />
        )}

        {/* Empty State */}
        {isEmpty && !isLoading && !error && <EmptyCompare />}

        {/* Compare Content */}
        {!isEmpty && !isLoading && !error && (
          <>
            {/* Package Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {compareItemsWithPackages.map((item) => {
                const design = getDesignById(item.designId);
                if (!design) return null;

                return (
                  <CompareCard
                    key={`${item.designId}-${item.packageType}`}
                    design={design}
                    addedDate={item.addedAt || new Date().toISOString()}
                    packageType={item.packageType}
                    onRemove={handleRemoveFromCompare}
                    onAddToWishlist={handleAddToWishlist}
                    onSelectPackage={handleSelectPackage}
                    isLoading={isLoading}
                    isInWishlist={wishlistDesignIds.has(item.designId)}
                  />
                );
              })}
            </div>

            {/* Features Comparison Table */}
            {packageTypes.length > 0 && (
              <div className="overflow-x-auto mb-8">
                <div className="min-w-[800px]">
                  <CompareTable packageTypes={packageTypes} />
                </div>
              </div>
            )}

            <CompareActions itemCount={count} />
          </>
        )}
      </div>

      {/* Cart Modal */}
      <CartModal 
        isOpen={isCartModalOpen}
        onClose={closeModals}
        selectedPackage={selectedPackage}
        selectedDesign={selectedDesign}
      />
    </div>
  );
};

export default ComparePage;
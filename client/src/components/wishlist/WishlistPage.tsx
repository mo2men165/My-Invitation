'use client';
import React, { useCallback, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useWishlistData } from '@/hooks/useWishlistData';
import { useCompareData } from '@/hooks/useCompareData';
import { useWishlist } from '@/hooks/useWishlist';
import { useCompare } from '@/hooks/useCompare';
import { useModal } from '@/hooks/useModal';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store';
import { clearWishlist } from '@/store/wishlistSlice';
import { replaceCompareList } from '@/store/compareSlice';

// Components
import WishlistHeader from './WishlistHeader';
import WishlistGrid from './WishlistGrid';
import WishlistActions from './WishlistActions';
import EmptyWishlist from './EmptyWishlist';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ImageModal from '@/components/packages/modals/ImageModal';
import CartModal from '@/components/packages/modals/cartModal/CartModal';

import { InvitationDesign } from '@/types';

const WishlistPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { items, isLoading, error, count, isEmpty, refetchWishlist } = useWishlistData();
  const { items: compareItems } = useCompareData(); // Get compare items for status checking
  const { toggleWishlist } = useWishlist();
  const { toggleCompare } = useCompare();
  const { 
    isImageModalOpen, 
    isCartModalOpen,
    selectedDesign,
    selectedPackage,
    openImageModal,
    openCartModal,
    closeModals 
  } = useModal();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [selectedPackageType, setSelectedPackageType] = useState<"classic" | "premium" | "vip">("classic");

  const handleRemoveFromWishlist = useCallback(async (designId: string) => {
    try {
      await toggleWishlist(designId);
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [toggleWishlist]);

  const handleAddToCompare = useCallback(async (designId: string) => {
    try {
      await toggleCompare(designId);
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [toggleCompare]);

  const handleSelectPackage = useCallback((design: InvitationDesign) => {
    // Open cart modal instead of redirecting
    openCartModal('classic', design); // Default to classic, user can change in modal
  }, [openCartModal]);

  const handleViewImage = useCallback((design: InvitationDesign) => {
    openImageModal(design);
  }, [openImageModal]);

  const handleAddAllToCompare = useCallback(async () => {
    if (items.length === 0) return;
  
    try {
      // Take only first 3 items for comparison
      const compareItems = items.slice(0, 3).map(item => ({
        designId: item.designId,
        packageType: selectedPackageType,
      }));
  
      await dispatch(replaceCompareList(compareItems)).unwrap();
      
      toast({
        title: "تم إضافة للمقارنة",
        description: `تم إضافة ${compareItems.length} تصميم للمقارنة`,
        variant: "compare",
        duration: 3000
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error || "فشل في إضافة التصاميم للمقارنة",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [items, dispatch, toast, selectedPackageType]);
  

  const handleClearWishlist = useCallback(async () => {
    if (items.length === 0) return;

    if (window.confirm('هل تريد حقاً مسح جميع عناصر المفضلة؟')) {
      try {
        await dispatch(clearWishlist()).unwrap();
        toast({
          title: "تم المسح",
          description: "تم مسح جميع عناصر المفضلة",
          variant: "wishlist",
          duration: 3000
        });
      } catch (error: any) {
        toast({
          title: "خطأ",
          description: error || "فشل في مسح المفضلة",
          variant: "destructive",
          duration: 3000
        });
      }
    }
  }, [items.length, dispatch, toast]);

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
        
        <WishlistHeader itemCount={count} />

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
            onRetry={refetchWishlist}
            className="max-w-2xl mx-auto"
          />
        )}

        {/* Empty State */}
        {isEmpty && !isLoading && !error && <EmptyWishlist />}

        {/* Wishlist Content */}
        {!isEmpty && !isLoading && !error && (
          <>
            <WishlistGrid
              items={items}
              compareItems={compareItems}
              onRemove={handleRemoveFromWishlist}
              onViewImage={handleViewImage}
              onAddToCompare={handleAddToCompare}
              onSelectPackage={handleSelectPackage}
              isLoading={isLoading}
            />

            <WishlistActions
              itemCount={count}
              onAddAllToCompare={handleAddAllToCompare}
              onClearWishlist={handleClearWishlist}
              isLoading={isLoading}
              selectedPackageType={selectedPackageType}
              onPackageTypeChange={setSelectedPackageType}
            />
          </>
        )}
      </div>

      {/* Image Modal */}
      <ImageModal 
        isOpen={isImageModalOpen}
        onClose={closeModals}
        design={selectedDesign}
      />

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

export default WishlistPage;
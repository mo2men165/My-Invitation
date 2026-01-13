// client/src/hooks/usePackagesLogic.ts - Business logic for packages page
'use client';
import { useState, useMemo, useCallback } from 'react';
import { useAppSelector } from '@/store';
import { invitationDesigns } from '@/constants';
import { useMemoizedFilter, useMemoizedCallback } from '@/utils/memoization';

export interface PackageLogicState {
  selectedCategory: string | null;
  filteredDesigns: any[];
  isLoading: boolean;
  designMode: 'regular' | 'custom';
}

export interface PackageLogicActions {
  selectCategory: (category: string) => void;
  getCategoryStats: () => Record<string, number>;
  setDesignMode: (mode: 'regular' | 'custom') => void;
}

const categories = [
  { value: 'عيد ميلاد', label: 'عيد ميلاد' },
  { value: 'حفل تخرج', label: 'حفل تخرج' },
  { value: 'حفل زفاف', label: 'حفل زفاف' }
];

export function usePackagesLogic(): PackageLogicState & PackageLogicActions {
  const { isLoading: cartLoading } = useAppSelector((state) => state.cart);
  
  // Category filter state - start with no category selected
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Design mode state - start with regular designs
  const [designMode, setDesignMode] = useState<'regular' | 'custom'>('regular');

  // Filter designs based on selected category and design mode - memoized for performance
  const filteredDesigns = useMemoizedFilter(
    invitationDesigns,
    (design) => {
      // Filter out custom design from regular mode
      if (designMode === 'regular' && design.isCustom) {
        return false;
      }
      
      // In custom mode, only show custom design
      if (designMode === 'custom') {
        return design.isCustom === true;
      }
      
      // For regular mode, apply category filter
      // If no category selected, don't show any designs
      if (selectedCategory === null) {
        return false;
      }
      
      return selectedCategory === design.category;
    },
    [selectedCategory, designMode]
  );

  // Select category (single selection only) - memoized callback
  const selectCategory = useMemoizedCallback((category: string) => {
    setSelectedCategory(prev => {
      // If clicking the same category, deselect it
      if (prev === category) {
        return null;
      }
      // Otherwise, select the new category
      return category;
    });
  }, []);

  // Get category statistics
  const getCategoryStats = useMemoizedCallback(() => {
    return categories.reduce((stats, category) => {
      stats[category.value] = invitationDesigns.filter(
        design => design.category === category.value
      ).length;
      return stats;
    }, {} as Record<string, number>);
  }, []);

  return {
    selectedCategory,
    filteredDesigns,
    isLoading: cartLoading,
    designMode,
    selectCategory,
    getCategoryStats,
    setDesignMode
  };
}

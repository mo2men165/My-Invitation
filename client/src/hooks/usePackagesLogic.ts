// client/src/hooks/usePackagesLogic.ts - Business logic for packages page
'use client';
import { useState, useMemo, useCallback } from 'react';
import { useAppSelector } from '@/store';
import { invitationDesigns } from '@/constants';
import { useMemoizedFilter, useMemoizedCallback } from '@/utils/memoization';

export interface PackageLogicState {
  selectedCategories: string[];
  filteredDesigns: any[];
  isLoading: boolean;
  designMode: 'regular' | 'custom';
}

export interface PackageLogicActions {
  toggleCategory: (category: string) => void;
  selectAllCategories: () => void;
  clearCategories: () => void;
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
  
  // Category filter state - start with no categories selected
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Design mode state - start with regular designs
  const [designMode, setDesignMode] = useState<'regular' | 'custom'>('regular');

  // Filter designs based on selected categories and design mode - memoized for performance
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
      
      // For regular mode, apply category filters
      if (selectedCategories.length === 0) {
        return true;
      }
      
      return selectedCategories.includes(design.category);
    },
    [selectedCategories, designMode]
  );

  // Toggle category selection - memoized callback
  const toggleCategory = useMemoizedCallback((category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Remove category from selection
        return prev.filter(c => c !== category);
      } else {
        // Add category to selection
        return [...prev, category];
      }
    });
  }, []);

  // Select all categories
  const selectAllCategories = useMemoizedCallback(() => {
    setSelectedCategories(categories.map(cat => cat.value));
  }, []);

  // Clear all categories
  const clearCategories = useMemoizedCallback(() => {
    setSelectedCategories([]);
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
    selectedCategories,
    filteredDesigns,
    isLoading: cartLoading,
    designMode,
    toggleCategory,
    selectAllCategories,
    clearCategories,
    getCategoryStats,
    setDesignMode
  };
}

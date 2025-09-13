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
}

export interface PackageLogicActions {
  toggleCategory: (category: string) => void;
  selectAllCategories: () => void;
  clearCategories: () => void;
  getCategoryStats: () => Record<string, number>;
}

const categories = [
  { value: 'عيد ميلاد', label: 'عيد ميلاد' },
  { value: 'حفل تخرج', label: 'حفل تخرج' },
  { value: 'حفل زفاف', label: 'حفل زفاف' }
];

export function usePackagesLogic(): PackageLogicState & PackageLogicActions {
  const { isLoading: cartLoading } = useAppSelector((state) => state.cart);
  
  // Category filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'عيد ميلاد', 'حفل تخرج', 'حفل زفاف'
  ]);

  // Filter designs based on selected categories - memoized for performance
  const filteredDesigns = useMemoizedFilter(
    invitationDesigns,
    (design) => selectedCategories.includes(design.category),
    [selectedCategories]
  );

  // Toggle category selection - memoized callback
  const toggleCategory = useMemoizedCallback((category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Don't allow deselecting all categories
        return prev.length > 1 ? prev.filter(c => c !== category) : prev;
      } else {
        return [...prev, category];
      }
    });
  }, []);

  // Select all categories
  const selectAllCategories = useMemoizedCallback(() => {
    setSelectedCategories(categories.map(cat => cat.value));
  }, []);

  // Clear all categories (except one to prevent empty state)
  const clearCategories = useMemoizedCallback(() => {
    setSelectedCategories([categories[0].value]);
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
    toggleCategory,
    selectAllCategories,
    clearCategories,
    getCategoryStats
  };
}

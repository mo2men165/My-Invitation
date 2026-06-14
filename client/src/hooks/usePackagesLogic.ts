// client/src/hooks/usePackagesLogic.ts - Business logic for packages page
'use client';
import { useState } from 'react';
import { useAppSelector } from '@/store';
import { invitationDesigns } from '@/constants';
import { PackageData } from '@/types';
import {
  matchesCategoryView,
  matchesPackageView,
} from '@/utils/designHelpers';
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
  { value: 'حفل زفاف', label: 'حفل زفاف' },
];

export function usePackagesLogic(packageType: keyof PackageData): PackageLogicState & PackageLogicActions {
  const { isLoading: cartLoading } = useAppSelector((state) => state.cart);

  // null = package-tier designs (Classic / Premium / VIP folders)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [designMode, setDesignMode] = useState<'regular' | 'custom'>('regular');

  const filteredDesigns = useMemoizedFilter(
    invitationDesigns,
    (design) => {
      if (designMode === 'regular' && design.isCustom) {
        return false;
      }

      if (designMode === 'custom') {
        return design.isCustom === true;
      }

      // Package tab: tier-specific new cards only
      if (selectedCategory === null) {
        return matchesPackageView(design, packageType);
      }

      // Event category: legacy folder cards + new birthday/graduation cards
      return matchesCategoryView(design, selectedCategory);
    },
    [selectedCategory, designMode, packageType]
  );

  const selectCategory = useMemoizedCallback((category: string) => {
    setSelectedCategory(prev => (prev === category ? null : category));
  }, []);

  const getCategoryStats = useMemoizedCallback(() => {
    return categories.reduce((acc, category) => {
      acc[category.value] = invitationDesigns.filter(design =>
        matchesCategoryView(design, category.value)
      ).length;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  return {
    selectedCategory,
    filteredDesigns,
    isLoading: cartLoading,
    designMode,
    selectCategory,
    getCategoryStats,
    setDesignMode,
  };
}

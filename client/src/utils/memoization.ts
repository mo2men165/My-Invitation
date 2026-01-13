// client/src/utils/memoization.ts - Memoization utilities for expensive calculations
import { useMemo, useCallback } from 'react';

// Memoized filter function for large arrays
export function useMemoizedFilter<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  deps: React.DependencyList = []
) {
  return useMemo(() => {
    return items.filter(filterFn);
  }, [items, ...deps]);
}

// Memoized sort function for large arrays
export function useMemoizedSort<T>(
  items: T[],
  sortFn: (a: T, b: T) => number,
  deps: React.DependencyList = []
) {
  return useMemo(() => {
    return [...items].sort(sortFn);
  }, [items, ...deps]);
}

// Memoized search function
export function useMemoizedSearch<T>(
  items: T[],
  searchTerm: string,
  searchFn: (item: T, term: string) => boolean,
  deps: React.DependencyList = []
) {
  return useMemo(() => {
    if (!searchTerm.trim()) return items;
    return items.filter(item => searchFn(item, searchTerm.toLowerCase()));
  }, [items, searchTerm, ...deps]);
}

// Memoized group by function
export function useMemoizedGroupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
  deps: React.DependencyList = []
) {
  return useMemo(() => {
    return items.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }, [items, ...deps]);
}

// Memoized calculation function
export function useMemoizedCalculation<T, R>(
  input: T,
  calculationFn: (input: T) => R,
  deps: React.DependencyList = []
) {
  return useMemo(() => {
    return calculationFn(input);
  }, [input, ...deps]);
}

// Memoized callback with dependencies
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Expensive calculation examples
export const expensiveCalculations = {
  // Calculate total price with complex pricing logic
  calculateTotalPrice: (items: any[], basePrice: number, discounts: any[] = []) => {
    let total = basePrice;
    
    // Apply item-based calculations
    items.forEach(item => {
      total += item.price || 0;
      if (item.quantity) {
        total += (item.price || 0) * (item.quantity - 1);
      }
    });
    
    // Apply discounts
    discounts.forEach(discount => {
      if (discount.type === 'percentage') {
        total *= (1 - discount.value / 100);
      } else if (discount.type === 'fixed') {
        total -= discount.value;
      }
    });
    
    return Math.max(0, total);
  },

  // Calculate complex statistics
  calculateStatistics: (data: number[]) => {
    if (data.length === 0) return { mean: 0, median: 0, mode: 0, range: 0 };
    
    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;
    
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    // Calculate mode
    const frequency: Record<number, number> = {};
    data.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    const mode = Object.keys(frequency).reduce((a, b) => 
      frequency[Number(a)] > frequency[Number(b)] ? a : b
    );
    
    const range = sorted[sorted.length - 1] - sorted[0];
    
    return { mean, median: Number(mode), mode: Number(mode), range };
  },

  // Calculate pagination data
  calculatePagination: (totalItems: number, currentPage: number, itemsPerPage: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    return {
      totalPages,
      startIndex,
      endIndex,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      pageNumbers: Array.from({ length: totalPages }, (_, i) => i + 1)
    };
  }
};

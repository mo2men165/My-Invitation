'use client';
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCompareList } from '@/store/compareSlice';
import { useAuth } from '@/hooks/useAuth';

export const useCompareData = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAuth();
  const { items, isLoading, error, isInitialized: compareInitialized, count, isFull } = useAppSelector(
    (state) => state.compare
  );

  // Fetch compare list when user is authenticated and not already initialized
  const initializeCompare = useCallback(() => {
    if (isAuthenticated && isInitialized && !compareInitialized) {
      dispatch(fetchCompareList());
    }
  }, [isAuthenticated, isInitialized, compareInitialized, dispatch]);

  useEffect(() => {
    initializeCompare();
  }, [initializeCompare]);

  // Refetch compare list function
  const refetchCompare = useCallback(() => {
    if (isAuthenticated) {
      dispatch(fetchCompareList());
    }
  }, [isAuthenticated, dispatch]);

  return {
    items,
    isLoading,
    error,
    count,
    isFull,
    isInitialized: compareInitialized,
    refetchCompare,
    isEmpty: items.length === 0 && compareInitialized && !isLoading
  };
};

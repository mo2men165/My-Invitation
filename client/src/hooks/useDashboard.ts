// src/hooks/useDashboard.ts
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchDashboardData, fetchDashboardStats, fetchRecentOrders } from '@/store/dashboardSlice';
import { useAuth } from '@/hooks/useAuth';

export function useDashboard() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const dashboard = useAppSelector((state) => state.dashboard);

  // Fetch all dashboard data
  const refreshDashboard = useCallback(() => {
    if (isAuthenticated) {
      dispatch(fetchDashboardData());
    }
  }, [dispatch, isAuthenticated]);

  // Fetch only stats
  const refreshStats = useCallback(() => {
    if (isAuthenticated) {
      dispatch(fetchDashboardStats());
    }
  }, [dispatch, isAuthenticated]);

  // Fetch only recent orders
  const refreshOrders = useCallback((limit: number = 5) => {
    if (isAuthenticated) {
      dispatch(fetchRecentOrders(limit));
    }
  }, [dispatch, isAuthenticated]);

  // Auto-fetch on mount
  useEffect(() => {
    if (isAuthenticated) {
      // Check if data is stale (older than 5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const isDataStale = !dashboard.lastFetched || dashboard.lastFetched < fiveMinutesAgo;
      
      if (isDataStale) {
        refreshDashboard();
      }
    }
  }, [isAuthenticated, dashboard.lastFetched, refreshDashboard]);

  return {
    // Data
    stats: dashboard.stats,
    recentOrders: dashboard.recentOrders,
    
    // Loading states
    isLoadingStats: dashboard.isLoadingStats,
    isLoadingOrders: dashboard.isLoadingOrders,
    isLoading: dashboard.isLoadingStats || dashboard.isLoadingOrders,
    
    // Error states
    statsError: dashboard.statsError,
    ordersError: dashboard.ordersError,
    hasError: Boolean(dashboard.statsError || dashboard.ordersError),
    
    // Meta
    lastFetched: dashboard.lastFetched,
    
    // Actions
    refreshDashboard,
    refreshStats,
    refreshOrders,
  };
}
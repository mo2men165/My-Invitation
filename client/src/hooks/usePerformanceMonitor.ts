import { useEffect, useRef, useCallback } from 'react';
import { CART_MODAL_CONSTANTS } from '@/constants/cartModalConstants';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      renderCount.current += 1;

      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          renderCount: renderCount.current,
          timestamp: new Date().toISOString()
        });

        // Warn about slow renders
        if (renderTime > CART_MODAL_CONSTANTS.RENDER_TIME_WARNING_MS) {
          console.warn(`[Performance Warning] ${componentName} took ${renderTime.toFixed(2)}ms to render (target: <${CART_MODAL_CONSTANTS.RENDER_TIME_WARNING_MS}ms)`);
        }
      }

      // Reset for next render
      renderStartTime.current = 0;
    }
  }, [componentName]);

  // Monitor component mount/unmount
  useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  }, [startRender, endRender]);

  return {
    startRender,
    endRender,
    renderCount: renderCount.current
  };
};

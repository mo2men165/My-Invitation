export const performanceUtils = {
    // Measure component render time
    measureRenderTime: (componentName: string, renderFn: () => React.ReactElement) => {
      if (process.env.NODE_ENV === 'development') {
        const startTime = performance.now();
        const result = renderFn();
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        if (duration > 16.67) {
        }
        
        return result;
      }
      return renderFn();
    },
  
    // Throttle expensive operations
    throttleExpensiveOperation: <T extends (...args: any[]) => any>(
      fn: T,
      delay: number = 100
    ): T => {
      let lastCall = 0;
      let timeoutId: NodeJS.Timeout;
  
      return ((...args: Parameters<T>) => {
        const now = Date.now();
        
        if (now - lastCall >= delay) {
          lastCall = now;
          return fn(...args);
        } else {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            lastCall = Date.now();
            fn(...args);
          }, delay - (now - lastCall));
        }
      }) as T;
    },
  
    // Create memoized selector for complex computations
    createMemoizedSelector: <T, R>(
      selector: (data: T) => R,
      equalityFn?: (prev: T, next: T) => boolean
    ) => {
      let lastData: T;
      let lastResult: R;
      
      return (data: T): R => {
        if (equalityFn) {
          if (!equalityFn(lastData, data)) {
            lastData = data;
            lastResult = selector(data);
          }
        } else {
          if (lastData !== data) {
            lastData = data;
            lastResult = selector(data);
          }
        }
        
        return lastResult;
      };
    }
  };
  
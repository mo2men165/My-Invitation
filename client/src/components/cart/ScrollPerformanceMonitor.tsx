import React, { memo, useEffect, useRef, useState } from 'react';

interface ScrollPerformanceMonitorProps {
  enabled?: boolean;
  threshold?: number; // FPS threshold
}

const ScrollPerformanceMonitor = memo<ScrollPerformanceMonitorProps>(({
  enabled = process.env.NODE_ENV === 'development',
  threshold = 30 // 30 FPS threshold
}) => {
  const [fps, setFps] = useState(0);
  const [isLowFps, setIsLowFps] = useState(false);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationId = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastTime.current;
      
      if (delta >= 1000) { // Update every second
        const currentFps = Math.round((frameCount.current * 1000) / delta);
        setFps(currentFps);
        setIsLowFps(currentFps < threshold);
        
        frameCount.current = 0;
        lastTime.current = now;
      } else {
        frameCount.current++;
      }
      
      animationId.current = requestAnimationFrame(measureFPS);
    };

    animationId.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [enabled, threshold]);

  if (!enabled) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-2 rounded-lg text-xs font-mono">
      <div className={`${isLowFps ? 'text-red-400' : 'text-green-400'}`}>
        FPS: {fps}
      </div>
      {isLowFps && (
        <div className="text-yellow-400 text-xs mt-1">
          Low FPS detected
        </div>
      )}
    </div>
  );
});

ScrollPerformanceMonitor.displayName = 'ScrollPerformanceMonitor';
export default ScrollPerformanceMonitor;

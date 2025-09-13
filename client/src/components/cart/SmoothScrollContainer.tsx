import React, { memo, useRef, useEffect, useCallback } from 'react';

interface SmoothScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  height?: number;
  onScroll?: (scrollTop: number) => void;
}

const SmoothScrollContainer = memo<SmoothScrollContainerProps>(({
  children,
  className = '',
  height = 600,
  onScroll
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle scroll events with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      requestAnimationFrame(() => {
        onScroll?.(e.currentTarget.scrollTop);
        isScrollingRef.current = false;
      });
    }
  }, [onScroll]);

  // Smooth scroll to top
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Expose scroll methods
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).scrollToTop = scrollToTop;
      (containerRef.current as any).scrollToBottom = scrollToBottom;
    }
  }, [scrollToTop, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-[#C09B52]/30 scrollbar-track-transparent ${className}`}
      style={{
        height: `${height}px`,
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        scrollbarWidth: 'thin',
        scrollbarColor: '#C09B52 rgba(255, 255, 255, 0.1)'
      }}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
});

SmoothScrollContainer.displayName = 'SmoothScrollContainer';
export default SmoothScrollContainer;

'use client';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

export function SkeletonLoader({ 
  className = '', 
  count = 1, 
  height = 'h-4', 
  width = 'w-full' 
}: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-700 rounded ${height} ${width} ${className}`}
        />
      ))}
    </>
  );
}

export function ComparePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header Skeleton */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <SkeletonLoader height="h-8" width="w-48" className="mb-2" />
              <SkeletonLoader height="h-4" width="w-64" />
            </div>
            <SkeletonLoader height="h-12" width="w-32" className="rounded-lg" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <SkeletonLoader height="h-4" width="w-24" className="mb-2" />
                  <SkeletonLoader height="h-6" width="w-16" />
                </div>
                <SkeletonLoader height="h-8" width="w-8" className="rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Compare Cards Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white/5 rounded-2xl border border-white/10 p-6">
              {/* Image Skeleton */}
              <SkeletonLoader height="h-48" width="w-full" className="rounded-xl mb-4" />
              
              {/* Title Skeleton */}
              <SkeletonLoader height="h-6" width="w-3/4" className="mb-2" />
              
              {/* Description Skeleton */}
              <SkeletonLoader height="h-4" width="w-full" className="mb-2" />
              <SkeletonLoader height="h-4" width="w-2/3" className="mb-4" />
              
              {/* Price Skeleton */}
              <SkeletonLoader height="h-5" width="w-24" className="mb-4" />
              
              {/* Buttons Skeleton */}
              <div className="flex gap-2">
                <SkeletonLoader height="h-10" width="w-20" className="rounded-lg" />
                <SkeletonLoader height="h-10" width="w-20" className="rounded-lg" />
                <SkeletonLoader height="h-10" width="w-20" className="rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-8 py-12">
        {/* Welcome Header Skeleton */}
        <div className="mb-12">
          <SkeletonLoader height="h-12" width="w-96" className="mb-4" />
          <SkeletonLoader height="h-6" width="w-64" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
              <SkeletonLoader height="h-8" width="w-8" className="mb-4" />
              <SkeletonLoader height="h-6" width="w-24" className="mb-2" />
              <SkeletonLoader height="h-8" width="w-16" />
            </div>
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <SkeletonLoader height="h-6" width="w-32" className="mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <SkeletonLoader height="h-12" width="w-12" className="rounded" />
                    <div className="flex-1">
                      <SkeletonLoader height="h-4" width="w-3/4" className="mb-2" />
                      <SkeletonLoader height="h-3" width="w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

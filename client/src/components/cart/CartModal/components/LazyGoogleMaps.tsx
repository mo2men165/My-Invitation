'use client';
import React, { lazy, Suspense } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

const GoogleMapsSelector = lazy(() => 
  import('@/components/packages/modals/cartModal/GoogleMapsSelector').catch(() => ({
    default: () => (
      <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">فشل في تحميل مكون الخرائط</span>
        </div>
        <p className="text-red-300 text-sm">يرجى المحاولة مرة أخرى</p>
      </div>
    )
  }))
);

interface LazyGoogleMapsProps {
  locationData: any;
  onLocationSelect: any;
  errors: any;
  searchQuery: string;
  onSearchQueryChange: any;
}

const LazyGoogleMaps: React.FC<LazyGoogleMapsProps> = (props) => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 bg-white/5 rounded-xl border border-white/10">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#C09B52] mx-auto mb-2 animate-spin" />
          <p className="text-white text-sm">جاري تحميل الخرائط...</p>
        </div>
      </div>
    }>
      <GoogleMapsSelector {...props} />
    </Suspense>
  );
};

export default LazyGoogleMaps;

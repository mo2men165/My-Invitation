'use client';
import React, { memo, useCallback } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface LocationMapSectionProps {
  eventLocation: string;
  onLocationChange: (value: string) => void;
  locationError?: string;
  showMap: boolean;
  onToggleMap: () => void;
  mapComponent?: React.ReactNode;
}

// ✅ MEMOIZED WITH LOCATION-SPECIFIC PROPS ONLY
const LocationMapSection = memo<LocationMapSectionProps>(({
  eventLocation,
  onLocationChange,
  locationError,
  showMap,
  onToggleMap,
  mapComponent
}) => {
  // ✅ MEMOIZED HANDLER - WON'T RECREATE UNLESS onLocationChange CHANGES
  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onLocationChange(e.target.value);
  }, [onLocationChange]);

  return (
    <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-5">
      <label className="text-white font-medium mb-3 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#C09B52]" />
        موقع المناسبة <span className="text-red-400 text-lg">*</span>
      </label>
      
      <div className="space-y-3">
        <Input
          type="text"
          value={eventLocation}
          onChange={handleLocationChange}
          className={`w-full px-4 py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 transition-all duration-300 text-lg ${
            locationError ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
          }`}
          placeholder="أدخل عنوان المناسبة"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={onToggleMap}
          className={`w-full border-2 transition-all duration-300 ${
            showMap 
              ? 'border-[#C09B52] bg-[#C09B52]/10 text-[#C09B52]' 
              : 'border-[#C09B52]/30 text-[#C09B52] hover:bg-[#C09B52]/10'
          }`}
        >
          <MapPin className="w-4 h-4 mr-2" />
          {showMap ? 'إخفاء الخريطة' : 'تحديد الموقع على الخريطة'}
        </Button>
        
        {/* ✅ MAP ONLY RE-RENDERS WHEN showMap OR mapComponent CHANGES */}
        {showMap && mapComponent}
      </div>

      {locationError && (
        <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {locationError}
        </div>
      )}
    </div>
  );
});

LocationMapSection.displayName = 'LocationMapSection';
export default LocationMapSection;

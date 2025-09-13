import React, { memo, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDebouncedInput } from '../hooks/useDebouncedInput';

interface LocationSectionProps {
  eventLocation: string;
  onLocationChange: (value: string) => void;
  onToggleMap: () => void;
  showMap: boolean;
  locationError?: string;
  mapComponent?: React.ReactNode;
}

const LocationSection = memo<LocationSectionProps>(({
  eventLocation,
  onLocationChange,
  onToggleMap,
  showMap,
  locationError,
  mapComponent
}) => {
  // Debounced input for better performance
  const { value, setValue } = useDebouncedInput(
    eventLocation,
    500,
    onLocationChange
  );

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, [setValue]);

  return (
    <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-5">
      <label className="text-white font-medium mb-3 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#C09B52]" />
        موقع المناسبة <span className="text-red-400 text-lg">*</span>
      </label>
      
      <div className="space-y-3">
        <Input
          type="text"
          value={value}
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
        
        {showMap && mapComponent}
      </div>

      {locationError && (
        <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
          {locationError}
        </div>
      )}
    </div>
  );
});

LocationSection.displayName = 'LocationSection';
export default LocationSection;

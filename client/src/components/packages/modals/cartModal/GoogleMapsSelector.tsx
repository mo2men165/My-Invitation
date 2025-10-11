// client/src/components/packages/modals/GoogleMapsSelector.tsx
'use client';
import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { MapPin, Search, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { SAUDI_CITIES, CITY_BOUNDARIES, DEFAULT_COORDINATES, MAP_CONFIG, MAP_STYLES } from '@/constants';

// Declare google as any to avoid type conflicts
declare const google: any;

interface LocationData {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  city: string;
}

interface GoogleMapsSelectorProps {
  locationData: LocationData;
  onLocationSelect: (lat: number, lng: number, address: string, city: string) => void;
  errors: { location?: string };
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}



// Global state to track Google Maps loading
let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;
let googleMapsCallbacks: (() => void)[] = [];

// Global function to handle Google Maps loading
const loadGoogleMapsGlobally = (callback: () => void) => {
  if (isGoogleMapsLoaded) {
    callback();
    return;
  }

  googleMapsCallbacks.push(callback);

  if (isGoogleMapsLoading) {
    return; // Already loading, just wait
  }

  isGoogleMapsLoading = true;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return;
  }

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ar&region=SA&callback=initGoogleMapsGlobal`;
  script.async = true;
  script.defer = true;

  (window as any).initGoogleMapsGlobal = () => {
    isGoogleMapsLoaded = true;
    isGoogleMapsLoading = false;
    googleMapsCallbacks.forEach(cb => cb());
    googleMapsCallbacks = [];
    delete (window as any).initGoogleMapsGlobal;
  };

  script.onerror = () => {
    isGoogleMapsLoading = false;
  };

  document.head.appendChild(script);
};

const GoogleMapsSelector: React.FC<GoogleMapsSelectorProps> = memo(({
  locationData,
  onLocationSelect,
  errors,
  searchQuery,
  onSearchQueryChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const geocoderRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  const { toast } = useToast();

  // Memoized distance calculation
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Memoized city boundary validation
  const validateCityBoundary = useCallback((lat: number, lng: number) => {
    for (const [cityName, boundary] of Object.entries(CITY_BOUNDARIES)) {
      const distance = calculateDistance(lat, lng, boundary.lat, boundary.lng);
      if (distance <= boundary.radius) {
        return cityName;
      }
    }
    return null;
  }, [calculateDistance]);

  // Memoized location selection handler
  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    const validCity = validateCityBoundary(lat, lng);
    
    if (!validCity) {
      toast({
        title: "موقع غير مدعوم",
        description: "يرجى اختيار موقع داخل إحدى المدن المدعومة: " + SAUDI_CITIES.join('، '),
        variant: "destructive",
        duration: 4000
      });
      return;
    }

    try {
      // Use cached geocoder
      if (geocoderRef.current) {
        const result = await geocoderRef.current.geocode({ location: { lat, lng } });
        
        if (result?.results && result.results[0]) {
          const address = result.results[0].formatted_address;
          onLocationSelect(lat, lng, address, validCity);
          
          // Update marker position without re-rendering
          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          }
          
          return;
        }
      }
      
      // Fallback
      onLocationSelect(lat, lng, `موقع في ${validCity}`, validCity);
      
    } catch (error) {
      onLocationSelect(lat, lng, `موقع في ${validCity}`, validCity);
    }
  }, [validateCityBoundary, onLocationSelect, toast]);

  // Initialize Google Maps (only once)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setLoadError('مفتاح Google Maps API غير موجود في متغيرات البيئة');
      setIsLoading(false);
      return;
    }

    loadGoogleMapsGlobally(() => {
      setIsLoading(false);
    });
  }, []);

  // Initialize map instance (only once)
  useEffect(() => {
    if (isLoading || loadError || isMapInitialized || !mapRef.current) return;

    if (typeof google === 'undefined' || !google?.maps) {
      setLoadError('Google Maps API لم يتم تحميله بشكل صحيح');
      return;
    }

    try {
      // Create map
      const map = new google.maps.Map(mapRef.current, {
        center: DEFAULT_COORDINATES,
        zoom: MAP_CONFIG.defaultZoom,
        // Remove custom styles to use default Google Maps theme
      });

      mapInstanceRef.current = map;

      // Create geocoder
      geocoderRef.current = new google.maps.Geocoder();

      // Create marker
      const marker = new google.maps.Marker({
        map: map,
        draggable: true,
        title: 'موقع المناسبة'
      });

      markerRef.current = marker;

      // Add event listeners (only once)
      map.addListener('click', (e: any) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          handleLocationSelect(lat, lng);
        }
      });

      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (position) {
          handleLocationSelect(position.lat(), position.lng());
        }
      });

      setIsMapInitialized(true);

    } catch (error) {
      setLoadError('خطأ في تهيئة الخريطة');
    }
  }, [isLoading, loadError, isMapInitialized, handleLocationSelect]);

  // Update marker position when location data changes (without re-rendering map)
  useEffect(() => {
    if (!isMapInitialized || !markerRef.current || !mapInstanceRef.current) return;

    const { lat, lng } = locationData.coordinates;
    
    // Only update if coordinates are different from default
    if (lat !== 24.7136 || lng !== 46.6753) {
      markerRef.current.setPosition({ lat, lng });
      mapInstanceRef.current.setCenter({ lat, lng });
    }
  }, [locationData.coordinates, isMapInitialized]);

  // Initialize autocomplete (only once)
  useEffect(() => {
    if (!isMapInitialized || !searchInputRef.current || typeof google === 'undefined' || !google?.maps?.places) return;

    try {
      // Create autocomplete with specific options to prevent input blocking
      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
        componentRestrictions: MAP_CONFIG.componentRestrictions,
        fields: MAP_CONFIG.fields,
        strictBounds: false,
      });

      // Prevent the autocomplete from blocking the Enter key
      google.maps.event.addDomListener(searchInputRef.current, 'keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          
          handleLocationSelect(lat, lng);
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(15);
          }
        }
      });

    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }, [isMapInitialized, handleLocationSelect]);

  // Memoized search input change handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchQueryChange(e.target.value);
  }, [onSearchQueryChange]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white/5 rounded-xl p-6 space-y-4 border border-white/10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-[#C09B52] mx-auto mb-2 animate-spin" />
            <p className="text-white text-sm">جاري تحميل الخرائط...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">فشل في تحميل الخرائط</span>
        </div>
        <p className="text-red-300 text-sm">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-4 space-y-4 border border-white/10 mt-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#C09B52]" />
        <span className="text-white font-medium">تحديد موقع المناسبة</span>
      </div>
      
      {/* Map Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="ابحث عن مكان..."
          className="bg-white/10 border-white/20 text-white pl-10"
          autoComplete="off"
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Google Map */}
      <div 
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-white/10 overflow-hidden bg-gray-800"
        style={{ minHeight: '256px' }} // Prevent layout shift
      />

      {/* Selected Location Display */}
      {locationData.address && (
        <div className="bg-[#C09B52]/10 rounded-lg p-3 border border-[#C09B52]/20">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#C09B52] mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">الموقع المحدد:</p>
              <p className="text-gray-300 text-sm">{locationData.address}</p>
              <p className="text-[#C09B52] text-xs">المدينة: {locationData.city}</p>
            </div>
          </div>
        </div>
      )}

      {/* City Restriction Notice */}
      <div className="text-xs text-gray-400 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
        <p className="font-medium text-blue-300 mb-1">ملاحظة:</p>
        <p>يمكن تحديد المواقع في المدن التالية فقط: {SAUDI_CITIES.join('، ')}</p>
        <p className="mt-1">اضغط على الخريطة أو اسحب العلامة لتحديد الموقع</p>
      </div>

      {/* Error Display */}
      {errors.location && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {errors.location}
        </div>
      )}
    </div>
  );
});

GoogleMapsSelector.displayName = 'GoogleMapsSelector';

export default GoogleMapsSelector;
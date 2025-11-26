// client/src/components/cart/CartModal/components/GoogleMapsLocationPicker.tsx
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Search, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  GoogleMapsLocationPickerProps,
  GULF_COUNTRIES_BOUNDARIES,
  GULF_COUNTRIES,
  DEFAULT_CENTER
} from '@/types/location';

// Declare google as any to avoid type conflicts
declare const google: any;

// Global state to track Google Maps loading
let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;
let googleMapsCallbacks: (() => void)[] = [];

// Global function to handle Google Maps loading
const loadGoogleMapsScript = (callback: () => void) => {
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
    console.error('Google Maps API key not found');
    isGoogleMapsLoading = false;
    return;
  }

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement('script');
  // Load Google Maps with Places library for autocomplete
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ar&region=SA&loading=async&callback=initGoogleMaps`;
  script.async = true;
  script.defer = true;

  (window as any).initGoogleMaps = () => {
    isGoogleMapsLoaded = true;
    isGoogleMapsLoading = false;
    googleMapsCallbacks.forEach(cb => cb());
    googleMapsCallbacks = [];
    delete (window as any).initGoogleMaps;
  };

  script.onerror = () => {
    isGoogleMapsLoading = false;
    console.error('Failed to load Google Maps');
  };

  document.head.appendChild(script);
};

const GoogleMapsLocationPicker: React.FC<GoogleMapsLocationPickerProps> = ({
  locationData,
  onLocationSelect,
  errors
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const geocoderRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  const { toast } = useToast();

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Validate if coordinates are within Gulf countries boundaries
  const validateGulfCountryBoundary = useCallback((lat: number, lng: number): boolean => {
    return GULF_COUNTRIES_BOUNDARIES.some(country => 
      lat >= country.minLat && 
      lat <= country.maxLat && 
      lng >= country.minLng && 
      lng <= country.maxLng
    );
  }, []);

  // Extract city from address components (for Gulf countries)
  const extractCityFromPlace = useCallback((place: any): string | null => {
    if (!place.address_components) return null;

    // Try to find city in address components (prioritize locality, then administrative_area_level_1)
    for (const component of place.address_components) {
      if (component.types.includes('locality')) {
        return component.long_name;
      }
    }
    
    // If no locality, try administrative_area_level_1 (state/province)
    for (const component of place.address_components) {
      if (component.types.includes('administrative_area_level_1')) {
        return component.long_name;
      }
    }
    
    // If still no city, try country name as fallback
    for (const component of place.address_components) {
      if (component.types.includes('country')) {
        return component.long_name;
      }
    }
    
    return null;
  }, []);

  // Handle location selection from any source
  const handleLocationSelect = useCallback(async (lat: number, lng: number, place?: any) => {
    // Validate coordinates are in Gulf countries
    const isInGulfCountry = validateGulfCountryBoundary(lat, lng);

    if (!isInGulfCountry) {
      toast({
        title: "موقع غير مدعوم",
        description: `يرجى اختيار موقع داخل إحدى دول الخليج: ${GULF_COUNTRIES.join('، ')}`,
        variant: "destructive",
        duration: 4000
      });
      return;
    }

    try {
      let placeId = '';
      let displayName = '';
      let formattedAddress = '';
      let city = '';

      if (place) {
        // Data from autocomplete selection
        placeId = place.place_id || '';
        displayName = place.name || place.formatted_address || '';
        formattedAddress = place.formatted_address || '';

        // Extract city from place data
        const extractedCity = extractCityFromPlace(place);
        if (extractedCity) {
          city = extractedCity;
        } else {
          // Fallback: use formatted address or display name
          city = formattedAddress || displayName || 'موقع غير محدد';
        }
      } else {
        // Data from map click or marker drag - need to geocode
        if (geocoderRef.current) {
          const result = await geocoderRef.current.geocode({ location: { lat, lng } });

          if (result?.results && result.results[0]) {
            const geocodedPlace = result.results[0];
            placeId = geocodedPlace.place_id || '';
            displayName = geocodedPlace.formatted_address || '';
            formattedAddress = geocodedPlace.formatted_address || '';

            const extractedCity = extractCityFromPlace(geocodedPlace);
            if (extractedCity) {
              city = extractedCity;
            } else {
              city = formattedAddress || displayName || 'موقع غير محدد';
            }
          } else {
            // Fallback
            placeId = '';
            displayName = `موقع مختار`;
            formattedAddress = `موقع مختار`;
            city = 'موقع غير محدد';
          }
        } else {
          // No geocoder available
          placeId = '';
          displayName = `موقع مختار`;
          formattedAddress = `موقع مختار`;
          city = 'موقع غير محدد';
        }
      }

      // Update marker position
      if (markerRef.current) {
        const marker = markerRef.current;
        const newPosition = new google.maps.LatLng(lat, lng);
        marker.setPosition(newPosition);
      }

      // Center map on location
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat, lng });
        mapInstanceRef.current.setZoom(15);
      }

      // Call parent callback
      onLocationSelect(placeId, displayName, city, lat, lng, formattedAddress);

    } catch (error) {
      console.error('Error handling location selection:', error);

      // Fallback - still provide basic data
      const placeId = '';
      const displayName = `موقع مختار`;
      const formattedAddress = `موقع مختار`;
      const fallbackCity = 'موقع غير محدد';

      onLocationSelect(placeId, displayName, fallbackCity, lat, lng, formattedAddress);
    }
  }, [validateGulfCountryBoundary, extractCityFromPlace, onLocationSelect, toast]);

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setLoadError('مفتاح Google Maps API غير موجود في متغيرات البيئة');
      setIsLoading(false);
      return;
    }

    loadGoogleMapsScript(() => {
      setIsLoading(false);
    });
  }, []);

  // Initialize map instance
  useEffect(() => {
    if (isLoading || loadError || isMapInitialized || !mapRef.current) return;

    if (typeof google === 'undefined' || !google?.maps) {
      setLoadError('Google Maps API لم يتم تحميله بشكل صحيح');
      return;
    }

    try {
      // Create map with dark theme
      // Note: Removed mapId because it conflicts with custom styles
      // Using classic Marker instead of AdvancedMarkerElement to support styles
      const map = new google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 11,
        styles: [
          {
            elementType: "geometry",
            stylers: [{ color: "#1d2c4d" }]
          },
          {
            elementType: "labels.text.fill",
            stylers: [{ color: "#8ec3b9" }]
          },
          {
            elementType: "labels.text.stroke",
            stylers: [{ color: "#1a3646" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0e1626" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Create geocoder
      geocoderRef.current = new google.maps.Geocoder();

      // ✅ Use classic Marker (works with custom map styles)
      // Note: AdvancedMarkerElement requires mapId which conflicts with custom styles
      const marker = new google.maps.Marker({
        map: map,
        position: DEFAULT_CENTER,
        draggable: true,
        title: 'موقع المناسبة',
        animation: google.maps.Animation.DROP
      });

      markerRef.current = marker;

      // Add map click listener
      map.addListener('click', (e: any) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          handleLocationSelect(lat, lng);
        }
      });

      // Add marker drag listener
      marker.addListener('dragend', () => {
        // Classic Marker uses getPosition()
        const position = marker.getPosition();
        if (position) {
          const lat = position.lat();
          const lng = position.lng();
          handleLocationSelect(lat, lng);
        }
      });

      setIsMapInitialized(true);

    } catch (error) {
      console.error('Error initializing map:', error);
      setLoadError('خطأ في تهيئة الخريطة');
    }
  }, [isLoading, loadError, isMapInitialized, handleLocationSelect]);

  // Initialize PlaceAutocompleteElement
  useEffect(() => {
    if (!isMapInitialized || !mapInstanceRef.current || typeof google === 'undefined' || !google?.maps?.places) {
      return;
    }

    const containerElement = autocompleteContainerRef.current;
    if (!containerElement) return;

    // Wait for PlaceAutocompleteElement to be defined
    const initAutocomplete = async () => {
      try {
        // Check if PlaceAutocompleteElement is available
        if (!google.maps.places.PlaceAutocompleteElement) {
          return;
        }

        // Create PlaceAutocompleteElement
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: ['SA', 'AE', 'KW', 'QA', 'BH', 'OM'] }, // Gulf countries
        });

        placeAutocomplete.setAttribute('placeholder', 'ابحث عن مكان...');
        placeAutocomplete.style.width = '100%';

        // Clear container and add autocomplete element
        containerElement.innerHTML = '';
        containerElement.appendChild(placeAutocomplete);

        autocompleteRef.current = placeAutocomplete;

        // Handle place selection using 'gmp-select' event
        const handlePlaceSelect = async (event: any) => {
          try {
            // For PlaceAutocompleteElement, the place data is in event.placePrediction
            if (!event.placePrediction) {
              toast({
                title: "خطأ",
                description: "لم يتم العثور على البيانات",
                variant: "destructive",
              });
              return;
            }

            // Convert prediction to place object
            const place = event.placePrediction.toPlace();

            // Fetch place details with required fields
            await place.fetchFields({
              fields: ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents']
            });

            if (!place.location) {
              toast({
                title: "خطأ",
                description: "لم يتم العثور على الموقع المحدد",
                variant: "destructive",
              });
              return;
            }

            // Extract coordinates
            const lat = place.location.lat();
            const lng = place.location.lng();

            if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
              toast({
                title: "خطأ",
                description: "إحداثيات غير صالحة",
                variant: "destructive",
              });
              return;
            }

            // Convert to format expected by handleLocationSelect
            const placeData = {
              place_id: place.id || '',
              name: place.displayName || '',
              formatted_address: place.formattedAddress || '',
              geometry: { location: place.location },
              address_components: place.addressComponents || []
            };

            await handleLocationSelect(lat, lng, placeData);

          } catch (error) {
            console.error('Error handling place selection:', error);
            toast({
              title: "خطأ",
              description: "حدث خطأ أثناء تحديد الموقع",
              variant: "destructive",
            });
          }
        };

        placeAutocomplete.addEventListener('gmp-select', handlePlaceSelect);

        // Cleanup
        return () => {
          placeAutocomplete.removeEventListener('gmp-select', handlePlaceSelect);
          if (containerElement) {
            containerElement.innerHTML = '';
          }
          autocompleteRef.current = null;
        };

      } catch (error) {
        console.error('Error initializing PlaceAutocompleteElement:', error);
      }
    };

    const cleanup = initAutocomplete();

    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, [isMapInitialized, handleLocationSelect, toast]);

  // Update marker position when locationData changes from parent
  useEffect(() => {
    if (!isMapInitialized || !markerRef.current || !mapInstanceRef.current) return;

    const { lat, lng } = locationData.coordinates;

    // Only update if coordinates are different from default
    if (lat !== DEFAULT_CENTER.lat || lng !== DEFAULT_CENTER.lng) {
      const marker = markerRef.current;
      const newPosition = new google.maps.LatLng(lat, lng);
      
      // Classic Marker uses setPosition method
      marker.setPosition(newPosition);
      mapInstanceRef.current.setCenter({ lat, lng });
    }
  }, [locationData.coordinates, isMapInitialized]);

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

      {/* Search Input - PlaceAutocompleteElement Container */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-5">
        <label className="text-white font-medium mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-[#C09B52]" />
          ابحث عن الموقع
        </label>
        <div
          ref={autocompleteContainerRef}
          className="w-full gmp-autocomplete-container"
        >
          {!isMapInitialized && (
            <div className="w-full px-4 py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-xl text-gray-400 text-lg text-center">
              جاري تحميل البحث...
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Style PlaceAutocompleteElement to match our design */
        :global(.gmp-autocomplete-container gmp-place-autocomplete) {
          width: 100%;
        }

        :global(.gmp-autocomplete-container gmp-place-autocomplete input) {
          width: 100% !important;
          padding: 1rem !important;
          background: linear-gradient(to right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1)) !important;
          border: 2px solid ${errors?.location ? '#f87171' : 'rgba(255, 255, 255, 0.2)'} !important;
          border-radius: 0.75rem !important;
          color: #ffffff !important;
          font-size: 1.125rem !important;
          line-height: 1.75rem !important;
          transition: all 0.3s ease !important;
          box-sizing: border-box !important;
        }

        :global(.gmp-autocomplete-container gmp-place-autocomplete input::placeholder) {
          color: #9ca3af !important;
        }

        :global(.gmp-autocomplete-container gmp-place-autocomplete input:focus) {
          outline: none !important;
          border-color: #C09B52 !important;
          box-shadow: 0 0 0 2px rgba(192, 155, 82, 0.5) !important;
        }

        /* Dropdown styling */
        :global(.pac-container) {
          background-color: #1f2937 !important;
          border: 2px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 0.75rem !important;
          margin-top: 0.25rem !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }

        :global(.pac-item) {
          background-color: transparent !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          padding: 0.75rem 1rem !important;
          cursor: pointer !important;
        }

        :global(.pac-item:hover),
        :global(.pac-item-selected) {
          background-color: rgba(192, 155, 82, 0.2) !important;
        }

        :global(.pac-item-query) {
          color: #ffffff !important;
        }

        :global(.pac-matched) {
          color: #C09B52 !important;
          font-weight: 600 !important;
        }
      `}</style>

      {/* Google Map */}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-white/10 overflow-hidden bg-gray-800"
        style={{ minHeight: '256px' }}
      />

      {/* Selected Location Display */}
      {locationData.address && locationData.displayName && (
        <div className="bg-[#C09B52]/10 rounded-lg p-3 border border-[#C09B52]/20">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#C09B52] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">الموقع المحدد:</p>
              <p className="text-gray-300 text-sm mt-1">{locationData.displayName}</p>
              {locationData.city && (
                <p className="text-[#C09B52] text-xs mt-1">المدينة: {locationData.city}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Location Restriction Notice */}
      <div className="text-xs text-gray-400 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
        <p className="font-medium text-blue-300 mb-1">ملاحظة:</p>
        <p>يمكن تحديد المواقع في دول الخليج فقط: {GULF_COUNTRIES.join('، ')}</p>
        <p className="mt-1">اضغط على الخريطة أو اسحب العلامة لتحديد الموقع</p>
      </div>

      {/* Error Display */}
      {errors?.location && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {errors.location}
        </div>
      )}
    </div>
  );
};

export default GoogleMapsLocationPicker;

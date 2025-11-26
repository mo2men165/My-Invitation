// client/src/types/location.ts
export interface LocationData {
  placeId: string;
  displayName: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
}

export interface GoogleMapsLocationPickerProps {
  locationData: LocationData;
  onLocationSelect: (
    placeId: string,
    displayName: string,
    city: string,
    lat: number,
    lng: number,
    formattedAddress: string
  ) => void;
  errors?: { location?: string };
}

// Gulf countries boundaries for validation
export const GULF_COUNTRIES_BOUNDARIES = [
  // Saudi Arabia
  { minLat: 16, maxLat: 32, minLng: 34, maxLng: 55, name: 'Saudi Arabia' },
  // UAE
  { minLat: 22, maxLat: 26, minLng: 51, maxLng: 56, name: 'UAE' },
  // Kuwait
  { minLat: 28.5, maxLat: 30.1, minLng: 46.5, maxLng: 48.5, name: 'Kuwait' },
  // Qatar
  { minLat: 24.4, maxLat: 26.2, minLng: 50.7, maxLng: 51.7, name: 'Qatar' },
  // Bahrain
  { minLat: 25.8, maxLat: 26.3, minLng: 50.4, maxLng: 50.7, name: 'Bahrain' },
  // Oman
  { minLat: 16.6, maxLat: 26.4, minLng: 51.9, maxLng: 59.8, name: 'Oman' }
] as const;

// Gulf countries list for display
export const GULF_COUNTRIES = [
  'المملكة العربية السعودية',
  'الإمارات العربية المتحدة',
  'الكويت',
  'قطر',
  'البحرين',
  'عُمان'
] as const;

// Legacy exports for backward compatibility
export const SAUDI_CITIES = [
  'جدة',
  'الرياض',
  'الدمام',
  'مكة المكرمة',
  'الطائف',
  'المدينة المنورة'
] as const;

export const CITY_BOUNDARIES = {
  'جدة': { lat: 21.4858, lng: 39.1925, radius: 50 },
  'الرياض': { lat: 24.7136, lng: 46.6753, radius: 60 },
  'الدمام': { lat: 26.4207, lng: 50.0888, radius: 40 },
  'مكة المكرمة': { lat: 21.3891, lng: 39.8579, radius: 30 },
  'الطائف': { lat: 21.2703, lng: 40.4034, radius: 35 },
  'المدينة المنورة': { lat: 24.5247, lng: 39.5692, radius: 40 }
} as const;

export const DEFAULT_CENTER = {
  lat: 24.7136,
  lng: 46.6753
} as const;

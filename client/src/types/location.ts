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

// Saudi Arabia city boundaries for validation
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

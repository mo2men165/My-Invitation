// client/src/constants/mapData.ts - Map and location related constants

// Saudi cities list for maps
export const SAUDI_CITIES = ['الرياض', 'جدة', 'الدمام', 'المدينة المنورة', 'مكة المكرمة', 'القصيم'];

// City boundaries for validation
export const CITY_BOUNDARIES = {
  'الرياض': { lat: 24.7136, lng: 46.6753, radius: 60 },
  'جدة': { lat: 21.4858, lng: 39.1925, radius: 50 },
  'الدمام': { lat: 26.4207, lng: 50.0888, radius: 40 },
  'المدينة المنورة': { lat: 24.5247, lng: 39.5692, radius: 40 },
  'مكة المكرمة': { lat: 21.3891, lng: 39.8579, radius: 30 },
  'القصيم': { lat: 26.3260, lng: 43.9750, radius: 50 }
};

// Default coordinates (Riyadh)
export const DEFAULT_COORDINATES = {
  lat: 24.7136,
  lng: 46.6753
};

// Map configuration - Allow Gulf countries
export const MAP_CONFIG = {
  defaultZoom: 11,
  defaultCenter: DEFAULT_COORDINATES,
  componentRestrictions: { country: ['SA', 'AE', 'KW', 'QA', 'BH', 'OM'] }, // Gulf countries
  fields: ['place_id', 'geometry', 'name', 'formatted_address']
};

// Map styles
export const MAP_STYLES = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dadada"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c9c9c9"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  }
];

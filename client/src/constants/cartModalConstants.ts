// Constants for CartModal component
export const CART_MODAL_CONSTANTS = {
  // Debounce delays
  DEBOUNCE_DELAY: 300, // Optimized from 500ms
  
  // Form validation
  MIN_BOOKING_DAYS: 7,
  
  // Pricing
  EXTRA_HOUR_COST: 250,
  GATE_SUPERVISOR_COST: 450,
  EXPEDITED_DELIVERY_COST: 3000,
  
  // Package pricing per extra card
  EXTRA_CARD_PRICES: {
    classic: 7,
    premium: 13,
    vip: 20,
  } as const,
  
  // Event duration
  BASE_EVENT_HOURS: 4,
  MAX_EXTRA_HOURS: 2,
  
  // Character limits
  INVITATION_TEXT_MAX_LENGTH: 1000,
  
  // Performance thresholds
  RENDER_TIME_WARNING_MS: 16, // 60fps threshold
  
  // Auto-refresh intervals
  TOKEN_REFRESH_CHECK_INTERVAL: 60000, // 1 minute
  TOKEN_REFRESH_BEFORE_EXPIRY: 300, // 5 minutes
} as const;

// City coordinates for auto-location
export const CITY_COORDINATES = {
  'الرياض': { lat: 24.7136, lng: 46.6753 },
  'جدة': { lat: 21.4858, lng: 39.1925 },
  'الدمام': { lat: 26.4207, lng: 50.0888 },
  'مكة المكرمة': { lat: 21.3891, lng: 39.8579 },
  'الطائف': { lat: 21.2703, lng: 40.4034 },
  'المدينة المنورة': { lat: 24.5247, lng: 39.5692 }
} as const;

// Default coordinates (Riyadh)
export const DEFAULT_LOCATION = CITY_COORDINATES['الرياض'];

// Time options - pre-generated to avoid re-computation
export const TIME_OPTIONS = (() => {
  const times: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(`1970-01-01T${timeStr}`).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      times.push({ value: timeStr, label: displayTime });
    }
  }
  return times;
})();

export type CityKey = keyof typeof CITY_COORDINATES;
export type PackageType = keyof typeof CART_MODAL_CONSTANTS.EXTRA_CARD_PRICES;
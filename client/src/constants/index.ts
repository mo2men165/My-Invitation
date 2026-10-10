// Re-export from split files
export {
  packageData,
  purchasablePackageData,
  PURCHASABLE_PACKAGE_KEYS,
  isPackagePurchasable
} from './packageData';
export { additionalServices } from './additionalServices';
export { customDesignSentinel } from './customDesign';

// Re-export from new data files
export { quickActions, statsConfig, orderStatusConfig } from './dashboardData';
export { navLinks, socialLinks, services, quickLinks, supportLinks } from './layoutData';
export { aboutFeatures, counters, ctaFeatures, invitationSliderData } from './homeData';
export { saudiCities, passwordStrengthChecks, passwordStrengthLevels, generateTimeOptions, validationPatterns } from './formData';
export { SAUDI_CITIES, CITY_BOUNDARIES, DEFAULT_COORDINATES, MAP_CONFIG, MAP_STYLES } from './mapData';
  
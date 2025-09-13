import { CompareItem } from "@/lib/api/compare";
import { WishlistItem } from "@/lib/api/wishlist";
import { LucideIcon } from "lucide-react";

// Re-export component types
export * from './components';

export interface PricingOption {
    invites: number;
    price: number;
  }
  
  export interface PackageInfo {
    name: string;
    icon: LucideIcon;
    color: string;
    borderColor: string;
    features: string[];
    pricing: PricingOption[];
  }
  
  export interface PackageData {
    classic: PackageInfo;
    premium: PackageInfo;
    vip: PackageInfo;
  }
  
  export interface GateSupervisorOption {
    range: string;
    supervisors: number;
    price: number;
  }
  
  export interface AdditionalService {
    id: string;
    name: string;
    description: string;
    price?: number;
    unit?: string;
    options?: GateSupervisorOption[];
    cities?: string[];
  }
  
  export interface InvitationDesign {
    id: string;
    name: string;
    category: string;
    image: string;
  }
  
  export interface CartForm {
    inviteCount: number;
    eventDate: string;
    startTime: string;
    endTime: string;
    invitationText: string;
    hostName: string;
    eventLocation: string;
    additionalCards: number;
    gateSupervisors: number; // Changed from string to number
    extraHours?: number;
    qrCode?: boolean;
    fastDelivery?: boolean;
    expeditedDelivery?: boolean;
    // Existing location fields
    locationCoordinates?: {
      lat: number;
      lng: number;
    };
    detectedCity?: string;
  }

  export interface LocationData {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    city: string;
  }
  
  export interface CityBoundary {
    lat: number;
    lng: number;
    radius: number; // in kilometers
  }
  
  export interface FormErrors {
    [key: string]: string;
  }
  
  export interface ValidationRule {
    (value: any, formData?: CartForm): string | null;
  }
  
  export interface ValidationRules {
    [key: string]: ValidationRule;
  }
  
  // Map integration interfaces
  export interface MapSearchResult {
    place_id: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    name: string;
  }
  
  export interface GoogleMapsConfig {
    apiKey: string;
    libraries: string[];
    region: string;
    language: string;
  }  
  

  export interface DesignCardProps {
    design: InvitationDesign;
    packageType: keyof PackageData;
    onToggleWishlist: (designId: string) => void;
    onToggleCompare: (designId: string) => void;
    isInWishlist: (designId: string) => boolean;
    isInCompare: (designId: string) => boolean;
    cartLoading: boolean;
  }  

  export interface WishlistItemWithPackage extends WishlistItem {
    packageType?: keyof PackageData; // We'll add this to the backend later
  }
  
  export interface CompareItemWithPackage extends CompareItem {
    packageType: 'classic' | 'premium' | 'vip'; // We'll add this to the backend later
  }
  
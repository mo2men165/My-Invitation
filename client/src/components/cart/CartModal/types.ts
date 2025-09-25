import { InvitationDesign, PackageData } from '@/types';

export interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: keyof PackageData | null;
  selectedDesign: InvitationDesign | null;
  editItem?: any;
}

export interface CartModalState {
  isEditMode: boolean;
  showMap: boolean;
  showConfirmation: boolean;
  mapSearchQuery: string;
  isUpdating: boolean;
}

export interface CartFormData {
  eventName?: string;
  inviteCount: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  invitationText: string;
  hostName: string;
  eventLocation: string;
  additionalCards: number;
  gateSupervisors: number;
  extraHours: number;
  qrCode: boolean;
  fastDelivery: boolean;
  expeditedDelivery: boolean;
  // Custom design fields
  isCustomDesign?: boolean;
  customDesignNotes?: string;
}

export interface LocationData {
  address: string;
  coordinates: { lat: number; lng: number };
  city: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface CartModalContextType {
  state: CartModalState;
  formData: CartFormData;
  locationData: LocationData;
  errors: FormErrors;
  actions: {
    updateFormField: (field: string, value: any) => void;
    updateLocation: (lat: number, lng: number, address: string) => void;
    toggleMap: () => void;
    toggleConfirmation: () => void;
    setEditMode: (mode: boolean) => void;
    setUpdating: (updating: boolean) => void;
    resetForm: () => void;
    validateForm: () => boolean;
    submitForm: () => Promise<void>;
  };
}

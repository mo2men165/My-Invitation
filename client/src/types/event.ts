export interface Guest {
  _id?: string;
  name: string;
  phone: string;
  numberOfAccompanyingGuests: number;
  whatsappMessageSent: boolean;
  addedBy?: {
    type: 'owner' | 'collaborator';
    userId: string;
    collaboratorName?: string;
    collaboratorEmail?: string;
  };
  addedAt?: string;
  updatedAt?: string;
}

export interface PackageDetails {
  name: string;
  color: string;
}

export interface StatusDetails {
  name: string;
  color: string;
  bgColor: string;
}

export interface ApprovalStatusDetails {
  name: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

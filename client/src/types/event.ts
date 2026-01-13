// Cloudinary image object interface
export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export interface Guest {
  _id?: string;
  name: string;
  phone: string;
  numberOfAccompanyingGuests: number;
  whatsappMessageSent: boolean;
  whatsappSentAt?: string;
  whatsappMessageId?: string;
  rsvpStatus?: 'pending' | 'accepted' | 'declined';
  rsvpResponse?: string;
  rsvpRespondedAt?: string;
  addedBy?: {
    type: 'owner' | 'collaborator';
    userId: string;
    collaboratorName?: string;
    collaboratorEmail?: string;
  };
  individualInviteImage?: CloudinaryImage;
  actuallyAttended?: boolean;
  attendanceMarkedAt?: string;
  attendanceMarkedBy?: string;
  addedAt?: string;
  updatedAt?: string;
  refundedOnDecline?: boolean;
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

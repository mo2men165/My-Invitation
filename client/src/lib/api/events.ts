// src/lib/api/events.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Guest {
  _id?: string;
  name: string;
  phone: string;
  numberOfAccompanyingGuests: number;
  whatsappMessageSent: boolean;
  addedAt: string;
  updatedAt: string;
}

export interface EventItem {
  _id: string;
  userId: string;
  designId: string;
  packageType: 'classic' | 'premium' | 'vip';
  details: {
    eventName: string;
    inviteCount: number;
    eventDate: string;
    startTime: string;
    endTime: string;
    invitationText: string;
    hostName: string;
    eventLocation: string;
    additionalCards: number;
    gateSupervisors: number;
    fastDelivery: boolean;
    // Location fields
    placeId?: string;
    displayName?: string;
    formattedAddress?: string;
    detectedCity?: string;
    locationCoordinates?: {
      lat: number;
      lng: number;
    };
    googleMapsUrl?: string;
  };
  totalPrice: number;
  status: 'upcoming' | 'cancelled' | 'done';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  invitationCardUrl?: string;
  qrCodeUrl?: string;
  qrCodeReaderUrl: string;
  adminNotes?: string;
  guestListConfirmed: {
    isConfirmed: boolean;
    confirmedAt?: string;
    confirmedBy?: string;
  };
  guests: Guest[];
  paymentCompletedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventStats {
  upcoming: number;
  cancelled: number;
  done: number;
  total_revenue: number;
}

export interface GuestStats {
  totalGuests: number;
  totalInvited: number;
  whatsappMessagesSent: number;
  remainingInvites: number;
}

export interface EventsApiResponse<T = any> {
  success: boolean;
  message?: string;
  events?: T;
  event?: EventItem;
  guests?: Guest[]; // Add guests field for filtered guest data
  stats?: EventStats;
  guestStats?: GuestStats;
  guest?: Guest;
  count?: number;
  remainingInvites?: number;
  remainingGuests?: number;
  userRole?: 'owner' | 'collaborator';
  permissions?: {
    canAddGuests: boolean;
    canEditGuests: boolean;
    canDeleteGuests: boolean;
    canViewFullEvent: boolean;
    canManageCollaborators?: boolean;
  };
  totalInvitesForView?: number; // Total invites to show in UI (allocated for collaborators)
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: { message: string };
}

class EventsAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getEvents(params?: {
    status?: string;
    approvalStatus?: string;
    limit?: number;
    page?: number;
  }): Promise<EventsApiResponse<EventItem[]>> {
    const searchParams = new URLSearchParams();
    
    if (params?.status) searchParams.set('status', params.status);
    if (params?.approvalStatus) searchParams.set('approvalStatus', params.approvalStatus);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.page) searchParams.set('page', params.page.toString());

    const response = await fetch(`${API_BASE_URL}/api/events?${searchParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب المناسبات');
    }

    return result;
  }

  async getEventDetails(id: string): Promise<EventsApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب تفاصيل المناسبة');
    }

    return result;
  }

  async addGuest(eventId: string, guestData: {
    name: string;
    phone: string;
    numberOfAccompanyingGuests: number;
  }): Promise<EventsApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/guests`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(guestData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إضافة الضيف');
    }

    return result;
  }

  async updateGuest(eventId: string, guestId: string, updates: Partial<{
    name: string;
    phone: string;
    numberOfAccompanyingGuests: number;
  }>): Promise<EventsApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/guests/${guestId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث بيانات الضيف');
    }

    return result;
  }

  async removeGuest(eventId: string, guestId: string): Promise<EventsApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/guests/${guestId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في حذف الضيف');
    }

    return result;
  }

  async markWhatsappSent(eventId: string, guestId: string): Promise<EventsApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/guests/${guestId}/whatsapp`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث حالة الرسالة');
    }

    return result;
  }

  async updateEventStatus(id: string, status: 'cancelled'): Promise<EventsApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/events/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث حالة المناسبة');
    }

    return result;
  }

  async getEventStats(): Promise<EventsApiResponse<EventStats>> {
    const response = await fetch(`${API_BASE_URL}/api/events/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب إحصائيات المناسبات');
    }

    return result;
  }

  async confirmGuestList(eventId: string): Promise<EventsApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/guests/confirm`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تأكيد قائمة الضيوف');
    }

    return result;
  }
}

export const eventsAPI = new EventsAPI();
// client/src/lib/api/collaboration.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  phone: string;
  allocatedInvites: number;
  usedInvites: number;
  permissions: {
    canAddGuests: boolean;
    canEditGuests: boolean;
    canDeleteGuests: boolean;
    canViewFullEvent: boolean;
  };
  addedAt: string;
  isNewUser?: boolean;
}

export interface CollaboratorData {
  name: string;
  email: string;
  phone: string;
  city: string;
  customCity?: string;
  allocatedInvites: number;
  permissions?: {
    canAddGuests?: boolean;
    canEditGuests?: boolean;
    canDeleteGuests?: boolean;
    canViewFullEvent?: boolean;
  };
}

export interface CollaborationStats {
  totalCollaborators: number;
  totalAllocatedInvites: number;
  guestsAddedByOwner: number;
  guestsAddedByCollaborators: number;
}

export interface UserEventPermissions {
  role: 'owner' | 'collaborator';
  permissions: {
    canAddGuests: boolean;
    canEditGuests: boolean;
    canDeleteGuests: boolean;
    canViewFullEvent: boolean;
    canManageCollaborators?: boolean;
  };
  allocatedInvites: number;
  usedInvites: number;
}

export interface CollaborationApiResponse<T = any> {
  success: boolean;
  message?: string;
  collaborator?: Collaborator;
  collaborators?: Collaborator[];
  events?: T;
  stats?: any;
  summary?: any;
  totalAllocatedInvites?: number;
  maxAllocation?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: { message: string };
}

class CollaborationAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Add a collaborator to an event
   */
  async addCollaborator(eventId: string, collaboratorData: CollaboratorData): Promise<CollaborationApiResponse<Collaborator>> {
    const response = await fetch(`${API_BASE_URL}/api/collaboration/events/${eventId}/collaborators`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(collaboratorData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إضافة المتعاون');
    }

    return result;
  }

  /**
   * Get collaborators for an event
   */
  async getCollaborators(eventId: string): Promise<CollaborationApiResponse<Collaborator[]>> {
    const response = await fetch(`${API_BASE_URL}/api/collaboration/events/${eventId}/collaborators`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب المتعاونين');
    }

    return result;
  }

  /**
   * Update collaborator permissions
   */
  async updateCollaborator(
    eventId: string, 
    collaboratorId: string, 
    updates: {
      permissions?: Partial<Collaborator['permissions']>;
      allocatedInvites?: number;
    }
  ): Promise<CollaborationApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/collaboration/events/${eventId}/collaborators/${collaboratorId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث المتعاون');
    }

    return result;
  }

  /**
   * Remove a collaborator from an event
   */
  async removeCollaborator(eventId: string, collaboratorId: string): Promise<CollaborationApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/collaboration/events/${eventId}/collaborators/${collaboratorId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إزالة المتعاون');
    }

    return result;
  }

  /**
   * Get user's events (both owned and collaborated)
   */
  async getUserEvents(params?: {
    role?: 'owner' | 'collaborator';
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<CollaborationApiResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.page) searchParams.set('page', params.page.toString());

    const response = await fetch(`${API_BASE_URL}/api/collaboration/my-events?${searchParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب المناسبات');
    }

    return result;
  }

  /**
   * Get user's permissions for a specific event
   */
  async getEventPermissions(eventId: string): Promise<CollaborationApiResponse<UserEventPermissions>> {
    const response = await fetch(`${API_BASE_URL}/api/collaboration/events/${eventId}/permissions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في التحقق من الصلاحيات');
    }

    return result;
  }

  /**
   * Get collaboration statistics for the user
   */
  async getCollaborationStats(): Promise<CollaborationApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/collaboration/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب الإحصائيات');
    }

    return result;
  }
}

export const collaborationAPI = new CollaborationAPI();

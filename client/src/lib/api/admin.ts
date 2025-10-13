const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    suspended: number;
  };
  events: {
    total: number;
    pendingApprovals: number;
    approved: number;
    rejected: number;
  };
  revenue: {
    thisMonth: number;
  };
}

interface PendingEvent {
  id: string;
  user: {
    name: string;
    email: string;
    phone: string;
    city: string;
  };
  eventDetails: {
    hostName: string;
    eventDate: string;
    eventLocation: string;
    inviteCount: number;
    packageType: string;
  };
  totalPrice: number;
  paymentCompletedAt: string;
  status: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  role: string;
  status: string;
  eventCount: number;
  createdAt: string;
}

interface Event {
  id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  eventDetails: {
    hostName: string;
    eventDate: string;
    eventLocation: string;
    inviteCount: number;
    packageType: string;
  };
  totalPrice: number;
  status: string;
  approvalStatus: string;
  invitationCardUrl?: string;
  qrCodeUrl?: string;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  paymentCompletedAt: string;
}

interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  eventId?: {
    details: {
      hostName: string;
      eventDate: string;
    };
  };
  userId?: {
    firstName: string;
    lastName: string;
  };
  isRead: boolean;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const adminAPI = {
  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب الإحصائيات');
    }
    
    return result.data;
  },

  // Pending Events
  async getPendingEvents(page = 1, limit = 10): Promise<PaginatedResponse<PendingEvent>> {
    const response = await fetch(`${API_URL}/api/admin/events/pending?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب الأحداث المعلقة');
    }
    
    return {
      data: result.data.events,
      pagination: result.data.pagination
    };
  },

  // All Events
  async getAllEvents(params: {
    page?: number;
    limit?: number;
    approvalStatus?: string;
    status?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<Event>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, value.toString());
    });
    
    const response = await fetch(`${API_URL}/api/admin/events/all?${query}`, {
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب الأحداث');
    }
    
    return {
      data: result.data.events,
      pagination: result.data.pagination
    };
  },

  // Approve Event
  async approveEvent(eventId: string, notes?: string, invitationCardUrl?: string, qrCodeUrl?: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes, invitationCardUrl, qrCodeUrl })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في الموافقة على الحدث');
    }
  },

  // Reject Event
  async rejectEvent(eventId: string, notes: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في رفض الحدث');
    }
  },

  // Bulk Approve Events
  async bulkApproveEvents(eventIds: string[], notes?: string): Promise<{ approvedCount: number }> {
    const response = await fetch(`${API_URL}/api/admin/events/bulk-approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ eventIds, notes })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في الموافقة الجماعية');
    }
    
    return { approvedCount: result.approvedCount };
  },

  // Users Management
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}): Promise<PaginatedResponse<User>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, value.toString());
    });
    
    const response = await fetch(`${API_URL}/api/admin/users?${query}`, {
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب المستخدمين');
    }
    
    return {
      data: result.data.users,
      pagination: result.data.pagination
    };
  },

  // Update User Status
  async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث حالة المستخدم');
    }
  },

  // Update User Role
  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث دور المستخدم');
    }
  },

  // Notifications
  async getNotifications(params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}): Promise<PaginatedResponse<AdminNotification> & { unreadCount: number }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, value.toString());
    });
    
    const response = await fetch(`${API_URL}/api/admin/notifications?${query}`, {
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب الإشعارات');
    }
    
    return {
      data: result.data.notifications,
      pagination: result.data.pagination,
      unreadCount: result.data.unreadCount
    };
  },

  // Mark Notification as Read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث الإشعار');
    }
  },

  // Event Guest Management
  async getEventGuests(eventId: string): Promise<{
    event: any;
    guests: any[];
    guestStats: {
      totalGuests: number;
      totalInvited: number;
      whatsappMessagesSent: number;
      remainingInvites: number;
    };
  }> {
    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/guests`, {
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب ضيوف المناسبة');
    }
    
    return result.data;
  },

  // Mark WhatsApp as sent for guest
  async markGuestWhatsappSent(eventId: string, guestId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/guests/${guestId}/whatsapp`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث حالة الرسالة');
    }
  },

  // Update Guest Individual Invite Link (premium and VIP only)
  async updateGuestInviteLink(eventId: string, guestId: string, individualInviteLink: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/guests/${guestId}/invite-link`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ individualInviteLink })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث رابط الدعوة');
    }
  }
};
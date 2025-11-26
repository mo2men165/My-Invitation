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
    customCity?: string;
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
  customCity?: string;
  role: string;
  status: string;
  eventCount: number;
  createdAt: string;
}

interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
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
  invitationCardImage?: CloudinaryImage;
  qrCodeReaderUrl?: string;
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

const getAuthHeaders = (includeContentType = true) => {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`
  };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
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
  async approveEvent(eventId: string, invitationCardImage: File, notes?: string, qrCodeReaderUrl?: string): Promise<void> {
    const formData = new FormData();
    formData.append('image', invitationCardImage);
    if (notes) formData.append('notes', notes);
    if (qrCodeReaderUrl) formData.append('qrCodeReaderUrl', qrCodeReaderUrl);

    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(false), // Don't include Content-Type, let browser set it with boundary
      body: formData
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

  // Update Event Image
  async updateEventImage(eventId: string, invitationCardImage: File): Promise<void> {
    const formData = new FormData();
    formData.append('image', invitationCardImage);

    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/image`, {
      method: 'PUT',
      headers: getAuthHeaders(false), // Don't include Content-Type, let browser set it with boundary
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث صورة الحدث');
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

  // Update Guest Individual Invite Image (premium and VIP only)
  async updateGuestInviteImage(eventId: string, guestId: string, individualInviteImage: File | null): Promise<void> {
    const formData = new FormData();
    if (individualInviteImage) {
      formData.append('image', individualInviteImage);
    }

    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/guests/${guestId}/invite-image`, {
      method: 'PUT',
      headers: getAuthHeaders(false), // Don't include Content-Type, let browser set it with boundary
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث صورة الدعوة');
    }
  },

  // Reopen Guest List (all package types)
  async reopenGuestList(eventId: string): Promise<{ reopenedAt: string; reopenCount: number }> {
    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/reopen-guest-list`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إعادة فتح قائمة الضيوف');
    }
    
    return result.data;
  },

  // Mark Guest Attendance (VIP packages only)
  async markGuestAttendance(eventId: string, guestId: string, attended: boolean): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/guests/${guestId}/attendance`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ attended })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تسجيل حضور الضيف');
    }
  },

  // User Cart Management
  async getUserCart(userId: string): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
    };
    cart: any[];
  }> {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/cart`, {
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب سلة المستخدم');
    }
    
    return result.data;
  },

  async updateCartItemPrice(userId: string, cartItemId: string, price: number, reason?: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/cart/${cartItemId}/price`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ price, reason })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث السعر');
    }
    
    return result.data;
  },

  async applyCartItemDiscount(userId: string, cartItemId: string, percentage: number, reason?: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/cart/${cartItemId}/discount`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ percentage, reason })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تطبيق الخصم');
    }
    
    return result.data;
  },

  async applyCartDiscountAll(userId: string, percentage: number, reason?: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/cart/discount-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ percentage, reason })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تطبيق الخصم');
    }
    
    return result.data;
  },

  async removeCartItemPriceModification(userId: string, cartItemId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/cart/${cartItemId}/price-modification`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إعادة السعر الأصلي');
    }
    
    return result.data;
  }
};
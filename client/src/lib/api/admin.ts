import { uploadMedia } from '@/lib/uploadMedia';

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

interface PackageImage {
  _id: string;
  name: string;
  image: CloudinaryImage;
  packageTier?: 'classic' | 'premium' | 'vip';
  category?: string;
  createdAt: string;
  updatedAt: string;
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

/**
 * One chunk of a bulk WhatsApp send, as the server returns it.
 */
export interface AdminBulkChunkResult {
  success: boolean;
  sent: number;
  failed: number;
  results: Array<{ guestId: string; success: boolean; error?: string; messageId?: string }>;
  remainingGuestIds: string[];
}

export interface AdminBulkProgress {
  sent: number;
  failed: number;
  total: number;
}

export interface AdminBulkSummary {
  sent: number;
  failed: number;
  total: number;
  failures: Array<{ guestId: string; error?: string }>;
}

/**
 * Drive a bulk WhatsApp endpoint to completion. The server sends a handful of
 * messages per request and returns whoever is left, so we keep calling with the
 * remainder. The first call omits guestIds and lets the server pick the
 * recipients. Guests are marked as sent as they go, so an interrupted run can
 * simply be started again.
 */
const runAdminBulkSend = async (
  path: string,
  errorMessage: string,
  onProgress?: (progress: AdminBulkProgress) => void
): Promise<AdminBulkSummary> => {
  const failures: AdminBulkSummary['failures'] = [];
  let sent = 0;
  let failed = 0;
  let total = 0;
  let remaining: string[] | undefined;
  let firstChunk = true;

  while (firstChunk || (remaining && remaining.length > 0)) {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(remaining ? { guestIds: remaining } : {})
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || errorMessage);
    }

    const chunk = result.data;

    // The API and the frontend deploy separately, so an older API may answer
    // with the previous shape. Say so plainly instead of failing on undefined.
    if (!chunk || !Array.isArray(chunk.results) || !Array.isArray(chunk.remainingGuestIds)) {
      throw new Error('الخادم يعمل بإصدار أقدم غير متوافق. يرجى المحاولة بعد قليل');
    }

    sent += chunk.sent;
    failed += chunk.failed;
    failures.push(
      ...chunk.results.filter(r => !r.success).map(r => ({ guestId: r.guestId, error: r.error }))
    );

    if (firstChunk) {
      total = chunk.sent + chunk.failed + chunk.remainingGuestIds.length;
    }

    onProgress?.({ sent, failed, total });

    // Stop if the server stopped making progress, so this cannot spin forever.
    if (!firstChunk && remaining && chunk.remainingGuestIds.length >= remaining.length) {
      break;
    }

    remaining = chunk.remainingGuestIds;
    firstChunk = false;
  }

  return { sent, failed, total, failures };
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

  // Approve Event. The card goes straight to Cloudinary first - it may be a
  // video, and the API cannot relay a body that size - and only its metadata
  // reaches us.
  async approveEvent(
    eventId: string,
    invitationCard: File,
    notes?: string,
    qrCodeReaderUrl?: string,
    onUploadProgress?: (percent: number) => void
  ): Promise<void> {
    const media = await uploadMedia(invitationCard, `events/${eventId}/invitation-cards`, onUploadProgress);

    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ media, notes, qrCodeReaderUrl })
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

  // Replace an event's invitation card (image or video)
  async updateEventImage(
    eventId: string,
    invitationCard: File,
    onUploadProgress?: (percent: number) => void
  ): Promise<void> {
    const media = await uploadMedia(invitationCard, `events/${eventId}/invitation-cards`, onUploadProgress);

    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/image`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ media })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث بطاقة الدعوة');
    }
  },

  // Add a guest to a premium/VIP event on the customer's behalf
  async addEventGuest(
    eventId: string,
    guest: { name: string; phone: string; numberOfAccompanyingGuests: number }
  ): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/guests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(guest)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إضافة الضيف');
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
  // Set or remove one of a guest's entry cards. Slot 0 is the guest's own card,
  // slots 1..n-1 belong to the accompanying guests on the same invitation.
  async updateGuestInviteImage(
    eventId: string,
    guestId: string,
    individualInviteImage: File | null,
    slot = 0,
    onUploadProgress?: (percent: number) => void
  ): Promise<void> {
    // The card goes straight to Cloudinary; passing null removes the slot.
    const media = individualInviteImage
      ? await uploadMedia(
          individualInviteImage,
          `events/${eventId}/guests/${guestId}/invites`,
          onUploadProgress
        )
      : null;

    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/guests/${guestId}/invite-image/${slot}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(media ? { media } : {})
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

  // Send WhatsApp invitations to a premium/VIP event's guests (chunked)
  async sendEventInvitations(
    eventId: string,
    onProgress?: (progress: AdminBulkProgress) => void
  ): Promise<AdminBulkSummary> {
    return runAdminBulkSend(
      `/api/admin/events/${eventId}/send-invitations`,
      'فشل في إرسال الدعوات',
      onProgress
    );
  },

  // Send reminder messages to guests who accepted (chunked)
  async sendEventReminders(
    eventId: string,
    onProgress?: (progress: AdminBulkProgress) => void
  ): Promise<AdminBulkSummary> {
    return runAdminBulkSend(
      `/api/admin/events/${eventId}/send-reminders`,
      'فشل في إرسال التذكيرات',
      onProgress
    );
  },

  // Send thank you messages to guests who attended (VIP, chunked)
  async sendThankYouMessages(
    eventId: string,
    onProgress?: (progress: AdminBulkProgress) => void
  ): Promise<AdminBulkSummary> {
    return runAdminBulkSend(
      `/api/admin/events/${eventId}/send-thank-you`,
      'فشل في إرسال رسائل الشكر',
      onProgress
    );
  },

  // Mark the invitation cards of a classic event as handed to the customer
  async setClassicInvitationsDelivered(
    eventId: string,
    delivered: boolean
  ): Promise<{ classicInvitationsDelivered: { isDelivered: boolean; deliveredAt?: string } }> {
    const response = await fetch(`${API_URL}/api/admin/events/${eventId}/classic-invitations-delivered`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ delivered })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث حالة تسليم الدعوات');
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

  // Package Images
  async getPackageImages(filters: { packageTier?: string; category?: string } = {}): Promise<PackageImage[]> {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });

    const response = await fetch(`${API_URL}/api/admin/package-images?${query}`, {
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب صور الباقات');
    }

    return result.data;
  },

  // The design goes straight to Cloudinary first; only its metadata reaches us.
  async createPackageImage(
    image: File,
    details: { name: string; packageTier?: string; category?: string },
    onUploadProgress?: (percent: number) => void
  ): Promise<PackageImage> {
    const media = await uploadMedia(image, 'packages', onUploadProgress);

    const response = await fetch(`${API_URL}/api/admin/package-images`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ media, ...details })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إضافة التصميم');
    }

    return result.data;
  },

  async updatePackageImage(id: string, data: { name?: string; packageTier?: string; category?: string }): Promise<PackageImage> {
    const response = await fetch(`${API_URL}/api/admin/package-images/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث التصميم');
    }

    return result.data;
  },

  async deletePackageImage(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/package-images/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في حذف التصميم');
    }
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
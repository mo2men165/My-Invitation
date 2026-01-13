// src/lib/api/dashboard.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  totalGuests: number;
  upcomingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  monthlyOrdersChange: number;
  monthlySpentChange: number;
}

export interface RecentOrder {
  id: string;
  event: string;
  date: string;
  guests: number;
  status: 'مكتمل' | 'قيد التنفيذ' | 'قيد المراجعة' | 'ملغي' | 'مجدول';
  statusColor: 'green' | 'yellow' | 'blue' | 'red' | 'purple';
  amount: string;
  type: string;
  packageType: 'classic' | 'premium' | 'vip';
}

export interface DashboardApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: { message: string };
}

class DashboardAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getDashboardStats(): Promise<DashboardApiResponse<DashboardStats>> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب إحصائيات لوحة التحكم');
    }

    return result;
  }

  async getRecentOrders(limit: number = 5): Promise<DashboardApiResponse<RecentOrder[]>> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-orders?limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب الطلبات الأخيرة');
    }

    return result;
  }

  async getBills(params?: { limit?: number; page?: number }): Promise<DashboardApiResponse<{
    bills: Bill[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const response = await fetch(`${API_BASE_URL}/api/dashboard/bills?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب الفواتير');
    }

    return result;
  }

  async getBillById(billId: string): Promise<DashboardApiResponse<Bill>> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/bills/${billId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب الفاتورة');
    }

    return result;
  }
}

export interface PricingBreakdown {
  basePrice: number;
  additionalCards: {
    count: number;
    pricePerCard: number;
    total: number;
  };
  gateSupervisors: {
    count: number;
    pricePerSupervisor: number;
    total: number;
  };
  fastDelivery: {
    enabled: boolean;
    price: number;
  };
  extraHours: {
    count: number;
    pricePerHour: number;
    total: number;
  };
  totalAdditionalCosts: number;
  totalPrice: number;
}

export interface BillEvent {
  eventId: string;
  eventName?: string;
  hostName: string;
  eventDate: string;
  eventLocation: string;
  simpleLocation?: string;
  packageType: string;
  inviteCount: number;
  price: number;
  pricingBreakdown?: PricingBreakdown;
  eventDetails?: any;
}

export interface Bill {
  _id: string;
  userId: string;
  orderId: string;
  billNumber: string;
  paymentId: string;
  totalAmount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string;
  events: BillEvent[];
  user: {
    name: string;
    email: string;
    phone: string;
    city: string;
  };
  emailSent: boolean;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const dashboardAPI = new DashboardAPI();
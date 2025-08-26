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
}

export const dashboardAPI = new DashboardAPI();
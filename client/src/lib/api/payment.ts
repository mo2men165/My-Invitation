// src/lib/api/payment.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface PaymentSummary {
  itemCount: number;
  totalAmount: number;
  items: Array<{
    id: string;
    designId: string;
    packageType: 'classic' | 'premium' | 'vip';
    hostName: string;
    eventDate: string;
    eventLocation: string;
    inviteCount: number;
    price: number;
  }>;
}

export interface PaymentApiResponse<T = any> {
  success: boolean;
  message?: string;
  summary?: PaymentSummary;
  eventsCreated?: number;
  events?: T[];
  paymentId?: string;
  totalAmount?: number;
  errorReason?: string;
  error?: { message: string };
}

class PaymentAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getPaymentSummary(): Promise<PaymentApiResponse<PaymentSummary>> {
    const response = await fetch(`${API_BASE_URL}/api/payment/summary`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب ملخص الدفع');
    }

    return result;
  }

  async processPayment(paymentDetails: {
    paymentId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
  }): Promise<PaymentApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/payment/process`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(paymentDetails),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في معالجة الدفع');
    }

    return result;
  }

  async processFailedPayment(failureDetails: {
    paymentId: string;
    amount: number;
    errorReason: string;
  }): Promise<PaymentApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/payment/failed`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(failureDetails),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في معالجة فشل الدفع');
    }

    return result;
  }

  async getPendingOrders(): Promise<{
    success: boolean;
    orders: Array<{
      id: string;
      paymobOrderId: number;
      totalAmount: number;
      selectedItemsCount: number;
      createdAt: string;
      selectedItems: Array<{
        cartItemId: string;
        hostName: string;
        packageType: string;
        eventDate: string;
        price: number;
      }>;
    }>;
    error?: { message: string };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/payment/pending-orders`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب الطلبات المعلقة');
    }

    return result;
  }

  async getPendingCartItems(): Promise<{
    success: boolean;
    pendingCartItemIds: string[];
    error?: { message: string };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/payment/pending-cart-items`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب العناصر المعلقة');
    }

    return result;
  }

  async getOrderByMerchantId(merchantOrderId: string): Promise<{
    success: boolean;
    order?: any;
    error?: { message: string };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/payment/order/${merchantOrderId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب بيانات الطلب');
    }

    return result;
  }

  async createTabbySession(data: {
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      city: string;
      address?: string;
      zip?: string;
      dob?: string;
    };
    selectedCartItemIds?: string[];
  }): Promise<{
    success: boolean;
    sessionId?: string;
    paymentId?: string;
    checkoutUrl?: string;
    merchantOrderId?: string;
    amount?: number;
    currency?: string;
    error?: { message: string; rejectionReason?: string };
    status?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/payment/create-tabby-session`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إنشاء جلسة Tabby');
    }

    return result;
  }

  async getTabbyPaymentStatus(paymentId: string): Promise<{
    success: boolean;
    payment?: any;
    error?: { message: string };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/payment/tabby/${paymentId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب حالة الدفع');
    }

    return result;
  }
}

export const paymentAPI = new PaymentAPI();
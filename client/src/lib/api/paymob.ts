// client/src/lib/api/paymob.ts
import { apiClient as axios } from '@/lib/axios';

export interface PaymobOrderRequest {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
  };
}

export interface PaymobOrderResponse {
  success: boolean;
  orderId: number;
  paymentToken: string;
  iframeUrl: string;
  amount: number;
  currency: string;
}

export interface PaymobConfig {
  iframeId: number;
  currency: string;
  language: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymobConfigResponse {
  success: boolean;
  config: PaymobConfig;
}

export interface PaymentStatusResponse {
  success: boolean;
  status?: string;
  amount?: number;
  error?: string;
}

export const paymobAPI = {
  /**
   * Create Paymob order and get payment URL
   */
  async createOrder(orderData: PaymobOrderRequest): Promise<PaymobOrderResponse> {
    const response = await axios.post('/api/payment/create-paymob-order', orderData);
    return response.data;
  },

  /**
   * Get Paymob configuration for frontend
   */
  async getConfig(): Promise<PaymobConfigResponse> {
    const response = await axios.get('/api/payment/paymob/config');
    return response.data;
  },

  /**
   * Get payment status from Paymob
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    const response = await axios.get(`/api/payment/paymob/status/${transactionId}`);
    return response.data;
  },

  /**
   * Process successful payment (for manual processing)
   */
  async processPayment(paymentData: {
    paymentId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
  }) {
    const response = await axios.post('/api/payment/process', paymentData);
    return response.data;
  }
};

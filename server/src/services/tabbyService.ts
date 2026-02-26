// server/src/services/tabbyService.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../config/logger';
import {
  TabbyConfig,
  TabbySessionRequest,
  TabbySessionResponse,
  TabbyPaymentResponse,
  TabbyCaptureRequest,
  TabbyCaptureResponse,
  TabbyRefundRequest,
  TabbyRefundResponse,
  TabbyItem,
  TabbyErrorResponse
} from '../types/tabby';

let tabbyServiceInstance: TabbyService | null = null;

export function getTabbyService(): TabbyService {
  if (!tabbyServiceInstance) {
    tabbyServiceInstance = new TabbyService();
    logger.info('TabbyService initialized (lazy initialization)');
  }
  return tabbyServiceInstance;
}

export class TabbyService {
  private config: TabbyConfig;
  private axiosInstance: AxiosInstance;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.config = {
      publicKey: process.env.TABBY_PUBLIC_KEY!,
      secretKey: process.env.TABBY_SECRET_KEY!,
      merchantCode: process.env.TABBY_MERCHANT_CODE || 'TWS',
      apiUrl: process.env.TABBY_API_URL || 'https://api.tabby.ai',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      backendUrl: isProduction 
        ? (process.env.BACKEND_URL_PRODUCTION || process.env.BACKEND_URL || 'http://localhost:5000')
        : (process.env.BACKEND_URL || 'http://localhost:5000')
    };

    this.validateConfig();

    this.axiosInstance = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<TabbyErrorResponse>) => {
        logger.error('Tabby API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });
        throw error;
      }
    );
  }

  private validateConfig(): void {
    const requiredFields: (keyof TabbyConfig)[] = ['secretKey', 'merchantCode', 'apiUrl'];
    const missingFields = requiredFields.filter(field => !this.config[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required Tabby configuration: ${missingFields.join(', ')}`);
    }
  }

  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Method 1: Create a checkout session
   * Endpoint: POST /api/v2/checkout
   * Returns session with web_url for customer redirect
   */
  async createSession(params: {
    orderReferenceId: string;
    amount: number;
    description: string;
    items: Array<{
      title: string;
      description: string;
      id: string;
      sku: string;
      category: string;
      quantity: number;
      unitPrice: number;
      referenceId: string;
      imageUrl?: string;
      productUrl?: string;
    }>;
    buyer: {
      phone: string;
      email: string;
      name: string;
      dob?: string;
    };
    buyerHistory?: {
      registeredSince: string;
      loyaltyLevel?: number;
      isEmailVerified?: boolean;
      isPhoneVerified?: boolean;
    };
    shippingAddress: {
      city: string;
      address: string;
      zip: string;
    };
    customerId?: string;
    lang?: string;
  }): Promise<{
    success: boolean;
    sessionId?: string;
    paymentId?: string;
    webUrl?: string;
    status: 'created' | 'rejected';
    rejectionReason?: string;
  }> {
    const requestId = `tabby_session_${Date.now()}`;

    try {
      logger.info(`[${requestId}] Creating Tabby checkout session`, {
        orderReferenceId: params.orderReferenceId,
        amount: params.amount,
        itemCount: params.items.length
      });

      const tabbyItems: TabbyItem[] = params.items.map(item => ({
        title: item.title,
        description: item.description,
        id: item.id,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        unit_price: this.formatAmount(item.unitPrice),
        discount_amount: '0.00',
        reference_id: item.referenceId,
        image_url: item.imageUrl,
        product_url: item.productUrl
      }));

      // Prepare buyer info with phone normalization
      const buyerPhone = params.buyer.phone.replace(/^\+966/, '').replace(/^966/, '').replace(/^0/, '');
      
      const sessionRequest: TabbySessionRequest = {
        payment: {
          amount: this.formatAmount(params.amount),
          currency: 'SAR',
          description: params.description,
          buyer: {
            phone: buyerPhone,
            email: params.buyer.email,
            name: params.buyer.name,
            dob: params.buyer.dob
          },
          buyer_history: {
            registered_since: params.buyerHistory?.registeredSince || new Date().toISOString(),
            loyalty_level: params.buyerHistory?.loyaltyLevel || 0,
            wishlist_count: 0,
            is_email_verified: params.buyerHistory?.isEmailVerified ?? true,
            is_phone_number_verified: params.buyerHistory?.isPhoneVerified ?? true
          },
          order: {
            tax_amount: '0.00',
            shipping_amount: '0.00',
            discount_amount: '0.00',
            updated_at: new Date().toISOString(),
            reference_id: params.orderReferenceId,
            items: tabbyItems
          },
          // order_history is required by Tabby API - empty array for new customers
          order_history: [],
          shipping_address: {
            city: params.shippingAddress.city,
            address: params.shippingAddress.address || params.shippingAddress.city,
            zip: params.shippingAddress.zip || '00000'
          },
          meta: {
            order_id: params.orderReferenceId,
            customer: params.customerId || 'guest'
          }
        },
        lang: params.lang || 'ar',
        merchant_code: this.config.merchantCode,
        merchant_urls: {
          success: `${this.config.frontendUrl}/payment/result?provider=tabby&status=success&merchant_order_id=${params.orderReferenceId}`,
          cancel: `${this.config.frontendUrl}/payment/result?provider=tabby&status=cancel&merchant_order_id=${params.orderReferenceId}`,
          failure: `${this.config.frontendUrl}/payment/result?provider=tabby&status=failure&merchant_order_id=${params.orderReferenceId}`
        }
      };

      logger.debug(`[${requestId}] Tabby session request body`, {
        request: JSON.stringify(sessionRequest, null, 2)
      });

      const response = await this.axiosInstance.post<TabbySessionResponse>(
        '/api/v2/checkout',
        sessionRequest
      );

      const sessionData = response.data;

      logger.info(`[${requestId}] Tabby session response`, {
        sessionId: sessionData.id,
        status: sessionData.status,
        hasInstallments: !!sessionData.configuration?.available_products?.installments?.length
      });

      if (sessionData.status === 'rejected') {
        const rejectionReason = 
          sessionData.configuration?.products?.installments?.rejection_reason ||
          sessionData.configuration?.available_products?.rejection_reason ||
          'Unknown rejection reason';

        logger.warn(`[${requestId}] Tabby session rejected`, {
          sessionId: sessionData.id,
          rejectionReason
        });

        return {
          success: false,
          sessionId: sessionData.id,
          status: 'rejected',
          rejectionReason
        };
      }

      // Check if installments are available
      const installments = sessionData.configuration?.available_products?.installments;
      if (!installments || installments.length === 0) {
        logger.error(`[${requestId}] No installment products available`, {
          sessionId: sessionData.id,
          configuration: sessionData.configuration
        });

        return {
          success: false,
          sessionId: sessionData.id,
          status: 'rejected',
          rejectionReason: 'No installment products available'
        };
      }

      // Get checkout URL from installments and payment ID from payment object
      const installment = installments[0];
      const paymentId = sessionData.payment?.id;
      const webUrl = installment.web_url;

      if (!webUrl) {
        logger.error(`[${requestId}] No checkout URL in response`, {
          sessionId: sessionData.id,
          installment
        });

        return {
          success: false,
          sessionId: sessionData.id,
          status: 'rejected',
          rejectionReason: 'No checkout URL available'
        };
      }

      logger.info(`[${requestId}] Tabby session created successfully`, {
        sessionId: sessionData.id,
        paymentId,
        webUrl
      });

      return {
        success: true,
        sessionId: sessionData.id,
        paymentId: paymentId || installment.payment_id, // Fallback to installment.payment_id if available
        webUrl,
        status: 'created'
      };

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to create Tabby session`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to create Tabby session: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Method 2: Get payment details
   * Endpoint: GET /api/v2/payments/{payment_id}
   * Use to verify status before capturing
   */
  async getPayment(paymentId: string): Promise<TabbyPaymentResponse> {
    const requestId = `tabby_get_payment_${Date.now()}`;

    try {
      logger.info(`[${requestId}] Getting Tabby payment details`, { paymentId });

      const response = await this.axiosInstance.get<TabbyPaymentResponse>(
        `/api/v2/payments/${paymentId}`
      );

      logger.info(`[${requestId}] Tabby payment details retrieved`, {
        paymentId,
        status: response.data.status,
        amount: response.data.amount
      });

      return response.data;

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to get Tabby payment`, {
        paymentId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to get Tabby payment: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Method 3: Capture payment
   * Endpoint: POST /api/v2/payments/{payment_id}/captures
   * Must capture the full amount - Tabby requires full capture
   * reference_id is required for idempotency
   */
  async capturePayment(params: {
    paymentId: string;
    amount: number;
    referenceId?: string;  // Idempotency key
    items?: Array<{
      title: string;
      description: string;
      id: string;
      sku: string;
      category: string;
      quantity: number;
      unitPrice: number;
      referenceId: string;
      imageUrl?: string;
      productUrl?: string;
    }>;
  }): Promise<TabbyCaptureResponse> {
    const requestId = `tabby_capture_${Date.now()}`;
    const idempotencyKey = params.referenceId || `capture_${params.paymentId}_${Date.now()}`;

    try {
      logger.info(`[${requestId}] Capturing Tabby payment`, {
        paymentId: params.paymentId,
        amount: params.amount,
        referenceId: idempotencyKey
      });

      const tabbyItems: TabbyItem[] | undefined = params.items?.map(item => ({
        title: item.title,
        description: item.description,
        id: item.id,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        unit_price: this.formatAmount(item.unitPrice),
        discount_amount: '0.00',
        reference_id: item.referenceId,
        image_url: item.imageUrl,
        product_url: item.productUrl
      }));

      const captureRequest: TabbyCaptureRequest = {
        amount: this.formatAmount(params.amount),
        reference_id: idempotencyKey,
        tax_amount: '0.00',
        shipping_amount: '0.00',
        discount_amount: '0.00',
        items: tabbyItems
      };

      const response = await this.axiosInstance.post<TabbyCaptureResponse>(
        `/api/v2/payments/${params.paymentId}/captures`,
        captureRequest
      );

      logger.info(`[${requestId}] Tabby payment captured successfully`, {
        paymentId: params.paymentId,
        captureId: response.data.id,
        amount: response.data.amount
      });

      return response.data;

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to capture Tabby payment`, {
        paymentId: params.paymentId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to capture Tabby payment: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Method 4: Refund payment
   * Endpoint: POST /api/v2/payments/{payment_id}/refunds
   * Only callable after status is CLOSED
   * reference_id is required for idempotency
   */
  async refundPayment(params: {
    paymentId: string;
    amount: number;
    reason?: string;
    referenceId?: string;  // Idempotency key
  }): Promise<TabbyRefundResponse> {
    const requestId = `tabby_refund_${Date.now()}`;
    const idempotencyKey = params.referenceId || `refund_${params.paymentId}_${Date.now()}`;

    try {
      logger.info(`[${requestId}] Refunding Tabby payment`, {
        paymentId: params.paymentId,
        amount: params.amount,
        reason: params.reason,
        referenceId: idempotencyKey
      });

      const refundRequest: TabbyRefundRequest = {
        amount: this.formatAmount(params.amount),
        reference_id: idempotencyKey,
        reason: params.reason
      };

      const response = await this.axiosInstance.post<TabbyRefundResponse>(
        `/api/v2/payments/${params.paymentId}/refunds`,
        refundRequest
      );

      logger.info(`[${requestId}] Tabby payment refunded successfully`, {
        paymentId: params.paymentId,
        refundId: response.data.id,
        amount: response.data.amount
      });

      return response.data;

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to refund Tabby payment`, {
        paymentId: params.paymentId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to refund Tabby payment: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Method 5: Close payment
   * Endpoint: POST /api/v2/payments/{payment_id}/close
   * Use to close a payment without full capture (partial order cancellation)
   * If order is fully cancelled, close without capturing - customer will be refunded
   */
  async closePayment(paymentId: string): Promise<TabbyPaymentResponse> {
    const requestId = `tabby_close_${Date.now()}`;

    try {
      logger.info(`[${requestId}] Closing Tabby payment`, { paymentId });

      const response = await this.axiosInstance.post<TabbyPaymentResponse>(
        `/api/v2/payments/${paymentId}/close`
      );

      logger.info(`[${requestId}] Tabby payment closed successfully`, {
        paymentId,
        status: response.data.status
      });

      return response.data;

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to close Tabby payment`, {
        paymentId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to close Tabby payment: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get merchant code for verification
   */
  getMerchantCode(): string {
    return this.config.merchantCode;
  }

  /**
   * Get configuration for debugging
   */
  getConfig(): { apiUrl: string; merchantCode: string; frontendUrl: string; backendUrl: string } {
    return {
      apiUrl: this.config.apiUrl,
      merchantCode: this.config.merchantCode,
      frontendUrl: this.config.frontendUrl,
      backendUrl: this.config.backendUrl
    };
  }
}

export const tabbyService = {
  get instance() {
    return getTabbyService();
  },
  createSession: (...args: Parameters<TabbyService['createSession']>) =>
    getTabbyService().createSession(...args),
  getPayment: (...args: Parameters<TabbyService['getPayment']>) =>
    getTabbyService().getPayment(...args),
  capturePayment: (...args: Parameters<TabbyService['capturePayment']>) =>
    getTabbyService().capturePayment(...args),
  refundPayment: (...args: Parameters<TabbyService['refundPayment']>) =>
    getTabbyService().refundPayment(...args),
  closePayment: (...args: Parameters<TabbyService['closePayment']>) =>
    getTabbyService().closePayment(...args),
  getMerchantCode: () => getTabbyService().getMerchantCode(),
  getConfig: () => getTabbyService().getConfig()
};

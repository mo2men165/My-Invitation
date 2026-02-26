// server/src/services/tamaraService.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../config/logger';
import {
  TamaraConfig,
  TamaraCheckoutRequest,
  TamaraCheckoutResponse,
  TamaraAuthoriseResponse,
  TamaraCaptureRequest,
  TamaraCaptureResponse,
  TamaraCancelRequest,
  TamaraCancelResponse,
  TamaraRefundRequest,
  TamaraRefundResponse,
  TamaraOrderDetails,
  TamaraItem,
  TamaraAmount,
  TamaraErrorResponse
} from '../types/tamara';

let tamaraServiceInstance: TamaraService | null = null;

export function getTamaraService(): TamaraService {
  if (!tamaraServiceInstance) {
    tamaraServiceInstance = new TamaraService();
    logger.info('TamaraService initialized (lazy initialization)');
  }
  return tamaraServiceInstance;
}

export class TamaraService {
  private config: TamaraConfig;
  private axiosInstance: AxiosInstance;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.config = {
      apiToken: process.env.TAMARA_API_TOKEN!,
      notificationToken: process.env.TAMARA_NOTIFICATION_TOKEN!,
      publicKey: process.env.TAMARA_PUBLIC_KEY!,
      apiUrl: process.env.TAMARA_API_URL || 'https://api-sandbox.tamara.co',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      backendUrl: isProduction 
        ? (process.env.BACKEND_URL_PRODUCTION || process.env.BACKEND_URL || 'http://localhost:5000')
        : (process.env.BACKEND_URL || 'http://localhost:5000')
    };

    this.validateConfig();

    this.axiosInstance = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<TamaraErrorResponse>) => {
        logger.error('Tamara API Error:', {
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
    const requiredFields: (keyof TamaraConfig)[] = ['apiToken', 'notificationToken', 'apiUrl'];
    const missingFields = requiredFields.filter(field => !this.config[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required Tamara configuration: ${missingFields.join(', ')}`);
    }
  }

  private createAmount(amount: number): TamaraAmount {
    return { amount, currency: 'SAR' };
  }

  private createZeroAmount(): TamaraAmount {
    return { amount: 0, currency: 'SAR' };
  }

  /**
   * Method 1: Create a checkout session
   * Endpoint: POST /checkout
   * Returns checkout_url to redirect the customer
   */
  async createCheckoutSession(params: {
    orderReferenceId: string;
    orderNumber: string;
    totalAmount: number;
    items: Array<{
      name: string;
      referenceId: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
    }>;
    consumer: {
      email: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
    };
    billingAddress: {
      city: string;
      firstName: string;
      lastName: string;
      line1: string;
      phoneNumber: string;
      region: string;
    };
    description: string;
    instalments?: number;
    locale?: string;
  }): Promise<TamaraCheckoutResponse> {
    const requestId = `tamara_checkout_${Date.now()}`;
    
    try {
      logger.info(`[${requestId}] Creating Tamara checkout session`, {
        orderReferenceId: params.orderReferenceId,
        totalAmount: params.totalAmount,
        itemCount: params.items.length
      });

      const tamaraItems: TamaraItem[] = params.items.map(item => ({
        name: item.name,
        type: 'Digital',
        reference_id: item.referenceId,
        sku: item.sku,
        quantity: item.quantity,
        discount_amount: this.createZeroAmount(),
        tax_amount: this.createZeroAmount(),
        unit_price: this.createAmount(item.unitPrice),
        total_amount: this.createAmount(item.totalAmount)
      }));

      const checkoutRequest: TamaraCheckoutRequest = {
        total_amount: this.createAmount(params.totalAmount),
        shipping_amount: this.createZeroAmount(),
        tax_amount: this.createZeroAmount(),
        order_reference_id: params.orderReferenceId,
        order_number: params.orderNumber,
        items: tamaraItems,
        consumer: {
          email: params.consumer.email,
          first_name: params.consumer.firstName,
          last_name: params.consumer.lastName,
          phone_number: params.consumer.phoneNumber
        },
        country_code: 'SA',
        description: params.description,
        merchant_url: {
          cancel: `${this.config.frontendUrl}/payment/cancel?provider=tamara`,
          failure: `${this.config.frontendUrl}/payment/failure?provider=tamara`,
          success: `${this.config.frontendUrl}/payment/success?provider=tamara`,
          notification: `${this.config.backendUrl}/api/payments/tamara/webhook`
        },
        payment_type: 'PAY_BY_INSTALMENTS',
        instalments: params.instalments || 3,
        billing_address: {
          city: params.billingAddress.city,
          country_code: 'SA',
          first_name: params.billingAddress.firstName,
          last_name: params.billingAddress.lastName,
          line1: params.billingAddress.line1,
          phone_number: params.billingAddress.phoneNumber,
          region: params.billingAddress.region
        },
        locale: params.locale || 'ar_SA',
        is_mobile: false,
        platform: 'web'
      };

      logger.debug(`[${requestId}] Tamara checkout request body`, { 
        request: JSON.stringify(checkoutRequest, null, 2) 
      });

      const response = await this.axiosInstance.post<TamaraCheckoutResponse>(
        '/checkout',
        checkoutRequest
      );

      logger.info(`[${requestId}] Tamara checkout session created successfully`, {
        orderId: response.data.order_id,
        checkoutId: response.data.checkout_id,
        status: response.data.status
      });

      return response.data;

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to create Tamara checkout session`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to create Tamara checkout session: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Method 2: Authorise an order
   * Endpoint: POST /orders/{order_id}/authorise
   * Call this ONLY after receiving the order_approved webhook
   */
  async authoriseOrder(orderId: string): Promise<TamaraAuthoriseResponse> {
    const requestId = `tamara_authorise_${Date.now()}`;

    try {
      logger.info(`[${requestId}] Authorising Tamara order`, { orderId });

      const response = await this.axiosInstance.post<TamaraAuthoriseResponse>(
        `/orders/${orderId}/authorise`
      );

      logger.info(`[${requestId}] Tamara order authorised successfully`, {
        orderId,
        status: response.data.status,
        captureId: response.data.capture_id,
        authorizedAmount: response.data.authorized_amount
      });

      return response.data;

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to authorise Tamara order`, {
        orderId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to authorise Tamara order: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Method 3: Capture an order
   * Endpoint: POST /payments/capture
   * Call this after order fulfillment/delivery within 21 days of authorisation
   */
  async captureOrder(params: {
    orderId: string;
    totalAmount: number;
    items: Array<{
      name: string;
      referenceId: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
    }>;
  }): Promise<TamaraCaptureResponse> {
    const requestId = `tamara_capture_${Date.now()}`;

    try {
      logger.info(`[${requestId}] Capturing Tamara order`, {
        orderId: params.orderId,
        totalAmount: params.totalAmount
      });

      const tamaraItems: TamaraItem[] = params.items.map(item => ({
        name: item.name,
        type: 'Digital',
        reference_id: item.referenceId,
        sku: item.sku,
        quantity: item.quantity,
        discount_amount: this.createZeroAmount(),
        tax_amount: this.createZeroAmount(),
        unit_price: this.createAmount(item.unitPrice),
        total_amount: this.createAmount(item.totalAmount)
      }));

      const captureRequest: TamaraCaptureRequest = {
        order_id: params.orderId,
        total_amount: this.createAmount(params.totalAmount),
        items: tamaraItems,
        shipping_amount: this.createZeroAmount(),
        tax_amount: this.createZeroAmount(),
        discount_amount: this.createZeroAmount()
      };

      const response = await this.axiosInstance.post<TamaraCaptureResponse>(
        '/payments/capture',
        captureRequest
      );

      logger.info(`[${requestId}] Tamara order captured successfully`, {
        orderId: params.orderId,
        captureId: response.data.capture_id,
        status: response.data.status
      });

      return response.data;

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to capture Tamara order`, {
        orderId: params.orderId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to capture Tamara order: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Method 4: Cancel an order
   * Endpoint: POST /orders/{order_id}/cancel
   * Only callable when order status is 'authorised'
   */
  async cancelOrder(params: {
    orderId: string;
    totalAmount: number;
    items: Array<{
      name: string;
      referenceId: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
    }>;
  }): Promise<TamaraCancelResponse> {
    const requestId = `tamara_cancel_${Date.now()}`;

    try {
      logger.info(`[${requestId}] Cancelling Tamara order`, {
        orderId: params.orderId,
        totalAmount: params.totalAmount
      });

      const tamaraItems: TamaraItem[] = params.items.map(item => ({
        name: item.name,
        type: 'Digital',
        reference_id: item.referenceId,
        sku: item.sku,
        quantity: item.quantity,
        discount_amount: this.createZeroAmount(),
        tax_amount: this.createZeroAmount(),
        unit_price: this.createAmount(item.unitPrice),
        total_amount: this.createAmount(item.totalAmount)
      }));

      const cancelRequest: TamaraCancelRequest = {
        total_amount: this.createAmount(params.totalAmount),
        shipping_amount: this.createZeroAmount(),
        tax_amount: this.createZeroAmount(),
        discount_amount: this.createZeroAmount(),
        items: tamaraItems
      };

      const response = await this.axiosInstance.post<TamaraCancelResponse>(
        `/orders/${params.orderId}/cancel`,
        cancelRequest
      );

      logger.info(`[${requestId}] Tamara order cancelled successfully`, {
        orderId: params.orderId,
        cancelId: response.data.cancel_id,
        status: response.data.status
      });

      return response.data;

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to cancel Tamara order`, {
        orderId: params.orderId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to cancel Tamara order: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Method 5: Refund an order
   * Endpoint: POST /payments/simplified-refund/{order_id}
   * Only callable after 'fully_captured' status
   */
  async refundOrder(params: {
    orderId: string;
    totalAmount: number;
    comment: string;
  }): Promise<TamaraRefundResponse> {
    const requestId = `tamara_refund_${Date.now()}`;

    try {
      logger.info(`[${requestId}] Refunding Tamara order`, {
        orderId: params.orderId,
        totalAmount: params.totalAmount,
        comment: params.comment
      });

      const refundRequest: TamaraRefundRequest = {
        total_amount: this.createAmount(params.totalAmount),
        comment: params.comment
      };

      const response = await this.axiosInstance.post<TamaraRefundResponse>(
        `/payments/simplified-refund/${params.orderId}`,
        refundRequest
      );

      logger.info(`[${requestId}] Tamara order refunded successfully`, {
        orderId: params.orderId,
        refundId: response.data.refund_id,
        status: response.data.status
      });

      return response.data;

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to refund Tamara order`, {
        orderId: params.orderId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to refund Tamara order: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Method 6: Get order details
   * Endpoint: GET /merchants/orders/{order_id}
   * Use this to manually check order status if webhook was not received
   */
  async getOrderDetails(orderId: string): Promise<TamaraOrderDetails> {
    const requestId = `tamara_get_order_${Date.now()}`;

    try {
      logger.info(`[${requestId}] Getting Tamara order details`, { orderId });

      const response = await this.axiosInstance.get<TamaraOrderDetails>(
        `/merchants/orders/${orderId}`
      );

      logger.info(`[${requestId}] Tamara order details retrieved successfully`, {
        orderId,
        status: response.data.status,
        orderReferenceId: response.data.order_reference_id
      });

      return response.data;

    } catch (error: any) {
      logger.error(`[${requestId}] Failed to get Tamara order details`, {
        orderId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to get Tamara order details: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get the notification token for webhook validation
   */
  getNotificationToken(): string {
    return this.config.notificationToken;
  }

  /**
   * Get configuration for debugging
   */
  getConfig(): { apiUrl: string; frontendUrl: string; backendUrl: string } {
    return {
      apiUrl: this.config.apiUrl,
      frontendUrl: this.config.frontendUrl,
      backendUrl: this.config.backendUrl
    };
  }
}

export const tamaraService = {
  get instance() {
    return getTamaraService();
  },
  createCheckoutSession: (...args: Parameters<TamaraService['createCheckoutSession']>) => 
    getTamaraService().createCheckoutSession(...args),
  authoriseOrder: (...args: Parameters<TamaraService['authoriseOrder']>) => 
    getTamaraService().authoriseOrder(...args),
  captureOrder: (...args: Parameters<TamaraService['captureOrder']>) => 
    getTamaraService().captureOrder(...args),
  cancelOrder: (...args: Parameters<TamaraService['cancelOrder']>) => 
    getTamaraService().cancelOrder(...args),
  refundOrder: (...args: Parameters<TamaraService['refundOrder']>) => 
    getTamaraService().refundOrder(...args),
  getOrderDetails: (...args: Parameters<TamaraService['getOrderDetails']>) => 
    getTamaraService().getOrderDetails(...args),
  getNotificationToken: () => getTamaraService().getNotificationToken(),
  getConfig: () => getTamaraService().getConfig()
};

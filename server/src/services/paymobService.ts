// server/src/services/paymobService.ts
import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { logger } from '../config/logger';
import {
  PaymobAuthResponse,
  PaymobOrderRequest,
  PaymobOrderResponse,
  PaymobPaymentKeyRequest,
  PaymobPaymentKeyResponse,
  PaymobWebhookData,
  PaymobErrorResponse,
  PaymobConfig
} from '../types/paymob';

export class PaymobService {
  private config: PaymobConfig;
  private authToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      apiKey: process.env.PAYMOB_API_KEY!,
      publicKey: process.env.PAYMOB_PUBLIC_KEY!,
      secretKey: process.env.PAYMOB_SECRET_KEY!,
      integrationId: parseInt(process.env.PAYMOB_INTEGRATION_ID!),
      iframeId: parseInt(process.env.PAYMOB_IFRAME_ID!),
      baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api',
      currency: process.env.PAYMOB_CURRENCY || 'SAR',
      language: process.env.PAYMOB_LANGUAGE || 'ar',
      debugMode: process.env.PAYMOB_DEBUG_MODE === 'true',
      webhookUrl: process.env.PAYMOB_WEBHOOK_URL || 'http://localhost:5000/api/payment/paymob/webhook',
      returnUrl: process.env.PAYMOB_RETURN_URL || 'http://localhost:3000/payment/success',
      cancelUrl: process.env.PAYMOB_CANCEL_URL || 'http://localhost:3000/payment/cancel'
    };

    // Debug logging for configuration (without exposing sensitive data)
    logger.info('Paymob Configuration Check:', {
      integrationId: this.config.integrationId,
      iframeId: this.config.iframeId,
      baseUrl: this.config.baseUrl,
      currency: this.config.currency,
      debugMode: this.config.debugMode,
      hasApiKey: !!this.config.apiKey,
      hasSecretKey: !!this.config.secretKey,
      hasPublicKey: !!this.config.publicKey,
      apiKeyLength: this.config.apiKey?.length || 0,
      secretKeyLength: this.config.secretKey?.length || 0
    });

    this.validateConfig();
  }

  private validateConfig(): void {
    const requiredFields = ['apiKey', 'secretKey', 'integrationId', 'iframeId'];
    const missingFields = requiredFields.filter(field => !this.config[field as keyof PaymobConfig]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required Paymob configuration: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Authenticate with Paymob API and get auth token
   */
  private async authenticate(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.authToken && Date.now() < this.tokenExpiry) {
        return this.authToken;
      }

      logger.info('Attempting Paymob authentication...', {
        baseUrl: this.config.baseUrl,
        apiKeyPrefix: this.config.apiKey?.substring(0, 10) + '...',
        apiKeyLength: this.config.apiKey?.length
      });

      const response: AxiosResponse<PaymobAuthResponse> = await axios.post(
        `${this.config.baseUrl}/auth/tokens`,
        {
          api_key: this.config.apiKey
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        // Set token expiry to 23 hours (Paymob tokens expire in 24 hours)
        this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
        
        logger.info('Paymob authentication successful');
        return this.authToken;
      } else {
        throw new Error('Invalid authentication response from Paymob');
      }
    } catch (error: any) {
      logger.error('Paymob authentication failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: `${this.config.baseUrl}/auth/tokens`
      });
      throw new Error(`Paymob authentication failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Create a payment order in Paymob
   */
  async createOrder(orderData: {
    userId: string;
    amount: number;
    items: Array<{
      name: string;
      description: string;
      quantity: number;
      price: number;
    }>;
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      city: string;
    };
  }): Promise<PaymobOrderResponse> {
    try {
      const authToken = await this.authenticate();
      
      // Debug logging
      logger.info(`Creating Paymob order with data:`, {
        userId: orderData.userId,
        amount: orderData.amount,
        amount_cents: Math.round(orderData.amount * 100),
        items: orderData.items.map(item => ({
          name: item.name,
          price: item.price,
          amount_cents: Math.round(item.price * 100),
          quantity: item.quantity
        }))
      });

      const orderRequest: PaymobOrderRequest = {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(orderData.amount * 100), // Convert to cents
        currency: this.config.currency,
        merchant_order_id: `ORDER_${orderData.userId}_${Date.now()}`,
        items: orderData.items.map(item => ({
          name: item.name,
          amount_cents: Math.round(item.price * 100),
          description: item.description,
          quantity: item.quantity
        })),
        shipping_data: {
          first_name: orderData.customerInfo.firstName,
          last_name: orderData.customerInfo.lastName,
          email: orderData.customerInfo.email,
          phone_number: orderData.customerInfo.phone,
          city: orderData.customerInfo.city,
          country: 'SA'
        }
      };

      const response: AxiosResponse<PaymobOrderResponse> = await axios.post(
        `${this.config.baseUrl}/ecommerce/orders`,
        orderRequest,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      logger.info(`Paymob order created successfully: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to create Paymob order:', error.response?.data || error.message);
      throw new Error(`Failed to create Paymob order: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Generate payment key for iframe integration
   */
  async generatePaymentKey(orderId: number, amount: number, customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
  }): Promise<PaymobPaymentKeyResponse> {
    try {
      const authToken = await this.authenticate();

      // Debug logging
      logger.info(`Generating payment key for order ${orderId} with amount:`, {
        amount: amount,
        amount_cents: Math.round(amount * 100)
      });

      const paymentKeyRequest: PaymobPaymentKeyRequest = {
        auth_token: authToken,
        amount_cents: Math.round(amount * 100), // Convert to cents
        expiration: 3600, // 1 hour
        order_id: orderId,
        billing_data: {
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          email: customerInfo.email,
          phone_number: customerInfo.phone,
          city: customerInfo.city,
          country: 'SA',
          street: 'N/A',
          building: 'N/A',
          floor: 'N/A',
          apartment: 'N/A',
          postal_code: 'N/A',
          state: 'N/A'
        },
        currency: this.config.currency,
        integration_id: this.config.integrationId,
        lock_order_when_paid: true
      };

      const response: AxiosResponse<PaymobPaymentKeyResponse> = await axios.post(
        `${this.config.baseUrl}/acceptance/payment_keys`,
        paymentKeyRequest,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      logger.info(`Payment key generated successfully for order: ${orderId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to generate payment key:', error.response?.data || error.message);
      throw new Error(`Failed to generate payment key: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(data: any, signature: string): boolean {
    try {
      const hmacKey = process.env.PAYMOB_HMAC_KEY || this.config.secretKey;
      
      if (!hmacKey) {
        logger.warn('No HMAC key configured, skipping verification');
        return true; // For testing
      }
  
      // Paymob's required concatenation format - NOT JSON.stringify
      const orderedData = {
        amount_cents: data.obj.amount_cents,
        created_at: data.obj.created_at,
        currency: data.obj.currency,
        error_occured: data.obj.error_occured,
        has_parent_transaction: data.obj.has_parent_transaction,
        id: data.obj.id,
        integration_id: data.obj.integration_id,
        is_3d_secure: data.obj.is_3d_secure,
        is_auth: data.obj.is_auth,
        is_capture: data.obj.is_capture,
        is_refunded: data.obj.is_refunded,
        is_standalone_payment: data.obj.is_standalone_payment,
        is_voided: data.obj.is_voided,
        order: data.obj.order.id,
        owner: data.obj.owner,
        pending: data.obj.pending,
        source_data_pan: data.obj.source_data_pan,
        source_data_sub_type: data.obj.source_data_sub_type,
        source_data_type: data.obj.source_data_type,
        success: data.obj.success
      };
  
      const concatenatedString = Object.values(orderedData).join('');
      const calculatedSignature = crypto.createHmac('sha512', hmacKey)
        .update(concatenatedString)
        .digest('hex');
      
      logger.info('HMAC Verification Details:', {
        receivedSignature: signature,
        calculatedSignature: calculatedSignature,
        match: calculatedSignature === signature,
        concatenatedString: concatenatedString.substring(0, 100) + '...'
      });
      
      return calculatedSignature === signature;
    } catch (error: any) {
      logger.error('Error verifying webhook signature:', error.message);
      return false;
    }
  }

  /**
   * Process webhook data
   */
  async processWebhook(webhookData: PaymobWebhookData): Promise<{
    success: boolean;
    orderId?: string;
    transactionId?: string;
    amount?: number;
    status?: string;
    error?: string;
  }> {
    try {
      logger.info('Processing Paymob webhook:', {
        type: webhookData.type,
        transactionId: webhookData.obj.id,
        orderId: webhookData.obj.merchant_order_id,
        amount: webhookData.obj.amount_cents / 100
      });

      // Extract relevant information
      const transactionId = webhookData.obj.id.toString();
      const orderId = webhookData.obj.merchant_order_id;
      const amount = webhookData.obj.amount_cents / 100; // Convert from cents
      const success = webhookData.obj.success;
      const pending = webhookData.obj.pending;

      let status = 'pending';
      if (success && !pending) {
        status = 'success';
      } else if (!success) {
        status = 'failed';
      }

      return {
        success: true,
        orderId,
        transactionId,
        amount,
        status
      };
    } catch (error: any) {
      logger.error('Error processing Paymob webhook:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get iframe URL for payment
   */
  getIframeUrl(paymentKey: string): string {
    return `${this.config.baseUrl}/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentKey}`;
  }

  /**
   * Get payment status from Paymob
   */
  async getPaymentStatus(transactionId: string): Promise<{
    success: boolean;
    status?: string;
    amount?: number;
    error?: string;
  }> {
    try {
      const authToken = await this.authenticate();
      
      const response = await axios.get(
        `${this.config.baseUrl}/acceptance/transactions/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          timeout: 10000
        }
      );

      const transaction = response.data;
      const status = transaction.success ? 'success' : 'failed';

      return {
        success: true,
        status,
        amount: transaction.amount_cents / 100
      };
    } catch (error: any) {
      logger.error('Failed to get payment status:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Get configuration for frontend
   */
  getConfig(): {
    iframeId: number;
    currency: string;
    language: string;
    returnUrl: string;
    cancelUrl: string;
  } {
    return {
      iframeId: this.config.iframeId,
      currency: this.config.currency,
      language: this.config.language,
      returnUrl: this.config.returnUrl,
      cancelUrl: this.config.cancelUrl
    };
  }
}

// Export singleton instance
export const paymobService = new PaymobService();

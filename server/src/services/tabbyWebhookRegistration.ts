// server/src/services/tabbyWebhookRegistration.ts
/**
 * Tabby Webhook Registration
 * 
 * IMPORTANT: Tabby webhooks must be registered ONCE per merchant_code.
 * This is NOT done automatically in serverless environments.
 * 
 * To register your webhook:
 * 1. Call POST /api/admin/tabby/register-webhook (admin-only endpoint)
 * 2. Or run: curl -X POST https://your-backend.com/api/admin/tabby/register-webhook
 * 3. Or use the Tabby merchant dashboard
 * 
 * The webhook URL will be: ${BACKEND_URL}/api/payment/tabby/webhook
 */

import axios from 'axios';
import { logger } from '../config/logger';
import {
  TabbyWebhookRegistrationRequest,
  TabbyWebhookRegistrationResponse
} from '../types/tabby';

/**
 * Register webhook with Tabby API
 * This must be called once per merchant_code
 * The is_test: true flag is required to receive webhooks when using test keys
 * 
 * NOTE: In serverless, call this manually via admin endpoint, not on every request
 */
export async function registerTabbyWebhook(): Promise<{
  success: boolean;
  message: string;
  webhookId?: string;
  webhookUrl?: string;
}> {
  const secretKey = process.env.TABBY_SECRET_KEY;
  const merchantCode = process.env.TABBY_MERCHANT_CODE || 'TWS';
  const apiUrl = process.env.TABBY_API_URL || 'https://api.tabby.ai';
  const isProduction = process.env.NODE_ENV === 'production';
  const backendUrl = isProduction 
    ? (process.env.BACKEND_URL_PRODUCTION || process.env.BACKEND_URL || 'http://localhost:5000')
    : (process.env.BACKEND_URL || 'http://localhost:5000');
  const isTest = secretKey?.startsWith('sk_test_') ?? true;

  if (!secretKey) {
    logger.error('TABBY_SECRET_KEY not configured');
    return {
      success: false,
      message: 'TABBY_SECRET_KEY not configured'
    };
  }

  if (!backendUrl || backendUrl.includes('localhost')) {
    return {
      success: false,
      message: 'BACKEND_URL must be a public URL for webhooks'
    };
  }

  const webhookUrl = `${backendUrl}/api/payment/tabby/webhook`;

  try {
    logger.info('Registering Tabby webhook', {
      webhookUrl,
      merchantCode,
      isTest
    });

    const registrationRequest: TabbyWebhookRegistrationRequest = {
      url: webhookUrl
    };

    const response = await axios.post<TabbyWebhookRegistrationResponse>(
      `${apiUrl}/api/v1/webhooks`,
      registrationRequest,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          'X-Merchant-Code': merchantCode
        },
        timeout: 15000
      }
    );

    logger.info('Tabby webhook registered successfully', {
      webhookId: response.data.id,
      webhookUrl: response.data.url,
      merchantCode: response.data.merchant_code,
      isTest: response.data.is_test,
      createdAt: response.data.created_at
    });

    return {
      success: true,
      message: 'Webhook registered successfully',
      webhookId: response.data.id,
      webhookUrl: response.data.url
    };

  } catch (error: any) {
    // If webhook already exists, that's fine
    if (error.response?.status === 409 || 
        error.response?.data?.error?.includes('already exists') ||
        error.response?.data?.error?.includes('duplicate')) {
      logger.info('Tabby webhook already registered with Tabby', {
        webhookUrl,
        merchantCode
      });
      return {
        success: true,
        message: 'Webhook already registered',
        webhookUrl
      };
    }

    logger.error('Failed to register Tabby webhook', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      webhookUrl,
      merchantCode
    });

    return {
      success: false,
      message: `Failed to register webhook: ${error.response?.data?.error || error.message}`
    };
  }
}

/**
 * Initialize Tabby webhook registration on server startup
 * Only used in non-serverless environments (local development)
 * In serverless (Vercel), use the admin endpoint instead
 */
export async function initializeTabbyWebhook(): Promise<void> {
  // Skip in serverless environments
  if (process.env.VERCEL) {
    logger.info('Tabby webhook auto-registration skipped in Vercel (use admin endpoint)');
    return;
  }

  // Only register if we have the required configuration
  if (!process.env.TABBY_SECRET_KEY) {
    logger.warn('Tabby webhook registration skipped - TABBY_SECRET_KEY not configured');
    return;
  }

  if (!process.env.BACKEND_URL || process.env.BACKEND_URL.includes('localhost')) {
    logger.warn('Tabby webhook registration skipped - BACKEND_URL is localhost');
    return;
  }

  try {
    const result = await registerTabbyWebhook();
    if (!result.success) {
      logger.warn('Tabby webhook registration failed:', result.message);
    }
  } catch (error: any) {
    logger.error('Error during Tabby webhook initialization', {
      error: error.message
    });
  }
}

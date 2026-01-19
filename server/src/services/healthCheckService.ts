// server/src/services/healthCheckService.ts
import axios, { AxiosError } from 'axios';
import { logger } from '../config/logger';
import { emailService } from './emailService';

const HEALTH_CHECK_INTERVAL = 3 * 60 * 1000; // 3 minutes
const REQUEST_TIMEOUT = 60 * 1000; // 1 minute
const NOTIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown between notifications

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services?: {
    eventStatusChecker?: boolean;
  };
}

class HealthCheckService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastNotificationTime: number = 0;
  private isChecking: boolean = false;
  private baseUrl: string;

  constructor() {
    // Get the server URL from environment or default to localhost
    // For self-ping, we always use localhost/http since we're pinging ourselves
    const port = process.env.PORT || 5000;
    // Use SERVER_URL if provided, otherwise use localhost
    const host = process.env.SERVER_URL || `localhost:${port}`;
    // For self-ping, always use http (not https) since we're on the same server
    this.baseUrl = host.startsWith('http') ? host : `http://${host}`;
    
    logger.info('HealthCheckService initialized', { baseUrl: this.baseUrl });
  }

  /**
   * Start the health check service
   * This service will run continuously and never stop until explicitly stopped
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('HealthCheckService is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🏥 Starting Health Check Service - will run continuously every 3 minutes');

    // Run initial check immediately
    this.checkHealth().catch((error) => {
      logger.error('Initial health check failed, will retry on next interval', { error: error.message });
    });

    // Set up interval for periodic checks
    // Using setInterval ensures it runs continuously, even if individual checks fail
    this.intervalId = setInterval(() => {
      if (!this.isRunning) {
        // If somehow stopped, restart it
        logger.warn('Health check service was stopped, restarting...');
        this.isRunning = true;
      }
      
      this.checkHealth().catch((error) => {
        // Log error but continue running - never stop the service
        logger.error('Health check failed, will retry on next interval', { error: error.message });
      });
    }, HEALTH_CHECK_INTERVAL);

    // Ensure the service keeps running even if there are unhandled errors
    // This prevents the service from stopping due to unexpected errors
    logger.info('✅ Health Check Service started and will run continuously to keep server active');
  }

  /**
   * Stop the health check service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('🏥 Health Check Service stopped');
  }

  /**
   * Check if the service is running
   */
  isHealthCheckerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Perform a health check
   * This method makes an HTTP request to the /health endpoint
   * The HTTP request itself counts as server activity, keeping the server awake
   */
  private async checkHealth(): Promise<void> {
    // Prevent concurrent checks
    if (this.isChecking) {
      logger.debug('Health check already in progress, skipping');
      return;
    }

    this.isChecking = true;
    const startTime = Date.now();

    try {
      logger.debug('Performing health check', { url: `${this.baseUrl}/health` });

      const response = await axios.get<HealthCheckResponse>(`${this.baseUrl}/health`, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseTime = Date.now() - startTime;

      // Check if status is OK
      if (response.data.status !== 'OK') {
        await this.sendNotification({
          reason: 'status_not_ok',
          message: `Server status is not OK. Received status: ${response.data.status || 'unknown'}`,
          responseTime,
          statusCode: response.status,
        });
        return;
      }

      // Health check passed
      logger.debug('Health check passed', {
        status: response.data.status,
        responseTime: `${responseTime}ms`,
        timestamp: response.data.timestamp,
      });

    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      if (error.code === 'ECONNABORTED' || responseTime >= REQUEST_TIMEOUT) {
        // Timeout error
        await this.sendNotification({
          reason: 'timeout',
          message: `Response timeout exceeded (${REQUEST_TIMEOUT / 1000} seconds)`,
          responseTime,
        });
      } else if (error.response) {
        // HTTP error response
        await this.sendNotification({
          reason: 'status_not_ok',
          message: `Server returned error: HTTP ${error.response.status} - ${error.response.statusText}`,
          responseTime,
          statusCode: error.response.status,
        });
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        // Connection error
        await this.sendNotification({
          reason: 'error',
          message: `Failed to connect to server: ${error.message}`,
          responseTime,
          error: error.message,
        });
      } else {
        // Other errors
        await this.sendNotification({
          reason: 'error',
          message: `Unexpected error during health check: ${error.message}`,
          responseTime,
          error: error.message,
        });
      }

      logger.error('Health check failed', {
        error: error.message,
        responseTime: `${responseTime}ms`,
        code: error.code,
      });
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Send email notification when health check fails
   */
  private async sendNotification(data: {
    reason: 'status_not_ok' | 'timeout' | 'error';
    message: string;
    responseTime?: number;
    statusCode?: number;
    error?: string;
  }): Promise<void> {
    // Cooldown check - don't send notifications too frequently
    const now = Date.now();
    if (now - this.lastNotificationTime < NOTIFICATION_COOLDOWN) {
      logger.debug('Skipping notification due to cooldown', {
        timeSinceLastNotification: `${(now - this.lastNotificationTime) / 1000}s`,
      });
      return;
    }

    try {
      logger.warn('Sending health check failure notification', data);

      const reasonText = data.reason === 'status_not_ok' 
        ? 'Server status is not OK' 
        : data.reason === 'timeout' 
        ? 'Response timeout exceeded' 
        : 'Connection error';

      const subject = '⚠️ Warning: Server Health Check Failed';
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="ltr" lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Health Check Warning</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #856404; margin-top: 0;">⚠️ Warning: Server Health Check Failed</h2>
          </div>
          
          <div style="background-color: #f8f9fa; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #495057;">Issue Details:</h3>
            <p><strong>Reason:</strong> ${reasonText}</p>
            <p><strong>Message:</strong> ${data.message}</p>
            ${data.responseTime ? `<p><strong>Response Time:</strong> ${data.responseTime}ms</p>` : ''}
            ${data.statusCode ? `<p><strong>Status Code:</strong> ${data.statusCode}</p>` : ''}
            ${data.error ? `<p><strong>Error:</strong> ${data.error}</p>` : ''}
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit'
            })}</p>
          </div>
          
          <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin-top: 20px;">
            <p style="margin: 0; color: #0c5460;">
              <strong>Note:</strong> Please check the server status and resolve the issue as soon as possible.
            </p>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Warning: Server Health Check Failed

Reason: ${reasonText}
Message: ${data.message}
${data.responseTime ? `Response Time: ${data.responseTime}ms\n` : ''}
${data.statusCode ? `Status Code: ${data.statusCode}\n` : ''}
${data.error ? `Error: ${data.error}\n` : ''}
Time: ${new Date().toLocaleString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit'
})}

Please check the server status and resolve the issue as soon as possible.
      `;

      await emailService.sendEmail(
        {
          email: 'moamenabdeltawab@gmail.com',
          name: 'System Administrator'
        },
        subject,
        htmlContent,
        textContent
      );

      this.lastNotificationTime = now;
      logger.info('Health check failure notification sent successfully', {
        reason: data.reason,
        recipient: 'moamenabdeltawab@gmail.com'
      });

    } catch (error: any) {
      logger.error('Failed to send health check notification', {
        error: error.message,
        reason: data.reason
      });
    }
  }
}

export const healthCheckService = new HealthCheckService();

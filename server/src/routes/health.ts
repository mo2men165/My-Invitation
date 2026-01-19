// server/src/routes/health.ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';
import { emailService } from '../services/emailService';

const router = Router();

// Health check notification validation schema
const healthNotificationSchema = z.object({
  reason: z.enum(['status_not_ok', 'timeout', 'error']),
  message: z.string().min(1).max(500),
  responseTime: z.number().optional(),
  statusCode: z.number().optional(),
  error: z.string().optional()
});

/**
 * POST /api/health/notify
 * Send email notification when health check fails
 */
router.post('/notify', async (req: Request, res: Response) => {
  try {
    // Validate input data
    const validatedData = healthNotificationSchema.parse(req.body);

    logger.warn('Health check failure notification received', {
      reason: validatedData.reason,
      message: validatedData.message,
      responseTime: validatedData.responseTime,
      statusCode: validatedData.statusCode,
      ip: req.ip
    });

    const reasonText = validatedData.reason === 'status_not_ok' 
      ? 'Server status is not OK' 
      : validatedData.reason === 'timeout' 
      ? 'Response timeout exceeded' 
      : 'Connection error';

    // Prepare email content
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
          <p><strong>Message:</strong> ${validatedData.message}</p>
          ${validatedData.responseTime ? `<p><strong>Response Time:</strong> ${validatedData.responseTime}ms</p>` : ''}
          ${validatedData.statusCode ? `<p><strong>Status Code:</strong> ${validatedData.statusCode}</p>` : ''}
          ${validatedData.error ? `<p><strong>Error:</strong> ${validatedData.error}</p>` : ''}
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
Message: ${validatedData.message}
${validatedData.responseTime ? `Response Time: ${validatedData.responseTime}ms\n` : ''}
${validatedData.statusCode ? `Status Code: ${validatedData.statusCode}\n` : ''}
${validatedData.error ? `Error: ${validatedData.error}\n` : ''}
Time: ${new Date().toLocaleString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit'
})}

Please check the server status and resolve the issue as soon as possible.
    `;

    // Send email notification
    await emailService.sendEmail(
      {
        email: 'moamenabdeltawab@gmail.com',
        name: 'System Administrator'
      },
      subject,
      htmlContent,
      textContent
    );

    logger.info('Health check failure notification email sent successfully', {
      reason: validatedData.reason,
      recipient: 'moamenabdeltawab@gmail.com'
    });

    return res.json({
      success: true,
      message: 'Health check failure notification sent successfully'
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Health notification validation error', {
        errors: error.issues,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Invalid input data',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      });
    }

    logger.error('Health check notification error:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      body: req.body
    });

    return res.status(500).json({
      success: false,
      error: { message: 'An error occurred while sending the notification. Please try again.' }
    });
  }
});

export default router;

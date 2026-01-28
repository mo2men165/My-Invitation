// server/src/routes/whatsapp.ts
import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';
import { WhatsappService } from '../services/whatsappService';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to protected routes
// Webhook routes need to be public for Meta to send notifications
// But send-invitation routes need authentication
router.use('/send-invitation', checkJwt, extractUser, requireActiveUser);
router.use('/send-bulk-invitations', checkJwt, extractUser, requireActiveUser);
router.use('/send-event-reminders', checkJwt, extractUser, requireActiveUser);
router.use('/send-thank-you-messages', checkJwt, extractUser, requireActiveUser);

/**
 * GET /api/whatsapp/webhook
 * Verify webhook with Meta
 */
router.get('/webhook', (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('=== WEBHOOK VERIFICATION: Attempt received ===', {
      mode,
      tokenReceived: token ? 'YES' : 'NO',
      tokenMatches: token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
      challenge: challenge ? 'PRESENT' : 'MISSING',
      expectedToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? 'SET' : 'NOT_SET',
      allQueryParams: req.query
    });

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
      // Check the mode and token sent is correct
      if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        logger.info('=== WEBHOOK VERIFICATION: SUCCESS ===', {
          challenge: challenge?.toString()
        });
        res.status(200).send(challenge);
      } else {
        logger.error('=== WEBHOOK VERIFICATION: FAILED - Token/Mode mismatch ===', {
          receivedMode: mode,
          expectedMode: 'subscribe',
          receivedToken: token,
          expectedTokenSet: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
          tokenMatch: token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
        });
        res.status(403).json({ error: 'Forbidden' });
      }
    } else {
      logger.error('=== WEBHOOK VERIFICATION: FAILED - Missing parameters ===', {
        hasMode: !!mode,
        hasToken: !!token,
        hasChallenge: !!challenge
      });
      res.status(400).json({ error: 'Bad Request' });
    }
  } catch (error: any) {
    logger.error('=== WEBHOOK VERIFICATION: ERROR ===', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/whatsapp/webhook
 * Receive messages and status updates from Meta
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;
    
    logger.info('=== WEBHOOK: WhatsApp webhook received ===', {
      timestamp: new Date().toISOString(),
      type: webhookData.entry?.[0]?.changes?.[0]?.field,
      entryCount: webhookData.entry?.length || 0,
      fullWebhookData: JSON.stringify(webhookData, null, 2)
    });

    // Process the webhook data
    logger.info('WEBHOOK: Processing webhook data...');
    await WhatsappService.processWebhook(webhookData);
    
    logger.info('WEBHOOK: Webhook processed successfully');

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    logger.error('=== WEBHOOK: ERROR processing webhook ===', {
      error: error.message,
      stack: error.stack,
      webhookData: JSON.stringify(req.body, null, 2)
    });
    // Still return 200 to avoid retries
    res.status(200).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /api/whatsapp/send-invitation
 * Send invitation to a guest
 */
router.post('/send-invitation', async (req: Request, res: Response) => {
  try {
    logger.info('=== ROUTE: POST /api/whatsapp/send-invitation - REQUEST RECEIVED ===', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      body: req.body,
      hasUser: !!req.user,
      userId: req.user?.id,
      headers: {
        contentType: req.headers['content-type'],
        authorization: req.headers.authorization ? 'PRESENT' : 'MISSING'
      },
      timestamp: new Date().toISOString()
    });

    const { eventId, guestId } = req.body;

    logger.info('ROUTE: Destructured parameters', {
      eventId,
      guestId,
      eventIdType: typeof eventId,
      guestIdType: typeof guestId
    });

    if (!eventId || !guestId) {
      logger.error('ROUTE: Missing required parameters', { 
        eventId, 
        guestId,
        hasEventId: !!eventId,
        hasGuestId: !!guestId,
        bodyReceived: req.body
      });
      return res.status(400).json({
        success: false,
        error: { message: 'Event ID and Guest ID are required' }
      });
    }

    logger.info('ROUTE: Calling WhatsappService.sendInvitation...');
    const result = await WhatsappService.sendInvitation(eventId, guestId);

    if (result.success) {
      logger.info('ROUTE: Invitation sent successfully', {
        eventId,
        guestId,
        messageId: result.data?.messageId
      });
      return res.json({
        success: true,
        message: 'Invitation sent successfully',
        data: result.data
      });
    } else {
      logger.error('ROUTE: Invitation failed', {
        eventId,
        guestId,
        error: result.error
      });
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }
  } catch (error: any) {
    logger.error('=== ROUTE: ERROR in send-invitation ===', {
      error: error.message,
      stack: error.stack,
      eventId: req.body?.eventId,
      guestId: req.body?.guestId
    });
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to send invitation' }
    });
  }
});

/**
 * POST /api/whatsapp/send-bulk-invitations
 * Send invitations to multiple guests
 */
router.post('/send-bulk-invitations', async (req: Request, res: Response) => {
  try {
    const { eventId, guestIds } = req.body;

    if (!eventId || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Event ID and Guest IDs array are required' }
      });
    }

    const result = await WhatsappService.sendBulkInvitations(eventId, guestIds);

    return res.json({
      success: true,
      message: `Processing ${guestIds.length} invitations`,
      data: result
    });
  } catch (error: any) {
    logger.error('Error sending bulk invitations:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to send bulk invitations' }
    });
  }
});

/**
 * POST /api/whatsapp/send-event-reminders
 * Send reminders to all confirmed guests (Premium: 3 days, VIP: 5 days before event)
 */
router.post('/send-event-reminders', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Event ID is required' }
      });
    }

    const result = await WhatsappService.sendEventReminders(eventId);

    // Check if result is a queued job response
    if ('jobId' in result) {
      return res.json({
        success: true,
        message: `Job queued successfully. ${result.guestCount} guests will receive reminders.`,
        data: {
          jobId: result.jobId,
          guestCount: result.guestCount,
          status: 'queued'
        }
      });
    }

    // Fallback for empty guest list case
    return res.json({
      success: true,
      message: 'No confirmed guests to send reminders to',
      data: result
    });
  } catch (error: any) {
    logger.error('Error sending event reminders:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to send reminders' }
    });
  }
});

/**
 * POST /api/whatsapp/send-thank-you-messages
 * Send thank you messages to all attended guests (VIP only - 4 hours after event)
 */
router.post('/send-thank-you-messages', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Event ID is required' }
      });
    }

    const result = await WhatsappService.sendThankYouMessages(eventId);

    // Check if result is a queued job response
    if ('jobId' in result) {
      return res.json({
        success: true,
        message: `Job queued successfully. ${result.guestCount} guests will receive thank you messages.`,
        data: {
          jobId: result.jobId,
          guestCount: result.guestCount,
          status: 'queued'
        }
      });
    }

    // Fallback for empty guest list case
    return res.json({
      success: true,
      message: 'No attended guests to send thank you messages to',
      data: result
    });
  } catch (error: any) {
    logger.error('Error sending thank you messages:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to send thank you messages' }
    });
  }
});

/**
 * GET /api/whatsapp/test-config
 * Test WhatsApp configuration (admin only for security)
 */
router.get('/test-config', async (req: Request, res: Response) => {
  try {
    logger.info('=== WHATSAPP CONFIG TEST: Starting configuration test ===');

    const config = {
      hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
      hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      hasBusinessAccountId: !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      hasWebhookToken: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
      accessTokenLength: process.env.WHATSAPP_ACCESS_TOKEN?.length || 0,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'NOT_SET',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'NOT_SET',
      webhookToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'NOT_SET',
      apiUrl: `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
    };

    logger.info('WHATSAPP CONFIG TEST: Configuration check complete', config);

    // Test API connectivity (without sending message)
    const testApiConnectivity = async () => {
      try {
        const axios = (await import('axios')).default;
        const response = await axios.get(
          `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
            }
          }
        );
        return { 
          success: true, 
          phoneData: response.data 
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.response?.data || error.message 
        };
      }
    };

    const apiTest = await testApiConnectivity();

    logger.info('WHATSAPP CONFIG TEST: API connectivity test', apiTest);

    return res.json({
      success: true,
      message: 'Configuration test complete',
      config: {
        hasAccessToken: config.hasAccessToken,
        hasPhoneNumberId: config.hasPhoneNumberId,
        hasBusinessAccountId: config.hasBusinessAccountId,
        hasWebhookToken: config.hasWebhookToken,
        accessTokenLength: config.accessTokenLength,
        phoneNumberId: config.phoneNumberId,
        apiUrl: config.apiUrl
      },
      apiConnectivity: apiTest
    });

  } catch (error: any) {
    logger.error('=== WHATSAPP CONFIG TEST: ERROR ===', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: { message: 'Configuration test failed' }
    });
  }
});

export default router;

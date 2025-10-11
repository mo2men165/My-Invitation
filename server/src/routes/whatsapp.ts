// server/src/routes/whatsapp.ts
import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';
import { WhatsappService } from '../services/whatsappService';

const router = Router();

/**
 * GET /api/whatsapp/webhook
 * Verify webhook with Meta
 */
router.get('/webhook', (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('WhatsApp webhook verification attempt:', {
      mode,
      token,
      challenge: challenge ? 'PRESENT' : 'MISSING'
    });

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
      // Check the mode and token sent is correct
      if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        logger.info('WhatsApp webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        logger.error('WhatsApp webhook verification failed:', {
          mode,
          token,
          expectedToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? 'SET' : 'NOT_SET'
        });
        res.status(403).json({ error: 'Forbidden' });
      }
    } else {
      logger.error('WhatsApp webhook verification missing parameters:', {
        mode,
        token
      });
      res.status(400).json({ error: 'Bad Request' });
    }
  } catch (error: any) {
    logger.error('WhatsApp webhook verification error:', error);
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
    
    logger.info('WhatsApp webhook received:', {
      type: webhookData.entry?.[0]?.changes?.[0]?.field,
      entryCount: webhookData.entry?.length || 0
    });

    // Process the webhook data
    await WhatsappService.processWebhook(webhookData);

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    logger.error('WhatsApp webhook processing error:', error);
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
    const { eventId, guestId } = req.body;

    if (!eventId || !guestId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Event ID and Guest ID are required' }
      });
    }

    const result = await WhatsappService.sendInvitation(eventId, guestId);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Invitation sent successfully',
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }
  } catch (error: any) {
    logger.error('Error sending invitation:', error);
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

export default router;

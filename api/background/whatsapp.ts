// api/background/whatsapp.ts
// Vercel Background Function for long-running WhatsApp operations
import { connectDatabase } from '../../server/src/config/database';
import { Event } from '../../server/src/models/Event';
import { WhatsappService } from '../../server/src/services/whatsappService';
import { logger } from '../../server/src/config/logger';

export type MessageType = 'invitation' | 'reminder' | 'thank-you';

/**
 * Process WhatsApp bulk job in background
 * This function is designed to run as a Vercel Background Function
 * for long-running operations that exceed the standard function timeout
 * 
 * @param eventId - The event ID to process
 * @param guestIds - Array of guest IDs to send messages to
 * @param messageType - Type of message: 'invitation' | 'reminder' | 'thank-you'
 */
export async function processWhatsAppBulkJob(
  eventId: string,
  guestIds: string[],
  messageType: MessageType
): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  results: Array<{
    guestId: string;
    success: boolean;
    error?: string;
    messageId?: string;
  }>;
}> {
  logger.info('=== BACKGROUND JOB: Starting WhatsApp bulk job ===', {
    eventId,
    guestCount: guestIds.length,
    messageType,
    timestamp: new Date().toISOString()
  });

  const results: Array<{
    guestId: string;
    success: boolean;
    error?: string;
    messageId?: string;
  }> = [];
  let processed = 0;
  let failed = 0;

  try {
    // Connect to database
    await connectDatabase();
    logger.info('BACKGROUND JOB: Database connected');

    // Load event and populate userId
    const event = await Event.findById(eventId).populate('userId');
    if (!event) {
      logger.error('BACKGROUND JOB: Event not found', { eventId });
      return {
        success: false,
        processed: 0,
        failed: guestIds.length,
        results: guestIds.map(guestId => ({
          guestId,
          success: false,
          error: 'Event not found'
        }))
      };
    }

    logger.info('BACKGROUND JOB: Event loaded', {
      eventId,
      eventName: event.details.eventName,
      packageType: event.packageType,
      guestCount: event.guests.length
    });

    // Process each guest
    for (let i = 0; i < guestIds.length; i++) {
      const guestId = guestIds[i];
      
      logger.info(`BACKGROUND JOB: Processing guest ${i + 1}/${guestIds.length}`, {
        guestId,
        messageType,
        progress: `${i + 1}/${guestIds.length}`
      });

      try {
        let result: { success: boolean; data?: any; error?: string };

        // Send appropriate message based on messageType
        switch (messageType) {
          case 'invitation':
            result = await WhatsappService.sendInvitation(eventId, guestId);
            break;
          
          case 'reminder':
            result = await WhatsappService.sendReminderMessage(eventId, guestId);
            break;
          
          case 'thank-you':
            result = await WhatsappService.sendThankYouMessage(eventId, guestId);
            break;
          
          default:
            result = { success: false, error: `Unknown message type: ${messageType}` };
        }

        if (result.success) {
          processed++;
          
          // Update guest record
          const guest = event.guests.find(g => g._id?.toString() === guestId);
          if (guest) {
            guest.whatsappMessageSent = true;
            guest.whatsappSentAt = new Date();
            
            // Save event after each guest to ensure progress is persisted
            await event.save();
            
            logger.info(`BACKGROUND JOB: Guest ${i + 1} SUCCESS`, {
              guestId,
              guestName: guest.name,
              messageId: result.data?.messageId
            });
          }

          results.push({
            guestId,
            success: true,
            messageId: result.data?.messageId
          });
        } else {
          failed++;
          logger.error(`BACKGROUND JOB: Guest ${i + 1} FAILED`, {
            guestId,
            error: result.error
          });
          
          results.push({
            guestId,
            success: false,
            error: result.error
          });
        }
      } catch (error: any) {
        failed++;
        logger.error(`BACKGROUND JOB: Guest ${i + 1} EXCEPTION`, {
          guestId,
          error: error.message,
          stack: error.stack
        });
        
        results.push({
          guestId,
          success: false,
          error: error.message
        });
      }

      // Add 1 second delay between messages to avoid rate limits
      if (i < guestIds.length - 1) {
        logger.info('BACKGROUND JOB: Waiting 1 second before next message...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('=== BACKGROUND JOB: Bulk job complete ===', {
      eventId,
      messageType,
      total: guestIds.length,
      processed,
      failed,
      successRate: `${((processed / guestIds.length) * 100).toFixed(1)}%`
    });

    return {
      success: failed === 0,
      processed,
      failed,
      results
    };

  } catch (error: any) {
    logger.error('=== BACKGROUND JOB: Fatal error ===', {
      eventId,
      messageType,
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      processed,
      failed: guestIds.length - processed,
      results
    };
  }
}

/**
 * Vercel API endpoint handler for triggering background job
 * This allows the background function to be called via HTTP
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId, guestIds, messageType } = req.body;

    // Validate required fields
    if (!eventId || !guestIds || !messageType) {
      return res.status(400).json({
        error: 'Missing required fields: eventId, guestIds, messageType'
      });
    }

    if (!Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({
        error: 'guestIds must be a non-empty array'
      });
    }

    const validMessageTypes = ['invitation', 'reminder', 'thank-you'];
    if (!validMessageTypes.includes(messageType)) {
      return res.status(400).json({
        error: `messageType must be one of: ${validMessageTypes.join(', ')}`
      });
    }

    logger.info('Background job triggered via API', {
      eventId,
      guestCount: guestIds.length,
      messageType
    });

    // Process the job
    const result = await processWhatsAppBulkJob(eventId, guestIds, messageType);

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error('Background job handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

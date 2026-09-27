// server/src/services/whatsappService.ts
import axios from 'axios';
import { logger } from '../config/logger';
import { Event } from '../models/Event';
import { Types } from 'mongoose';
import { getCardUrl, getCardsToSend, getGuestCards, getInvitationSize } from '../utils/guestCards';

// Type for bulk job message types
export type BulkMessageType = 'invitation' | 'reminder' | 'thank-you';

// Result of processing one chunk of a bulk job. remainingGuestIds is what the
// caller passes back to send the next chunk; an empty array means it is done.
export interface BulkChunkResult {
  success: boolean;
  sent: number;
  failed: number;
  results: Array<{
    guestId: string;
    success: boolean;
    error?: string;
    messageId?: string;
  }>;
  remainingGuestIds: string[];
}

export class WhatsappService {
  private static readonly WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

  // How many guests one bulk request handles. Kept small so a chunk finishes
  // well inside the serverless function timeout; the caller loops for the rest.
  private static readonly DEFAULT_BULK_CHUNK_SIZE = 10;
  private static readonly MAX_BULK_CHUNK_SIZE = 25;
  private static readonly BULK_MESSAGE_DELAY_MS = 250;
  
  // Lazy getters for environment variables - ensures they're read at runtime, not module load
  private static get PHONE_NUMBER_ID(): string | undefined {
    return process.env.WHATSAPP_PHONE_NUMBER_ID;
  }
  
  private static get ACCESS_TOKEN(): string | undefined {
    return process.env.WHATSAPP_ACCESS_TOKEN;
  }

  /**
   * Sanitize template parameters to avoid WhatsApp API issues
   */
  private static sanitizeTemplateParam(text: string): string {
    if (!text) return '';
    return text
      .replace(/\n/g, ' ')        // Replace newlines with space
      .replace(/\t/g, ' ')        // Replace tabs with space
      .replace(/\s{4,}/g, '   ')  // Replace 4+ spaces with 3 spaces
      .trim();
  }

  /**
   * Process incoming webhook data from Meta
   */
  static async processWebhook(webhookData: any): Promise<void> {
    try {
      logger.info('Processing WhatsApp webhook:', {
        entryCount: webhookData.entry?.length || 0
      });

      if (!webhookData.entry) {
        logger.warn('No entries in webhook data');
        return;
      }

      for (const entry of webhookData.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await this.processMessageChanges(change.value);
            }
          }
        }
      }
    } catch (error: any) {
      logger.error('Error processing WhatsApp webhook:', error);
      throw error;
    }
  }

  /**
   * Process message changes from webhook
   */
  private static async processMessageChanges(value: any): Promise<void> {
    try {
      // Handle status updates (delivered, read, etc.)
      if (value.statuses) {
        for (const status of value.statuses) {
          await this.handleMessageStatus(status);
        }
      }

      // Handle incoming messages
      if (value.messages) {
        for (const message of value.messages) {
          await this.handleIncomingMessage(message);
        }
      }
    } catch (error: any) {
      logger.error('Error processing message changes:', error);
    }
  }

  /**
   * Handle message status updates
   */
  private static async handleMessageStatus(status: any): Promise<void> {
    try {
      logger.info('=== WHATSAPP STATUS: Message status update received ===', {
        messageId: status.id,
        status: status.status,
        timestamp: status.timestamp,
        recipientId: status.recipient_id,
        errors: status.errors ? JSON.stringify(status.errors) : null
      });

      // If message failed, trigger fallback mechanism (only if not already attempted)
      if (status.status === 'failed') {
        logger.warn('=== WHATSAPP STATUS: Message delivery FAILED ===', {
          messageId: status.id,
          recipientId: status.recipient_id,
          errorCode: status.errors?.[0]?.code,
          errorMessage: status.errors?.[0]?.message,
          errorTitle: status.errors?.[0]?.title,
          errorDetails: status.errors?.[0]?.error_data
        });

        // Check if this is already a fallback attempt by checking if fallback was attempted
        const event = await Event.findOne({
          'guests.whatsappMessageId': status.id
        });

        if (event) {
          const guest = event.guests.find(g => g.whatsappMessageId === status.id);
          if (guest?.fallbackAttempted) {
            logger.warn('=== WHATSAPP STATUS: Failed message is already a fallback attempt - STOPPING ===', {
              messageId: status.id,
              recipientId: status.recipient_id,
              eventId: event._id,
              guestId: guest._id,
              guestName: guest.name,
              message: 'Both initial_invitation and initial_invitation_utility templates failed. No further attempts.'
            });
            return;
          }
        }

        // Only trigger fallback if this is the initial message (not already a fallback)
        logger.info('WHATSAPP STATUS: This is initial message failure - triggering fallback...');
        await this.triggerFallbackInvitation(status.id, status.recipient_id);
      } else {
        logger.info('WHATSAPP STATUS: Message status is not failure, no action needed', {
          messageId: status.id,
          status: status.status
        });
      }
    } catch (error: any) {
      logger.error('=== WHATSAPP STATUS: ERROR handling message status ===', {
        error: error.message,
        stack: error.stack,
        status: status
      });
    }
  }

  /**
   * Trigger fallback invitation when initial message fails
   * Only attempts fallback once to prevent infinite loops
   */
  private static async triggerFallbackInvitation(failedMessageId: string, recipientPhone: string): Promise<void> {
    try {
      logger.info('=== FALLBACK: Starting fallback invitation process ===', {
        failedMessageId,
        recipientPhone
      });

      // Find event and guest by messageId
      const event = await Event.findOne({
        'guests.whatsappMessageId': failedMessageId
      });

      if (!event) {
        logger.error('FALLBACK: Event not found for failed message', {
          failedMessageId,
          recipientPhone
        });
        return;
      }

      logger.info('FALLBACK: Event found', {
        eventId: event._id,
        eventName: event.details.eventName,
        packageType: event.packageType
      });

      // Find the specific guest
      const guest = event.guests.find(g => g.whatsappMessageId === failedMessageId);

      if (!guest) {
        logger.error('FALLBACK: Guest not found for failed message', {
          failedMessageId,
          eventId: event._id,
          recipientPhone
        });
        return;
      }

      logger.info('FALLBACK: Guest found', {
        guestId: guest._id,
        guestName: guest.name,
        guestPhone: guest.phone,
        fallbackAttempted: guest.fallbackAttempted || false
      });

      // CRITICAL: Check if fallback was already attempted - only proceed if flag is false
      if (guest.fallbackAttempted) {
        logger.warn('=== FALLBACK: Fallback already attempted - STOPPING to prevent infinite loop ===', {
          eventId: event._id,
          guestId: guest._id,
          guestName: guest.name,
          failedMessageId,
          recipientPhone,
          message: 'Fallback was already attempted for this initial message failure. No further attempts will be made.'
        });
        return;
      }

      // Verify flag is false before proceeding (double-check after database query)
      logger.info('FALLBACK: Verifying fallbackAttempted flag is false before proceeding...');
      if (guest.fallbackAttempted) {
        logger.warn('FALLBACK: Flag check failed - fallback already attempted, stopping');
        return;
      }

      // Mark fallback as attempted BEFORE sending to prevent race conditions
      logger.info('FALLBACK: Flag is false - marking fallback as attempted in database...');
      await Event.updateOne(
        {
          _id: event._id,
          'guests._id': guest._id
        },
        {
          $set: {
            'guests.$.fallbackAttempted': true
          }
        }
      );

      logger.info('FALLBACK: Fallback flag set to true, proceeding with fallback send...');

      // Send fallback invitation using utility template
      logger.info('FALLBACK: Calling sendInvitationFallback...');
      const result = await WhatsappService.sendInvitationFallback(event._id.toString(), guest._id?.toString() || '');

      if (result.success) {
        logger.info('=== FALLBACK: Fallback invitation sent successfully ===', {
          eventId: event._id,
          guestId: guest._id,
          originalFailedMessageId: failedMessageId,
          newMessageId: result.data?.messageId,
          templateUsed: 'initial_invitation_utility'
        });
      } else {
        logger.error('=== FALLBACK: Fallback invitation failed - No further attempts will be made ===', {
          eventId: event._id,
          guestId: guest._id,
          originalFailedMessageId: failedMessageId,
          error: result.error,
          message: 'Both initial_invitation and initial_invitation_utility templates failed. Guest will not receive invitation via WhatsApp.'
        });
      }
    } catch (error: any) {
      logger.error('=== FALLBACK: ERROR in triggerFallbackInvitation ===', {
        error: error.message,
        stack: error.stack,
        failedMessageId,
        recipientPhone
      });
    }
  }

  /**
   * Handle incoming messages from guests
   */
  private static async handleIncomingMessage(message: any): Promise<void> {
    try {
      logger.info('=== WHATSAPP WEBHOOK: Incoming message received ===', {
        messageId: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type,
        hasContext: !!message.context,
        contextId: message.context?.id,
        fullMessage: JSON.stringify(message, null, 2)
      });

      const guestPhone = message.from;
      const originalMessageId = message.context?.id;
      let messageText = '';
      let listReplyId: string | undefined;

    // Extract text from message
    if (message.text) {
      messageText = message.text.body;
      logger.info('WHATSAPP WEBHOOK: Text message extracted', {
        messageText
      });
    } else if (message.button) {
      messageText = message.button.text;
      logger.info('WHATSAPP WEBHOOK: Button response', {
        payload: message.button.payload,
        buttonText: messageText
      });
    } else if (message.interactive) {
      // Handle button responses
      if (message.interactive.type === 'button_reply') {
        messageText = message.interactive.button_reply.title;
        logger.info('WHATSAPP WEBHOOK: Interactive button response', {
          buttonId: message.interactive.button_reply.id,
          buttonTitle: messageText
        });
      } else if (message.interactive.type === 'list_reply') {
        listReplyId = message.interactive.list_reply.id;
        messageText = message.interactive.list_reply.title;
        logger.info('WHATSAPP WEBHOOK: Interactive list response', {
          listReplyId,
          listReplyTitle: messageText
        });
      }
    } else {
      logger.warn('WHATSAPP WEBHOOK: Unknown message type', {
        type: message.type,
        message: JSON.stringify(message)
      });
    }

      // Convert WhatsApp phone format to our stored format
      const normalizedGuestPhone = this.normalizeWhatsAppPhone(guestPhone);
      
      logger.info('WHATSAPP WEBHOOK: Phone normalized', {
        original: guestPhone,
        normalized: normalizedGuestPhone
      });

      // Build query with phone and message context for accurate event matching
      // Context (original message ID) is always present in webhook responses
      const query: any = {
        'guests.phone': normalizedGuestPhone,
        'guests.whatsappMessageId': originalMessageId
      };
      
      logger.info('WHATSAPP WEBHOOK: Using message context for precise event lookup', {
        originalMessageId,
        guestPhone: normalizedGuestPhone
      });
      
      logger.info('WHATSAPP WEBHOOK: Looking for event with query...', {
        query: JSON.stringify(query)
      });
      
      const event = await Event.findOne(query);

      if (!event) {
        logger.warn('WHATSAPP WEBHOOK: No event found for guest phone and message ID', {
          guestPhone,
          normalizedPhone: normalizedGuestPhone,
          contextId: originalMessageId
        });
        return;
      }

      logger.info('WHATSAPP WEBHOOK: Event found', {
        eventId: event._id,
        eventName: event.details.eventName,
        packageType: event.packageType
      });

      // Find the specific guest - match by both phone and message ID
      const guest = event.guests.find(g => 
        g.phone === normalizedGuestPhone && 
        g.whatsappMessageId === originalMessageId
      );
        
      if (!guest) {
        logger.warn('WHATSAPP WEBHOOK: Guest not found in event', { 
          guestPhone: normalizedGuestPhone, 
          eventId: event._id,
          messageId: originalMessageId
        });
        return;
      }

      logger.info('WHATSAPP WEBHOOK: Guest found, processing reply', {
        guestId: guest._id,
        guestName: guest.name,
        messageText,
        conversationStage: guest.conversationStage
      });

      // Dispatch based on which question this guest is currently expected to answer
      if (guest.conversationStage === 'awaiting_accompanying_count') {
        await this.processAccompanyingCountResponse(event, guest, messageText, listReplyId);
      } else {
        await this.processRSVPResponse(event, guest, messageText);
      }

    } catch (error: any) {
      logger.error('=== WHATSAPP WEBHOOK: ERROR handling incoming message ===', {
        error: error.message,
        stack: error.stack,
        message: JSON.stringify(message, null, 2)
      });
    }
  }

  /**
   * Process RSVP response from guest
   */
  private static async processRSVPResponse(event: any, guest: any, response: string): Promise<void> {
    try {
      logger.info('=== WHATSAPP RSVP: Processing response ===', {
        eventId: event._id,
        guestId: guest._id,
        guestName: guest.name,
        guestPhone: guest.phone,
        response,
        currentRsvpStatus: guest.rsvpStatus
      });

    // Normalize response
    const normalizedResponse = response.toLowerCase().trim();
    
    logger.info('WHATSAPP RSVP: Response normalized', {
      original: response,
      normalized: normalizedResponse
    });

    let rsvpStatus = null;
    if (normalizedResponse === 'تأكيد الحضور') {
      rsvpStatus = 'accepted';
      logger.info('WHATSAPP RSVP: Acceptance confirmed');
    } else if (normalizedResponse === 'اعتذار عن الحضور' || normalizedResponse === 'إعتذار عن الحضور') {
      rsvpStatus = 'declined';
      logger.info('WHATSAPP RSVP: Decline confirmed');
    } else {
      logger.warn('WHATSAPP RSVP: Unrecognized response', {
        response,
        normalizedResponse
      });
    }

      if (rsvpStatus) {
        logger.info('WHATSAPP RSVP: Updating database...', {
          eventId: event._id,
          guestId: guest._id,
          newStatus: rsvpStatus
        });

        // Handle automatic refunding for declined guests (premium and VIP only)
        let refundedOnDecline = false;
        if (rsvpStatus === 'declined' && (event.packageType === 'premium' || event.packageType === 'vip')) {
          // Initialize refundable slots if not set
          if (!event.refundableSlots || event.refundableSlots.total === 0) {
            const percentage = event.packageType === 'premium' ? 0.20 : 0.30;
            event.refundableSlots = {
              total: Math.floor(event.details.inviteCount * percentage),
              used: 0
            };
          }

          // Check if we can refund this guest
          const availableRefundableSlots = event.refundableSlots.total - event.refundableSlots.used;
          const guestSlots = guest.numberOfAccompanyingGuests;

          if (availableRefundableSlots >= guestSlots) {
            // Refund the guest slots
            refundedOnDecline = true;
            event.refundableSlots.used += guestSlots;
            logger.info('WHATSAPP RSVP: Guest declined - slots automatically refunded', {
              guestName: guest.name,
              numberOfAccompanyingGuests: guestSlots,
              packageType: event.packageType,
              refundableSlotsUsed: event.refundableSlots.used,
              refundableSlotsTotal: event.refundableSlots.total,
              refundableSlotsRemaining: event.refundableSlots.total - event.refundableSlots.used
            });
          } else {
            logger.info('WHATSAPP RSVP: Guest declined - no refundable slots available', {
              guestName: guest.name,
              numberOfAccompanyingGuests: guestSlots,
              availableRefundableSlots,
              refundableSlotsUsed: event.refundableSlots.used,
              refundableSlotsTotal: event.refundableSlots.total
            });
          }
        }

        // Update guest RSVP status and refund status in database
        const updateData: any = {
          'guests.$.rsvpStatus': rsvpStatus,
          'guests.$.rsvpResponse': response,
          'guests.$.rsvpRespondedAt': new Date()
        };

        if (rsvpStatus === 'declined') {
          updateData['guests.$.refundedOnDecline'] = refundedOnDecline;
        }

        // Update refundable slots if changed
        if (refundedOnDecline) {
          updateData['refundableSlots.used'] = event.refundableSlots.used;
          if (!event.refundableSlots.total) {
            updateData['refundableSlots.total'] = event.refundableSlots.total;
          }
        }

        const updateResult = await Event.updateOne(
          { 
            _id: event._id,
            'guests._id': guest._id
          },
          {
            $set: updateData
          }
        );

        logger.info('WHATSAPP RSVP: Database updated', {
          matched: updateResult.matchedCount,
          modified: updateResult.modifiedCount,
          rsvpStatus,
          refundedOnDecline
        });

        // If accepted, ask how many accompanying guests they're bringing (when relevant),
        // otherwise go straight to the confirmation-with-links message
        if (rsvpStatus === 'accepted') {
          if (guest.numberOfAccompanyingGuests > 1) {
            logger.info('WHATSAPP RSVP: Guest accepted - asking for accompanying guest count...');
            await this.sendAccompanyingCountPrompt(event, guest);
          } else {
            logger.info('WHATSAPP RSVP: Guest accepted - sending confirmation message...');
            await Event.updateOne(
              { _id: event._id, 'guests._id': guest._id },
              { $set: { 'guests.$.conversationStage': 'completed' } }
            );
            await this.sendConfirmationWithLinks(event, guest);
          }
        }
      } else {
        logger.warn('WHATSAPP RSVP: Could not determine RSVP status from response');
      }

    } catch (error: any) {
      logger.error('=== WHATSAPP RSVP: ERROR processing response ===', {
        error: error.message,
        stack: error.stack,
        eventId: event._id,
        guestId: guest._id
      });
    }
  }

  /**
   * Google Maps link for an event, however its location was captured.
   */
  private static buildMapsLink(event: any): string {
    return event.details.locationCoordinates
      ? `https://maps.google.com/?q=${event.details.locationCoordinates.lat},${event.details.locationCoordinates.lng}`
      : event.details.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(event.details.eventLocation)}`;
  }

  /**
   * Send the entry cards and the venue location after a guest confirms.
   *
   * These go out as free-form session messages, inside the 24-hour window the
   * guest's own reply just opened. That matters for two reasons: an invitation
   * covers several people and so needs a card each, which a single template
   * (one media header) cannot carry; and a template combining an image header
   * with a URL button renders the card as the button's link preview, so tapping
   * the card opened Google Maps instead of the card. As separate messages, an
   * image behaves like an image and the venue is a native map pin.
   *
   * sendConfirmationTemplate remains the fallback for when the window has
   * closed, which is the case for guests the stale-reply cron defaults.
   */
  private static async sendConfirmationWithLinks(event: any, guest: any): Promise<void> {
    try {
      logger.info('=== WHATSAPP CONFIRMATION: Preparing confirmation message ===', {
        eventId: event._id,
        guestId: guest._id,
        guestName: guest.name
      });

      const invitationSize = getInvitationSize(guest);
      const confirmedCount = guest.confirmedAccompanyingGuests ?? invitationSize;
      const cards = getCardsToSend(guest, confirmedCount).filter(card => !!getCardUrl(card));

      if (cards.length === 0) {
        logger.error('WHATSAPP CONFIRMATION: No usable entry cards for this guest', {
          eventId: event._id,
          guestId: guest._id,
          invitationSize,
          confirmedCount
        });
        throw new Error('No entry cards uploaded for this guest');
      }

      if (cards.length < confirmedCount) {
        logger.warn('WHATSAPP CONFIRMATION: Fewer cards on file than confirmed attendees', {
          eventId: event._id,
          guestId: guest._id,
          confirmedCount,
          cardsAvailable: cards.length
        });
      }

      const eventDate = new Date(event.details.eventDate);
      const formattedDate = eventDate.toLocaleDateString('ar-SA', {
        calendar: 'gregory',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const eventName = event.details.eventName || 'المناسبة';
      const phone = guest.phone.replace(/^\+/, '');

      // One card per attending person, each as its own image so it can be
      // opened, saved and forwarded on its own.
      for (let i = 0; i < cards.length; i++) {
        const caption = i === 0
          ? `بطاقة دخول ${guest.name}\n${eventName}\n${formattedDate}`
          : `بطاقة دخول مرافق ${i} — ${guest.name}\n${eventName}\n${formattedDate}`;

        await this.sendMessage({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'image',
          image: {
            link: getCardUrl(cards[i]),
            caption
          }
        });

        if (i < cards.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.BULK_MESSAGE_DELAY_MS));
        }
      }

      // The venue as a map pin when we have coordinates: it opens in the guest's
      // own maps app and cannot steal taps from the cards above.
      const locationName = event.details.displayName || event.details.eventLocation;
      if (event.details.locationCoordinates) {
        await this.sendLocation(phone, event.details.locationCoordinates, locationName);
      } else {
        await this.sendMessage({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: {
            preview_url: true,
            body: `موقع المناسبة: ${locationName}\n${this.buildMapsLink(event)}`
          }
        });
      }

      logger.info('=== WHATSAPP CONFIRMATION: Confirmation sent successfully ===', {
        eventId: event._id,
        guestName: guest.name,
        guestPhone: guest.phone,
        cardsSent: cards.length,
        confirmedCount
      });

    } catch (error: any) {
      const errorCode = error.response?.data?.error?.code;

      logger.error('=== WHATSAPP CONFIRMATION: ERROR sending confirmation ===', {
        error: error.message,
        errorCode,
        eventId: event._id,
        guestId: guest._id
      });

      // 131047 / 470: outside the 24-hour customer service window, where only
      // templates may be sent. The stale-reply cron lands here by definition.
      if (errorCode === 131047 || errorCode === 470) {
        logger.info('WHATSAPP CONFIRMATION: Session window closed, falling back to template', {
          eventId: event._id,
          guestId: guest._id
        });
        await this.sendConfirmationTemplate(event, guest);
      }
    }
  }

  /**
   * Fallback confirmation: the approved invitation_message template, used when a
   * free-form send is refused because the session window has closed. Carries the
   * guest's own card only, since a template header holds a single image.
   */
  private static async sendConfirmationTemplate(event: any, guest: any): Promise<void> {
    try {
      const mapsLink = this.buildMapsLink(event);
      const validImageUrl = getCardUrl(getGuestCards(guest)[0]);

      if (!validImageUrl) {
        logger.error('WHATSAPP CONFIRMATION TEMPLATE: Invalid individual invite image URL', {
          eventId: event._id,
          guestId: guest._id
        });
        throw new Error('Individual invite image URL is invalid or not accessible');
      }

      const eventDate = new Date(event.details.eventDate);
      const formattedDate = eventDate.toLocaleDateString('ar-SA', {
        calendar: 'gregory',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const messageData = {
        messaging_product: 'whatsapp',
        to: guest.phone.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: 'invitation_message',
          language: {
            code: 'ar'
          },
          components: [
            // Template requires IMAGE header - always include it
            {
              type: 'header',
              parameters: [
                {
                  type: 'image',
                  image: {
                    link: validImageUrl
                  }
                }
              ]
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: guest.name,
                  parameter_name: 'guest_name'
                },
                {
                  type: 'text',
                  text: event.details.eventName || 'المناسبة',
                  parameter_name: 'event_name'
                },
                {
                  type: 'text',
                  text: formattedDate,
                  parameter_name: 'event_date'
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: mapsLink.replace('https://maps.google.com/', '')
                }
              ]
            }
          ]
        }
      };

      await this.sendMessage(messageData);

      logger.info('=== WHATSAPP CONFIRMATION TEMPLATE: Sent successfully ===', {
        eventId: event._id,
        guestName: guest.name
      });
    } catch (error: any) {
      logger.error('=== WHATSAPP CONFIRMATION TEMPLATE: ERROR ===', {
        error: error.message,
        eventId: event._id,
        guestId: guest._id
      });
    }
  }

  /**
   * Send an interactive list message asking an accepted guest how many people are
   * actually coming on their invitation (1..numberOfAccompanyingGuests, which is
   * the total the invitation covers, the guest included).
   * Sent as a free-form session message (no template needed) since it's sent within the
   * 24-hour window the guest's own "confirm attendance" reply just opened.
   */
  private static async sendAccompanyingCountPrompt(event: any, guest: any, isRetry: boolean = false): Promise<void> {
    try {
      const maxCount = getInvitationSize(guest);
      const rows: { id: string; title: string }[] = [];

      // The guest themself always attends, so the range starts at 1. An
      // invitation covers at most 10 people, which fits Meta's 10-row cap.
      for (let i = 1; i <= maxCount; i++) {
        rows.push({ id: `count_${i}`, title: `${i}` });
      }

      const bodyText = isRetry
        ? `لم أفهم ردك، من فضلك اختر عدد الأشخاص الذين سيحضرون من أصل ${maxCount}:`
        : `تم تأكيد حضورك يا ${guest.name}! كم عدد الأشخاص الذين سيحضرون من أصل ${maxCount} (بما فيهم أنت)؟`;

      const messageData = {
        messaging_product: 'whatsapp',
        to: guest.phone.replace(/^\+/, ''),
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: bodyText },
          action: {
            button: 'اختر العدد',
            sections: [
              {
                title: 'عدد الأشخاص',
                rows
              }
            ]
          }
        }
      };

      logger.info('WHATSAPP ACCOMPANYING COUNT: Sending prompt...', {
        guestId: guest._id,
        guestName: guest.name,
        maxCount,
        isRetry
      });

      const response = await this.sendMessage(messageData);
      const sentMessageId = response.messages?.[0]?.id;

      // Overwrite whatsappMessageId so the guest's reply threads to THIS message,
      // matching the same context-correlation pattern used for the initial invitation.
      await Event.updateOne(
        { _id: event._id, 'guests._id': guest._id },
        {
          $set: {
            'guests.$.whatsappMessageId': sentMessageId,
            'guests.$.conversationStage': 'awaiting_accompanying_count',
            'guests.$.accompanyingCountPromptSentAt': new Date()
          }
        }
      );

      logger.info('WHATSAPP ACCOMPANYING COUNT: Prompt sent successfully', {
        guestId: guest._id,
        messageId: sentMessageId
      });
    } catch (error: any) {
      logger.error('=== WHATSAPP ACCOMPANYING COUNT: ERROR sending prompt ===', {
        error: error.message,
        stack: error.stack,
        eventId: event._id,
        guestId: guest._id
      });
    }
  }

  /**
   * Parse a guest's reply to the accompanying-count prompt into a validated count.
   * Prefers the unambiguous list_reply id; falls back to free text (digits, Arabic-Indic
   * digits, and common Arabic/English words for "none"/"all") for guests who type instead of tap.
   */
  private static parseAccompanyingCountReply(
    rawText: string,
    listReplyId: string | undefined,
    maxCount: number
  ): { type: 'value'; value: number } | { type: 'invalid' } {
    if (listReplyId) {
      const match = listReplyId.match(/^count_(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n >= 1 && n <= maxCount) {
          return { type: 'value', value: n };
        }
      }
    }

    if (!rawText) {
      return { type: 'invalid' };
    }

    // Normalize Arabic-Indic digits (٠-٩) to Latin digits
    const arabicIndicDigits = '٠١٢٣٤٥٦٧٨٩';
    const text = rawText.trim().replace(/[٠-٩]/g, (d) => String(arabicIndicDigits.indexOf(d)));
    const normalized = text.toLowerCase();

    // "nobody else" still means the guest themself is coming: one person.
    const aloneWords = ['لا احد', 'لا أحد', 'ولا حد', 'ولا أحد', 'لا يوجد', 'بمفردي', 'وحدي', 'none', 'no one', 'alone'];
    const allWords = ['الكل', 'كلهم', 'الجميع', 'all', 'everyone'];

    if (aloneWords.some(w => normalized.includes(w))) {
      return { type: 'value', value: 1 };
    }
    if (allWords.some(w => normalized.includes(w))) {
      return { type: 'value', value: maxCount };
    }

    const digitMatch = text.match(/\d+/);
    if (digitMatch) {
      const n = parseInt(digitMatch[0], 10);
      if (!isNaN(n) && n >= 1 && n <= maxCount) {
        return { type: 'value', value: n };
      }
    }

    return { type: 'invalid' };
  }

  /**
   * Process a guest's reply to "how many accompanying guests are you bringing?"
   * Persists the confirmed count, auto-refunds any unused declared slots (same
   * refundableSlots pool used for full declines), then sends the final confirmation message.
   */
  private static async processAccompanyingCountResponse(
    event: any,
    guest: any,
    messageText: string,
    listReplyId: string | undefined
  ): Promise<void> {
    try {
      const maxCount = getInvitationSize(guest);
      const parsed = this.parseAccompanyingCountReply(messageText, listReplyId, maxCount);

      logger.info('WHATSAPP ACCOMPANYING COUNT: Processing response', {
        guestId: guest._id,
        guestName: guest.name,
        messageText,
        listReplyId,
        parsedType: parsed.type
      });

      if (parsed.type === 'invalid') {
        logger.warn('WHATSAPP ACCOMPANYING COUNT: Could not parse reply, re-prompting', {
          guestId: guest._id,
          messageText
        });
        await this.sendAccompanyingCountPrompt(event, guest, true);
        return;
      }

      const confirmedCount = parsed.value;
      const unusedSlots = maxCount - confirmedCount;

      // Auto-refund unused slots against the same refundableSlots pool used for full declines
      let accompanyingCountRefunded = false;
      if (unusedSlots > 0 && (event.packageType === 'premium' || event.packageType === 'vip')) {
        if (!event.refundableSlots || event.refundableSlots.total === 0) {
          const percentage = event.packageType === 'premium' ? 0.20 : 0.30;
          event.refundableSlots = {
            total: Math.floor(event.details.inviteCount * percentage),
            used: 0
          };
        }

        const availableRefundableSlots = event.refundableSlots.total - event.refundableSlots.used;
        if (availableRefundableSlots >= unusedSlots) {
          accompanyingCountRefunded = true;
          event.refundableSlots.used += unusedSlots;
        }

        logger.info('WHATSAPP ACCOMPANYING COUNT: Refund evaluation', {
          guestName: guest.name,
          declared: maxCount,
          confirmed: confirmedCount,
          unusedSlots,
          accompanyingCountRefunded,
          refundableSlotsUsed: event.refundableSlots.used,
          refundableSlotsTotal: event.refundableSlots.total
        });
      }

      const updateData: any = {
        'guests.$.confirmedAccompanyingGuests': confirmedCount,
        'guests.$.accompanyingCountConfirmedAt': new Date(),
        'guests.$.accompanyingCountResponse': messageText,
        'guests.$.conversationStage': 'completed',
        'guests.$.accompanyingCountRefunded': accompanyingCountRefunded
      };

      if (accompanyingCountRefunded) {
        updateData['refundableSlots.used'] = event.refundableSlots.used;
        if (!event.refundableSlots.total) {
          updateData['refundableSlots.total'] = event.refundableSlots.total;
        }
      }

      const updateResult = await Event.updateOne(
        { _id: event._id, 'guests._id': guest._id },
        { $set: updateData }
      );

      logger.info('WHATSAPP ACCOMPANYING COUNT: Database updated', {
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount,
        confirmedCount,
        accompanyingCountRefunded
      });

      // Final step of the accept flow: send the maps/invite-image confirmation message
      await this.sendConfirmationWithLinks(event, guest);
    } catch (error: any) {
      logger.error('=== WHATSAPP ACCOMPANYING COUNT: ERROR processing response ===', {
        error: error.message,
        stack: error.stack,
        eventId: event._id,
        guestId: guest._id
      });
    }
  }

  /**
   * For guests who accepted but never answered the accompanying-count prompt: after the
   * 24-hour WhatsApp customer-service window has passed (no further interactive follow-up
   * is possible without a new approved template), assume they're bringing everyone they were
   * declared with. Intended to be called on a schedule (see api/cron/accompanying-count-defaults.ts).
   */
  static async applyAccompanyingCountDefaults(staleHours: number = 24): Promise<{ processed: number; errors: number }> {
    const cutoff = new Date(Date.now() - staleHours * 60 * 60 * 1000);
    let processed = 0;
    let errors = 0;

    const events = await Event.find({
      status: { $ne: 'cancelled' },
      guests: {
        $elemMatch: {
          conversationStage: 'awaiting_accompanying_count',
          accompanyingCountPromptSentAt: { $lte: cutoff }
        }
      }
    });

    for (const event of events) {
      const staleGuests = event.guests.filter(
        (g: any) =>
          g.conversationStage === 'awaiting_accompanying_count' &&
          g.accompanyingCountPromptSentAt &&
          g.accompanyingCountPromptSentAt <= cutoff
      );

      for (const guest of staleGuests) {
        try {
          const confirmedCount = guest.numberOfAccompanyingGuests;

          await Event.updateOne(
            { _id: event._id, 'guests._id': guest._id },
            {
              $set: {
                'guests.$.confirmedAccompanyingGuests': confirmedCount,
                'guests.$.accompanyingCountConfirmedAt': new Date(),
                'guests.$.accompanyingCountResponse': 'auto_defaulted_no_reply',
                'guests.$.conversationStage': 'completed',
                'guests.$.accompanyingCountRefunded': false
              }
            }
          );

          logger.info('WHATSAPP ACCOMPANYING COUNT: Auto-defaulted stale guest', {
            eventId: event._id,
            guestId: guest._id,
            guestName: guest.name,
            defaultedCount: confirmedCount
          });

          await this.sendConfirmationWithLinks(event, guest);
          processed++;
        } catch (error: any) {
          errors++;
          logger.error('=== WHATSAPP ACCOMPANYING COUNT: ERROR auto-defaulting guest ===', {
            error: error.message,
            eventId: event._id,
            guestId: guest._id
          });
        }
      }
    }

    logger.info('WHATSAPP ACCOMPANYING COUNT: Auto-default sweep complete', { processed, errors });
    return { processed, errors };
  }

  /**
   * Build message data for invitation template
   * Reusable method that works with any template name (initial_invitation or initial_invitation_utility)
   * Note: initial_invitation_utility template uses 7 parameters (excludes invitation_text)
   */
  private static buildInvitationMessageData(
    event: any,
    guest: any,
    templateName: string
  ): { messageData: any; phoneNumber: string; validImageUrl: string } {
    // Format dates
    const eventDate = new Date(event.details.eventDate);
    const hijriDate = eventDate.toLocaleDateString('ar-SA', { calendar: 'islamic' });
    const gregorianDate = eventDate.toLocaleDateString('ar-SA', { calendar: 'gregory', year: 'numeric', month: 'long', day: 'numeric' });
    const dayOfWeek = eventDate.toLocaleDateString('ar-SA', { weekday: 'long' });

    // Determine event type
    const eventType = event.details.eventName || 'حفل';

    // Prepare phone number (remove + for WhatsApp API)
    const phoneNumber = guest.phone.replace(/^\+/, '');

    // Get event invitation card image URL
    const eventImageUrl = event.invitationCardImage?.secure_url || event.invitationCardImage?.url || '';

    // Ensure URL is HTTPS (WhatsApp requires HTTPS for images)
    const validImageUrl = eventImageUrl.startsWith('https://') 
      ? eventImageUrl 
      : eventImageUrl.replace(/^http:\/\//, 'https://');

    // Build body parameters - utility template excludes invitation_text
    const isUtilityTemplate = templateName === 'initial_invitation_utility';
    const bodyParameters: any[] = [
      {
        type: 'text',
        text: event.details.hostName,
        parameter_name: 'host_name'
      },
      {
        type: 'text',
        text: eventType,
        parameter_name: 'event_type'
      },
      {
        type: 'text',
        text: dayOfWeek,
        parameter_name: 'day_of_week'
      },
      {
        type: 'text',
        text: hijriDate,
        parameter_name: 'hijri_date'
      },
      {
        type: 'text',
        text: gregorianDate,
        parameter_name: 'gregorian_date'
      },
      {
        type: 'text',
        text: `${event.details.startTime} - ${event.details.endTime}`,
        parameter_name: 'event_time'
      },
      {
        type: 'text',
        text: event.details.displayName || event.details.eventLocation,
        parameter_name: 'event_location'
      }
    ];

    // Only add invitation_text for non-utility templates (initial_invitation has 8 params)
    if (!isUtilityTemplate) {
      bodyParameters.push({
        type: 'text',
        text: this.sanitizeTemplateParam(event.details.invitationText || ''),
        parameter_name: 'invitation_text'
      });
    }

    const messageData = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'ar'
        },
        components: [
          // Template requires IMAGE header - always include it
          {
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: {
                  link: validImageUrl
                }
              }
            ]
          },
          {
            type: 'body',
            parameters: bodyParameters
          },
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '0',
            parameters: [
              {
                type: 'payload',
                payload: 'تأكيد الحضور'
              }
            ]
          },
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '1',
            parameters: [
              {
                type: 'payload',
                payload: 'اعتذار عن الحضور'
              }
            ]
          }
        ]
      }
    };

    return { messageData, phoneNumber, validImageUrl };
  }

  /**
   * Send initial invitation message
   */
  static async sendInvitation(eventId: string, guestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info('=== WHATSAPP: Starting sendInvitation ===', {
        eventId,
        guestId,
        timestamp: new Date().toISOString()
      });

      const event = await Event.findById(eventId);
      if (!event) {
        logger.error('WHATSAPP: Event not found', { eventId });
        return { success: false, error: 'Event not found' };
      }

      logger.info('WHATSAPP: Event found', {
        eventId,
        packageType: event.packageType,
        eventName: event.details.eventName,
        hostName: event.details.hostName
      });

      const guest = event.guests.find(g => g._id?.toString() === guestId);
      if (!guest) {
        logger.error('WHATSAPP: Guest not found', { eventId, guestId });
        return { success: false, error: 'Guest not found' };
      }

      logger.info('WHATSAPP: Guest found', {
        guestId,
        guestName: guest.name,
        guestPhone: guest.phone,
        hasIndividualImage: !!guest.individualInviteImage
      });

      // Check package type
      if (event.packageType === 'classic') {
        logger.warn('WHATSAPP: Classic package - API not available', { eventId });
        return { success: false, error: 'WhatsApp integration not available for classic packages' };
      }

      // For Premium/VIP, ensure event invitation card image is set (initial invitation uses event image)
      if (!event.invitationCardImage) {
        logger.error('WHATSAPP: Event invitation card image missing', {
          eventId,
          guestId,
          guestName: guest.name,
          packageType: event.packageType
        });
        return { success: false, error: 'Event invitation card image not set' };
      }

      logger.info('WHATSAPP: Event invitation card image validated', {
        imageUrl: event.invitationCardImage?.secure_url || event.invitationCardImage?.url
      });

      // Validate image URL - must be HTTPS and non-empty
      const eventImageUrl = event.invitationCardImage?.secure_url || event.invitationCardImage?.url || '';
      if (!eventImageUrl || !eventImageUrl.startsWith('http')) {
        logger.error('WHATSAPP: Invalid image URL', {
          eventId,
          guestId,
          imageUrl: eventImageUrl,
          hasSecureUrl: !!event.invitationCardImage?.secure_url,
          hasUrl: !!event.invitationCardImage?.url
        });
        return { success: false, error: 'Event invitation card image URL is invalid or not accessible' };
      }

      // Reset fallbackAttempted flag to false when sending initial invitation
      // This allows retrying the initial template and attempting fallback again if needed
      logger.info('WHATSAPP: Resetting fallbackAttempted flag to false for new initial invitation attempt...');
      await Event.updateOne(
        {
          _id: event._id,
          'guests._id': guest._id
        },
        {
          $set: {
            'guests.$.fallbackAttempted': false
          }
        }
      );

      // Build message data using reusable method
      const { messageData, phoneNumber, validImageUrl } = this.buildInvitationMessageData(event, guest, 'initial_invitation');

      // Format dates for logging
      const eventDate = new Date(event.details.eventDate);
      const hijriDate = eventDate.toLocaleDateString('ar-SA', { calendar: 'islamic' });
      const gregorianDate = eventDate.toLocaleDateString('ar-SA', { calendar: 'gregory', year: 'numeric', month: 'long', day: 'numeric' });
      const dayOfWeek = eventDate.toLocaleDateString('ar-SA', { weekday: 'long' });

      logger.info('WHATSAPP: Date formatting complete', {
        eventDate: event.details.eventDate,
        hijriDate,
        gregorianDate,
        dayOfWeek
      });

      logger.info('WHATSAPP: Phone number prepared', {
        original: guest.phone,
        formatted: phoneNumber
      });

      logger.info('WHATSAPP: Image URL validated', {
        originalUrl: eventImageUrl,
        validUrl: validImageUrl
      });

      // Find body component (index 1) for logging - FIXED: was logging header (index 0) before
      const bodyComponent = messageData.template.components.find((c: any) => c.type === 'body');
      const buttonComponents = messageData.template.components.filter((c: any) => c.type === 'button');

      logger.info('WHATSAPP: Message data prepared', {
        template: 'initial_invitation',
        to: phoneNumber,
        bodyParametersCount: bodyComponent?.parameters?.length || 0,
        bodyParameters: bodyComponent?.parameters?.map((p: any, i: number) => ({
          index: i,
          parameter_name: p.parameter_name,
          value: p.text?.substring(0, 50) + (p.text && p.text.length > 50 ? '...' : '')
        })) || [],
        buttonCount: buttonComponents.length,
        buttons: buttonComponents.map((b: any) => ({
          sub_type: b.sub_type,
          index: b.index
        }))
      });

      logger.info('WHATSAPP: Sending message to WhatsApp API...', {
        endpoint: `${this.WHATSAPP_API_URL}/${this.PHONE_NUMBER_ID}/messages`,
        phoneNumberId: this.PHONE_NUMBER_ID
      });

      const response = await this.sendMessage(messageData);
      const sentMessageId = response.messages?.[0]?.id;

      logger.info('WHATSAPP: Message sent successfully', {
        messageId: sentMessageId,
        response: JSON.stringify(response)
      });

      // Mark as sent in database with message ID for context tracking
      logger.info('WHATSAPP: Updating database with sent status and message ID...', {
        messageId: sentMessageId
      });
      
      const updateResult = await Event.updateOne(
        { 
          _id: event._id,
          'guests._id': guest._id
        },
        {
          $set: {
            'guests.$.whatsappMessageSent': true,
            'guests.$.whatsappSentAt': new Date(),
            'guests.$.whatsappMessageId': sentMessageId,
            'guests.$.rsvpStatus': 'pending',
            'guests.$.conversationStage': 'awaiting_rsvp'
          }
        }
      );

      logger.info('WHATSAPP: Database updated', {
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount
      });

      logger.info('=== WHATSAPP: Initial invitation sent successfully ===', {
        eventId,
        guestId,
        guestName: guest.name,
        guestPhone: guest.phone,
        messageId: response.messages?.[0]?.id,
        packageType: event.packageType
      });

      return { 
        success: true, 
        data: { 
          messageId: response.messages?.[0]?.id,
          sentAt: new Date()
        }
      };

    } catch (error: any) {
      logger.error('=== WHATSAPP: ERROR in sendInvitation ===', {
        eventId,
        guestId,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        statusCode: error.response?.status
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send fallback invitation message using initial_invitation_utility template
   * This is triggered when the initial_invitation template fails to deliver
   */
  static async sendInvitationFallback(eventId: string, guestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info('=== FALLBACK: Starting sendInvitationFallback ===', {
        eventId,
        guestId,
        templateName: 'initial_invitation_utility',
        timestamp: new Date().toISOString()
      });

      const event = await Event.findById(eventId);
      if (!event) {
        logger.error('FALLBACK: Event not found', { eventId });
        return { success: false, error: 'Event not found' };
      }

      logger.info('FALLBACK: Event found', {
        eventId,
        packageType: event.packageType,
        eventName: event.details.eventName,
        hostName: event.details.hostName
      });

      const guest = event.guests.find(g => g._id?.toString() === guestId);
      if (!guest) {
        logger.error('FALLBACK: Guest not found', { eventId, guestId });
        return { success: false, error: 'Guest not found' };
      }

      logger.info('FALLBACK: Guest found', {
        guestId,
        guestName: guest.name,
        guestPhone: guest.phone,
        hasIndividualImage: !!guest.individualInviteImage
      });

      // Check package type
      if (event.packageType === 'classic') {
        logger.warn('FALLBACK: Classic package - API not available', { eventId });
        return { success: false, error: 'WhatsApp integration not available for classic packages' };
      }

      // For Premium/VIP, ensure event invitation card image is set
      if (!event.invitationCardImage) {
        logger.error('FALLBACK: Event invitation card image missing', {
          eventId,
          guestId,
          guestName: guest.name,
          packageType: event.packageType
        });
        return { success: false, error: 'Event invitation card image not set' };
      }

      logger.info('FALLBACK: Event invitation card image validated', {
        imageUrl: event.invitationCardImage?.secure_url || event.invitationCardImage?.url
      });

      // Validate image URL - must be HTTPS and non-empty
      const eventImageUrl = event.invitationCardImage?.secure_url || event.invitationCardImage?.url || '';
      if (!eventImageUrl || !eventImageUrl.startsWith('http')) {
        logger.error('FALLBACK: Invalid image URL', {
          eventId,
          guestId,
          imageUrl: eventImageUrl,
          hasSecureUrl: !!event.invitationCardImage?.secure_url,
          hasUrl: !!event.invitationCardImage?.url
        });
        return { success: false, error: 'Event invitation card image URL is invalid or not accessible' };
      }

      // Build message data using reusable method with fallback template name
      const { messageData, phoneNumber, validImageUrl } = this.buildInvitationMessageData(event, guest, 'initial_invitation_utility');

      // Format dates for logging
      const eventDate = new Date(event.details.eventDate);
      const hijriDate = eventDate.toLocaleDateString('ar-SA', { calendar: 'islamic' });
      const gregorianDate = eventDate.toLocaleDateString('ar-SA', { calendar: 'gregory', year: 'numeric', month: 'long', day: 'numeric' });
      const dayOfWeek = eventDate.toLocaleDateString('ar-SA', { weekday: 'long' });

      logger.info('FALLBACK: Date formatting complete', {
        eventDate: event.details.eventDate,
        hijriDate,
        gregorianDate,
        dayOfWeek
      });

      logger.info('FALLBACK: Phone number prepared', {
        original: guest.phone,
        formatted: phoneNumber
      });

      logger.info('FALLBACK: Image URL validated', {
        originalUrl: eventImageUrl,
        validUrl: validImageUrl
      });

      // Find body component (index 1) for logging
      const bodyComponent = messageData.template.components.find((c: any) => c.type === 'body');
      const buttonComponents = messageData.template.components.filter((c: any) => c.type === 'button');

      logger.info('FALLBACK: Message data prepared', {
        template: 'initial_invitation_utility',
        to: phoneNumber,
        bodyParametersCount: bodyComponent?.parameters?.length || 0,
        bodyParameters: bodyComponent?.parameters?.map((p: any, i: number) => ({
          index: i,
          parameter_name: p.parameter_name,
          value: p.text?.substring(0, 50) + (p.text && p.text.length > 50 ? '...' : '')
        })) || [],
        buttonCount: buttonComponents.length,
        buttons: buttonComponents.map((b: any) => ({
          sub_type: b.sub_type,
          index: b.index
        }))
      });

      logger.info('FALLBACK: Sending message to WhatsApp API...', {
        endpoint: `${this.WHATSAPP_API_URL}/${this.PHONE_NUMBER_ID}/messages`,
        phoneNumberId: this.PHONE_NUMBER_ID,
        templateName: 'initial_invitation_utility'
      });

      const response = await this.sendMessage(messageData);
      const sentMessageId = response.messages?.[0]?.id;

      logger.info('FALLBACK: Message sent successfully', {
        messageId: sentMessageId,
        templateName: 'initial_invitation_utility',
        response: JSON.stringify(response)
      });

      // Update database with new message ID (keep the fallback message ID)
      logger.info('FALLBACK: Updating database with fallback message ID...', {
        messageId: sentMessageId
      });
      
      const updateResult = await Event.updateOne(
        { 
          _id: event._id,
          'guests._id': guest._id
        },
        {
          $set: {
            'guests.$.whatsappMessageSent': true,
            'guests.$.whatsappSentAt': new Date(),
            'guests.$.whatsappMessageId': sentMessageId,
            'guests.$.rsvpStatus': 'pending',
            'guests.$.conversationStage': 'awaiting_rsvp'
          }
        }
      );

      logger.info('FALLBACK: Database updated', {
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount
      });

      logger.info('=== FALLBACK: Fallback invitation sent successfully ===', {
        eventId,
        guestId,
        guestName: guest.name,
        guestPhone: guest.phone,
        messageId: response.messages?.[0]?.id,
        packageType: event.packageType,
        templateName: 'initial_invitation_utility'
      });

      return { 
        success: true, 
        data: { 
          messageId: response.messages?.[0]?.id,
          sentAt: new Date(),
          templateUsed: 'initial_invitation_utility'
        }
      };

    } catch (error: any) {
      logger.error('=== FALLBACK: ERROR in sendInvitationFallback ===', {
        eventId,
        guestId,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        statusCode: error.response?.status,
        templateName: 'initial_invitation_utility'
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send one chunk of a bulk WhatsApp job, in this request.
   *
   * Bulk sending used to be handed to a Vercel background function over an
   * un-awaited HTTP call to the deployment's own URL. That call never arrived:
   * the path is rewritten to the Express app, which has no such route, and a
   * serverless instance may be frozen before an un-awaited request is even
   * dispatched. Sending now happens in-process, a chunk per request, so the
   * caller keeps control (and can report progress) while each request stays
   * well inside the function timeout.
   */
  static async processBulkChunk(
    eventId: string,
    guestIds: string[],
    messageType: BulkMessageType,
    limit: number = this.DEFAULT_BULK_CHUNK_SIZE
  ): Promise<BulkChunkResult> {
    const chunkSize = Math.max(1, Math.min(limit, this.MAX_BULK_CHUNK_SIZE));
    const chunk = guestIds.slice(0, chunkSize);
    const remainingGuestIds = guestIds.slice(chunk.length);

    logger.info('=== WHATSAPP BULK CHUNK: Starting ===', {
      eventId,
      messageType,
      chunkSize: chunk.length,
      remaining: remainingGuestIds.length,
      timestamp: new Date().toISOString()
    });

    const results: BulkChunkResult['results'] = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < chunk.length; i++) {
      const guestId = chunk[i];

      try {
        let result: { success: boolean; data?: any; error?: string };

        switch (messageType) {
          case 'invitation':
            result = await this.sendInvitation(eventId, guestId);
            break;
          case 'reminder':
            result = await this.sendReminderMessage(eventId, guestId);
            break;
          case 'thank-you':
            result = await this.sendThankYouMessage(eventId, guestId);
            break;
          default:
            result = { success: false, error: `Unknown message type: ${messageType}` };
        }

        if (result.success) {
          sent++;
          results.push({ guestId, success: true, messageId: result.data?.messageId });
        } else {
          failed++;
          logger.error('WHATSAPP BULK CHUNK: Guest failed', { eventId, guestId, error: result.error });
          results.push({ guestId, success: false, error: result.error });
        }
      } catch (error: any) {
        failed++;
        logger.error('WHATSAPP BULK CHUNK: Guest threw', {
          eventId,
          guestId,
          error: error.message
        });
        results.push({ guestId, success: false, error: error.message });
      }

      // Space the messages out slightly to stay friendly with the WhatsApp API
      // rate limits, without making a chunk take long enough to time out.
      if (i < chunk.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.BULK_MESSAGE_DELAY_MS));
      }
    }

    logger.info('=== WHATSAPP BULK CHUNK: Complete ===', {
      eventId,
      messageType,
      sent,
      failed,
      remaining: remainingGuestIds.length
    });

    return {
      success: failed === 0,
      sent,
      failed,
      results,
      remainingGuestIds
    };
  }

  /**
   * Send one chunk of bulk invitations. The caller repeats the request with the
   * returned remainingGuestIds until nothing is left.
   */
  static async sendBulkInvitations(
    eventId: string,
    guestIds: string[],
    limit?: number
  ): Promise<BulkChunkResult> {
    logger.info('=== WHATSAPP BULK INVITATIONS: Processing chunk ===', {
      eventId,
      guestCount: guestIds.length
    });

    return this.processBulkChunk(eventId, guestIds, 'invitation', limit ?? this.DEFAULT_BULK_CHUNK_SIZE);
  }

  /**
   * Send location message
   */
  private static async sendLocation(phoneNumber: string, coordinates: any, locationName: string): Promise<void> {
    try {
      const messageData = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'location',
        location: {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          name: locationName,
          address: locationName
        }
      };

      await this.sendMessage(messageData);
    } catch (error: any) {
      logger.error('Error sending location:', error);
    }
  }

  /**
   * Normalize WhatsApp phone number format to our stored format
   */
  private static normalizeWhatsAppPhone(whatsappPhone: string): string {
    // WhatsApp sends phone numbers without country code (e.g., "966501234567")
    // Our system stores them with country code (e.g., "+966501234567")
    
    if (!whatsappPhone) return whatsappPhone;
    
    // If it already has +, return as is
    if (whatsappPhone.startsWith('+')) {
      return whatsappPhone;
    }
    
    // Add + if it's a valid international format
    if (whatsappPhone.length >= 10) {
      return '+' + whatsappPhone;
    }
    
    return whatsappPhone;
  }

  /**
   * Send message via WhatsApp API
   */
  private static async sendMessage(messageData: any): Promise<any> {
    try {
      logger.info('=== WHATSAPP API: Preparing to send message ===', {
        to: messageData.to,
        type: messageData.type,
        templateName: messageData.template?.name,
        hasAccessToken: !!this.ACCESS_TOKEN,
        hasPhoneNumberId: !!this.PHONE_NUMBER_ID,
        apiUrl: `${this.WHATSAPP_API_URL}/${this.PHONE_NUMBER_ID}/messages`
      });

      if (!this.ACCESS_TOKEN) {
        throw new Error('WHATSAPP_ACCESS_TOKEN not configured');
      }

      if (!this.PHONE_NUMBER_ID) {
        throw new Error('WHATSAPP_PHONE_NUMBER_ID not configured');
      }

      logger.info('WHATSAPP API: Sending request to Meta...', {
        messageDataSample: JSON.stringify(messageData, null, 2).substring(0, 500)
      });

      const response = await axios.post(
        `${this.WHATSAPP_API_URL}/${this.PHONE_NUMBER_ID}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('=== WHATSAPP API: Message sent successfully ===', {
        messageId: response.data.messages?.[0]?.id,
        to: messageData.to,
        statusCode: response.status,
        responseData: JSON.stringify(response.data)
      });

      return response.data;
    } catch (error: any) {
      logger.error('=== WHATSAPP API: ERROR sending message ===', {
        error: error.message,
        statusCode: error.response?.status,
        errorData: JSON.stringify(error.response?.data),
        errorCode: error.response?.data?.error?.code,
        errorMessage: error.response?.data?.error?.message,
        errorDetails: error.response?.data?.error?.error_data,
        to: messageData.to,
        templateName: messageData.template?.name,
        fullError: JSON.stringify(error.response?.data, null, 2)
      });
      throw error;
    }
  }

  /**
   * Send image message via WhatsApp
   */
  private static async sendImageMessage(phone: string, imageUrl: string): Promise<any> {
    try {
      if (!this.ACCESS_TOKEN) {
        throw new Error('WHATSAPP_ACCESS_TOKEN not configured');
      }

      if (!this.PHONE_NUMBER_ID) {
        throw new Error('WHATSAPP_PHONE_NUMBER_ID not configured');
      }

      const messageData = {
        messaging_product: 'whatsapp',
        to: phone.replace(/^\+/, ''),
        type: 'image',
        image: {
          link: imageUrl
        }
      };

      logger.info('WHATSAPP API: Sending image message...', {
        to: phone,
        imageUrl: imageUrl.substring(0, 100) + '...'
      });

      const response = await axios.post(
        `${this.WHATSAPP_API_URL}/${this.PHONE_NUMBER_ID}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WHATSAPP API: Image message sent successfully', {
        messageId: response.data.messages?.[0]?.id
      });

      return response.data;
    } catch (error: any) {
      logger.error('WHATSAPP API: ERROR sending image message', {
        error: error.message,
        statusCode: error.response?.status,
        errorData: JSON.stringify(error.response?.data)
      });
      throw error;
    }
  }

  /**
   * Send reminder message for Premium/VIP packages
   * Premium: 3 days before event
   * VIP: 5 days before event
   */
  static async sendReminderMessage(eventId: string, guestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, error: 'Event not found' };
      }

      // Only for Premium and VIP packages
      if (event.packageType !== 'premium' && event.packageType !== 'vip') {
        return { success: false, error: 'Reminders only available for Premium and VIP packages' };
      }

      const guest = event.guests.find(g => g._id?.toString() === guestId);
      if (!guest) {
        return { success: false, error: 'Guest not found' };
      }

      // Use individual invite image for reminder message
      const individualImageUrl = guest.individualInviteImage?.secure_url || guest.individualInviteImage?.url || '';
      
      // Validate image URL - template requires IMAGE header
      if (!individualImageUrl || !individualImageUrl.startsWith('http')) {
        logger.error('WHATSAPP REMINDER: Invalid individual invite image URL', {
          eventId,
          guestId,
          imageUrl: individualImageUrl,
          hasIndividualImage: !!guest.individualInviteImage,
          hasSecureUrl: !!guest.individualInviteImage?.secure_url,
          hasUrl: !!guest.individualInviteImage?.url
        });
        return { success: false, error: 'Individual invite image URL is invalid or not accessible' };
      }

      // Ensure URL is HTTPS (WhatsApp requires HTTPS for images)
      const validImageUrl = individualImageUrl.startsWith('https://') 
        ? individualImageUrl 
        : individualImageUrl.replace(/^http:\/\//, 'https://');

      logger.info('WHATSAPP REMINDER: Individual invite image validated', {
        originalUrl: individualImageUrl,
        validUrl: validImageUrl
      });

      // Generate Google Maps link
      const mapsLink = event.details.locationCoordinates 
        ? `https://maps.google.com/?q=${event.details.locationCoordinates.lat},${event.details.locationCoordinates.lng}`
        : event.details.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(event.details.eventLocation)}`;

      // Format event date
      const eventDate = new Date(event.details.eventDate);
      const formattedDate = eventDate.toLocaleDateString('ar-SA', { calendar: 'gregory', year: 'numeric', month: 'long', day: 'numeric' });

      const messageData = {
        messaging_product: 'whatsapp',
        to: guest.phone.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: 'event_reminder',
          language: {
            code: 'ar'
          },
          components: [
            // Template requires IMAGE header - always include it
            {
              type: 'header',
              parameters: [
                {
                  type: 'image',
                  image: {
                    link: validImageUrl
                  }
                }
              ]
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: guest.name,
                  parameter_name: 'guest_name'
                },
                {
                  type: 'text',
                  text: event.details.eventName || 'المناسبة',
                  parameter_name: 'event_name'
                },
                {
                  type: 'text',
                  text: formattedDate,
                  parameter_name: 'event_date'
                },
                {
                  type: 'text',
                  text: `${event.details.startTime} - ${event.details.endTime}`,
                  parameter_name: 'event_time'
                },
                {
                  type: 'text',
                  text: event.details.displayName || event.details.eventLocation,
                  parameter_name: 'event_location'
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: mapsLink.replace('https://maps.google.com/', '')
                }
              ]
            }
          ]
        }
      };

      const response = await this.sendMessage(messageData);

      logger.info('Reminder message sent:', {
        eventId,
        guestName: guest.name,
        guestPhone: guest.phone,
        packageType: event.packageType
      });

      return { 
        success: true, 
        data: { 
          messageId: response.messages?.[0]?.id,
          sentAt: new Date()
        }
      };

    } catch (error: any) {
      logger.error('Error sending reminder message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send thank you message after event (VIP only - 4 hours after end time)
   */
  static async sendThankYouMessage(eventId: string, guestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, error: 'Event not found' };
      }

      // Only for VIP packages
      if (event.packageType !== 'vip') {
        return { success: false, error: 'Thank you messages only for VIP packages' };
      }

      const guest = event.guests.find(g => g._id?.toString() === guestId);
      if (!guest) {
        return { success: false, error: 'Guest not found' };
      }

      // Only send to guests who actually attended
      if (guest.actuallyAttended !== true) {
        logger.info('Skipping thank you message - guest did not attend:', {
          eventId,
          guestName: guest.name
        });
        return { success: false, error: 'Guest did not attend event' };
      }

      const messageData = {
        messaging_product: 'whatsapp',
        to: guest.phone.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: 'thank_you_message',
          language: {
            code: 'ar'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: guest.name,
                  parameter_name: 'guest_name'
                },
                {
                  type: 'text',
                  text: event.details.eventName || 'المناسبة',
                  parameter_name: 'event_name'
                },
                {
                  type: 'text',
                  text: event.details.hostName,
                  parameter_name: 'host_name'
                }
              ]
            }
          ]
        }
      };

      const response = await this.sendMessage(messageData);

      logger.info('Thank you message sent:', {
        eventId,
        guestName: guest.name,
        guestPhone: guest.phone
      });

      return { 
        success: true, 
        data: { 
          messageId: response.messages?.[0]?.id,
          sentAt: new Date()
        }
      };

    } catch (error: any) {
      logger.error('Error sending thank you message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send reminders to all confirmed guests - queues job for background processing
   * Premium: 3 days before event
   * VIP: 5 days before event
   */
  static async sendEventReminders(
    eventId: string,
    guestIds?: string[],
    limit?: number
  ): Promise<BulkChunkResult> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, sent: 0, failed: 0, results: [], remainingGuestIds: [] };
      }

      // Only for Premium and VIP packages
      if (event.packageType !== 'premium' && event.packageType !== 'vip') {
        return { success: false, sent: 0, failed: 0, results: [], remainingGuestIds: [] };
      }

      // Get guests who accepted RSVP
      const confirmedGuests = event.guests.filter(g => 
        g.rsvpStatus === 'accepted' && g.whatsappMessageSent
      );

      if (confirmedGuests.length === 0 && !guestIds?.length) {
        logger.info('WHATSAPP REMINDERS: No confirmed guests to send reminders to', {
          eventId
        });
        return { success: true, sent: 0, failed: 0, results: [], remainingGuestIds: [] };
      }

      const recipientIds = guestIds ?? confirmedGuests.map(g => g._id!.toString());

      logger.info('=== WHATSAPP REMINDERS: Processing chunk ===', {
        eventId,
        packageType: event.packageType,
        guestCount: recipientIds.length
      });

      return this.processBulkChunk(eventId, recipientIds, 'reminder', limit ?? this.DEFAULT_BULK_CHUNK_SIZE);

    } catch (error: any) {
      logger.error('Error sending event reminders:', error);
      return { success: false, sent: 0, failed: 0, results: [], remainingGuestIds: [] };
    }
  }

  /**
   * Send thank you messages to all attended guests (VIP only) - queues job for background processing
   */
  static async sendThankYouMessages(
    eventId: string,
    guestIds?: string[],
    limit?: number
  ): Promise<BulkChunkResult> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, sent: 0, failed: 0, results: [], remainingGuestIds: [] };
      }

      // Only for VIP packages
      if (event.packageType !== 'vip') {
        return { success: false, sent: 0, failed: 0, results: [], remainingGuestIds: [] };
      }

      // Get guests who actually attended
      const attendedGuests = event.guests.filter(g => g.actuallyAttended === true);

      if (attendedGuests.length === 0 && !guestIds?.length) {
        logger.info('WHATSAPP THANK YOU: No attended guests to send thank you messages to', {
          eventId
        });
        return { success: true, sent: 0, failed: 0, results: [], remainingGuestIds: [] };
      }

      const recipientIds = guestIds ?? attendedGuests.map(g => g._id!.toString());

      logger.info('=== WHATSAPP THANK YOU: Processing chunk ===', {
        eventId,
        guestCount: recipientIds.length
      });

      return this.processBulkChunk(eventId, recipientIds, 'thank-you', limit ?? this.DEFAULT_BULK_CHUNK_SIZE);

    } catch (error: any) {
      logger.error('Error sending thank you messages:', error);
      return { success: false, sent: 0, failed: 0, results: [], remainingGuestIds: [] };
    }
  }
}

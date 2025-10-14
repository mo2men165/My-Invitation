// server/src/services/whatsappService.ts
import axios from 'axios';
import { logger } from '../config/logger';
import { Event } from '../models/Event';
import { Types } from 'mongoose';

export class WhatsappService {
  private static readonly WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
  private static readonly PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private static readonly ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

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
      logger.info('Message status update:', {
        messageId: status.id,
        status: status.status,
        timestamp: status.timestamp,
        recipientId: status.recipient_id
      });

      // Update message status in database if needed
      // For now, just log it
    } catch (error: any) {
      logger.error('Error handling message status:', error);
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
        fullMessage: JSON.stringify(message, null, 2)
      });

      const guestPhone = message.from;
      let messageText = '';

      // Extract text from message
      if (message.text) {
        messageText = message.text.body;
        logger.info('WHATSAPP WEBHOOK: Text message extracted', {
          messageText
        });
      } else if (message.interactive) {
        // Handle button responses
        if (message.interactive.type === 'button_reply') {
          messageText = message.interactive.button_reply.title;
          logger.info('WHATSAPP WEBHOOK: Interactive button response', {
            buttonId: message.interactive.button_reply.id,
            buttonTitle: messageText
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

      // Find event by guest phone number
      logger.info('WHATSAPP WEBHOOK: Looking for event with guest phone...');
      
      const event = await Event.findOne({
        'guests.phone': normalizedGuestPhone,
        status: 'upcoming'
      });

      if (!event) {
        logger.warn('WHATSAPP WEBHOOK: No upcoming event found for guest phone', {
          guestPhone,
          normalizedPhone: normalizedGuestPhone
        });
        return;
      }

      logger.info('WHATSAPP WEBHOOK: Event found', {
        eventId: event._id,
        eventName: event.details.eventName,
        packageType: event.packageType
      });

      const guest = event.guests.find(g => g.phone === normalizedGuestPhone);
      if (!guest) {
        logger.warn('WHATSAPP WEBHOOK: Guest not found in event', { 
          guestPhone: normalizedGuestPhone, 
          eventId: event._id 
        });
        return;
      }

      logger.info('WHATSAPP WEBHOOK: Guest found, processing RSVP', {
        guestId: guest._id,
        guestName: guest.name,
        messageText
      });

      // Process RSVP response
      await this.processRSVPResponse(event, guest, messageText);

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

      // Check for positive responses
      const positiveResponses = ['نعم', 'yes', 'أوافق', 'موافق', 'سأحضر', 'حاضر', 'تأكيد الحضور'];
      const negativeResponses = ['لا', 'no', 'معذرة', 'اعتذار', 'لن أحضر', 'إعتذار عن الحضور'];

      let rsvpStatus = null;
      if (positiveResponses.some(pos => normalizedResponse.includes(pos))) {
        rsvpStatus = 'accepted';
        logger.info('WHATSAPP RSVP: Positive response detected', { 
          matchedKeywords: positiveResponses.filter(pos => normalizedResponse.includes(pos))
        });
      } else if (negativeResponses.some(neg => normalizedResponse.includes(neg))) {
        rsvpStatus = 'declined';
        logger.info('WHATSAPP RSVP: Negative response detected', { 
          matchedKeywords: negativeResponses.filter(neg => normalizedResponse.includes(neg))
        });
      } else {
        logger.warn('WHATSAPP RSVP: No recognized RSVP pattern in response', {
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

        // Update guest RSVP status in database
        const updateResult = await Event.updateOne(
          { 
            _id: event._id,
            'guests._id': guest._id
          },
          {
            $set: {
              'guests.$.rsvpStatus': rsvpStatus,
              'guests.$.rsvpResponse': response,
              'guests.$.rsvpRespondedAt': new Date()
            }
          }
        );

        logger.info('WHATSAPP RSVP: Database updated', {
          matched: updateResult.matchedCount,
          modified: updateResult.modifiedCount,
          rsvpStatus
        });

        // If accepted, send confirmation with links
        if (rsvpStatus === 'accepted') {
          logger.info('WHATSAPP RSVP: Guest accepted - sending confirmation message...');
          await this.sendConfirmationWithLinks(event, guest);
        } else {
          logger.info('WHATSAPP RSVP: Guest declined - no further action needed');
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
   * Send confirmation message with invitation card and location links
   * Template: invitation_message - sent after guest accepts RSVP
   */
  private static async sendConfirmationWithLinks(event: any, guest: any): Promise<void> {
    try {
      logger.info('=== WHATSAPP CONFIRMATION: Preparing confirmation message ===', {
        eventId: event._id,
        guestId: guest._id,
        guestName: guest.name
      });

      // Generate Google Maps link
      const mapsLink = event.details.locationCoordinates 
        ? `https://maps.google.com/?q=${event.details.locationCoordinates.lat},${event.details.locationCoordinates.lng}`
        : event.details.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(event.details.eventLocation)}`;

      logger.info('WHATSAPP CONFIRMATION: Maps link generated', { mapsLink });

      // Use individual invite link for Premium/VIP, fallback to general invitation card
      const inviteCardLink = guest.individualInviteLink || event.invitationCardUrl || '';
      
      if (!inviteCardLink) {
        logger.error('WHATSAPP CONFIRMATION: No invite card link available', {
          hasIndividualLink: !!guest.individualInviteLink,
          hasEventCard: !!event.invitationCardUrl
        });
      } else {
        logger.info('WHATSAPP CONFIRMATION: Invite card link ready', {
          link: inviteCardLink,
          source: guest.individualInviteLink ? 'individual' : 'event'
        });
      }

      // Format event date
      const eventDate = new Date(event.details.eventDate);
      const formattedDate = eventDate.toLocaleDateString('ar-SA', { calendar: 'gregory', year: 'numeric', month: 'long', day: 'numeric' });

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
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: guest.name
                },
                {
                  type: 'text',
                  text: event.details.eventName || 'المناسبة'
                },
                {
                  type: 'text',
                  text: formattedDate
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 0,
              parameters: [
                {
                  type: 'text',
                  text: inviteCardLink
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 1,
              parameters: [
                {
                  type: 'text',
                  text: mapsLink
                }
              ]
            }
          ]
        }
      };

      logger.info('WHATSAPP CONFIRMATION: Sending confirmation message...', {
        template: 'invitation_message',
        to: guest.phone.replace(/^\+/, '')
      });

      await this.sendMessage(messageData);

      logger.info('=== WHATSAPP CONFIRMATION: Confirmation sent successfully ===', {
        eventId: event._id,
        guestName: guest.name,
        guestPhone: guest.phone,
        inviteCardLink
      });

    } catch (error: any) {
      logger.error('=== WHATSAPP CONFIRMATION: ERROR sending confirmation ===', {
        error: error.message,
        stack: error.stack,
        eventId: event._id,
        guestId: guest._id
      });
    }
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
        hasIndividualLink: !!guest.individualInviteLink
      });

      // Check package type
      if (event.packageType === 'classic') {
        logger.warn('WHATSAPP: Classic package - API not available', { eventId });
        return { success: false, error: 'WhatsApp integration not available for classic packages' };
      }

      // For Premium/VIP, ensure individual invite link is set
      if (!guest.individualInviteLink) {
        logger.error('WHATSAPP: Individual invite link missing', {
          eventId,
          guestId,
          guestName: guest.name,
          packageType: event.packageType
        });
        return { success: false, error: 'Individual invite link not set for guest' };
      }

      logger.info('WHATSAPP: Individual invite link validated', {
        link: guest.individualInviteLink
      });

      // Format dates
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

      // Determine event type based on context (could be enhanced)
      const eventType = event.details.eventName || 'حفل';

      // Prepare phone number (remove + for WhatsApp API)
      const phoneNumber = guest.phone.replace(/^\+/, '');
      
      logger.info('WHATSAPP: Phone number prepared', {
        original: guest.phone,
        formatted: phoneNumber
      });

      const messageData = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: 'initial_invitation',
          language: {
            code: 'ar'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: event.details.hostName
                },
                {
                  type: 'text',
                  text: eventType
                },
                {
                  type: 'text',
                  text: dayOfWeek
                },
                {
                  type: 'text',
                  text: hijriDate
                },
                {
                  type: 'text',
                  text: gregorianDate
                },
                {
                  type: 'text',
                  text: `${event.details.startTime} - ${event.details.endTime}`
                },
                {
                  type: 'text',
                  text: event.details.displayName || event.details.eventLocation
                },
                {
                  type: 'text',
                  text: event.details.invitationText || ''
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'quick_reply',
              index: '0'
            },
            {
              type: 'button',
              sub_type: 'quick_reply',
              index: '1'
            }
          ]
        }
      };

      logger.info('WHATSAPP: Message data prepared', {
        template: 'initial_invitation',
        to: phoneNumber,
        parametersCount: messageData.template.components[0].parameters.length,
        parameters: messageData.template.components[0].parameters.map((p, i) => ({
          index: i,
          value: p.text?.substring(0, 50) + (p.text && p.text.length > 50 ? '...' : '')
        })),
        buttonCount: messageData.template.components.filter(c => c.type === 'button').length,
        buttons: messageData.template.components.filter(c => c.type === 'button').map(b => ({
          sub_type: b.sub_type,
          index: b.index
        }))
      });

      logger.info('WHATSAPP: Sending message to WhatsApp API...', {
        endpoint: `${this.WHATSAPP_API_URL}/${this.PHONE_NUMBER_ID}/messages`,
        phoneNumberId: this.PHONE_NUMBER_ID
      });

      const response = await this.sendMessage(messageData);

      logger.info('WHATSAPP: Message sent successfully', {
        messageId: response.messages?.[0]?.id,
        response: JSON.stringify(response)
      });

      // Mark as sent in database
      logger.info('WHATSAPP: Updating database with sent status...');
      
      const updateResult = await Event.updateOne(
        { 
          _id: event._id,
          'guests._id': guest._id
        },
        {
          $set: {
            'guests.$.whatsappMessageSent': true,
            'guests.$.whatsappSentAt': new Date(),
            'guests.$.rsvpStatus': 'pending'
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
   * Send bulk invitations
   */
  static async sendBulkInvitations(eventId: string, guestIds: string[]): Promise<any> {
    logger.info('=== WHATSAPP BULK: Starting bulk invitation send ===', {
      eventId,
      guestCount: guestIds.length,
      guestIds
    });

    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < guestIds.length; i++) {
      const guestId = guestIds[i];
      
      logger.info(`WHATSAPP BULK: Processing guest ${i + 1}/${guestIds.length}`, {
        guestId,
        progress: `${i + 1}/${guestIds.length}`
      });

      try {
        const result = await this.sendInvitation(eventId, guestId);
        results.push({
          guestId,
          success: result.success,
          error: result.error,
          messageId: result.data?.messageId
        });
        
        if (result.success) {
          successCount++;
          logger.info(`WHATSAPP BULK: Guest ${i + 1} SUCCESS`, { guestId });
        } else {
          failureCount++;
          logger.error(`WHATSAPP BULK: Guest ${i + 1} FAILED`, { 
            guestId, 
            error: result.error 
          });
        }
        
        // Add delay between messages to avoid rate limits
        if (i < guestIds.length - 1) {
          logger.info('WHATSAPP BULK: Waiting 1 second before next message...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        failureCount++;
        logger.error(`WHATSAPP BULK: Guest ${i + 1} EXCEPTION`, {
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
    }

    logger.info('=== WHATSAPP BULK: Bulk send complete ===', {
      eventId,
      total: guestIds.length,
      success: successCount,
      failed: failureCount
    });

    return results;
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

      // Use individual invite link for Premium/VIP
      const inviteCardLink = guest.individualInviteLink || event.invitationCardUrl || '';
      
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
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: guest.name
                },
                {
                  type: 'text',
                  text: event.details.eventName || 'المناسبة'
                },
                {
                  type: 'text',
                  text: formattedDate
                },
                {
                  type: 'text',
                  text: `${event.details.startTime} - ${event.details.endTime}`
                },
                {
                  type: 'text',
                  text: event.details.displayName || event.details.eventLocation
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 0,
              parameters: [
                {
                  type: 'text',
                  text: inviteCardLink
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 1,
              parameters: [
                {
                  type: 'text',
                  text: mapsLink
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
                  text: guest.name
                },
                {
                  type: 'text',
                  text: event.details.eventName || 'المناسبة'
                },
                {
                  type: 'text',
                  text: event.details.hostName
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
   * Send reminders to all confirmed guests
   * Premium: 3 days before event
   * VIP: 5 days before event
   */
  static async sendEventReminders(eventId: string): Promise<{ success: boolean; sent: number; failed: number; results: any[] }> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, sent: 0, failed: 0, results: [] };
      }

      // Only for Premium and VIP packages
      if (event.packageType !== 'premium' && event.packageType !== 'vip') {
        return { success: false, sent: 0, failed: 0, results: [] };
      }

      const results = [];
      let sent = 0;
      let failed = 0;

      // Send to guests who accepted RSVP
      const confirmedGuests = event.guests.filter(g => 
        g.rsvpStatus === 'accepted' && g.whatsappMessageSent
      );

      for (const guest of confirmedGuests) {
        try {
          const result = await this.sendReminderMessage(eventId, guest._id!.toString());
          
          if (result.success) {
            sent++;
            results.push({
              guestId: guest._id,
              guestName: guest.name,
              success: true
            });
          } else {
            failed++;
            results.push({
              guestId: guest._id,
              guestName: guest.name,
              success: false,
              error: result.error
            });
          }

          // Delay between messages to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          failed++;
          results.push({
            guestId: guest._id,
            guestName: guest.name,
            success: false,
            error: error.message
          });
        }
      }

      logger.info('Event reminders sent:', {
        eventId,
        packageType: event.packageType,
        sent,
        failed,
        total: confirmedGuests.length
      });

      return { success: true, sent, failed, results };

    } catch (error: any) {
      logger.error('Error sending event reminders:', error);
      return { success: false, sent: 0, failed: 0, results: [] };
    }
  }

  /**
   * Send thank you messages to all attended guests (VIP only)
   */
  static async sendThankYouMessages(eventId: string): Promise<{ success: boolean; sent: number; failed: number; results: any[] }> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, sent: 0, failed: 0, results: [] };
      }

      // Only for VIP packages
      if (event.packageType !== 'vip') {
        return { success: false, sent: 0, failed: 0, results: [] };
      }

      const results = [];
      let sent = 0;
      let failed = 0;

      // Send to guests who actually attended
      const attendedGuests = event.guests.filter(g => g.actuallyAttended === true);

      for (const guest of attendedGuests) {
        try {
          const result = await this.sendThankYouMessage(eventId, guest._id!.toString());
          
          if (result.success) {
            sent++;
            results.push({
              guestId: guest._id,
              guestName: guest.name,
              success: true
            });
          } else {
            failed++;
            results.push({
              guestId: guest._id,
              guestName: guest.name,
              success: false,
              error: result.error
            });
          }

          // Delay between messages to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          failed++;
          results.push({
            guestId: guest._id,
            guestName: guest.name,
            success: false,
            error: error.message
          });
        }
      }

      logger.info('Thank you messages sent:', {
        eventId,
        sent,
        failed,
        total: attendedGuests.length
      });

      return { success: true, sent, failed, results };

    } catch (error: any) {
      logger.error('Error sending thank you messages:', error);
      return { success: false, sent: 0, failed: 0, results: [] };
    }
  }
}

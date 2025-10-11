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
      logger.info('Incoming WhatsApp message:', {
        messageId: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type
      });

      const guestPhone = message.from;
      let messageText = '';

      // Extract text from message
      if (message.text) {
        messageText = message.text.body;
      } else if (message.interactive) {
        // Handle button responses
        if (message.interactive.type === 'button_reply') {
          messageText = message.interactive.button_reply.title;
        }
      }

      // Convert WhatsApp phone format to our stored format
      const normalizedGuestPhone = this.normalizeWhatsAppPhone(guestPhone);

      // Find event by guest phone number
      const event = await Event.findOne({
        'guests.phone': normalizedGuestPhone,
        status: 'upcoming'
      });

      if (!event) {
        logger.warn('No upcoming event found for guest phone:', guestPhone);
        return;
      }

      const guest = event.guests.find(g => g.phone === normalizedGuestPhone);
      if (!guest) {
        logger.warn('Guest not found in event:', { guestPhone, eventId: event._id });
        return;
      }

      // Process RSVP response
      await this.processRSVPResponse(event, guest, messageText);

    } catch (error: any) {
      logger.error('Error handling incoming message:', error);
    }
  }

  /**
   * Process RSVP response from guest
   */
  private static async processRSVPResponse(event: any, guest: any, response: string): Promise<void> {
    try {
      logger.info('Processing RSVP response:', {
        eventId: event._id,
        guestName: guest.name,
        guestPhone: guest.phone,
        response
      });

      // Normalize response
      const normalizedResponse = response.toLowerCase().trim();

      // Check for positive responses
      const positiveResponses = ['نعم', 'yes', 'أوافق', 'موافق', 'سأحضر', 'حاضر', 'تأكيد الحضور'];
      const negativeResponses = ['لا', 'no', 'معذرة', 'اعتذار', 'لن أحضر', 'إعتذار عن الحضور'];

      let rsvpStatus = null;
      if (positiveResponses.some(pos => normalizedResponse.includes(pos))) {
        rsvpStatus = 'accepted';
      } else if (negativeResponses.some(neg => normalizedResponse.includes(neg))) {
        rsvpStatus = 'declined';
      }

      if (rsvpStatus) {
        // Update guest RSVP status in database
        await Event.updateOne(
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

        logger.info('RSVP status updated:', {
          eventId: event._id,
          guestName: guest.name,
          rsvpStatus
        });

        // If accepted, send confirmation with links
        if (rsvpStatus === 'accepted') {
          await this.sendConfirmationWithLinks(event, guest);
        }
        // If declined, do nothing (as per requirements)
      }

    } catch (error: any) {
      logger.error('Error processing RSVP response:', error);
    }
  }

  /**
   * Send confirmation message with invitation card and location links
   */
  private static async sendConfirmationWithLinks(event: any, guest: any): Promise<void> {
    try {
      // Generate Google Maps link
      const mapsLink = event.details.locationCoordinates 
        ? `https://maps.google.com/?q=${event.details.locationCoordinates.lat},${event.details.locationCoordinates.lng}`
        : `https://maps.google.com/?q=${encodeURIComponent(event.details.eventLocation)}`;

      const messageData = {
        messaging_product: 'whatsapp',
        to: guest.phone,
        type: 'template',
        template: {
          name: 'invitation_message',
          language: {
            code: 'ar'
          },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'text',
                  text: guest.name
                }
              ]
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: event.details.eventName || 'مناسبة خاصة'
                },
                {
                  type: 'text',
                  text: new Date(event.details.eventDate).toLocaleDateString('ar-SA')
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
                  text: event.invitationCardUrl || ''
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

      await this.sendMessage(messageData);

      logger.info('Confirmation with links sent:', {
        eventId: event._id,
        guestName: guest.name,
        guestPhone: guest.phone
      });

    } catch (error: any) {
      logger.error('Error sending confirmation with links:', error);
    }
  }

  /**
   * Send initial invitation message
   */
  static async sendInvitation(eventId: string, guestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, error: 'Event not found' };
      }

      const guest = event.guests.find(g => g._id?.toString() === guestId);
      if (!guest) {
        return { success: false, error: 'Guest not found' };
      }

      // Check package type
      if (event.packageType === 'classic') {
        return { success: false, error: 'WhatsApp integration not available for classic packages' };
      }

      const messageData = {
        messaging_product: 'whatsapp',
        to: guest.phone,
        type: 'template',
        template: {
          name: 'initial_invitation', // You'll need to create this template
          language: {
            code: 'ar'
          },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'text',
                  text: guest.name
                }
              ]
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: event.details.hostName
                },
                {
                  type: 'text',
                  text: event.details.eventName || 'مناسبة خاصة'
                },
                {
                  type: 'text',
                  text: new Date(event.details.eventDate).toLocaleDateString('ar-SA')
                },
                {
                  type: 'text',
                  text: `${event.details.startTime} - ${event.details.endTime}`
                },
                {
                  type: 'text',
                  text: event.details.eventLocation
                }
              ]
            }
          ]
        }
      };

      const response = await this.sendMessage(messageData);

      // Mark as sent in database
      await Event.updateOne(
        { 
          _id: event._id,
          'guests._id': guest._id
        },
        {
          $set: {
            'guests.$.whatsappMessageSent': true,
            'guests.$.whatsappSentAt': new Date()
          }
        }
      );

      logger.info('Invitation sent successfully:', {
        eventId,
        guestId,
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
      logger.error('Error sending invitation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk invitations
   */
  static async sendBulkInvitations(eventId: string, guestIds: string[]): Promise<any> {
    const results = [];
    
    for (const guestId of guestIds) {
      try {
        const result = await this.sendInvitation(eventId, guestId);
        results.push({
          guestId,
          success: result.success,
          error: result.error
        });
        
        // Add delay between messages to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        results.push({
          guestId,
          success: false,
          error: error.message
        });
      }
    }

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

      logger.info('WhatsApp message sent:', {
        messageId: response.data.messages?.[0]?.id,
        to: messageData.to
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending WhatsApp message:', {
        error: error.response?.data || error.message,
        messageData
      });
      throw error;
    }
  }

  /**
   * Send reminder message for VIP packages
   */
  static async sendReminderMessage(eventId: string, guestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const event = await Event.findById(eventId);
      if (!event || event.packageType !== 'vip') {
        return { success: false, error: 'Event not found or not VIP package' };
      }

      const guest = event.guests.find(g => g._id?.toString() === guestId);
      if (!guest) {
        return { success: false, error: 'Guest not found' };
      }

      const messageData = {
        messaging_product: 'whatsapp',
        to: guest.phone,
        type: 'template',
        template: {
          name: 'event_reminder',
          language: {
            code: 'ar'
          },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'text',
                  text: guest.name
                }
              ]
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: event.details.eventName || 'مناسبة خاصة'
                },
                {
                  type: 'text',
                  text: new Date(event.details.eventDate).toLocaleDateString('ar-SA')
                },
                {
                  type: 'text',
                  text: `${event.details.startTime} - ${event.details.endTime}`
                },
                {
                  type: 'text',
                  text: event.details.eventLocation
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
                  text: event.invitationCardUrl || ''
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
      logger.error('Error sending reminder message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send thank you message after event
   */
  static async sendThankYouMessage(eventId: string, guestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, error: 'Event not found' };
      }

      const guest = event.guests.find(g => g._id?.toString() === guestId);
      if (!guest) {
        return { success: false, error: 'Guest not found' };
      }

      const messageData = {
        messaging_product: 'whatsapp',
        to: guest.phone,
        type: 'template',
        template: {
          name: 'thank_you_message',
          language: {
            code: 'ar'
          },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'text',
                  text: guest.name
                }
              ]
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: event.details.eventName || 'مناسبة خاصة'
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
   * Schedule reminder for VIP packages
   */
  static async scheduleReminder(eventId: string, reminderDays: number = 3): Promise<void> {
    try {
      const event = await Event.findById(eventId);
      if (!event || event.packageType !== 'vip') {
        return;
      }

      const eventDate = new Date(event.details.eventDate);
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDays);

      // Schedule reminder (you might want to use a job queue like Bull or Agenda)
      logger.info('Reminder scheduled for VIP event:', {
        eventId,
        reminderDate,
        eventDate
      });

      // TODO: Implement actual scheduling logic
    } catch (error: any) {
      logger.error('Error scheduling reminder:', error);
    }
  }
}

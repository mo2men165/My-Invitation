// server/src/services/paymentService.ts
import { User } from '../models/User';
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import { CacheService } from './cacheService';
import { Types } from 'mongoose';
import { NotificationService } from './notificationService';
import { emailService, BillEmailData, EventDetailsEmailData } from './emailService';

export class PaymentService {
  /**
   * Process successful payment and convert cart items to events
   */
  static async processSuccessfulPayment(
    userId: string, 
    paymentDetails: {
      paymentId: string;
      amount: number;
      paymentMethod: string;
      transactionId?: string;
      source?: string; // 'paymob' or 'manual'
    }
  ) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      if (user.cart.length === 0) {
        throw new Error('السلة فارغة');
      }

      // Calculate total amount from cart
      const cartTotal = user.cart.reduce((sum, item) => sum + item.totalPrice, 0);
      
      if (Math.abs(cartTotal - paymentDetails.amount) > 0.01) {
        throw new Error('مبلغ الدفع لا يتطابق مع إجمالي السلة');
      }

      const createdEvents = [];
      const paymentCompletedAt = new Date();

      // Convert each cart item to an event
      for (const cartItem of user.cart) {
        const eventData = {
          userId: new Types.ObjectId(userId),
          designId: cartItem.designId,
          packageType: cartItem.packageType,
          details: {
            ...cartItem.details,
            eventDate: new Date(cartItem.details.eventDate)
          },
          totalPrice: cartItem.totalPrice,
          status: 'upcoming' as const,
          approvalStatus: 'pending' as const,
          guests: [], // Empty initially
          paymentCompletedAt
        };
      
        const newEvent = new Event(eventData);
        const savedEvent = await newEvent.save();
        createdEvents.push(savedEvent);
      
        await NotificationService.notifyNewEventPending(
          (savedEvent._id as Types.ObjectId).toString(),
          userId,
          {
            hostName: savedEvent.details.hostName,
            eventDate: savedEvent.details.eventDate.toLocaleDateString('ar-SA')
          }
        );
        
        logger.info(`Event created from cart item: ${cartItem._id} -> Event: ${savedEvent._id}`);
              }
      

      // Clear the cart after successful conversion
      user.cart = [];
      await user.save();

      // Update cache
      await CacheService.cacheUserCart(userId, user.cart);

      // Send emails after successful payment
      try {
        // Prepare data for bill email
        const billEmailData: BillEmailData = {
          paymentId: paymentDetails.paymentId,
          totalAmount: paymentDetails.amount,
          paymentMethod: paymentDetails.paymentMethod === 'paymob' ? 'Paymob' : paymentDetails.paymentMethod,
          transactionId: paymentDetails.transactionId,
          paymentDate: paymentCompletedAt.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          user: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            city: user.city
          },
          events: createdEvents.map(event => ({
            eventId: (event._id as Types.ObjectId).toString(),
            eventName: event.details.eventName,
            hostName: event.details.hostName,
            eventDate: event.details.eventDate.toLocaleDateString('ar-SA'),
            eventLocation: event.details.eventLocation,
            packageType: event.packageType,
            inviteCount: event.details.inviteCount,
            price: event.totalPrice
          }))
        };

        // Prepare data for event details email
        const eventDetailsEmailData: EventDetailsEmailData = {
          paymentId: paymentDetails.paymentId,
          totalAmount: paymentDetails.amount,
          paymentMethod: paymentDetails.paymentMethod === 'paymob' ? 'Paymob' : paymentDetails.paymentMethod,
          transactionId: paymentDetails.transactionId,
          paymentDate: paymentCompletedAt.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          user: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            city: user.city
          },
          events: createdEvents.map(event => ({
            eventId: (event._id as Types.ObjectId).toString(),
            eventName: event.details.eventName,
            hostName: event.details.hostName,
            eventDate: event.details.eventDate.toLocaleDateString('ar-SA'),
            eventLocation: event.details.eventLocation,
            packageType: event.packageType,
            inviteCount: event.details.inviteCount,
            price: event.totalPrice,
            invitationText: event.details.invitationText,
            startTime: event.details.startTime,
            endTime: event.details.endTime,
            additionalCards: event.details.additionalCards,
            gateSupervisors: event.details.gateSupervisors,
            fastDelivery: event.details.fastDelivery || false,
            detectedCity: event.details.detectedCity
          }))
        };

        // Send emails in parallel (don't wait for them to complete)
        Promise.all([
          emailService.sendBillEmail(billEmailData),
          emailService.sendEventDetailsEmail(eventDetailsEmailData)
        ]).then(() => {
          logger.info('Payment confirmation emails sent successfully', {
            paymentId: paymentDetails.paymentId,
            userId
          });
        }).catch((error) => {
          logger.error('Failed to send payment confirmation emails', {
            paymentId: paymentDetails.paymentId,
            userId,
            error: error.message
          });
          // Don't throw error - emails are not critical for payment success
        });

      } catch (emailError: any) {
        logger.error('Error preparing payment confirmation emails', {
          paymentId: paymentDetails.paymentId,
          userId,
          error: emailError.message
        });
        // Don't throw error - emails are not critical for payment success
      }

      logger.info(`Payment processed successfully for user ${userId}. ${createdEvents.length} events created.`);

      return {
        success: true,
        eventsCreated: createdEvents.length,
        events: createdEvents,
        paymentId: paymentDetails.paymentId,
        totalAmount: paymentDetails.amount
      };

    } catch (error) {
      logger.error('Error processing successful payment:', error);
      throw error;
    }
  }

  /**
   * Handle payment failure - keep cart items, log failure
   */
  static async processFailedPayment(
    userId: string, 
    paymentDetails: {
      paymentId: string;
      amount: number;
      errorReason: string;
    }
  ) {
    try {
      logger.warn(`Payment failed for user ${userId}: ${paymentDetails.errorReason}`);

      // Cart items remain unchanged
      return {
        success: false,
        errorReason: paymentDetails.errorReason,
        paymentId: paymentDetails.paymentId,
        message: 'فشل في معالجة الدفع. السلة محفوظة.'
      };

    } catch (error) {
      logger.error('Error processing failed payment:', error);
      throw error;
    }
  }

  /**
   * Get payment summary for cart
   */
  static async getCartPaymentSummary(userId: string) {
    try {
      const user = await User.findById(userId).select('cart');
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      if (user.cart.length === 0) {
        return {
          success: false,
          message: 'السلة فارغة'
        };
      }

      const summary = {
        itemCount: user.cart.length,
        totalAmount: user.cart.reduce((sum, item) => sum + item.totalPrice, 0),
        items: user.cart.map(item => ({
          id: item._id,
          designId: item.designId,
          packageType: item.packageType,
          eventName: item.details.eventName,
          hostName: item.details.hostName,
          eventDate: item.details.eventDate,
          eventLocation: item.details.eventLocation,
          inviteCount: item.details.inviteCount,
          price: item.totalPrice
        }))
      };

      return {
        success: true,
        summary
      };

    } catch (error) {
      logger.error('Error getting payment summary:', error);
      throw error;
    }
  }
}
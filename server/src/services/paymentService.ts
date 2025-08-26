// server/src/services/paymentService.ts
import { User } from '../models/User';
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import { CacheService } from './cacheService';
import { Types } from 'mongoose';

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
          guests: [], // Empty initially
          paymentCompletedAt
        };

        const newEvent = new Event(eventData);
        const savedEvent = await newEvent.save();
        createdEvents.push(savedEvent);

        logger.info(`Event created from cart item: ${cartItem._id} -> Event: ${savedEvent._id}`);
      }

      // Clear the cart after successful conversion
      user.cart = [];
      await user.save();

      // Update cache
      await CacheService.cacheUserCart(userId, user.cart);

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
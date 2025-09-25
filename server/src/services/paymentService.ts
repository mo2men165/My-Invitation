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
      logger.info('Starting PaymentService.processSuccessfulPayment:', {
        userId,
        paymentDetails,
        timestamp: new Date().toISOString()
      });

      const user = await User.findById(userId);
      if (!user) {
        logger.error('User not found:', { userId });
        throw new Error('المستخدم غير موجود');
      }

      logger.info('User found:', {
        userId: user._id,
        userEmail: user.email,
        cartLength: user.cart.length,
        cartItems: user.cart.map(item => ({
          id: item._id,
          designId: item.designId,
          packageType: item.packageType,
          totalPrice: item.totalPrice,
          hostName: item.details.hostName
        }))
      });

      if (user.cart.length === 0) {
        logger.error('Cart is empty:', { userId });
        throw new Error('السلة فارغة');
      }

      // Calculate total amount from cart
      const cartTotal = user.cart.reduce((sum, item) => sum + item.totalPrice, 0);
      
      logger.info('Cart total calculation:', {
        cartTotal,
        paymentAmount: paymentDetails.amount,
        difference: Math.abs(cartTotal - paymentDetails.amount),
        isAmountMatch: Math.abs(cartTotal - paymentDetails.amount) <= 0.01
      });
      
      if (Math.abs(cartTotal - paymentDetails.amount) > 0.01) {
        logger.error('Amount mismatch:', {
          cartTotal,
          paymentAmount: paymentDetails.amount,
          difference: Math.abs(cartTotal - paymentDetails.amount)
        });
        throw new Error('مبلغ الدفع لا يتطابق مع إجمالي السلة');
      }

      const createdEvents = [];
      const paymentCompletedAt = new Date();

      logger.info('Starting event creation process:', {
        cartItemCount: user.cart.length,
        paymentCompletedAt: paymentCompletedAt.toISOString()
      });

      // Convert each cart item to an event
      for (let i = 0; i < user.cart.length; i++) {
        const cartItem = user.cart[i];
        
        logger.info(`Processing cart item ${i + 1}/${user.cart.length}:`, {
          cartItemId: cartItem._id,
          designId: cartItem.designId,
          packageType: cartItem.packageType,
          totalPrice: cartItem.totalPrice,
          hostName: cartItem.details.hostName,
          eventDate: cartItem.details.eventDate
        });

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

        logger.info(`Creating event with data:`, {
          userId: eventData.userId,
          designId: eventData.designId,
          packageType: eventData.packageType,
          totalPrice: eventData.totalPrice,
          status: eventData.status,
          approvalStatus: eventData.approvalStatus
        });
      
        const newEvent = new Event(eventData);
        const savedEvent = await newEvent.save();
        createdEvents.push(savedEvent);

        logger.info(`Event created successfully:`, {
          eventId: savedEvent._id,
          cartItemId: cartItem._id,
          hostName: savedEvent.details.hostName,
          eventDate: savedEvent.details.eventDate
        });
      
        try {
          await NotificationService.notifyNewEventPending(
            (savedEvent._id as Types.ObjectId).toString(),
            userId,
            {
              hostName: savedEvent.details.hostName,
              eventDate: savedEvent.details.eventDate.toLocaleDateString('ar-SA')
            }
          );
          logger.info(`Notification sent for event: ${savedEvent._id}`);
        } catch (notificationError: any) {
          logger.error(`Failed to send notification for event ${savedEvent._id}:`, notificationError.message);
          // Don't throw error - notification failure shouldn't stop event creation
        }
      }

      logger.info(`All events created successfully. Total events: ${createdEvents.length}`);
      

      // Clear the cart after successful conversion
      logger.info('Clearing user cart:', {
        userId,
        cartLengthBefore: user.cart.length,
        cartItemsBefore: user.cart.map(item => ({
          id: item._id,
          hostName: item.details.hostName
        }))
      });

      user.cart = [];
      await user.save();

      logger.info('Cart cleared successfully:', {
        userId,
        cartLengthAfter: user.cart.length
      });

      // Update cache
      try {
        await CacheService.cacheUserCart(userId, user.cart);
        logger.info('Cache updated successfully for user:', userId);
      } catch (cacheError: any) {
        logger.error('Failed to update cache:', {
          userId,
          error: cacheError.message
        });
        // Don't throw error - cache failure shouldn't stop the process
      }

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

      const finalResult = {
        success: true,
        eventsCreated: createdEvents.length,
        events: createdEvents,
        paymentId: paymentDetails.paymentId,
        totalAmount: paymentDetails.amount
      };

      logger.info(`Payment processed successfully for user ${userId}:`, {
        userId,
        eventsCreated: finalResult.eventsCreated,
        paymentId: finalResult.paymentId,
        totalAmount: finalResult.totalAmount,
        eventIds: createdEvents.map(event => event._id)
      });

      return finalResult;

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
   * Get payment summary for cart (all items or selected items)
   */
  static async getCartPaymentSummary(userId: string, selectedCartItemIds?: string[]) {
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

      // Filter cart items if specific IDs are provided
      let cartItems = user.cart;
      if (selectedCartItemIds && selectedCartItemIds.length > 0) {
        cartItems = user.cart.filter(item => 
          selectedCartItemIds.includes(item._id!.toString())
        );
        
        if (cartItems.length === 0) {
          return {
            success: false,
            message: 'العناصر المحددة غير موجودة في السلة'
          };
        }
      }

      const summary = {
        itemCount: cartItems.length,
        totalAmount: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
        items: cartItems.map(item => ({
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
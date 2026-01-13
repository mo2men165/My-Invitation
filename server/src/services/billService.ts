// server/src/services/billService.ts
import { Bill, IBill } from '../models/Bill';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import { emailService } from './emailService';
import { Types } from 'mongoose';
import { BillEmailData } from './emailService';

export class BillService {
  /**
   * Generate unique bill number
   */
  private static generateBillNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BILL-${timestamp}-${random}`;
  }

  /**
   * Create a bill after successful payment
   */
  static async createBillFromOrder(orderId: string, skipEmail: boolean = false): Promise<IBill | null> {
    try {
      const order = await Order.findById(orderId).populate('userId');
      if (!order) {
        logger.error(`Order not found for bill creation: ${orderId}`);
        return null;
      }

      // Check if bill already exists for this order
      const existingBill = await Bill.findOne({ orderId: order._id });
      if (existingBill) {
        logger.info(`Bill already exists for order ${orderId}, skipping creation`);
        return existingBill;
      }

      // Get user information
      const user = await User.findById(order.userId);
      if (!user) {
        logger.error(`User not found for bill creation: ${order.userId}`);
        return null;
      }

      // Get events created from this order
      const events = await Event.find({ _id: { $in: order.eventsCreated } });
      
      // Skip bill creation if no events found
      if (events.length === 0) {
        logger.warn(`No events found for order ${orderId}, skipping bill creation`);
        return null;
      }

      // Prepare events data for bill
      const eventsData = events.map(event => ({
        eventId: event._id as Types.ObjectId,
        eventName: event.details.eventName,
        hostName: event.details.hostName,
        eventDate: event.details.eventDate,
        eventLocation: event.details.eventLocation,
        packageType: event.packageType,
        inviteCount: event.details.inviteCount,
        price: event.totalPrice
      }));

      // Create bill
      const bill = new Bill({
        userId: order.userId,
        orderId: order._id,
        billNumber: this.generateBillNumber(),
        paymentId: order.merchantOrderId,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        transactionId: order.paymobTransactionId,
        paymentDate: order.completedAt || new Date(),
        events: eventsData,
        user: {
          name: user.name,
          email: user.email || '',
          phone: user.phone,
          city: user.customCity || user.city
        },
        emailSent: false
      });

      const savedBill = await bill.save();

      logger.info(`Bill created successfully:`, {
        billId: savedBill._id,
        billNumber: savedBill.billNumber,
        orderId: order._id,
        userId: user._id
      });

      // Try to send email to user if email exists (unless skipped)
      if (!skipEmail && user.email && user.email.trim()) {
        try {
          const billEmailData: BillEmailData = {
            paymentId: order.merchantOrderId,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            transactionId: order.paymobTransactionId,
            paymentDate: (order.completedAt || new Date()).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              calendar: 'gregory'
            }),
            user: {
              name: user.name,
              email: user.email,
              phone: user.phone,
              city: user.customCity || user.city
            },
            events: eventsData.map(event => ({
              eventId: (event.eventId as Types.ObjectId).toString(),
              eventName: event.eventName,
              hostName: event.hostName,
              eventDate: event.eventDate.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                calendar: 'gregory'
              }),
              eventLocation: event.eventLocation,
              packageType: event.packageType,
              inviteCount: event.inviteCount,
              price: event.price
            }))
          };

          const emailSent = await emailService.sendBillEmailToUser(billEmailData);
          
          if (emailSent) {
            savedBill.emailSent = true;
            savedBill.emailSentAt = new Date();
            await savedBill.save();
            logger.info(`Bill email sent to user: ${user.email}`);
          }
        } catch (emailError: any) {
          logger.error(`Failed to send bill email to user:`, {
            email: user.email,
            error: emailError.message
          });
          // Don't fail the bill creation if email fails
        }
      } else if (!skipEmail) {
        logger.info(`User ${user._id} has no email, skipping bill email`);
      }

      return savedBill;
    } catch (error: any) {
      logger.error('Error creating bill from order:', {
        orderId,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Ensure bills exist for all completed orders for a user
   */
  static async ensureBillsExistForUser(userId: string): Promise<void> {
    try {
      // Find all completed orders for this user that don't have bills
      const completedOrders = await Order.find({
        userId: new Types.ObjectId(userId),
        status: 'completed',
        eventsCreated: { $exists: true, $ne: [] } // Only orders with events
      });

      if (completedOrders.length === 0) {
        return;
      }

      // Get all existing bills for these orders
      const orderIds = completedOrders.map(order => order._id);
      const existingBills = await Bill.find({ 
        orderId: { $in: orderIds }
      }).select('orderId');

      const existingOrderIds = new Set(
        existingBills.map(bill => bill.orderId.toString())
      );

      // Create bills for orders that don't have them
      const ordersWithoutBills = completedOrders.filter(
        order => !existingOrderIds.has(order._id.toString())
      );

      if (ordersWithoutBills.length > 0) {
        logger.info(`Creating ${ordersWithoutBills.length} bills for user ${userId} for existing orders`);

        // Create bills in parallel (skip emails for retroactive bills)
        await Promise.all(
          ordersWithoutBills.map(order =>
            this.createBillFromOrder(order._id.toString(), true).catch(error => {
              logger.error(`Failed to create bill for order ${order._id}:`, error);
            })
          )
        );
      }
    } catch (error: any) {
      logger.error('Error ensuring bills exist for user:', {
        userId,
        error: error.message
      });
      // Don't throw - we don't want to block bill retrieval if this fails
    }
  }

  /**
   * Get user's bills
   */
  static async getUserBills(
    userId: string,
    limit: number = 20,
    page: number = 1
  ): Promise<{ bills: IBill[]; total: number }> {
    try {
      // First, ensure bills exist for all completed orders
      await this.ensureBillsExistForUser(userId);

      const skip = (page - 1) * limit;

      const [bills, total] = await Promise.all([
        Bill.find({ userId: new Types.ObjectId(userId) })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .populate('orderId', 'merchantOrderId status')
          .lean(),
        Bill.countDocuments({ userId: new Types.ObjectId(userId) })
      ]);

      return { bills: bills as unknown as IBill[], total };
    } catch (error: any) {
      logger.error('Error fetching user bills:', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get bill by ID (for a specific user) with enriched event details
   */
  static async getBillById(billId: string, userId: string): Promise<any | null> {
    try {
      const bill = await Bill.findOne({
        _id: new Types.ObjectId(billId),
        userId: new Types.ObjectId(userId)
      })
        .populate('orderId')
        .populate('events.eventId')
        .lean();

      if (!bill) {
        return null;
      }

      // Package pricing constants (should match client constants)
      const packagePricing: Record<string, Record<number, number>> = {
        classic: { 100: 650, 150: 950, 200: 1250, 250: 1550, 300: 1850, 400: 2450, 500: 3000 },
        premium: { 100: 1200, 150: 1650, 200: 2000, 250: 2250, 300: 2400, 400: 2800, 500: 3350 },
        vip: { 100: 1950, 150: 2550, 200: 3250, 250: 3900, 300: 4500, 400: 4750, 500: 5000 }
      };

      const getExtraCardPrice = (pkgType: string) => {
        switch (pkgType) {
          case 'classic': return 7;
          case 'premium': return 13;
          case 'vip': return 20;
          default: return 7;
        }
      };

      const getExpeditedDeliveryPrice = (pkgType: string, isExpedited: boolean) => {
        if (!isExpedited) return 0;
        const EXPEDITED_COSTS: Record<string, number> = {
          classic: 600,
          premium: 1000,
          vip: 1500,
        };
        return EXPEDITED_COSTS[pkgType] || EXPEDITED_COSTS.classic;
      };

      // Enrich events with full details and pricing breakdown
      const enrichedEvents = await Promise.all(
        (bill.events as any[]).map(async (eventItem: any) => {
          let event = eventItem.eventId;
          
          // If eventId is not populated or doesn't have details, fetch it
          if (!event || typeof event === 'string' || !event.details) {
            const eventId = typeof event === 'string' ? event : (event?._id?.toString() || eventItem.eventId?.toString());
            if (!eventId) return eventItem;
            event = await Event.findById(eventId).lean();
            if (!event) return eventItem;
          }
          
          return this.enrichEventItem(eventItem, event, packagePricing, getExtraCardPrice, getExpeditedDeliveryPrice);
        })
      );

      return {
        ...bill,
        events: enrichedEvents
      } as unknown as IBill;
    } catch (error: any) {
      logger.error('Error fetching bill by ID:', {
        billId,
        userId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Helper method to enrich event item with pricing breakdown and location
   */
  private static enrichEventItem(
    eventItem: any,
    event: any,
    packagePricing: Record<string, Record<number, number>>,
    getExtraCardPrice: (pkgType: string) => number,
    getExpeditedDeliveryPrice: (pkgType: string, isExpedited: boolean) => number
  ): any {
    // Calculate base price from package pricing
    const basePrice = packagePricing[event.packageType]?.[event.details.inviteCount] || 0;
    
    // Calculate additional costs
    const additionalCardsPrice = (event.details.additionalCards || 0) * getExtraCardPrice(event.packageType);
    const gateSupervisorsPrice = (event.details.gateSupervisors || 0) * 450;
    const expeditedDeliveryPrice = getExpeditedDeliveryPrice(event.packageType, event.details.fastDelivery || false);
    const extraHoursPrice = (event.details.extraHours || 0) * 150;
    
    const totalAdditionalCosts = additionalCardsPrice + gateSupervisorsPrice + expeditedDeliveryPrice + extraHoursPrice;
    
    // Use simple location name (displayName or detectedCity) instead of eventLocation
    const simpleLocation = event.details.displayName || event.details.detectedCity || eventItem.eventLocation || event.details.eventLocation;

    return {
      ...eventItem,
      eventDetails: event,
      pricingBreakdown: {
        basePrice,
        additionalCards: {
          count: event.details.additionalCards || 0,
          pricePerCard: getExtraCardPrice(event.packageType),
          total: additionalCardsPrice
        },
        gateSupervisors: {
          count: event.details.gateSupervisors || 0,
          pricePerSupervisor: 450,
          total: gateSupervisorsPrice
        },
        fastDelivery: {
          enabled: event.details.fastDelivery || false,
          price: expeditedDeliveryPrice
        },
        extraHours: {
          count: event.details.extraHours || 0,
          pricePerHour: 150,
          total: extraHoursPrice
        },
        totalAdditionalCosts,
        totalPrice: event.totalPrice || eventItem.price
      },
      simpleLocation
    };
  }
}
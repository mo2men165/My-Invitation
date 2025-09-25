// server/src/services/orderService.ts
import { Order, IOrder } from '../models/Order';
import { User, ICartItem } from '../models/User';
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import { Types } from 'mongoose';
import { NotificationService } from './notificationService';

export class OrderService {
  /**
   * Create a new order with selected cart items
   */
  static async createOrder(
    userId: string,
    selectedCartItemIds: string[],
    paymobOrderId: number,
    merchantOrderId: string,
    totalAmount: number
  ): Promise<IOrder> {
    try {
      // Get user and validate cart items
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // Find selected cart items
      const selectedCartItems = user.cart.filter(item => 
        selectedCartItemIds.includes(item._id!.toString())
      );

      if (selectedCartItems.length !== selectedCartItemIds.length) {
        throw new Error('بعض العناصر المحددة غير موجودة في السلة');
      }

      // Check if any selected items are already in pending orders
      const pendingOrders = await Order.find({
        userId: new Types.ObjectId(userId),
        status: 'pending',
        'selectedCartItems.cartItemId': { $in: selectedCartItemIds.map(id => new Types.ObjectId(id)) }
      });

      if (pendingOrders.length > 0) {
        throw new Error('بعض العناصر المحددة في طلبات معلقة بالفعل');
      }

      // Create order with cart snapshot
      const orderData = {
        userId: new Types.ObjectId(userId),
        paymobOrderId,
        merchantOrderId,
        selectedCartItems: selectedCartItems.map(item => ({
          cartItemId: item._id!,
          cartItemData: item
        })),
        totalAmount,
        status: 'pending' as const,
        paymentMethod: 'paymob'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      logger.info(`Order created successfully:`, {
        orderId: savedOrder._id,
        userId,
        paymobOrderId,
        selectedItemsCount: selectedCartItems.length,
        totalAmount
      });

      return savedOrder;
    } catch (error: any) {
      logger.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Process successful payment and create events
   */
  static async processSuccessfulPayment(
    paymobOrderId: number,
    transactionId: string
  ): Promise<{
    success: boolean;
    orderId?: string;
    eventsCreated?: number;
    events?: any[];
    error?: string;
  }> {
    try {
      // Find order by Paymob order ID
      const order = await Order.findOne({ paymobOrderId });
      if (!order) {
        logger.error(`Order not found for Paymob order ID: ${paymobOrderId}`);
        return {
          success: false,
          error: 'Order not found'
        };
      }

      if (order.status !== 'pending') {
        logger.warn(`Order ${order._id} is not pending, current status: ${order.status}`);
        return {
          success: false,
          error: 'Order is not pending'
        };
      }

      logger.info(`Processing successful payment for order:`, {
        orderId: order._id,
        userId: order.userId,
        paymobOrderId,
        selectedItemsCount: order.selectedCartItems.length
      });

      const paymentCompletedAt = new Date();
      const createdEvents = [];

      // Create events from cart snapshot
      for (const selectedItem of order.selectedCartItems) {
        const cartItem = selectedItem.cartItemData;
        
        logger.info(`Creating event from cart item:`, {
          cartItemId: selectedItem.cartItemId,
          hostName: cartItem.details.hostName,
          packageType: cartItem.packageType,
          totalPrice: cartItem.totalPrice
        });

        const eventData = {
          userId: order.userId,
          designId: cartItem.designId,
          packageType: cartItem.packageType,
          details: {
            ...cartItem.details,
            eventDate: new Date(cartItem.details.eventDate)
          },
          totalPrice: cartItem.totalPrice,
          status: 'upcoming' as const,
          approvalStatus: 'pending' as const,
          guests: [],
          paymentCompletedAt
        };

        const newEvent = new Event(eventData);
        const savedEvent = await newEvent.save();
        createdEvents.push(savedEvent);

        // Send notification
        try {
          await NotificationService.notifyNewEventPending(
            (savedEvent._id as Types.ObjectId).toString(),
            order.userId.toString(),
            {
              hostName: savedEvent.details.hostName,
              eventDate: savedEvent.details.eventDate.toLocaleDateString('ar-SA')
            }
          );
        } catch (notificationError: any) {
          logger.error(`Failed to send notification for event ${savedEvent._id}:`, notificationError.message);
        }
      }

      // Update order status
      order.status = 'completed';
      order.completedAt = paymentCompletedAt;
      order.paymobTransactionId = transactionId;
      order.eventsCreated = createdEvents.map(event => event._id as Types.ObjectId);
      await order.save();

      // Remove paid cart items from user's cart
      const user = await User.findById(order.userId);
      if (user) {
        const cartItemIdsToRemove = order.selectedCartItems.map(item => item.cartItemId);
        user.cart = user.cart.filter(item => !cartItemIdsToRemove.includes(item._id!));
        await user.save();

        logger.info(`Cart items removed for user ${order.userId}:`, {
          removedItemsCount: cartItemIdsToRemove.length,
          remainingItemsCount: user.cart.length
        });
      }

      logger.info(`Order processed successfully:`, {
        orderId: order._id,
        eventsCreated: createdEvents.length,
        totalAmount: order.totalAmount
      });

      return {
        success: true,
        orderId: (order._id as Types.ObjectId).toString(),
        eventsCreated: createdEvents.length,
        events: createdEvents
      };
    } catch (error: any) {
      logger.error('Error processing successful payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark order as failed
   */
  static async markOrderAsFailed(paymobOrderId: number): Promise<boolean> {
    try {
      const order = await Order.findOne({ paymobOrderId });
      if (!order) {
        logger.error(`Order not found for Paymob order ID: ${paymobOrderId}`);
        return false;
      }

      if (order.status === 'pending') {
        order.status = 'failed';
        order.failedAt = new Date();
        await order.save();

        logger.info(`Order marked as failed:`, {
          orderId: order._id,
          paymobOrderId
        });
      }

      return true;
    } catch (error: any) {
      logger.error('Error marking order as failed:', error);
      return false;
    }
  }

  /**
   * Get user's pending orders
   */
  static async getUserPendingOrders(userId: string): Promise<IOrder[]> {
    try {
      const orders = await Order.find({
        userId: new Types.ObjectId(userId),
        status: 'pending'
      }).sort({ createdAt: -1 });

      return orders;
    } catch (error: any) {
      logger.error('Error getting user pending orders:', error);
      throw error;
    }
  }

  /**
   * Get user's order history
   */
  static async getUserOrderHistory(userId: string, limit: number = 10): Promise<IOrder[]> {
    try {
      const orders = await Order.find({
        userId: new Types.ObjectId(userId)
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('eventsCreated', 'details.hostName details.eventDate status approvalStatus');

      return orders;
    } catch (error: any) {
      logger.error('Error getting user order history:', error);
      throw error;
    }
  }

  /**
   * Check if cart items are in pending orders
   */
  static async getPendingCartItemIds(userId: string): Promise<string[]> {
    try {
      const pendingOrders = await Order.find({
        userId: new Types.ObjectId(userId),
        status: 'pending'
      });

      const pendingCartItemIds = pendingOrders.flatMap(order =>
        order.selectedCartItems.map(item => item.cartItemId.toString())
      );

      return pendingCartItemIds;
    } catch (error: any) {
      logger.error('Error getting pending cart item IDs:', error);
      throw error;
    }
  }
}

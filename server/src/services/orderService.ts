// server/src/services/orderService.ts
import { Order, IOrder } from '../models/Order';
import { User, ICartItem } from '../models/User';
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import { Types } from 'mongoose';
import { CacheService } from './cacheService';
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
    const orderCreationId = `order_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info(`📝 ORDER CREATION STARTED [${orderCreationId}]`, {
        orderCreationId,
        userId,
        paymobOrderId,
        merchantOrderId,
        selectedCartItemIds,
        totalAmount,
        timestamp: new Date().toISOString()
      });

      // Get user and validate cart items
      const user = await User.findById(userId);
      if (!user) {
        logger.error(`❌ USER NOT FOUND [${orderCreationId}]`, {
          orderCreationId,
          userId,
          action: 'ABORTING_ORDER_CREATION'
        });
        throw new Error('المستخدم غير موجود');
      }

      logger.info(`✅ USER FOUND [${orderCreationId}]`, {
        orderCreationId,
        userId,
        userCartLength: user.cart.length
      });

      // Find selected cart items
      const selectedCartItems = user.cart.filter(item => 
        selectedCartItemIds.includes(item._id!.toString())
      );

      logger.info(`🔍 CART ITEMS VALIDATION [${orderCreationId}]`, {
        orderCreationId,
        userId,
        requestedItemIds: selectedCartItemIds,
        foundItemsCount: selectedCartItems.length,
        foundItemIds: selectedCartItems.map(item => item._id!.toString()),
        missingItemIds: selectedCartItemIds.filter(id => 
          !selectedCartItems.some(item => item._id!.toString() === id)
        )
      });

      if (selectedCartItems.length !== selectedCartItemIds.length) {
        logger.error(`❌ CART ITEMS VALIDATION FAILED [${orderCreationId}]`, {
          orderCreationId,
          userId,
          requestedCount: selectedCartItemIds.length,
          foundCount: selectedCartItems.length,
          missingItems: selectedCartItemIds.filter(id => 
            !selectedCartItems.some(item => item._id!.toString() === id)
          )
        });
        throw new Error('بعض العناصر المحددة غير موجودة في السلة');
      }

      // Check if any selected items are already in pending orders
      logger.info(`🔍 CHECKING FOR EXISTING PENDING ORDERS [${orderCreationId}]`, {
        orderCreationId,
        userId,
        selectedItemIds: selectedCartItemIds
      });

      const pendingOrders = await Order.find({
        userId: new Types.ObjectId(userId),
        status: 'pending',
        'selectedCartItems.cartItemId': { $in: selectedCartItemIds.map(id => new Types.ObjectId(id)) }
      });

      logger.info(`📋 PENDING ORDERS CHECK RESULT [${orderCreationId}]`, {
        orderCreationId,
        userId,
        pendingOrdersFound: pendingOrders.length,
        pendingOrderIds: pendingOrders.map(order => order._id),
        conflictingItems: pendingOrders.flatMap(order => 
          order.selectedCartItems.map(item => item.cartItemId.toString())
        )
      });

      if (pendingOrders.length > 0) {
        logger.error(`❌ CONFLICTING PENDING ORDERS FOUND [${orderCreationId}]`, {
          orderCreationId,
          userId,
          conflictingOrderIds: pendingOrders.map(order => order._id),
          conflictingItems: pendingOrders.flatMap(order => 
            order.selectedCartItems.map(item => item.cartItemId.toString())
          )
        });
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

      logger.info(`📝 CREATING ORDER RECORD [${orderCreationId}]`, {
        orderCreationId,
        userId,
        paymobOrderId,
        merchantOrderId,
        selectedItemsCount: orderData.selectedCartItems.length,
        totalAmount: orderData.totalAmount,
        orderData: {
          userId: orderData.userId.toString(),
          paymobOrderId: orderData.paymobOrderId,
          merchantOrderId: orderData.merchantOrderId,
          totalAmount: orderData.totalAmount,
          status: orderData.status,
          paymentMethod: orderData.paymentMethod,
          selectedItems: orderData.selectedCartItems.map(item => ({
            cartItemId: item.cartItemId.toString(),
            hostName: item.cartItemData.details.hostName,
            packageType: item.cartItemData.packageType,
            price: item.cartItemData.totalPrice
          }))
        }
      });

      const order = new Order(orderData);
      const savedOrder = await order.save();

      logger.info(`✅ ORDER CREATED SUCCESSFULLY [${orderCreationId}]`, {
        orderCreationId,
        userId,
        paymobOrderId,
        merchantOrderId,
        ourOrderId: savedOrder._id,
        selectedItemsCount: savedOrder.selectedCartItems.length,
        totalAmount: savedOrder.totalAmount,
        status: savedOrder.status,
        createdAt: savedOrder.createdAt,
        orderSnapshot: {
          selectedItems: savedOrder.selectedCartItems.map(item => ({
            cartItemId: item.cartItemId.toString(),
            hostName: item.cartItemData.details.hostName,
            packageType: item.cartItemData.packageType,
            eventDate: item.cartItemData.details.eventDate,
            price: item.cartItemData.totalPrice
          }))
        }
      });

      return savedOrder;

    } catch (error: any) {
      logger.error(`💥 ORDER CREATION FAILED [${orderCreationId}]`, {
        orderCreationId,
        userId,
        paymobOrderId,
        merchantOrderId,
        selectedCartItemIds,
        totalAmount,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Process successful payment and create events
   */
  static async processSuccessfulPayment(
    merchantOrderId: string,
    transactionId: string
  ): Promise<{
    success: boolean;
    orderId?: string;
    eventsCreated?: number;
    events?: any[];
    error?: string;
  }> {
    try {
      // Find order by merchant order ID
      const order = await Order.findOne({ merchantOrderId });
      if (!order) {
        logger.error(`Order not found for merchant order ID: ${merchantOrderId}`);
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
        merchantOrderId,
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
        const cartItemIdsToRemove = order.selectedCartItems.map(item => item.cartItemId.toString());
        user.cart = user.cart.filter(item => !cartItemIdsToRemove.includes(item._id!.toString()));
        await user.save();

        // Invalidate cart cache to prevent stale data
        try {
          await CacheService.invalidateUserCartCache((order.userId as Types.ObjectId).toString());
          logger.info(`Cart cache invalidated for user ${order.userId}`);
        } catch (cacheError: any) {
          logger.error(`Failed to invalidate cart cache for user ${order.userId}:`, cacheError.message);
          // Don't throw error - cache failure shouldn't stop the process
        }

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
  static async markOrderAsFailed(merchantOrderId: string): Promise<boolean> {
    try {
      const order = await Order.findOne({ merchantOrderId });
      if (!order) {
        logger.error(`Order not found for merchant order ID: ${merchantOrderId}`);
        return false;
      }

      if (order.status === 'pending') {
        order.status = 'failed';
        order.failedAt = new Date();
        await order.save();

        logger.info(`Order marked as failed:`, {
          orderId: order._id,
          merchantOrderId
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

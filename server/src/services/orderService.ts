// server/src/services/orderService.ts
import { Order, IOrder } from '../models/Order';
import { User, ICartItem } from '../models/User';
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import { Types } from 'mongoose';
import { CacheService } from './cacheService';
import { NotificationService } from './notificationService';
import { BillService } from './billService';

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
        merchantOrderId,
        paymentProvider: 'paymob' as const,
        paymobOrderId,
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
            eventDate: new Date(cartItem.details.eventDate),
            // Explicitly preserve custom design fields
            isCustomDesign: cartItem.details.isCustomDesign || false,
            customDesignNotes: cartItem.details.customDesignNotes || ''
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
        } catch (cacheError: any) {
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

      // Create bill for this order (don't await to avoid blocking)
      BillService.createBillFromOrder((order._id as Types.ObjectId).toString())
        .then((bill) => {
          if (bill) {
            logger.info(`Bill created successfully for order ${order._id}:`, {
              billId: bill._id,
              billNumber: bill.billNumber
            });
          }
        })
        .catch((billError) => {
          logger.error(`Failed to create bill for order ${order._id}:`, billError);
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

  /**
   * Create a new Tabby order with selected cart items
   */
  static async createTabbyOrder(
    userId: string,
    selectedCartItemIds: string[],
    tabbySessionId: string,
    tabbyPaymentId: string,
    merchantOrderId: string,
    totalAmount: number
  ): Promise<IOrder> {
    const orderCreationId = `tabby_order_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info(`📝 TABBY ORDER CREATION STARTED [${orderCreationId}]`, {
        orderCreationId,
        userId,
        tabbySessionId,
        tabbyPaymentId,
        merchantOrderId,
        selectedCartItemIds,
        totalAmount,
        timestamp: new Date().toISOString()
      });

      // Get user and validate cart items
      const user = await User.findById(userId);
      if (!user) {
        logger.error(`❌ USER NOT FOUND [${orderCreationId}]`, { orderCreationId, userId });
        throw new Error('المستخدم غير موجود');
      }

      // Find selected cart items
      const selectedCartItems = user.cart.filter(item => 
        selectedCartItemIds.includes(item._id!.toString())
      );

      if (selectedCartItems.length !== selectedCartItemIds.length) {
        logger.error(`❌ CART ITEMS VALIDATION FAILED [${orderCreationId}]`, {
          orderCreationId,
          userId,
          requestedCount: selectedCartItemIds.length,
          foundCount: selectedCartItems.length
        });
        throw new Error('بعض العناصر المحددة غير موجودة في السلة');
      }

      // Check for existing pending orders with these items
      const pendingOrders = await Order.find({
        userId: new Types.ObjectId(userId),
        status: 'pending',
        'selectedCartItems.cartItemId': { $in: selectedCartItemIds.map(id => new Types.ObjectId(id)) }
      });

      if (pendingOrders.length > 0) {
        logger.error(`❌ CONFLICTING PENDING ORDERS FOUND [${orderCreationId}]`, {
          orderCreationId,
          conflictingOrderIds: pendingOrders.map(order => order._id)
        });
        throw new Error('بعض العناصر المحددة في طلبات معلقة بالفعل');
      }

      // Create order with cart snapshot
      const orderData = {
        userId: new Types.ObjectId(userId),
        merchantOrderId,
        paymentProvider: 'tabby' as const,
        tabbySessionId,
        tabbyPaymentId,
        selectedCartItems: selectedCartItems.map(item => ({
          cartItemId: item._id!,
          cartItemData: item
        })),
        totalAmount,
        status: 'pending' as const,
        paymentMethod: 'tabby'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      logger.info(`✅ TABBY ORDER CREATED SUCCESSFULLY [${orderCreationId}]`, {
        orderCreationId,
        userId,
        tabbySessionId,
        tabbyPaymentId,
        merchantOrderId,
        ourOrderId: savedOrder._id,
        selectedItemsCount: savedOrder.selectedCartItems.length,
        totalAmount: savedOrder.totalAmount
      });

      return savedOrder;

    } catch (error: any) {
      logger.error(`💥 TABBY ORDER CREATION FAILED [${orderCreationId}]`, {
        orderCreationId,
        userId,
        tabbySessionId,
        tabbyPaymentId,
        merchantOrderId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Process successful Tabby payment and create events
   */
  static async processSuccessfulTabbyPayment(
    tabbyPaymentId: string,
    tabbyStatus: string
  ): Promise<{
    success: boolean;
    orderId?: string;
    eventsCreated?: number;
    events?: any[];
    error?: string;
  }> {
    const processId = `tabby_process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info(`🔄 PROCESSING TABBY PAYMENT [${processId}]`, {
        processId,
        tabbyPaymentId,
        tabbyStatus
      });

      // Find order by Tabby payment ID
      const order = await Order.findOne({ tabbyPaymentId });
      if (!order) {
        logger.error(`❌ ORDER NOT FOUND FOR TABBY PAYMENT [${processId}]`, { tabbyPaymentId });
        return { success: false, error: 'Order not found' };
      }

      if (order.status !== 'pending') {
        logger.warn(`⚠️ ORDER NOT PENDING [${processId}]`, {
          orderId: order._id,
          currentStatus: order.status
        });
        return { success: false, error: 'Order is not pending' };
      }

      // Update tabby status
      order.tabbyStatus = tabbyStatus;
      
      // Process using existing successful payment logic
      const paymentCompletedAt = new Date();
      const createdEvents = [];

      // Create events from cart snapshot
      for (const selectedItem of order.selectedCartItems) {
        const cartItem = selectedItem.cartItemData;
        
        const eventData = {
          userId: order.userId,
          designId: cartItem.designId,
          packageType: cartItem.packageType,
          details: {
            ...cartItem.details,
            eventDate: new Date(cartItem.details.eventDate),
            isCustomDesign: cartItem.details.isCustomDesign || false,
            customDesignNotes: cartItem.details.customDesignNotes || ''
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
      order.eventsCreated = createdEvents.map(event => event._id as Types.ObjectId);
      await order.save();

      // Remove paid cart items from user's cart
      const user = await User.findById(order.userId);
      if (user) {
        const cartItemIdsToRemove = order.selectedCartItems.map(item => item.cartItemId.toString());
        user.cart = user.cart.filter(item => !cartItemIdsToRemove.includes(item._id!.toString()));
        await user.save();

        try {
          await CacheService.invalidateUserCartCache((order.userId as Types.ObjectId).toString());
        } catch (cacheError: any) {
          // Cache failure shouldn't stop the process
        }
      }

      logger.info(`✅ TABBY PAYMENT PROCESSED SUCCESSFULLY [${processId}]`, {
        processId,
        orderId: order._id,
        eventsCreated: createdEvents.length
      });

      // Create bill (non-blocking)
      BillService.createBillFromOrder((order._id as Types.ObjectId).toString())
        .then((bill) => {
          if (bill) {
            logger.info(`Bill created for Tabby order ${order._id}:`, { billId: bill._id });
          }
        })
        .catch((billError) => {
          logger.error(`Failed to create bill for Tabby order ${order._id}:`, billError);
        });

      return {
        success: true,
        orderId: (order._id as Types.ObjectId).toString(),
        eventsCreated: createdEvents.length,
        events: createdEvents
      };

    } catch (error: any) {
      logger.error(`💥 TABBY PAYMENT PROCESSING FAILED [${processId}]`, {
        processId,
        tabbyPaymentId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Find order by Tabby payment ID
   */
  static async findByTabbyPaymentId(tabbyPaymentId: string): Promise<IOrder | null> {
    try {
      return await Order.findOne({ tabbyPaymentId });
    } catch (error: any) {
      logger.error('Error finding order by Tabby payment ID:', error);
      throw error;
    }
  }

  /**
   * Create a new Tamara order with selected cart items
   */
  static async createTamaraOrder(
    userId: string,
    selectedCartItemIds: string[],
    tamaraOrderId: string,
    tamaraCheckoutId: string,
    merchantOrderId: string,
    totalAmount: number
  ): Promise<IOrder> {
    const orderCreationId = `tamara_order_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info(`📝 TAMARA ORDER CREATION STARTED [${orderCreationId}]`, {
        orderCreationId,
        userId,
        tamaraOrderId,
        tamaraCheckoutId,
        merchantOrderId,
        selectedCartItemIds,
        totalAmount,
        timestamp: new Date().toISOString()
      });

      const user = await User.findById(userId);
      if (!user) {
        logger.error(`❌ USER NOT FOUND [${orderCreationId}]`, { orderCreationId, userId });
        throw new Error('المستخدم غير موجود');
      }

      const selectedCartItems = user.cart.filter(item => 
        selectedCartItemIds.includes(item._id!.toString())
      );

      if (selectedCartItems.length !== selectedCartItemIds.length) {
        logger.error(`❌ CART ITEMS VALIDATION FAILED [${orderCreationId}]`, {
          orderCreationId,
          userId,
          requestedCount: selectedCartItemIds.length,
          foundCount: selectedCartItems.length
        });
        throw new Error('بعض العناصر المحددة غير موجودة في السلة');
      }

      const pendingOrders = await Order.find({
        userId: new Types.ObjectId(userId),
        status: 'pending',
        'selectedCartItems.cartItemId': { $in: selectedCartItemIds.map(id => new Types.ObjectId(id)) }
      });

      if (pendingOrders.length > 0) {
        logger.error(`❌ CONFLICTING PENDING ORDERS FOUND [${orderCreationId}]`, {
          orderCreationId,
          conflictingOrderIds: pendingOrders.map(order => order._id)
        });
        throw new Error('بعض العناصر المحددة في طلبات معلقة بالفعل');
      }

      const orderData = {
        userId: new Types.ObjectId(userId),
        merchantOrderId,
        paymentProvider: 'tamara' as const,
        tamaraOrderId,
        tamaraCheckoutId,
        tamaraStatus: 'pending',
        selectedCartItems: selectedCartItems.map(item => ({
          cartItemId: item._id!,
          cartItemData: item
        })),
        totalAmount,
        status: 'pending' as const,
        paymentMethod: 'tamara'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      logger.info(`✅ TAMARA ORDER CREATED SUCCESSFULLY [${orderCreationId}]`, {
        orderCreationId,
        userId,
        tamaraOrderId,
        tamaraCheckoutId,
        merchantOrderId,
        ourOrderId: savedOrder._id,
        selectedItemsCount: savedOrder.selectedCartItems.length,
        totalAmount: savedOrder.totalAmount
      });

      return savedOrder;

    } catch (error: any) {
      logger.error(`💥 TAMARA ORDER CREATION FAILED [${orderCreationId}]`, {
        orderCreationId,
        userId,
        tamaraOrderId,
        merchantOrderId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Process successful Tamara payment and create events
   */
  /**
   * Complete Tamara checkout using our merchant order reference (Tamara webhook order_reference_id).
   */
  static async processSuccessfulTamaraPaymentByMerchantOrderId(
    merchantOrderId: string,
    tamaraStatus: string
  ): Promise<{
    success: boolean;
    orderId?: string;
    eventsCreated?: number;
    events?: any[];
    error?: string;
  }> {
    try {
      const order = await Order.findOne({
        merchantOrderId,
        paymentProvider: 'tamara'
      });
      if (!order?.tamaraOrderId) {
        return { success: false, error: 'Order not found' };
      }
      return OrderService.processSuccessfulTamaraPayment(
        order.tamaraOrderId,
        tamaraStatus
      );
    } catch (error: any) {
      logger.error('processSuccessfulTamaraPaymentByMerchantOrderId failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async processSuccessfulTamaraPayment(
    tamaraOrderId: string,
    tamaraStatus: string
  ): Promise<{
    success: boolean;
    orderId?: string;
    eventsCreated?: number;
    events?: any[];
    error?: string;
  }> {
    const processId = `tamara_process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info(`🔄 PROCESSING TAMARA PAYMENT [${processId}]`, {
        processId,
        tamaraOrderId,
        tamaraStatus
      });

      const order = await Order.findOne({ tamaraOrderId });
      if (!order) {
        logger.error(`❌ ORDER NOT FOUND FOR TAMARA ORDER [${processId}]`, { tamaraOrderId });
        return { success: false, error: 'Order not found' };
      }

      if (order.status !== 'pending') {
        logger.warn(`⚠️ ORDER NOT PENDING [${processId}]`, {
          orderId: order._id,
          currentStatus: order.status
        });
        return { success: false, error: 'Order is not pending' };
      }

      order.tamaraStatus = tamaraStatus as IOrder['tamaraStatus'];
      
      const paymentCompletedAt = new Date();
      const createdEvents = [];

      for (const selectedItem of order.selectedCartItems) {
        const cartItem = selectedItem.cartItemData;
        
        const eventData = {
          userId: order.userId,
          designId: cartItem.designId,
          packageType: cartItem.packageType,
          details: {
            ...cartItem.details,
            eventDate: new Date(cartItem.details.eventDate),
            isCustomDesign: cartItem.details.isCustomDesign || false,
            customDesignNotes: cartItem.details.customDesignNotes || ''
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

      order.status = 'completed';
      order.completedAt = paymentCompletedAt;
      order.eventsCreated = createdEvents.map(event => event._id as Types.ObjectId);
      await order.save();

      const user = await User.findById(order.userId);
      if (user) {
        const cartItemIdsToRemove = order.selectedCartItems.map(item => item.cartItemId.toString());
        user.cart = user.cart.filter(item => !cartItemIdsToRemove.includes(item._id!.toString()));
        await user.save();

        try {
          await CacheService.invalidateUserCartCache((order.userId as Types.ObjectId).toString());
        } catch (cacheError: any) {
          // Cache failure shouldn't stop the process
        }
      }

      logger.info(`✅ TAMARA PAYMENT PROCESSED SUCCESSFULLY [${processId}]`, {
        processId,
        orderId: order._id,
        eventsCreated: createdEvents.length
      });

      BillService.createBillFromOrder((order._id as Types.ObjectId).toString())
        .then((bill) => {
          if (bill) {
            logger.info(`Bill created for Tamara order ${order._id}:`, { billId: bill._id });
          }
        })
        .catch((billError) => {
          logger.error(`Failed to create bill for Tamara order ${order._id}:`, billError);
        });

      return {
        success: true,
        orderId: (order._id as Types.ObjectId).toString(),
        eventsCreated: createdEvents.length,
        events: createdEvents
      };

    } catch (error: any) {
      logger.error(`💥 TAMARA PAYMENT PROCESSING FAILED [${processId}]`, {
        processId,
        tamaraOrderId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Find order by Tamara order ID
   */
  static async findByTamaraOrderId(tamaraOrderId: string): Promise<IOrder | null> {
    try {
      return await Order.findOne({ tamaraOrderId });
    } catch (error: any) {
      logger.error('Error finding order by Tamara order ID:', error);
      throw error;
    }
  }

  /**
   * Mark Tamara order as failed
   */
  static async markTamaraOrderAsFailed(tamaraOrderId: string, tamaraStatus: string): Promise<boolean> {
    try {
      const order = await Order.findOne({ tamaraOrderId });
      if (!order) {
        logger.error(`Order not found for Tamara order ID: ${tamaraOrderId}`);
        return false;
      }

      if (order.status === 'pending') {
        order.status = 'failed';
        order.failedAt = new Date();
        order.tamaraStatus = tamaraStatus as IOrder['tamaraStatus'];
        await order.save();

        logger.info(`Tamara order marked as failed:`, {
          orderId: order._id,
          tamaraOrderId,
          tamaraStatus
        });
      }

      return true;
    } catch (error: any) {
      logger.error('Error marking Tamara order as failed:', error);
      return false;
    }
  }

  static async markTamaraOrderAsFailedByMerchantOrderId(
    merchantOrderId: string,
    tamaraStatus: string
  ): Promise<boolean> {
    try {
      const order = await Order.findOne({ merchantOrderId, paymentProvider: 'tamara' });
      if (!order) {
        logger.error(`Order not found for Tamara merchant order ID: ${merchantOrderId}`);
        return false;
      }

      if (order.status === 'pending') {
        order.status = 'failed';
        order.failedAt = new Date();
        order.tamaraStatus = tamaraStatus as IOrder['tamaraStatus'];
        await order.save();

        logger.info(`Tamara order marked as failed by merchant reference:`, {
          orderId: order._id,
          merchantOrderId,
          tamaraStatus
        });
      }

      return true;
    } catch (error: any) {
      logger.error('Error marking Tamara order as failed by merchant ref:', error);
      return false;
    }
  }

  /**
   * Mark Tabby order as failed
   */
  static async markTabbyOrderAsFailed(tabbyPaymentId: string, tabbyStatus: string): Promise<boolean> {
    try {
      const order = await Order.findOne({ tabbyPaymentId });
      if (!order) {
        logger.error(`Order not found for Tabby payment ID: ${tabbyPaymentId}`);
        return false;
      }

      if (order.status === 'pending') {
        order.status = 'failed';
        order.failedAt = new Date();
        order.tabbyStatus = tabbyStatus;
        await order.save();

        logger.info(`Tabby order marked as failed:`, {
          orderId: order._id,
          tabbyPaymentId,
          tabbyStatus
        });
      }

      return true;
    } catch (error: any) {
      logger.error('Error marking Tabby order as failed:', error);
      return false;
    }
  }
}

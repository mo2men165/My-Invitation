// routes/payment.ts
import { Router, Request, Response } from 'express';
import cors from 'cors';
import { PaymentService } from '../services/paymentService';
import { paymobService } from '../services/paymobService';
import { OrderService } from '../services/orderService';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';
import { PaymobWebhookData } from '../types/paymob';

const router = Router();

// Apply authentication middleware to all payment routes except webhook
router.use((req, res, next) => {
  // Skip authentication for webhook routes
  if (req.path.includes('/webhook')) {
    return next();
  }
  // Apply authentication for all other routes
  checkJwt(req, res, (err) => {
    if (err) return next(err);
    extractUser(req, res, (err) => {
      if (err) return next(err);
      requireActiveUser(req, res, next);
    });
  });
});

/**
 * GET /api/payment/summary
 * Get payment summary for current cart
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await PaymentService.getCartPaymentSummary(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.message }
      });
    }

    return res.json({
      success: true,
      summary: result.summary
    });

  } catch (error: any) {
    logger.error('Error getting payment summary:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب ملخص الدفع' }
    });
  }
});

/**
 * POST /api/payment/create-paymob-order
 * Create Paymob order and get payment URL
 */
router.post('/create-paymob-order', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { customerInfo, selectedCartItemIds } = req.body;

    // Validate required fields
    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone || !customerInfo.city) {
      return res.status(400).json({
        success: false,
        error: { message: 'معلومات العميل مطلوبة' }
      });
    }

    // If no selectedCartItemIds provided, use all cart items (backward compatibility)
    if (!selectedCartItemIds || !Array.isArray(selectedCartItemIds) || selectedCartItemIds.length === 0) {
      // For backward compatibility, if no specific items selected, use all cart items
      const allCartSummary = await PaymentService.getCartPaymentSummary(userId);
      if (!allCartSummary.success || !allCartSummary.summary) {
        return res.status(400).json({
          success: false,
          error: { message: 'السلة فارغة أو غير صحيحة' }
        });
      }
      selectedCartItemIds = allCartSummary.summary.items.map(item => item.id);
    }

    // Get cart summary for selected items only
    const cartSummary = await PaymentService.getCartPaymentSummary(userId, selectedCartItemIds);
    if (!cartSummary.success || !cartSummary.summary) {
      return res.status(400).json({
        success: false,
        error: { message: 'السلة فارغة أو غير صحيحة' }
      });
    }

    // Debug logging
    logger.info(`Cart summary for user ${userId} (selected items):`, {
      selectedItemIds: selectedCartItemIds,
      itemCount: cartSummary.summary.itemCount,
      totalAmount: cartSummary.summary.totalAmount,
      items: cartSummary.summary.items.map(item => ({
        id: item.id,
        hostName: item.hostName,
        price: item.price,
        packageType: item.packageType
      }))
    });

    // Prepare items for Paymob
    const items = cartSummary.summary.items.map(item => ({
      name: `دعوة ${item.hostName}`,
      description: `دعوة ${item.packageType} لـ ${item.hostName} في ${item.eventLocation}`,
      quantity: 1,
      price: item.price
    }));

    // Create Paymob order
    const paymobOrder = await paymobService.createOrder({
      userId,
      amount: cartSummary.summary.totalAmount,
      items,
      customerInfo
    });

    // Generate payment key
    const paymentKey = await paymobService.generatePaymentKey(paymobOrder.id, cartSummary.summary.totalAmount, customerInfo);

    // Create our internal order record
    const merchantOrderId = `ORDER_${userId}_${Date.now()}`;
    const order = await OrderService.createOrder(
      userId,
      selectedCartItemIds,
      paymobOrder.id,
      merchantOrderId,
      cartSummary.summary.totalAmount
    );

    // Get iframe URL
    const iframeUrl = paymobService.getIframeUrl(paymentKey.token);

    logger.info(`Paymob order created for user ${userId}:`, {
      paymobOrderId: paymobOrder.id,
      ourOrderId: order._id,
      selectedItemsCount: selectedCartItemIds.length,
      totalAmount: cartSummary.summary.totalAmount
    });

    return res.json({
      success: true,
      orderId: paymobOrder.id,
      ourOrderId: order._id,
      paymentToken: paymentKey.token,
      iframeUrl,
      amount: cartSummary.summary.totalAmount,
      currency: 'SAR'
    });

  } catch (error: any) {
    logger.error('Error creating Paymob order:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في إنشاء طلب الدفع' }
    });
  }
});

/**
 * POST /api/payment/process
 * Process successful payment and convert cart to events
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { paymentId, amount, paymentMethod, transactionId } = req.body;

    // Validate required fields
    if (!paymentId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الدفع والمبلغ وطريقة الدفع مطلوبة' }
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'مبلغ الدفع غير صحيح' }
      });
    }

    const result = await PaymentService.processSuccessfulPayment(userId, {
      paymentId,
      amount,
      paymentMethod,
      transactionId
    });

    logger.info(`Payment processed successfully for user ${userId}, payment ${paymentId}`);

    return res.json({
      success: true,
      message: 'تم الدفع بنجاح وإنشاء المناسبات',
      eventsCreated: result.eventsCreated,
      events: result.events,
      paymentId: result.paymentId,
      totalAmount: result.totalAmount
    });

  } catch (error: any) {
    logger.error('Error processing payment:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في معالجة الدفع' }
    });
  }
});

/**
 * POST /api/payment/failed
 * Handle payment failure
 */
router.post('/failed', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { paymentId, amount, errorReason } = req.body;

    if (!paymentId || !errorReason) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الدفع وسبب الفشل مطلوبان' }
      });
    }

    const result = await PaymentService.processFailedPayment(userId, {
      paymentId,
      amount,
      errorReason
    });

    return res.json(result);

  } catch (error: any) {
    logger.error('Error processing payment failure:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في معالجة فشل الدفع' }
    });
  }
});

/**
 * GET /api/payment/paymob/config
 * Get Paymob configuration for frontend
 */
router.get('/paymob/config', async (req: Request, res: Response) => {
  try {
    const config = paymobService.getConfig();
    
    return res.json({
      success: true,
      config
    });
  } catch (error: any) {
    logger.error('Error getting Paymob config:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب إعدادات الدفع' }
    });
  }
});

/**
 * POST /api/payment/paymob/webhook
 * Handle Paymob webhook notifications
 * This route should NOT require authentication as it's called by Paymob
 */
router.post('/paymob/webhook', cors(), async (req: Request, res: Response) => {
  try {
    const webhookData: PaymobWebhookData = req.body;
    // Paymob sends signature as query parameter 'hmac', not in headers
    const signature = req.query.hmac as string || req.headers['x-paymob-signature'] as string;

    // Debug logging
    logger.info('Paymob webhook received:', {
      hasSignature: !!signature,
      signatureFromQuery: req.query.hmac,
      signatureFromHeader: req.headers['x-paymob-signature'],
      allHeaders: Object.keys(req.headers),
      queryParams: req.query,
      webhookType: webhookData.type,
      transactionId: webhookData.obj?.id,
      hasSecretKey: !!process.env.PAYMOB_SECRET_KEY,
      secretKeyLength: process.env.PAYMOB_SECRET_KEY?.length || 0
    });

    // Verify webhook signature (bypass for testing if needed)
    const bypassSignature = process.env.PAYMOB_BYPASS_SIGNATURE === 'true';
    if (!bypassSignature && !paymobService.verifyWebhookSignature(webhookData, signature)) {
      logger.warn('Invalid Paymob webhook signature', {
        receivedSignature: signature,
        hasSecretKey: !!process.env.PAYMOB_SECRET_KEY,
        webhookDataKeys: Object.keys(webhookData),
        bypassEnabled: bypassSignature
      });
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid signature' }
      });
    }
    
    if (bypassSignature) {
      logger.info('Signature validation bypassed for testing');
    }

    // Process webhook
    const result = await paymobService.processWebhook(webhookData);
    
    if (!result.success) {
      logger.error('Failed to process Paymob webhook:', result.error);
      return res.status(500).json({
        success: false,
        error: { message: result.error }
      });
    }

    // Handle payment result
    logger.info('Webhook result analysis:', {
      status: result.status,
      paymobOrderId: result.orderId,
      transactionId: result.transactionId,
      amount: result.amount,
      willProcessPayment: result.status === 'success' && result.orderId && result.transactionId
    });

    if (result.status === 'success' && result.orderId && result.transactionId) {
      try {
        // Process successful payment using OrderService
        const paymentResult = await OrderService.processSuccessfulPayment(
          Number(result.orderId), // This is the Paymob order ID
          result.transactionId
        );

        if (paymentResult.success) {
          logger.info(`Payment webhook processed successfully:`, {
            paymobOrderId: result.orderId,
            ourOrderId: paymentResult.orderId,
            transactionId: result.transactionId,
            eventsCreated: paymentResult.eventsCreated,
            amount: result.amount
          });
        } else {
          logger.error(`Failed to process payment:`, {
            paymobOrderId: result.orderId,
            transactionId: result.transactionId,
            error: paymentResult.error
          });
        }
      } catch (error: any) {
        logger.error('Error processing successful payment from webhook:', {
          error: error.message,
          stack: error.stack,
          paymobOrderId: result.orderId,
          transactionId: result.transactionId
        });
        // Don't return error to Paymob to avoid retries
      }
    } else if (result.status === 'failed' && result.orderId) {
      try {
        // Mark order as failed
        const markedAsFailed = await OrderService.markOrderAsFailed(Number(result.orderId));
        if (markedAsFailed) {
          logger.info(`Order marked as failed:`, {
            paymobOrderId: result.orderId,
            transactionId: result.transactionId
          });
        }
      } catch (error: any) {
        logger.error('Error marking order as failed:', {
          error: error.message,
          paymobOrderId: result.orderId
        });
      }
    } else {
      logger.info('Payment not processed - conditions not met:', {
        status: result.status,
        hasOrderId: !!result.orderId,
        hasTransactionId: !!result.transactionId,
        paymobOrderId: result.orderId,
        transactionId: result.transactionId
      });
    }

    return res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error: any) {
    logger.error('Error processing Paymob webhook:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في معالجة إشعار الدفع' }
    });
  }
});

/**
 * POST /api/payment/paymob/callback
 * Unified callback endpoint for Paymob success/failure redirects
 * This endpoint receives POST data from Paymob and redirects user accordingly
 */
router.post('/paymob/callback', cors(), async (req: Request, res: Response) => {
  try {
    const webhookData: PaymobWebhookData = req.body;
    
    logger.info('Paymob callback received:', {
      type: webhookData.type,
      transactionId: webhookData.obj?.id,
      success: webhookData.obj?.success,
      pending: webhookData.obj?.pending,
      orderId: webhookData.obj?.merchant_order_id
    });

    // Extract transaction details
    const transactionId = webhookData.obj?.id?.toString();
    const orderId = webhookData.obj?.merchant_order_id;
    const amount = webhookData.obj?.amount_cents ? webhookData.obj.amount_cents / 100 : 0;
    const success = webhookData.obj?.success;
    const pending = webhookData.obj?.pending;

    // Determine redirect URL based on payment status
    let redirectUrl: string;
    
    if (success && !pending) {
      // Payment successful - redirect to success page
      redirectUrl = `${process.env.FRONTEND_URL}/payment/success?transaction_id=${transactionId}&order_id=${orderId}&amount=${amount}&status=success`;
    } else if (!success) {
      // Payment failed - redirect to failure page
      redirectUrl = `${process.env.FRONTEND_URL}/payment/failure?transaction_id=${transactionId}&order_id=${orderId}&amount=${amount}&status=failed`;
    } else {
      // Payment pending - redirect to pending page
      redirectUrl = `${process.env.FRONTEND_URL}/payment/pending?transaction_id=${transactionId}&order_id=${orderId}&amount=${amount}&status=pending`;
    }

    logger.info(`Redirecting user to: ${redirectUrl}`);

    // Redirect user to appropriate page
    return res.redirect(redirectUrl);

  } catch (error: any) {
    logger.error('Error processing Paymob callback:', error);
    
    // Redirect to error page on any error
    const errorUrl = `${process.env.FRONTEND_URL}/payment/error?message=${encodeURIComponent('خطأ في معالجة الدفع')}`;
    return res.redirect(errorUrl);
  }
});

/**
 * GET /api/payment/pending-orders
 * Get user's pending orders
 */
router.get('/pending-orders', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const pendingOrders = await OrderService.getUserPendingOrders(userId);
    
    return res.json({
      success: true,
      orders: pendingOrders.map(order => ({
        id: order._id,
        paymobOrderId: order.paymobOrderId,
        totalAmount: order.totalAmount,
        selectedItemsCount: order.selectedCartItems.length,
        createdAt: order.createdAt,
        selectedItems: order.selectedCartItems.map(item => ({
          cartItemId: item.cartItemId,
          hostName: item.cartItemData.details.hostName,
          packageType: item.cartItemData.packageType,
          eventDate: item.cartItemData.details.eventDate,
          price: item.cartItemData.totalPrice
        }))
      }))
    });
  } catch (error: any) {
    logger.error('Error getting pending orders:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في جلب الطلبات المعلقة' }
    });
  }
});

/**
 * GET /api/payment/pending-cart-items
 * Get cart item IDs that are in pending orders
 */
router.get('/pending-cart-items', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const pendingCartItemIds = await OrderService.getPendingCartItemIds(userId);
    
    return res.json({
      success: true,
      pendingCartItemIds
    });
  } catch (error: any) {
    logger.error('Error getting pending cart items:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في جلب العناصر المعلقة' }
    });
  }
});

/**
 * GET /api/payment/paymob/status/:transactionId
 * Get payment status from Paymob
 */
router.get('/paymob/status/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف المعاملة مطلوب' }
      });
    }

    const status = await paymobService.getPaymentStatus(transactionId);
    
    return res.json(status);
  } catch (error: any) {
    logger.error('Error getting payment status:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب حالة الدفع' }
    });
  }
});

export default router;
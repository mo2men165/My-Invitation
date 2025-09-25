// routes/payment.ts
import { Router, Request, Response } from 'express';
import cors from 'cors';
import { PaymentService } from '../services/paymentService';
import { paymobService } from '../services/paymobService';
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
    const { customerInfo } = req.body;

    // Validate required fields
    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone || !customerInfo.city) {
      return res.status(400).json({
        success: false,
        error: { message: 'معلومات العميل مطلوبة' }
      });
    }

    // Get cart summary
    const cartSummary = await PaymentService.getCartPaymentSummary(userId);
    if (!cartSummary.success || !cartSummary.summary) {
      return res.status(400).json({
        success: false,
        error: { message: 'السلة فارغة أو غير صحيحة' }
      });
    }

    // Debug logging
    logger.info(`Cart summary for user ${userId}:`, {
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

    // Get iframe URL
    const iframeUrl = paymobService.getIframeUrl(paymentKey.token);

    logger.info(`Paymob order created for user ${userId}, order ID: ${paymobOrder.id}`);

    return res.json({
      success: true,
      orderId: paymobOrder.id,
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

    // Handle successful payment
    if (result.status === 'success' && result.orderId && result.transactionId) {
      try {
        // Extract userId from orderId (format: ORDER_userId_timestamp)
        const orderIdParts = result.orderId.split('_');
        if (orderIdParts.length >= 2) {
          const userId = orderIdParts[1];
          
          await PaymentService.processSuccessfulPayment(userId, {
            paymentId: result.transactionId,
            amount: result.amount || 0,
            paymentMethod: 'paymob',
            transactionId: result.transactionId
          });

          logger.info(`Payment webhook processed successfully for user ${userId}, transaction ${result.transactionId}`);
        } else {
          logger.warn('Invalid order ID format in webhook:', result.orderId);
        }
      } catch (error: any) {
        logger.error('Error processing successful payment from webhook:', error);
        // Don't return error to Paymob to avoid retries
      }
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
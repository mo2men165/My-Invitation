// routes/payment.ts
import { Router, Request, Response } from 'express';
import cors from 'cors';
import { Types } from 'mongoose';
import { PaymentService } from '../services/paymentService';
import { paymobService } from '../services/paymobService';
import { OrderService } from '../services/orderService';
import { Order } from '../models/Order';
import { Event } from '../models/Event';
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
  const orderCreationStartTime = Date.now();
  const orderCreationId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // ===== COMPREHENSIVE ORDER CREATION LOGGING =====
    logger.info(`🚀 PAYMENT ORDER CREATION STARTED [${orderCreationId}]`, {
      timestamp: new Date().toISOString(),
      orderCreationId,
      userId: req.user!.id,
      requestBody: {
        hasCustomerInfo: !!req.body.customerInfo,
        customerInfoKeys: req.body.customerInfo ? Object.keys(req.body.customerInfo) : [],
        hasSelectedCartItemIds: !!req.body.selectedCartItemIds,
        selectedCartItemIdsCount: req.body.selectedCartItemIds?.length || 0,
        selectedCartItemIds: req.body.selectedCartItemIds
      }
    });

    const userId = req.user!.id;
    const { customerInfo, selectedCartItemIds } = req.body;

    // Validate required fields
    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone || !customerInfo.city) {
      logger.error(`❌ VALIDATION FAILED - MISSING CUSTOMER INFO [${orderCreationId}]`, {
        orderCreationId,
        userId,
        customerInfoProvided: !!customerInfo,
        missingFields: {
          firstName: !customerInfo?.firstName,
          lastName: !customerInfo?.lastName,
          email: !customerInfo?.email,
          phone: !customerInfo?.phone,
          city: !customerInfo?.city
        }
      });
      
      return res.status(400).json({
        success: false,
        error: { message: 'معلومات العميل مطلوبة' }
      });
    }

    logger.info(`✅ CUSTOMER INFO VALIDATED [${orderCreationId}]`, {
      orderCreationId,
      userId,
      customerInfo: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        city: customerInfo.city
      }
    });

    // If no selectedCartItemIds provided, use all cart items (backward compatibility)
    let finalSelectedCartItemIds = selectedCartItemIds;
    if (!selectedCartItemIds || !Array.isArray(selectedCartItemIds) || selectedCartItemIds.length === 0) {
      logger.info(`📋 NO SPECIFIC ITEMS SELECTED - USING ALL CART ITEMS [${orderCreationId}]`, {
        orderCreationId,
        userId,
        reason: 'BACKWARD_COMPATIBILITY'
      });
      
      // For backward compatibility, if no specific items selected, use all cart items
      const allCartSummary = await PaymentService.getCartPaymentSummary(userId);
      if (!allCartSummary.success || !allCartSummary.summary) {
        logger.error(`❌ CART SUMMARY FAILED - NO ITEMS AVAILABLE [${orderCreationId}]`, {
          orderCreationId,
          userId,
          cartSummaryResult: allCartSummary
        });
        
        return res.status(400).json({
          success: false,
          error: { message: 'السلة فارغة أو غير صحيحة' }
        });
      }
      finalSelectedCartItemIds = allCartSummary.summary.items.map(item => item.id);
      
      logger.info(`📋 ALL CART ITEMS SELECTED [${orderCreationId}]`, {
        orderCreationId,
        userId,
        selectedItemsCount: finalSelectedCartItemIds.length,
        selectedItemIds: finalSelectedCartItemIds
      });
    } else {
      logger.info(`📋 SPECIFIC ITEMS SELECTED [${orderCreationId}]`, {
        orderCreationId,
        userId,
        selectedItemsCount: finalSelectedCartItemIds.length,
        selectedItemIds: finalSelectedCartItemIds
      });
    }

    // Get cart summary for selected items only
    logger.info(`🛒 GETTING CART SUMMARY FOR SELECTED ITEMS [${orderCreationId}]`, {
      orderCreationId,
      userId,
      selectedItemIds: finalSelectedCartItemIds
    });

    const cartSummary = await PaymentService.getCartPaymentSummary(userId, finalSelectedCartItemIds);
    if (!cartSummary.success || !cartSummary.summary) {
      logger.error(`❌ CART SUMMARY FAILED FOR SELECTED ITEMS [${orderCreationId}]`, {
        orderCreationId,
        userId,
        selectedItemIds: finalSelectedCartItemIds,
        cartSummaryResult: cartSummary
      });
      
      return res.status(400).json({
        success: false,
        error: { message: 'السلة فارغة أو غير صحيحة' }
      });
    }

    logger.info(`✅ CART SUMMARY RETRIEVED [${orderCreationId}]`, {
      orderCreationId,
      userId,
      cartSummary: {
        itemCount: cartSummary.summary.itemCount,
        totalAmount: cartSummary.summary.totalAmount,
        items: cartSummary.summary.items.map(item => ({
          id: item.id,
          hostName: item.hostName,
          packageType: item.packageType,
          price: item.price
        }))
      }
    });

    // Prepare items for Paymob
    const items = cartSummary.summary.items.map(item => ({
      name: `دعوة ${item.hostName}`,
      description: `دعوة ${item.packageType} لـ ${item.hostName} في ${item.eventLocation}`,
      quantity: 1,
      price: item.price
    }));

    logger.info(`🛍️ ITEMS PREPARED FOR PAYMOB [${orderCreationId}]`, {
      orderCreationId,
      userId,
      itemsCount: items.length,
      items: items.map(item => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price
      }))
    });

    // Generate merchant order ID once for consistency
    const merchantOrderId = `ORDER_${userId}_${Date.now()}`;
    
    logger.info(`💳 CREATING PAYMOB ORDER [${orderCreationId}]`, {
      orderCreationId,
      userId,
      amount: cartSummary.summary.totalAmount,
      itemsCount: items.length,
      merchantOrderId,
      startingPaymobOrderCreation: new Date().toISOString()
    });

    const paymobOrder = await paymobService.createOrder({
      userId,
      amount: cartSummary.summary.totalAmount,
      items,
      customerInfo,
      merchantOrderId
    });

    logger.info(`✅ PAYMOB ORDER CREATED [${orderCreationId}]`, {
      orderCreationId,
      userId,
      paymobOrderId: paymobOrder.id,
      amount: cartSummary.summary.totalAmount,
      paymobOrderCreationTime: Date.now() - orderCreationStartTime
    });

    // Generate payment key
    logger.info(`🔑 GENERATING PAYMENT KEY [${orderCreationId}]`, {
      orderCreationId,
      userId,
      paymobOrderId: paymobOrder.id,
      amount: cartSummary.summary.totalAmount
    });

    const paymentKey = await paymobService.generatePaymentKey(paymobOrder.id, cartSummary.summary.totalAmount, customerInfo, merchantOrderId);

    logger.info(`✅ PAYMENT KEY GENERATED [${orderCreationId}]`, {
      orderCreationId,
      userId,
      paymobOrderId: paymobOrder.id,
      paymentTokenLength: paymentKey.token?.length || 0,
      hasPaymentToken: !!paymentKey.token
    });

    // Create our internal order record
    logger.info(`📝 CREATING INTERNAL ORDER RECORD [${orderCreationId}]`, {
      orderCreationId,
      userId,
      paymobOrderId: paymobOrder.id,
      merchantOrderId,
      selectedItemsCount: finalSelectedCartItemIds.length,
      totalAmount: cartSummary.summary.totalAmount
    });

    const order = await OrderService.createOrder(
      userId,
      finalSelectedCartItemIds,
      paymobOrder.id,
      merchantOrderId,
      cartSummary.summary.totalAmount
    );

    logger.info(`✅ INTERNAL ORDER RECORD CREATED [${orderCreationId}]`, {
      orderCreationId,
      userId,
      paymobOrderId: paymobOrder.id,
      ourOrderId: order._id,
      merchantOrderId,
      selectedItemsCount: finalSelectedCartItemIds.length,
      totalAmount: cartSummary.summary.totalAmount
    });

    // Get iframe URL
    const iframeUrl = paymobService.getIframeUrl(paymentKey.token, merchantOrderId);

    logger.info(`🌐 IFRAME URL GENERATED [${orderCreationId}]`, {
      orderCreationId,
      userId,
      paymobOrderId: paymobOrder.id,
      ourOrderId: order._id,
      iframeUrl,
      hasIframeUrl: !!iframeUrl
    });

    const totalProcessingTime = Date.now() - orderCreationStartTime;
    
    logger.info(`🎉 PAYMENT ORDER CREATION COMPLETED [${orderCreationId}]`, {
      orderCreationId,
      userId,
      paymobOrderId: paymobOrder.id,
      ourOrderId: order._id,
      selectedItemsCount: finalSelectedCartItemIds.length,
      totalAmount: cartSummary.summary.totalAmount,
      iframeUrl,
      totalProcessingTime,
      completedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      orderId: paymobOrder.id,
      ourOrderId: order._id,
      paymentToken: paymentKey.token,
      iframeUrl,
      amount: cartSummary.summary.totalAmount,
      currency: 'SAR',
      orderCreationId: orderCreationId,
      processingTime: totalProcessingTime
    });

  } catch (error: any) {
    const totalProcessingTime = Date.now() - orderCreationStartTime;
    logger.error(`💥 PAYMENT ORDER CREATION FAILED [${orderCreationId}]`, {
      orderCreationId,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      processingTime: totalProcessingTime,
      errorAt: new Date().toISOString()
    });
    
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في إنشاء طلب الدفع' },
      orderCreationId: orderCreationId,
      processingTime: totalProcessingTime
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
  const webhookStartTime = Date.now();
  const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // ===== COMPREHENSIVE WEBHOOK LOGGING =====
    logger.info(`🔔 WEBHOOK RECEIVED [${webhookId}]`, {
      timestamp: new Date().toISOString(),
      webhookId,
      method: req.method,
      url: req.url,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'host': req.headers['host'],
        'x-paymob-signature': req.headers['x-paymob-signature'] ? 'PRESENT' : 'MISSING'
      },
      queryParams: req.query,
      bodySize: JSON.stringify(req.body).length,
      bodyKeys: Object.keys(req.body || {}),
      rawBody: req.body
    });

    const webhookData: PaymobWebhookData = req.body;
    
    // ===== DETAILED PAYMOB DATA ANALYSIS =====
    logger.info(`📊 PAYMOB DATA ANALYSIS [${webhookId}]`, {
      webhookId,
      webhookType: webhookData.type,
      hasObj: !!webhookData.obj,
      objStructure: webhookData.obj ? {
        keys: Object.keys(webhookData.obj),
        id: webhookData.obj.id,
        order: webhookData.obj.order ? {
          keys: Object.keys(webhookData.obj.order),
          id: webhookData.obj.order.id,
          merchant_order_id: webhookData.obj.order.merchant_order_id
        } : 'NO_ORDER',
        amount_cents: webhookData.obj?.amount_cents,
        amount_sar: webhookData.obj?.amount_cents ? webhookData.obj.amount_cents / 100 : 'N/A',
        success: webhookData.obj?.success,
        pending: webhookData.obj?.pending,
        error_occured: webhookData.obj?.error_occured,
        data: webhookData.obj?.data,
        created_at: webhookData.obj?.created_at,
        is_3d_secure: (webhookData.obj as any)?.is_3d_secure,
        is_auth: (webhookData.obj as any)?.is_auth,
        is_capture: (webhookData.obj as any)?.is_capture,
        is_refunded: (webhookData.obj as any)?.is_refunded,
        is_void: (webhookData.obj as any)?.is_void,
        is_voided: (webhookData.obj as any)?.is_voided,
        integration_id: webhookData.obj?.integration_id,
        profile_id: (webhookData.obj as any)?.profile_id,
        source_data: webhookData.obj?.source_data,
        hmac: webhookData.obj?.hmac
      } : 'NO_OBJ',
      fullWebhookData: webhookData
    });

    // Extract signature for verification
    const signature = req.query.hmac as string || req.headers['x-paymob-signature'] as string;
    
    logger.info(`🔐 SIGNATURE VERIFICATION [${webhookId}]`, {
      webhookId,
      signatureFromQuery: req.query.hmac,
      signatureFromHeader: req.headers['x-paymob-signature'],
      hasSignature: !!signature,
      signatureLength: signature?.length || 0,
      hasSecretKey: !!process.env.PAYMOB_SECRET_KEY,
      secretKeyLength: process.env.PAYMOB_SECRET_KEY?.length || 0,
      bypassEnabled: process.env.PAYMOB_BYPASS_SIGNATURE === 'true'
    });

    // Verify webhook signature (bypass for testing if needed)
    const bypassSignature = process.env.PAYMOB_BYPASS_SIGNATURE === 'true';
    let signatureValid = false;
    
    if (bypassSignature) {
      signatureValid = true;
      logger.info(`⚠️ SIGNATURE BYPASSED FOR TESTING [${webhookId}]`);
    } else {
      signatureValid = paymobService.verifyWebhookSignature(webhookData, signature);
      logger.info(`🔍 SIGNATURE VERIFICATION RESULT [${webhookId}]`, {
        webhookId,
        isValid: signatureValid,
        signatureProvided: !!signature,
        secretKeyConfigured: !!process.env.PAYMOB_SECRET_KEY
      });
    }

    if (!signatureValid) {
      logger.error(`❌ INVALID WEBHOOK SIGNATURE [${webhookId}]`, {
        webhookId,
        receivedSignature: signature,
        hasSecretKey: !!process.env.PAYMOB_SECRET_KEY,
        webhookDataKeys: Object.keys(webhookData),
        bypassEnabled: bypassSignature,
        action: 'REJECTING_WEBHOOK'
      });
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid signature' }
      });
    }
    
    logger.info(`✅ SIGNATURE VALIDATED [${webhookId}]`);

    // ===== PROCESS WEBHOOK DATA =====
    logger.info(`🔄 PROCESSING WEBHOOK DATA [${webhookId}]`, {
      webhookId,
      startingProcessing: new Date().toISOString()
    });

    const result = await paymobService.processWebhook(webhookData);
    
    logger.info(`📋 WEBHOOK PROCESSING RESULT [${webhookId}]`, {
      webhookId,
      processingSuccess: result.success,
      resultData: result,
      processingTime: Date.now() - webhookStartTime
    });
    
    if (!result.success) {
      logger.error(`❌ WEBHOOK PROCESSING FAILED [${webhookId}]`, {
        webhookId,
        error: result.error,
        webhookData: webhookData,
        processingTime: Date.now() - webhookStartTime
      });
      return res.status(500).json({
        success: false,
        error: { message: result.error }
      });
    }

    // ===== PAYMENT RESULT ANALYSIS =====
    logger.info(`🎯 PAYMENT RESULT ANALYSIS [${webhookId}]`, {
      webhookId,
      status: result.status,
      paymobOrderId: result.orderId,
      transactionId: result.transactionId,
      amount: result.amount,
      willProcessPayment: result.status === 'success' && result.orderId && result.transactionId,
      willMarkAsFailed: result.status === 'failed' && result.orderId,
      conditionsMet: {
        isSuccess: result.status === 'success',
        hasOrderId: !!result.orderId,
        hasTransactionId: !!result.transactionId,
        isFailed: result.status === 'failed'
      }
    });

    // ===== HANDLE SUCCESSFUL PAYMENT =====
    if (result.status === 'success' && result.orderId && result.transactionId) {
      logger.info(`💰 PROCESSING SUCCESSFUL PAYMENT [${webhookId}]`, {
        webhookId,
        paymobOrderId: result.orderId,
        transactionId: result.transactionId,
        amount: result.amount,
        startingPaymentProcessing: new Date().toISOString()
      });

      try {
        const paymentResult = await OrderService.processSuccessfulPayment(
          result.orderId, // This is the merchant order ID (string)
          result.transactionId
        );

        logger.info(`✅ PAYMENT PROCESSED SUCCESSFULLY [${webhookId}]`, {
          webhookId,
          paymobOrderId: result.orderId,
          ourOrderId: paymentResult.orderId,
          transactionId: result.transactionId,
          eventsCreated: paymentResult.eventsCreated,
          amount: result.amount,
          processingTime: Date.now() - webhookStartTime,
          paymentResult: paymentResult
        });

        if (paymentResult.success) {
          logger.info(`🎉 PAYMENT COMPLETED SUCCESSFULLY [${webhookId}]`, {
            webhookId,
            paymobOrderId: result.orderId,
            ourOrderId: paymentResult.orderId,
            transactionId: result.transactionId,
            eventsCreated: paymentResult.eventsCreated,
            amount: result.amount,
            totalProcessingTime: Date.now() - webhookStartTime
          });
        } else {
          logger.error(`❌ PAYMENT PROCESSING FAILED [${webhookId}]`, {
            webhookId,
            paymobOrderId: result.orderId,
            transactionId: result.transactionId,
            error: paymentResult.error,
            processingTime: Date.now() - webhookStartTime
          });
        }
      } catch (error: any) {
        logger.error(`💥 ERROR PROCESSING SUCCESSFUL PAYMENT [${webhookId}]`, {
          webhookId,
          error: error.message,
          stack: error.stack,
          paymobOrderId: result.orderId,
          transactionId: result.transactionId,
          processingTime: Date.now() - webhookStartTime,
          action: 'NOT_RETURNING_ERROR_TO_PAYMOB_TO_AVOID_RETRIES'
        });
        // Don't return error to Paymob to avoid retries
      }
    } 
    // ===== HANDLE FAILED PAYMENT =====
    else if (result.status === 'failed' && result.orderId) {
      logger.info(`❌ PROCESSING FAILED PAYMENT [${webhookId}]`, {
        webhookId,
        paymobOrderId: result.orderId,
        transactionId: result.transactionId,
        amount: result.amount,
        startingFailureProcessing: new Date().toISOString()
      });

      try {
        const markedAsFailed = await OrderService.markOrderAsFailed(result.orderId);
        
        logger.info(`📝 ORDER FAILURE PROCESSING RESULT [${webhookId}]`, {
          webhookId,
          paymobOrderId: result.orderId,
          transactionId: result.transactionId,
          markedAsFailed: markedAsFailed,
          processingTime: Date.now() - webhookStartTime
        });

        if (markedAsFailed) {
          logger.info(`✅ ORDER MARKED AS FAILED [${webhookId}]`, {
            webhookId,
            paymobOrderId: result.orderId,
            transactionId: result.transactionId,
            processingTime: Date.now() - webhookStartTime
          });
        } else {
          logger.warn(`⚠️ FAILED TO MARK ORDER AS FAILED [${webhookId}]`, {
            webhookId,
            paymobOrderId: result.orderId,
            transactionId: result.transactionId,
            processingTime: Date.now() - webhookStartTime
          });
        }
      } catch (error: any) {
        logger.error(`💥 ERROR MARKING ORDER AS FAILED [${webhookId}]`, {
          webhookId,
          error: error.message,
          stack: error.stack,
          paymobOrderId: result.orderId,
          processingTime: Date.now() - webhookStartTime
        });
      }
    } 
    // ===== HANDLE OTHER CASES =====
    else {
      logger.info(`ℹ️ PAYMENT NOT PROCESSED - CONDITIONS NOT MET [${webhookId}]`, {
        webhookId,
        status: result.status,
        hasOrderId: !!result.orderId,
        hasTransactionId: !!result.transactionId,
        paymobOrderId: result.orderId,
        transactionId: result.transactionId,
        amount: result.amount,
        processingTime: Date.now() - webhookStartTime,
        reason: 'CONDITIONS_NOT_MET_FOR_PROCESSING'
      });
    }

    // ===== WEBHOOK COMPLETION =====
    const totalProcessingTime = Date.now() - webhookStartTime;
    logger.info(`🏁 WEBHOOK PROCESSING COMPLETED [${webhookId}]`, {
      webhookId,
      totalProcessingTime,
      finalStatus: result.status,
      paymobOrderId: result.orderId,
      transactionId: result.transactionId,
      completedAt: new Date().toISOString(),
      responseToPaymob: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: 'Webhook processed successfully',
      webhookId: webhookId,
      processingTime: totalProcessingTime
    });

  } catch (error: any) {
    const totalProcessingTime = Date.now() - webhookStartTime;
    logger.error(`💥 WEBHOOK PROCESSING ERROR [${webhookId}]`, {
      webhookId,
      error: error.message,
      stack: error.stack,
      processingTime: totalProcessingTime,
      errorAt: new Date().toISOString(),
      action: 'RETURNING_ERROR_TO_PAYMOB'
    });
    
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في معالجة إشعار الدفع' },
      webhookId: webhookId,
      processingTime: totalProcessingTime
    });
  }
});

/**
 * POST /api/payment/paymob/callback
 * Unified callback endpoint for Paymob success/failure redirects
 * This endpoint receives POST data from Paymob and redirects user accordingly
 */
router.post('/paymob/callback', cors(), async (req: Request, res: Response) => {
  const callbackStartTime = Date.now();
  const callbackId = `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // ===== COMPREHENSIVE CALLBACK LOGGING =====
    logger.info(`🔄 CALLBACK RECEIVED [${callbackId}]`, {
      timestamp: new Date().toISOString(),
      callbackId,
      method: req.method,
      url: req.url,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'referer': req.headers['referer'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'host': req.headers['host']
      },
      queryParams: req.query,
      bodySize: JSON.stringify(req.body).length,
      bodyKeys: Object.keys(req.body || {}),
      rawBody: req.body
    });

    const webhookData: PaymobWebhookData = req.body;
    
    // ===== DETAILED CALLBACK DATA ANALYSIS =====
    logger.info(`📊 CALLBACK DATA ANALYSIS [${callbackId}]`, {
      callbackId,
      webhookType: webhookData.type,
      hasObj: !!webhookData.obj,
      objStructure: webhookData.obj ? {
        keys: Object.keys(webhookData.obj),
        id: webhookData.obj.id,
        order: webhookData.obj.order ? {
          keys: Object.keys(webhookData.obj.order),
          id: webhookData.obj.order.id,
          merchant_order_id: webhookData.obj.order.merchant_order_id
        } : 'NO_ORDER',
        amount_cents: webhookData.obj?.amount_cents,
        amount_sar: webhookData.obj?.amount_cents ? webhookData.obj.amount_cents / 100 : 'N/A',
        success: webhookData.obj?.success,
        pending: webhookData.obj?.pending,
        error_occured: webhookData.obj?.error_occured,
        created_at: webhookData.obj?.created_at
      } : 'NO_OBJ',
      fullCallbackData: webhookData
    });

    // Extract transaction details
    const transactionId = webhookData.obj?.id?.toString();
    const orderId = webhookData.obj?.order?.merchant_order_id;
    const amount = webhookData.obj?.amount_cents ? webhookData.obj.amount_cents / 100 : 0;
    const success = webhookData.obj?.success;
    const pending = webhookData.obj?.pending;

    logger.info(`🎯 CALLBACK TRANSACTION ANALYSIS [${callbackId}]`, {
      callbackId,
      transactionId,
      orderId,
      amount,
      success,
      pending,
      paymentStatus: {
        isSuccess: success && !pending,
        isFailed: !success,
        isPending: pending
      }
    });

    // Determine redirect URL based on payment status
    let redirectUrl: string;
    let redirectReason: string;
    
    // Always redirect to the unified result page with merchant order ID
    redirectUrl = `${process.env.FRONTEND_URL}/payment/result?order_id=${orderId}`;
    redirectReason = success && !pending ? 'PAYMENT_SUCCESS' : !success ? 'PAYMENT_FAILED' : 'PAYMENT_PENDING';
    
    logger.info(`🔄 REDIRECTING TO RESULT PAGE [${callbackId}]`, {
      callbackId,
      transactionId,
      orderId,
      amount,
      success,
      pending,
      redirectUrl,
      redirectReason
    });

    logger.info(`🚀 REDIRECTING USER [${callbackId}]`, {
      callbackId,
      redirectUrl,
      redirectReason,
      transactionId,
      orderId,
      amount,
      processingTime: Date.now() - callbackStartTime,
      frontendUrl: process.env.FRONTEND_URL
    });

    // Redirect user to appropriate page
    return res.redirect(redirectUrl);

  } catch (error: any) {
    const totalProcessingTime = Date.now() - callbackStartTime;
    logger.error(`💥 CALLBACK PROCESSING ERROR [${callbackId}]`, {
      callbackId,
      error: error.message,
      stack: error.stack,
      processingTime: totalProcessingTime,
      errorAt: new Date().toISOString(),
      action: 'REDIRECTING_TO_ERROR_PAGE'
    });
    
    // Redirect to result page with error details
    const errorUrl = `${process.env.FRONTEND_URL}/payment/result?message=${encodeURIComponent('خطأ في معالجة الدفع')}&callback_id=${callbackId}`;
    
    logger.info(`🔄 REDIRECTING TO RESULT PAGE WITH ERROR [${callbackId}]`, {
      callbackId,
      errorUrl,
      processingTime: totalProcessingTime
    });
    
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
 * GET /api/payment/order/:merchantOrderId
 * Get order data by merchant order ID for payment result page
 */
router.get('/order/:merchantOrderId', async (req: Request, res: Response) => {
  try {
    const { merchantOrderId } = req.params;
    const userId = req.user!.id;
    
    if (!merchantOrderId) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الطلب مطلوب' }
      });
    }

    logger.info(`🔍 FETCHING ORDER DATA [${merchantOrderId}]`, {
      merchantOrderId,
      userId,
      timestamp: new Date().toISOString()
    });

    const order = await Order.findOne({ 
      merchantOrderId,
      userId: new Types.ObjectId(userId) // Security check - ensure user owns the order
    });

    if (!order) {
      logger.warn(`❌ ORDER NOT FOUND [${merchantOrderId}]`, {
        merchantOrderId,
        userId,
        action: 'ORDER_NOT_FOUND_OR_NOT_OWNED'
      });
      return res.status(404).json({
        success: false,
        error: { message: 'الطلب غير موجود أو غير مملوك لك' }
      });
    }

    logger.info(`✅ ORDER FOUND [${merchantOrderId}]`, {
      merchantOrderId,
      userId,
      orderId: order._id,
      status: order.status,
      totalAmount: order.totalAmount,
      eventsCreated: order.eventsCreated.length,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      failedAt: order.failedAt
    });

    // Get events data if order is completed
    let events = [];
    if (order.status === 'completed' && order.eventsCreated.length > 0) {
      events = await Event.find({
        _id: { $in: order.eventsCreated }
      }).select('_id details.hostName details.eventDate details.eventLocation packageType');
    }

    const orderData = {
      id: order._id,
      merchantOrderId: order.merchantOrderId,
      paymobOrderId: order.paymobOrderId,
      paymobTransactionId: order.paymobTransactionId,
      status: order.status,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      eventsCreated: order.eventsCreated.length,
      events: events,
      selectedItems: order.selectedCartItems.map(item => ({
        cartItemId: item.cartItemId,
        hostName: item.cartItemData.details.hostName,
        packageType: item.cartItemData.packageType,
        eventDate: item.cartItemData.details.eventDate,
        eventLocation: item.cartItemData.details.eventLocation,
        price: item.cartItemData.totalPrice
      })),
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      failedAt: order.failedAt
    };

    return res.json({
      success: true,
      order: orderData
    });

  } catch (error: any) {
    logger.error(`💥 ERROR FETCHING ORDER [${req.params.merchantOrderId}]`, {
      merchantOrderId: req.params.merchantOrderId,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب بيانات الطلب' }
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
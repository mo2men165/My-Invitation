// routes/payment.ts
import { Router, Request, Response } from 'express';
import cors from 'cors';
// TEMPORARILY DISABLED - Tamara & Tabby (set to true to re-enable)
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { PaymentService } from '../services/paymentService';
import { paymobService } from '../services/paymobService';
import { tamaraService } from '../services/tamaraService';
import { tabbyService } from '../services/tabbyService';
import { OrderService } from '../services/orderService';
import { Order } from '../models/Order';
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';
import { withDB } from '../utils/routeUtils';
import { PaymobWebhookData } from '../types/paymob';
import { TabbyWebhookPayload } from '../types/tabby';

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
router.get('/summary', withDB(async (req: Request, res: Response) => {
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
}));

/**
 * POST /api/payment/create-paymob-order
 * Create Paymob order and get payment URL
 */
router.post('/create-paymob-order', withDB(async (req: Request, res: Response) => {
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
}));

/**
 * POST /api/payment/process
 * Process successful payment and convert cart to events
 */
router.post('/process', withDB(async (req: Request, res: Response) => {
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
}));

/**
 * POST /api/payment/failed
 * Handle payment failure
 */
router.post('/failed', withDB(async (req: Request, res: Response) => {
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
}));

/**
 * GET /api/payment/paymob/config
 * Get Paymob configuration for frontend
 */
router.get('/paymob/config', withDB(async (req: Request, res: Response) => {
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
}));

/**
 * POST /api/payment/paymob/webhook
 * Handle Paymob webhook notifications
 * This route should NOT require authentication as it's called by Paymob
 */
router.post('/paymob/webhook', cors(), withDB(async (req: Request, res: Response) => {
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
}));

/**
 * POST /api/payment/paymob/callback
 * Unified callback endpoint for Paymob success/failure redirects
 * This endpoint receives POST data from Paymob and redirects user accordingly
 */
router.post('/paymob/callback', cors(), withDB(async (req: Request, res: Response) => {
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
}));

/**
 * GET /api/payment/pending-orders
 * Get user's pending orders
 */
router.get('/pending-orders', withDB(async (req: Request, res: Response) => {
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
}));

/**
 * GET /api/payment/pending-cart-items
 * Get cart item IDs that are in pending orders
 */
router.get('/pending-cart-items', withDB(async (req: Request, res: Response) => {
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
}));

/**
 * GET /api/payment/order/:merchantOrderId
 * Get order data by merchant order ID for payment result page
 */
router.get('/order/:merchantOrderId', withDB(async (req: Request, res: Response) => {
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
      }).select('_id details.eventName details.displayName details.eventLocation packageType totalPrice');
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
}));

/**
 * GET /api/payment/paymob/status/:transactionId
 * Get payment status from Paymob
 */
router.get('/paymob/status/:transactionId', withDB(async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const transactionIdString = Array.isArray(transactionId) ? transactionId[0] : transactionId;
    
    if (!transactionIdString) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف المعاملة مطلوب' }
      });
    }

    const status = await paymobService.getPaymentStatus(transactionIdString);
    
    return res.json(status);
  } catch (error: any) {
    logger.error('Error getting payment status:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب حالة الدفع' }
    });
  }
}));

// TEMPORARILY DISABLED - Tamara & Tabby payment routes
if (false) {
/**
 * POST /api/payment/tamara/webhook
 * JWT verification only may return non-200.
 */
router.post('/tamara/webhook', cors(), withDB(async (req: Request, res: Response) => {
  const webhookId = `tamara_webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info(`🔔 TAMARA WEBHOOK RECEIVED [${webhookId}]`, {
    webhookId,
    bodyKeys: Object.keys(req.body || {})
  });

  const token =
    (req.query.tamaraToken as string) ||
    req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    jwt.verify(token, process.env.TAMARA_NOTIFICATION_TOKEN!, {
      algorithms: ['HS256']
    });
  } catch {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  try {
    const raw = (req.body || {}) as Record<string, unknown>;
    const order_id = String(raw.order_id ?? raw.orderId ?? '');
    const order_reference_id = String(
      raw.order_reference_id ?? raw.orderReferenceId ?? ''
    );

    logger.info(`📊 TAMARA WEBHOOK PAYLOAD [${webhookId}]`, {
      webhookId,
      order_id,
      order_reference_id,
      event_type: raw.event_type ?? raw.eventType,
      payload: raw
    });

    const event_type =
      typeof raw.event_type === 'string'
        ? raw.event_type
        : typeof raw.eventType === 'string'
          ? raw.eventType
          : '';

    switch (event_type) {
      case 'order_approved': {
        await tamaraService.authoriseOrder(order_id);
        await Order.findOneAndUpdate(
          { tamaraOrderId: order_id },
          { tamaraStatus: 'authorised' }
        );
        break;
      }
      case 'order_authorised': {
        const dbOrder = await OrderService.findByTamaraOrderId(order_id);
        const amount = dbOrder?.totalAmount ?? 0;
        const cap = await tamaraService.captureOrder(order_id, amount, 'SAR');
        await Order.findOneAndUpdate(
          { tamaraOrderId: order_id },
          { tamaraStatus: 'captured', tamaraCaptureId: cap.captureId }
        );
        if (order_reference_id) {
          await OrderService.processSuccessfulTamaraPaymentByMerchantOrderId(
            order_reference_id,
            'captured'
          );
        } else {
          await OrderService.processSuccessfulTamaraPayment(order_id, 'captured');
        }
        break;
      }
      case 'order_captured': {
        await Order.findOneAndUpdate(
          { tamaraOrderId: order_id },
          { tamaraStatus: 'fully_captured' }
        );
        await OrderService.processSuccessfulTamaraPayment(
          order_id,
          'fully_captured'
        );
        break;
      }
      case 'order_expired': {
        if (order_reference_id) {
          await Order.findOneAndUpdate(
            { merchantOrderId: order_reference_id },
            { tamaraStatus: 'expired' }
          );
          await OrderService.markTamaraOrderAsFailedByMerchantOrderId(
            order_reference_id,
            'expired'
          );
        }
        break;
      }
      case 'order_declined': {
        if (order_reference_id) {
          await Order.findOneAndUpdate(
            { merchantOrderId: order_reference_id },
            { tamaraStatus: 'declined' }
          );
          await OrderService.markTamaraOrderAsFailedByMerchantOrderId(
            order_reference_id,
            'declined'
          );
        }
        break;
      }
      default: {
        logger.warn(`⚠️ UNKNOWN OR EMPTY TAMARA EVENT [${webhookId}]`, {
          webhookId,
          event_type,
          order_id
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Tamara webhook processing error:', err);
    return res
      .status(200)
      .json({ received: true, note: 'error logged internally' });
  }
}));

/**
 * POST /api/payment/create-tamara-order
 * Create Tamara checkout session and get checkout URL
 */
router.post('/create-tamara-order', withDB(async (req: Request, res: Response) => {
  const orderCreationStartTime = Date.now();
  const orderCreationId = `tamara_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info(`🚀 TAMARA ORDER CREATION STARTED [${orderCreationId}]`, {
      timestamp: new Date().toISOString(),
      orderCreationId,
      userId: req.user!.id,
      requestBody: {
        hasCustomerInfo: !!req.body.customerInfo,
        hasSelectedCartItemIds: !!req.body.selectedCartItemIds,
        selectedCartItemIdsCount: req.body.selectedCartItemIds?.length || 0
      }
    });

    const userId = req.user!.id;
    const { customerInfo, selectedCartItemIds } = req.body;

    // Validate required fields
    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName || 
        !customerInfo.email || !customerInfo.phone || !customerInfo.city) {
      logger.error(`❌ VALIDATION FAILED - MISSING CUSTOMER INFO [${orderCreationId}]`, {
        orderCreationId,
        userId,
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

    // Get cart summary for selected items
    let finalSelectedCartItemIds = selectedCartItemIds;
    if (!selectedCartItemIds || !Array.isArray(selectedCartItemIds) || selectedCartItemIds.length === 0) {
      const allCartSummary = await PaymentService.getCartPaymentSummary(userId);
      if (!allCartSummary.success || !allCartSummary.summary) {
        return res.status(400).json({
          success: false,
          error: { message: 'السلة فارغة أو غير صحيحة' }
        });
      }
      finalSelectedCartItemIds = allCartSummary.summary.items.map(item => item.id);
    }

    const cartSummary = await PaymentService.getCartPaymentSummary(userId, finalSelectedCartItemIds);
    if (!cartSummary.success || !cartSummary.summary) {
      return res.status(400).json({
        success: false,
        error: { message: 'السلة فارغة أو غير صحيحة' }
      });
    }

    logger.info(`✅ CART SUMMARY RETRIEVED [${orderCreationId}]`, {
      orderCreationId,
      userId,
      itemCount: cartSummary.summary.itemCount,
      totalAmount: cartSummary.summary.totalAmount
    });

    // Generate merchant order ID
    const merchantOrderId = `TAMARA_ORDER_${userId}_${Date.now()}`;

    const taxFree: { amount: number; currency: 'SAR' } = {
      amount: 0,
      currency: 'SAR'
    };

    const checkoutResponse = await tamaraService.createCheckoutSession({
      total_amount: {
        amount: cartSummary.summary.totalAmount,
        currency: 'SAR'
      },
      shipping_amount: taxFree,
      tax_amount: taxFree,
      order_reference_id: merchantOrderId,
      country_code: 'SA',
      description: `طلب دعوات - ${cartSummary.summary.itemCount} مناسبة`,
      items: cartSummary.summary.items.map((item, index) => ({
        name: `دعوة ${item.hostName}`,
        quantity: 1,
        reference_id: String(item.id),
        type: 'Digital' as const,
        sku: `INV-${item.packageType.toUpperCase()}-${index + 1}`,
        unit_price: { amount: item.price, currency: 'SAR' as const },
        total_amount: { amount: item.price, currency: 'SAR' as const }
      })),
      consumer: {
        email: customerInfo.email,
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        phone_number: customerInfo.phone.replace(/^\+966/, '')
      },
      shipping_address: {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        line1: customerInfo.address || 'N/A',
        city:
          typeof customerInfo.city === 'string' && customerInfo.city
            ? customerInfo.city
            : 'الرياض',
        country_code: 'SA'
      },
      locale: 'ar_SA',
      payment_type: 'PAY_BY_INSTALMENTS',
      instalments: 3
    });

    logger.info(`✅ TAMARA CHECKOUT SESSION CREATED [${orderCreationId}]`, {
      orderCreationId,
      userId,
      tamaraOrderId: checkoutResponse.orderId,
      checkoutId: checkoutResponse.checkoutId
    });

    const order = await OrderService.createTamaraOrder(
      userId,
      finalSelectedCartItemIds,
      checkoutResponse.orderId,
      checkoutResponse.checkoutId,
      merchantOrderId,
      cartSummary.summary.totalAmount
    );

    const totalProcessingTime = Date.now() - orderCreationStartTime;

    logger.info(`🎉 TAMARA ORDER CREATION COMPLETED [${orderCreationId}]`, {
      orderCreationId,
      userId,
      tamaraOrderId: checkoutResponse.orderId,
      checkoutUrl: checkoutResponse.checkoutUrl,
      ourOrderId: order._id,
      totalAmount: cartSummary.summary.totalAmount,
      totalProcessingTime
    });

    return res.json({
      success: true,
      tamaraOrderId: checkoutResponse.orderId,
      checkoutId: checkoutResponse.checkoutId,
      checkoutUrl: checkoutResponse.checkoutUrl,
      merchantOrderId: merchantOrderId,
      amount: cartSummary.summary.totalAmount,
      currency: 'SAR',
      orderCreationId: orderCreationId,
      processingTime: totalProcessingTime
    });

  } catch (error: any) {
    const totalProcessingTime = Date.now() - orderCreationStartTime;
    logger.error(`💥 TAMARA ORDER CREATION FAILED [${orderCreationId}]`, {
      orderCreationId,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      processingTime: totalProcessingTime
    });

    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في إنشاء طلب الدفع عبر تمارا' },
      orderCreationId: orderCreationId,
      processingTime: totalProcessingTime
    });
  }
}));

/**
 * GET /api/payment/tamara/order/:orderId
 * Get Tamara order details
 */
router.get('/tamara/order/:orderId', withDB(async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId) 
      ? req.params.orderId[0] 
      : req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الطلب مطلوب' }
      });
    }

    const orderDetails = await tamaraService.getOrderDetails(orderId);

    return res.json({
      success: true,
      order: orderDetails
    });

  } catch (error: any) {
    logger.error('Error getting Tamara order details:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في جلب تفاصيل الطلب' }
    });
  }
}));

/**
 * POST /api/payment/tamara/capture/:orderId
 * Capture a Tamara order after fulfillment
 */
router.post('/tamara/capture/:orderId', withDB(async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;
    const { totalAmount } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الطلب مطلوب' }
      });
    }

    if (totalAmount == null || Number.isNaN(Number(totalAmount))) {
      return res.status(400).json({
        success: false,
        error: { message: 'المبلغ الإجمالي مطلوب' }
      });
    }

    const captureResult = await tamaraService.captureOrder(
      orderId,
      Number(totalAmount),
      'SAR'
    );

    logger.info('Tamara order captured successfully', {
      orderId,
      captureId: captureResult.captureId,
      status: captureResult.status
    });

    return res.json({
      success: true,
      capture: captureResult
    });
  } catch (error: any) {
    logger.error('Error capturing Tamara order:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في تأكيد الطلب' }
    });
  }
}));

/**
 * POST /api/payment/tamara/cancel/:orderId
 * Cancel a Tamara order (only when status is 'authorised')
 */
router.post('/tamara/cancel/:orderId', withDB(async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;
    const { items, totalAmount } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الطلب مطلوب' }
      });
    }

    if (totalAmount == null || Number.isNaN(Number(totalAmount))) {
      return res.status(400).json({
        success: false,
        error: { message: 'المبلغ الإجمالي مطلوب' }
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'عناصر الطلب مطلوبة' }
      });
    }

    const baseUrl = (process.env.TAMARA_API_URL || 'https://api-sandbox.tamara.co').replace(
      /\/$/,
      ''
    );
    const cancelUrl = `${baseUrl}/orders/${encodeURIComponent(orderId)}/cancel`;

    const taxFree = { amount: 0, currency: 'SAR' as const };
    const tamaraItems = items.map((item: any) => {
      const totalAmt =
        typeof item.total_amount === 'object' && item.total_amount?.amount !== undefined
          ? Number(item.total_amount.amount)
          : Number(item.totalAmount);
      const unitAmt =
        typeof item.unit_price === 'object' && item.unit_price?.amount !== undefined
          ? Number(item.unit_price.amount)
          : Number(item.unitPrice);
      return {
        reference_id: String(item.reference_id ?? item.referenceId),
        type: item.type || 'Digital',
        name: String(item.name),
        sku: String(item.sku),
        quantity: Number(item.quantity) || 1,
        total_amount: { amount: totalAmt, currency: 'SAR' as const },
        unit_price: { amount: Number.isFinite(unitAmt) ? unitAmt : 0, currency: 'SAR' as const },
        tax_amount: taxFree,
        discount_amount: taxFree
      };
    });

    const resTamara = await fetch(cancelUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TAMARA_API_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        total_amount: { amount: Number(totalAmount), currency: 'SAR' },
        shipping_amount: taxFree,
        tax_amount: taxFree,
        discount_amount: taxFree,
        items: tamaraItems
      })
    });

    const errorBodyRaw = await resTamara.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = errorBodyRaw ? JSON.parse(errorBodyRaw) : {};
    } catch {
      parsed = { raw: errorBodyRaw };
    }

    logger.info('Tamara cancel API call', {
      endpoint: cancelUrl,
      statusCode: resTamara.status,
      responseBody: parsed
    });

    if (!resTamara.ok) {
      throw new Error(
        `Tamara API error [${resTamara.status}] ${cancelUrl}: ${errorBodyRaw}`
      );
    }

    const cancelResult = parsed as {
      cancel_id?: string;
      cancelId?: string;
      order_id?: string;
      status?: string;
    };

    logger.info('Tamara order cancelled successfully', {
      orderId,
      cancelId: cancelResult.cancel_id ?? cancelResult.cancelId,
      status: cancelResult.status
    });

    return res.json({
      success: true,
      cancel: {
        cancel_id: cancelResult.cancel_id ?? cancelResult.cancelId,
        order_id: cancelResult.order_id,
        status: cancelResult.status
      }
    });
  } catch (error: any) {
    logger.error('Error cancelling Tamara order:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في إلغاء الطلب' }
    });
  }
}));

/**
 * POST /api/payment/tamara/refund/:orderId
 * Refund a Tamara order (only after 'fully_captured' status)
 */
router.post('/tamara/refund/:orderId', withDB(async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId) 
      ? req.params.orderId[0] 
      : req.params.orderId;
    const { totalAmount, comment } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الطلب مطلوب' }
      });
    }

    if (!totalAmount || !comment) {
      return res.status(400).json({
        success: false,
        error: { message: 'المبلغ وسبب الاسترداد مطلوبان' }
      });
    }

    const refundResult = await tamaraService.refundOrder(
      orderId,
      Number(totalAmount),
      'SAR',
      comment
    );

    logger.info('Tamara order refunded successfully', {
      orderId,
      refundId: refundResult.refundId,
      status: refundResult.status
    });

    return res.json({
      success: true,
      refund: refundResult
    });

  } catch (error: any) {
    logger.error('Error refunding Tamara order:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في استرداد المبلغ' }
    });
  }
}));

// ============================================
// TABBY PAYMENT ROUTES
// ============================================

/**
 * POST /api/payments/tabby/webhook
 * Handle Tabby webhook notifications
 * No JWT validation - Tabby webhooks don't use token validation
 * Security: Verify payment_id exists in DB
 * 
 * SERVERLESS COMPLIANT: Process everything before sending response
 */
router.post('/tabby/webhook', cors(), withDB(async (req: Request, res: Response) => {
  const webhookStartTime = Date.now();
  const webhookId = `tabby_webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info(`🔔 TABBY WEBHOOK RECEIVED [${webhookId}]`, {
      timestamp: new Date().toISOString(),
      webhookId,
      method: req.method,
      url: req.url,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      },
      bodyKeys: Object.keys(req.body || {})
    });

    const webhookPayload: TabbyWebhookPayload = req.body;
    const { id: paymentId, status, amount, is_test } = webhookPayload;

    logger.info(`📊 TABBY WEBHOOK PAYLOAD [${webhookId}]`, {
      webhookId,
      paymentId,
      status,
      amount,
      isTest: is_test
    });

    // Verify payment exists in our DB (this is the primary validation)
    const order = await OrderService.findByTabbyPaymentId(paymentId);
    if (!order) {
      logger.error(`❌ TABBY WEBHOOK - PAYMENT NOT FOUND [${webhookId}]`, { paymentId });
      return res.status(404).json({ 
        success: false, 
        error: 'Payment not found',
        webhookId 
      });
    }

    logger.info(`✅ ORDER FOUND FOR TABBY PAYMENT [${webhookId}]`, {
      webhookId,
      paymentId,
      orderId: order._id,
      orderStatus: order.status
    });

    // Handle different statuses (note: webhook statuses are lowercase)
    switch (status) {
      case 'authorized':
        logger.info(`✅ TABBY PAYMENT AUTHORIZED [${webhookId}]`, { paymentId, amount });

        // Only process if order is still pending
        if (order.status !== 'pending') {
          logger.warn(`⚠️ ORDER ALREADY PROCESSED [${webhookId}]`, {
            paymentId,
            orderStatus: order.status
          });
          break;
        }

        try {
          // Verify payment status via API before capturing
          const paymentDetails = await tabbyService.getPayment(paymentId);

          if (paymentDetails.status === 'AUTHORIZED') {
            logger.info(`✅ TABBY PAYMENT VERIFIED - CAPTURING [${webhookId}]`, { paymentId });

            // Prepare items for capture from order data
            const captureItems = order.selectedCartItems.map((item, index) => ({
              title: `دعوة ${item.cartItemData.details.hostName}`,
              description: `دعوة ${item.cartItemData.packageType} لـ ${item.cartItemData.details.hostName}`,
              id: item.cartItemId.toString(),
              sku: `INV-${item.cartItemData.packageType.toUpperCase()}-${index + 1}`,
              category: 'Invitations',
              quantity: 1,
              unitPrice: item.cartItemData.totalPrice,
              referenceId: item.cartItemId.toString()
            }));

            // Capture the payment
            const captureResult = await tabbyService.capturePayment({
              paymentId,
              amount: parseFloat(amount),
              items: captureItems
            });

            logger.info(`✅ TABBY PAYMENT CAPTURED [${webhookId}]`, {
              paymentId,
              captureResult
            });

            // Process the successful payment and create events
            const processResult = await OrderService.processSuccessfulTabbyPayment(
              paymentId,
              'captured'
            );

            if (processResult.success) {
              logger.info(`✅ EVENTS CREATED SUCCESSFULLY [${webhookId}]`, {
                paymentId,
                orderId: processResult.orderId,
                eventsCreated: processResult.eventsCreated
              });
            } else {
              logger.error(`❌ FAILED TO CREATE EVENTS [${webhookId}]`, {
                paymentId,
                error: processResult.error
              });
            }

          } else {
            logger.warn(`⚠️ TABBY PAYMENT STATUS MISMATCH [${webhookId}]`, {
              paymentId,
              webhookStatus: status,
              apiStatus: paymentDetails.status
            });
          }
        } catch (captureError: any) {
          logger.error(`❌ TABBY CAPTURE FAILED [${webhookId}]`, {
            paymentId,
            error: captureError.message
          });
        }
        break;

      case 'closed':
        logger.info(`✅ TABBY PAYMENT CLOSED (CAPTURED) [${webhookId}]`, { paymentId, amount });
        
        // Process if order is still pending (in case we missed the authorized webhook)
        if (order.status === 'pending') {
          const processResult = await OrderService.processSuccessfulTabbyPayment(
            paymentId,
            'closed'
          );

          if (processResult.success) {
            logger.info(`✅ ORDER COMPLETED ON CLOSED STATUS [${webhookId}]`, {
              paymentId,
              orderId: processResult.orderId,
              eventsCreated: processResult.eventsCreated
            });
          }
        }
        break;

      case 'rejected':
        logger.warn(`⚠️ TABBY PAYMENT REJECTED [${webhookId}]`, { paymentId });
        await OrderService.markTabbyOrderAsFailed(paymentId, 'rejected');
        break;

      case 'expired':
        logger.warn(`⚠️ TABBY PAYMENT EXPIRED [${webhookId}]`, { paymentId });
        await OrderService.markTabbyOrderAsFailed(paymentId, 'expired');
        break;

      default:
        logger.warn(`⚠️ UNKNOWN TABBY STATUS [${webhookId}]`, { paymentId, status });
    }

    const totalProcessingTime = Date.now() - webhookStartTime;
    logger.info(`🏁 TABBY WEBHOOK PROCESSING COMPLETED [${webhookId}]`, {
      webhookId,
      paymentId,
      status,
      totalProcessingTime,
      completedAt: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      webhookId,
      processingTime: totalProcessingTime
    });

  } catch (error: any) {
    const totalProcessingTime = Date.now() - webhookStartTime;
    logger.error(`💥 TABBY WEBHOOK PROCESSING ERROR [${webhookId}]`, {
      webhookId,
      error: error.message,
      stack: error.stack,
      processingTime: totalProcessingTime
    });

    // Return 200 even on error to prevent Tabby from retrying
    return res.status(200).json({
      success: true,
      message: 'Webhook received',
      webhookId,
      processingTime: totalProcessingTime
    });
  }
}));

/**
 * POST /api/payment/create-tabby-session
 * Create Tabby checkout session and get checkout URL
 */
router.post('/create-tabby-session', withDB(async (req: Request, res: Response) => {
  const sessionCreationStartTime = Date.now();
  const sessionCreationId = `tabby_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    logger.info(`🚀 TABBY SESSION CREATION STARTED [${sessionCreationId}]`, {
      timestamp: new Date().toISOString(),
      sessionCreationId,
      userId: req.user!.id,
      requestBody: {
        hasCustomerInfo: !!req.body.customerInfo,
        hasSelectedCartItemIds: !!req.body.selectedCartItemIds,
        selectedCartItemIdsCount: req.body.selectedCartItemIds?.length || 0
      }
    });

    const userId = req.user!.id;
    const { customerInfo, selectedCartItemIds } = req.body;

    // Validate required fields
    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName ||
        !customerInfo.email || !customerInfo.phone || !customerInfo.city) {
      logger.error(`❌ VALIDATION FAILED - MISSING CUSTOMER INFO [${sessionCreationId}]`, {
        sessionCreationId,
        userId,
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

    // Get cart summary for selected items
    let finalSelectedCartItemIds = selectedCartItemIds;
    if (!selectedCartItemIds || !Array.isArray(selectedCartItemIds) || selectedCartItemIds.length === 0) {
      const allCartSummary = await PaymentService.getCartPaymentSummary(userId);
      if (!allCartSummary.success || !allCartSummary.summary) {
        return res.status(400).json({
          success: false,
          error: { message: 'السلة فارغة أو غير صحيحة' }
        });
      }
      finalSelectedCartItemIds = allCartSummary.summary.items.map(item => item.id);
    }

    const cartSummary = await PaymentService.getCartPaymentSummary(userId, finalSelectedCartItemIds);
    if (!cartSummary.success || !cartSummary.summary) {
      return res.status(400).json({
        success: false,
        error: { message: 'السلة فارغة أو غير صحيحة' }
      });
    }

    logger.info(`✅ CART SUMMARY RETRIEVED [${sessionCreationId}]`, {
      sessionCreationId,
      userId,
      itemCount: cartSummary.summary.itemCount,
      totalAmount: cartSummary.summary.totalAmount
    });

    // Generate merchant order ID
    const merchantOrderId = `TABBY_ORDER_${userId}_${Date.now()}`;

    // Prepare items for Tabby
    const tabbyItems = cartSummary.summary.items.map((item, index) => ({
      title: `دعوة ${item.hostName}`,
      description: `دعوة ${item.packageType} لـ ${item.hostName}`,
      id: String(item.id),
      sku: `INV-${item.packageType.toUpperCase()}-${index + 1}`,
      category: 'Invitations',
      quantity: 1,
      unitPrice: item.price,
      referenceId: String(item.id)
    }));

    // Create Tabby session
    const sessionResponse = await tabbyService.createSession({
      orderReferenceId: merchantOrderId,
      amount: cartSummary.summary.totalAmount,
      description: `طلب دعوات - ${cartSummary.summary.itemCount} مناسبة`,
      items: tabbyItems,
      buyer: {
        phone: customerInfo.phone,
        email: customerInfo.email,
        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        dob: customerInfo.dob
      },
      shippingAddress: {
        city: customerInfo.city,
        address: customerInfo.address || 'N/A',
        zip: customerInfo.zip || '00000'
      },
      customerId: userId,
      lang: 'ar'
    });

    if (!sessionResponse.success) {
      logger.warn(`⚠️ TABBY SESSION REJECTED [${sessionCreationId}]`, {
        sessionCreationId,
        userId,
        sessionId: sessionResponse.sessionId,
        rejectionReason: sessionResponse.rejectionReason
      });

      return res.status(400).json({
        success: false,
        error: { 
          message: 'تم رفض الطلب من قبل Tabby',
          rejectionReason: sessionResponse.rejectionReason
        },
        sessionId: sessionResponse.sessionId,
        status: 'rejected'
      });
    }

    logger.info(`✅ TABBY SESSION CREATED [${sessionCreationId}]`, {
      sessionCreationId,
      userId,
      sessionId: sessionResponse.sessionId,
      paymentId: sessionResponse.paymentId,
      webUrl: sessionResponse.webUrl
    });

    // Create internal order record with Tabby session info
    const order = await OrderService.createTabbyOrder(
      userId,
      finalSelectedCartItemIds,
      sessionResponse.sessionId!,
      sessionResponse.paymentId!,
      merchantOrderId,
      cartSummary.summary.totalAmount
    );

    logger.info(`✅ TABBY ORDER RECORD CREATED [${sessionCreationId}]`, {
      sessionCreationId,
      userId,
      orderId: order._id,
      tabbyPaymentId: sessionResponse.paymentId,
      merchantOrderId
    });

    const totalProcessingTime = Date.now() - sessionCreationStartTime;

    logger.info(`🎉 TABBY SESSION CREATION COMPLETED [${sessionCreationId}]`, {
      sessionCreationId,
      userId,
      sessionId: sessionResponse.sessionId,
      paymentId: sessionResponse.paymentId,
      orderId: order._id,
      totalAmount: cartSummary.summary.totalAmount,
      totalProcessingTime
    });

    return res.json({
      success: true,
      sessionId: sessionResponse.sessionId,
      paymentId: sessionResponse.paymentId,
      checkoutUrl: sessionResponse.webUrl,
      merchantOrderId: merchantOrderId,
      orderId: (order._id as any).toString(),
      amount: cartSummary.summary.totalAmount,
      currency: 'SAR',
      sessionCreationId: sessionCreationId,
      processingTime: totalProcessingTime
    });

  } catch (error: any) {
    const totalProcessingTime = Date.now() - sessionCreationStartTime;
    logger.error(`💥 TABBY SESSION CREATION FAILED [${sessionCreationId}]`, {
      sessionCreationId,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      processingTime: totalProcessingTime
    });

    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في إنشاء جلسة الدفع عبر Tabby' },
      sessionCreationId: sessionCreationId,
      processingTime: totalProcessingTime
    });
  }
}));

/**
 * GET /api/payment/tabby/:paymentId
 * Get Tabby payment status
 */
router.get('/tabby/:paymentId', withDB(async (req: Request, res: Response) => {
  try {
    const paymentId = Array.isArray(req.params.paymentId)
      ? req.params.paymentId[0]
      : req.params.paymentId;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الدفع مطلوب' }
      });
    }

    const paymentDetails = await tabbyService.getPayment(paymentId);

    return res.json({
      success: true,
      payment: paymentDetails
    });

  } catch (error: any) {
    logger.error('Error getting Tabby payment:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في جلب تفاصيل الدفع' }
    });
  }
}));

/**
 * POST /api/payment/tabby/capture/:paymentId
 * Capture a Tabby payment (must capture full amount)
 */
router.post('/tabby/capture/:paymentId', withDB(async (req: Request, res: Response) => {
  try {
    const paymentId = Array.isArray(req.params.paymentId)
      ? req.params.paymentId[0]
      : req.params.paymentId;
    const { amount, items } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الدفع مطلوب' }
      });
    }

    if (!amount || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'المبلغ وعناصر الطلب مطلوبة' }
      });
    }

    const captureResult = await tabbyService.capturePayment({
      paymentId,
      amount,
      items
    });

    logger.info('Tabby payment captured successfully', {
      paymentId,
      captureId: captureResult.id,
      amount: captureResult.amount
    });

    return res.json({
      success: true,
      capture: captureResult
    });

  } catch (error: any) {
    logger.error('Error capturing Tabby payment:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في تأكيد الدفع' }
    });
  }
}));

/**
 * POST /api/payment/tabby/refund/:paymentId
 * Refund a Tabby payment (only after CLOSED status)
 */
router.post('/tabby/refund/:paymentId', withDB(async (req: Request, res: Response) => {
  try {
    const paymentId = Array.isArray(req.params.paymentId)
      ? req.params.paymentId[0]
      : req.params.paymentId;
    const { amount, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الدفع مطلوب' }
      });
    }

    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        error: { message: 'المبلغ وسبب الاسترداد مطلوبان' }
      });
    }

    const refundResult = await tabbyService.refundPayment({
      paymentId,
      amount,
      reason
    });

    logger.info('Tabby payment refunded successfully', {
      paymentId,
      refundId: refundResult.id,
      amount: refundResult.amount
    });

    return res.json({
      success: true,
      refund: refundResult
    });

  } catch (error: any) {
    logger.error('Error refunding Tabby payment:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في استرداد المبلغ' }
    });
  }
}));

/**
 * POST /api/payment/tabby/close/:paymentId
 * Close a Tabby payment (cancels order if not captured)
 * If order is fully cancelled, close without capturing - customer will be refunded
 */
router.post('/tabby/close/:paymentId', withDB(async (req: Request, res: Response) => {
  try {
    const paymentId = Array.isArray(req.params.paymentId)
      ? req.params.paymentId[0]
      : req.params.paymentId;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: { message: 'معرف الدفع مطلوب' }
      });
    }

    const result = await tabbyService.closePayment(paymentId);

    logger.info('Tabby payment closed successfully', { paymentId, status: result.status });

    return res.json({
      success: true,
      message: 'تم إغلاق الدفع بنجاح',
      payment: result
    });

  } catch (error: any) {
    logger.error('Error closing Tabby payment:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'خطأ في إغلاق الدفع' }
    });
  }
}));

} // END TEMPORARILY DISABLED - Tamara & Tabby

export default router;
// routes/payment.ts
import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all payment routes
router.use(checkJwt, extractUser, requireActiveUser);

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

export default router;
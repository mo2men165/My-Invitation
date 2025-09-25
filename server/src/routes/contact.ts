// server/src/routes/contact.ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';
import { emailService } from '../services/emailService';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for contact form submissions
const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    error: { message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة مرة أخرى لاحقاً.' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact form validation schema
const contactSchema = z.object({
  name: z.string()
    .min(2, 'الاسم يجب أن يكون أكثر من حرفين')
    .max(100, 'الاسم طويل جداً')
    .trim(),
  email: z.string()
    .email('عنوان البريد الإلكتروني غير صحيح')
    .toLowerCase()
    .trim(),
  phone: z.string()
    .optional()
    .refine(val => !val || /^[+]?[0-9\s-()]+$/.test(val), 'رقم الهاتف غير صحيح'),
  subject: z.string()
    .min(2, 'الموضوع يجب أن يكون أكثر من حرفين')
    .max(200, 'الموضوع طويل جداً')
    .trim(),
  message: z.string()
    .min(10, 'الرسالة يجب أن تكون أكثر من 10 أحرف')
    .max(2000, 'الرسالة طويلة جداً')
    .trim()
});

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * POST /api/contact/submit
 * Submit contact form
 */
router.post('/submit', contactRateLimit, async (req: Request, res: Response) => {
  try {
    // Validate input data
    const validatedData = contactSchema.parse(req.body);

    logger.info('Contact form submission received', {
      email: validatedData.email,
      subject: validatedData.subject,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Send contact email to customer support
    await emailService.sendContactEmail({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      subject: validatedData.subject,
      message: validatedData.message,
      submittedAt: new Date(),
      ipAddress: req.ip || 'Unknown',
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    // Send confirmation email to user
    try {
      await emailService.sendContactConfirmationEmail({
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject
      });
    } catch (confirmationError) {
      // Log error but don't fail the main request
      logger.error('Failed to send contact confirmation email:', {
        email: validatedData.email,
        error: confirmationError
      });
    }

    logger.info('Contact form processed successfully', {
      email: validatedData.email,
      subject: validatedData.subject
    });

    return res.json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.'
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Contact form validation error', {
        errors: error.issues,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: { 
          message: 'البيانات المدخلة غير صحيحة',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      });
    }

    logger.error('Contact form submission error:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      body: req.body
    });

    return res.status(500).json({
      success: false,
      error: { message: 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.' }
    });
  }
});

/**
 * GET /api/contact/subjects
 * Get available contact subjects
 */
router.get('/subjects', (req: Request, res: Response) => {
  const subjects = [
    'استفسار عام',
    'طلب عرض سعر',
    'دعم فني',
    'شراكة تجارية',
    'شكوى أو اقتراح',
    'أخرى'
  ];

  return res.json({
    success: true,
    data: subjects
  });
});

export default router;

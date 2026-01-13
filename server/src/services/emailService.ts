// server/src/services/emailService.ts
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { logger } from '../config/logger';

export interface PasswordResetEmailData {
  name: string;
  email: string;
  resetLink: string;
}

export interface EventApprovalEmailData {
  name: string;
  email: string;
  eventName: string;
  eventDate: string;
  invitationCardUrl?: string;
  qrCodeReaderUrl?: string;
}


export interface WelcomeEmailData {
  name: string;
  email: string;
}

export interface BillEmailData {
  paymentId: string;
  totalAmount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string;
  user: {
    name: string;
    email: string;
    phone: string;
    city: string;
  };
  events: Array<{
    eventId: string;
    eventName?: string;
    hostName: string;
    eventDate: string;
    eventLocation: string;
    packageType: string;
    inviteCount: number;
    price: number;
  }>;
}

export interface EventDetailsEmailData {
  paymentId: string;
  totalAmount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string;
  user: {
    name: string;
    email: string;
    phone: string;
    city: string;
  };
  events: Array<{
    eventId: string;
    eventName?: string;
    hostName: string;
    eventDate: string;
    eventLocation: string;
    packageType: string;
    inviteCount: number;
    price: number;
    invitationText: string;
    startTime: string;
    endTime: string;
    additionalCards: number;
    gateSupervisors: number;
    fastDelivery: boolean;
    detectedCity?: string;
  }>;
}

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  submittedAt: Date;
  ipAddress: string;
  userAgent: string;
}

export interface ContactConfirmationEmailData {
  name: string;
  email: string;
  subject: string;
}

class EmailService {
  private mailerSend: MailerSend;
  private sender: Sender;

  constructor() {
    // Validate required environment variables
    if (!process.env.MAILERSEND_API_KEY) {
      throw new Error('MAILERSEND_API_KEY is required');
    }
    if (!process.env.MAILERSEND_FROM_EMAIL) {
      throw new Error('MAILERSEND_FROM_EMAIL is required');
    }
    if (!process.env.MAILERSEND_FROM_NAME) {
      throw new Error('MAILERSEND_FROM_NAME is required');
    }

    this.mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY,
    });

    this.sender = new Sender(
      process.env.MAILERSEND_FROM_EMAIL,
      process.env.MAILERSEND_FROM_NAME
    );

    logger.info('EmailService initialized successfully');
  }

  /**
   * Create contact email template for customer support
   */
  private createContactEmailTemplate(data: ContactEmailData) {
    const phoneSection = data.phone 
      ? `<div><strong>رقم الهاتف:</strong> ${data.phone}</div>`
      : '';

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>رسالة تواصل جديدة - My Invitation</title>
    </head>
    <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #f8f9fa;">
        <div style="max-width: 700px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C09B52; padding-bottom: 20px;">
                <h1 style="color: #C09B52; margin: 0; font-size: 28px;">📧 رسالة تواصل جديدة</h1>
                <p style="color: #666; margin: 10px 0 0 0;">My Invitation - منصة الدعوات الإلكترونية</p>
            </div>

            <div style="margin-bottom: 30px;">
                <h2 style="color: #333; margin-bottom: 20px; font-size: 20px;">معلومات المرسل</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-right: 4px solid #C09B52;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div><strong>الاسم:</strong> ${data.name}</div>
                        <div><strong>البريد الإلكتروني:</strong> ${data.email}</div>
                        ${phoneSection}
                        <div><strong>تاريخ الإرسال:</strong> ${data.submittedAt.toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 30px;">
                <h2 style="color: #333; margin-bottom: 15px; font-size: 20px;">الموضوع</h2>
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-right: 4px solid #28a745;">
                    <strong style="color: #28a745; font-size: 16px;">${data.subject}</strong>
                </div>
            </div>

            <div style="margin-bottom: 30px;">
                <h2 style="color: #333; margin-bottom: 15px; font-size: 20px;">الرسالة</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; min-height: 150px;">
                    <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">${data.message}</div>
                </div>
            </div>

            <div style="margin-bottom: 30px;">
                <h2 style="color: #333; margin-bottom: 15px; font-size: 18px;">معلومات تقنية</h2>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 12px; color: #666;">
                    <div><strong>عنوان IP:</strong> ${data.ipAddress}</div>
                    <div style="margin-top: 5px;"><strong>متصفح المستخدم:</strong> ${data.userAgent}</div>
                </div>
            </div>

            <div style="text-align: center; padding: 20px; background: #C09B52; color: white; border-radius: 8px; margin-top: 30px;">
                <p style="margin: 0; font-size: 16px;">يرجى الرد على هذه الرسالة في أقرب وقت ممكن</p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">تم إرسال نسخة تأكيد للعميل</p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; font-size: 14px;">تم إرسال هذه الرسالة تلقائياً من نظام My Invitation</p>
                <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} My Invitation. جميع الحقوق محفوظة.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const textTemplate = `
رسالة تواصل جديدة - My Invitation

معلومات المرسل:
- الاسم: ${data.name}
- البريد الإلكتروني: ${data.email}
${data.phone ? `- رقم الهاتف: ${data.phone}` : ''}
- تاريخ الإرسال: ${data.submittedAt.toLocaleDateString('ar-SA')}

الموضوع: ${data.subject}

الرسالة:
${data.message}

معلومات تقنية:
- عنوان IP: ${data.ipAddress}
- متصفح المستخدم: ${data.userAgent}

يرجى الرد على هذه الرسالة في أقرب وقت ممكن.
تم إرسال نسخة تأكيد للعميل.

© ${new Date().getFullYear()} My Invitation. جميع الحقوق محفوظة.
    `;

    return {
      subject: `رسالة تواصل جديدة: ${data.subject} - من ${data.name}`,
      html: htmlTemplate,
      text: textTemplate
    };
  }

  /**
   * Create contact confirmation email template for user
   */
  private createContactConfirmationTemplate(data: ContactConfirmationEmailData) {
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تأكيد استلام رسالتك - My Invitation</title>
    </head>
    <body style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #28a745; margin-bottom: 10px;">✅ تم استلام رسالتك بنجاح!</h1>
                <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #C09B52, #28a745); margin: 0 auto; border-radius: 2px;"></div>
            </div>

            <div style="text-align: right; margin-bottom: 25px;">
                <p style="font-size: 18px; color: #333; margin-bottom: 15px;">مرحباً <strong>${data.name}</strong>،</p>
                <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                    شكراً لك على تواصلك معنا! لقد استلمنا رسالتك بخصوص "<strong style="color: #C09B52;">${data.subject}</strong>" وسنقوم بالرد عليك في أقرب وقت ممكن.
                </p>
            </div>

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #28a745;">
                <h3 style="color: #28a745; margin-top: 0; text-align: right;">ماذا بعد؟</h3>
                <ul style="text-align: right; color: #333; padding-right: 20px; margin: 0;">
                    <li style="margin-bottom: 8px;">سيتم مراجعة رسالتك من قبل فريق الدعم المختص</li>
                    <li style="margin-bottom: 8px;">سنتواصل معك خلال 24 ساعة كحد أقصى</li>
                    <li style="margin-bottom: 8px;">في حالة الاستعجال، يمكنك الاتصال بنا على: +966 59 270 6600</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://myinvitation-sa.com'}" 
                   style="background: linear-gradient(135deg, #C09B52, #d4af37); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          display: inline-block; 
                          font-weight: bold;
                          box-shadow: 0 4px 15px rgba(192, 155, 82, 0.3);">
                    زيارة موقعنا
                </a>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; font-size: 16px; margin-bottom: 10px;">
                    <strong>فريق My Invitation</strong>
                </p>
                <p style="color: #999; font-size: 14px; margin-bottom: 5px;">
                    customersupport@myinvitation-sa.com
                </p>
                <p style="color: #999; font-size: 14px;">
                    +966 59 270 6600
                </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 12px;">
                    © ${new Date().getFullYear()} My Invitation. جميع الحقوق محفوظة.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    const textTemplate = `
تأكيد استلام رسالتك - My Invitation

مرحباً ${data.name}،

شكراً لك على تواصلك معنا! لقد استلمنا رسالتك بخصوص "${data.subject}" وسنقوم بالرد عليك في أقرب وقت ممكن.

ماذا بعد؟
• سيتم مراجعة رسالتك من قبل فريق الدعم المختص
• سنتواصل معك خلال 24 ساعة كحد أقصى  
• في حالة الاستعجال، يمكنك الاتصال بنا على: +966 59 270 6600

فريق My Invitation
customersupport@myinvitation-sa.com
+966 59 270 6600

© ${new Date().getFullYear()} My Invitation. جميع الحقوق محفوظة.
    `;

    return {
      subject: 'تأكيد استلام رسالتك - My Invitation',
      html: htmlTemplate,
      text: textTemplate
    };
  }

  /**
   * Create password reset email template
   */
  private createPasswordResetTemplate(data: PasswordResetEmailData) {
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تعيين كلمة المرور</title>
    </head>
    <body style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px;">
        <h1>مرحباً ${data.name}</h1>
        <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.</p>
        <p>انقر على الرابط التالي لإعادة تعيين كلمة المرور:</p>
        <a href="${data.resetLink}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">إعادة تعيين كلمة المرور</a>
        <p>هذا الرابط صالح لمدة 15 دقيقة فقط.</p>
        <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
        <p>شكراً لك<br>فريق My Invitation</p>
    </body>
    </html>
    `;

    const textTemplate = `
مرحباً ${data.name}،

لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.

انقر على الرابط التالي لإعادة تعيين كلمة المرور:
${data.resetLink}

هذا الرابط صالح لمدة 15 دقيقة فقط.

إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.

شكراً لك،
فريق My Invitation
    `;

    return {
      subject: 'إعادة تعيين كلمة المرور - My Invitation',
      html: htmlTemplate,
      text: textTemplate
    };
  }

  /**
   * Create welcome email template
   */
  private createWelcomeTemplate(data: WelcomeEmailData) {
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مرحباً بك في My Invitation</title>
    </head>
    <body style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px;">
        <h1>مرحباً بك ${data.name}!</h1>
        <p>نرحب بك في منصة My Invitation</p>
        <p>يمكنك الآن إنشاء وإدارة دعواتك بسهولة.</p>
        <p>شكراً لانضمامك إلينا<br>فريق My Invitation</p>
    </body>
    </html>
    `;

    return {
      subject: 'مرحباً بك في My Invitation',
      html: htmlTemplate,
      text: `مرحباً ${data.name}! نرحب بك في منصة My Invitation`
    };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    try {
      logger.info('Sending password reset email', { email: data.email });

      const template = this.createPasswordResetTemplate(data);
      const recipients = [new Recipient(data.email, data.name)];

      const emailParams = new EmailParams()
        .setFrom(this.sender)
        .setTo(recipients)
        .setSubject(template.subject)
        .setHtml(template.html)
        .setText(template.text);

      const response = await this.mailerSend.email.send(emailParams);

      if (response?.statusCode && response.statusCode >= 400) {
        throw new Error(`MailerSend API error: ${response.statusCode}`);
      }

      logger.info('Password reset email sent successfully', { email: data.email });
      return true;

    } catch (error: any) {
      logger.error('Failed to send password reset email', {
        email: data.email,
        error: error.message
      });
      throw new Error('فشل في إرسال بريد إعادة تعيين كلمة المرور');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      logger.info('Sending welcome email', { email: data.email });

      const template = this.createWelcomeTemplate(data);
      const recipients = [new Recipient(data.email, data.name)];

      const emailParams = new EmailParams()
        .setFrom(this.sender)
        .setTo(recipients)
        .setSubject(template.subject)
        .setHtml(template.html)
        .setText(template.text);

      const response = await this.mailerSend.email.send(emailParams);

      if (response?.statusCode && response.statusCode >= 400) {
        throw new Error(`MailerSend API error: ${response.statusCode}`);
      }

      logger.info('Welcome email sent successfully', { email: data.email });
      return true;

    } catch (error: any) {
      logger.error('Failed to send welcome email', {
        email: data.email,
        error: error.message
      });
      // Don't throw error for welcome emails - they're not critical
      return false;
    }
  }

  /**
 * Create event approval email template
 */
private createEventApprovalTemplate(data: EventApprovalEmailData) {
  const cardSection = data.invitationCardUrl 
    ? `<p><a href="${data.invitationCardUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">عرض بطاقة الدعوة</a></p>`
    : '';
  
  const qrCodeSection = data.qrCodeReaderUrl 
    ? `<p><a href="${data.qrCodeReaderUrl}" style="background: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">عرض QR Code</a></p>`
    : '';

  const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تم الموافقة على حدثك</title>
  </head>
  <body style="font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #28a745; margin-bottom: 20px;">🎉 تم الموافقة على حدثك!</h1>
          <p style="font-size: 18px; color: #333;">مرحباً ${data.name}</p>
          <p style="color: #666; line-height: 1.6;">نحن سعداء لإعلامك بأنه تم الموافقة على حدثك <strong>"${data.eventName}"</strong> المقرر بتاريخ <strong>${data.eventDate}</strong></p>
          
          ${cardSection}
          ${qrCodeSection}
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #28a745; margin-top: 0;">ماذا بعد؟</h3>
              <p style="margin: 10px 0;">• يمكنك الآن إضافة ضيوفك إلى قائمة الدعوات</p>
              <p style="margin: 10px 0;">• إرسال رسائل واتساب للضيوف</p>
              <p style="margin: 10px 0;">• إدارة تفاصيل حدثك</p>
          </div>
          
          <a href="https://www.myinvitation-sa.com/dashboard" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold;">انتقل إلى لوحة التحكم</a>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">شكراً لاستخدامك منصة My Invitation<br>فريق My Invitation</p>
      </div>
  </body>
  </html>
  `;

  const textTemplate = `
مرحباً ${data.name}،

🎉 تم الموافقة على حدثك!

نحن سعداء لإعلامك بأنه تم الموافقة على حدثك "${data.eventName}" المقرر بتاريخ ${data.eventDate}

    ${data.invitationCardUrl ? `رابط بطاقة الدعوة: ${data.invitationCardUrl}` : ''}

ماذا بعد؟
• يمكنك الآن إضافة ضيوفك إلى قائمة الدعوات
• إرسال رسائل واتساب للضيوف  
• إدارة تفاصيل حدثك

انتقل إلى لوحة التحكم: https://www.myinvitation-sa.com/dashboard

شكراً لاستخدامك منصة My Invitation،
فريق My Invitation
  `;

  return {
    subject: `تم الموافقة على حدثك - ${data.eventName}`,
    html: htmlTemplate,
    text: textTemplate
  };
}

  /**
   * Create detailed bill email template for accountant
   */
  createBillEmailTemplate(data: BillEmailData) {
  const eventsTable = data.events.map(event => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: right;">${event.eventId}</td>
      <td style="padding: 12px; text-align: right;">${event.eventName || 'غير محدد'}</td>
      <td style="padding: 12px; text-align: right;">${event.hostName}</td>
      <td style="padding: 12px; text-align: right;">${event.eventDate}</td>
      <td style="padding: 12px; text-align: right;">${event.eventLocation}</td>
      <td style="padding: 12px; text-align: right;">${event.packageType}</td>
      <td style="padding: 12px; text-align: right;">${event.inviteCount}</td>
      <td style="padding: 12px; text-align: right; font-weight: bold; color: #C09B52;">${event.price.toLocaleString('ar-SA')} ريال</td>
    </tr>
  `).join('');

  const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة دفع - My Invitation</title>
  </head>
  <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #f8f9fa;">
      <div style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C09B52; padding-bottom: 20px;">
              <h1 style="color: #C09B52; margin: 0; font-size: 28px;">فاتورة دفع</h1>
              <p style="color: #666; margin: 10px 0 0 0;">My Invitation - منصة الدعوات الإلكترونية</p>
          </div>

          <div style="margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 20px;">تفاصيل الدفع</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-right: 4px solid #C09B52;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                      <div>
                          <strong>رقم الدفع:</strong> ${data.paymentId}
                      </div>
                      <div>
                          <strong>تاريخ الدفع:</strong> ${data.paymentDate}
                      </div>
                      <div>
                          <strong>طريقة الدفع:</strong> ${data.paymentMethod}
                      </div>
                      ${data.transactionId ? `<div><strong>رقم المعاملة:</strong> ${data.transactionId}</div>` : ''}
                  </div>
              </div>
          </div>

          <div style="margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 20px;">تفاصيل العميل</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                      <div><strong>الاسم:</strong> ${data.user.name}</div>
                      <div><strong>البريد الإلكتروني:</strong> ${data.user.email}</div>
                      <div><strong>رقم الهاتف:</strong> ${data.user.phone}</div>
                      <div><strong>المدينة:</strong> ${data.user.city}</div>
                  </div>
              </div>
          </div>

          <div style="margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 20px;">تفاصيل المناسبات</h2>
              <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <thead style="background: #C09B52; color: white;">
                          <tr>
                              <th style="padding: 15px; text-align: right; font-weight: bold;">رقم الحدث</th>
                              <th style="padding: 15px; text-align: right; font-weight: bold;">اسم المناسبة</th>
                              <th style="padding: 15px; text-align: right; font-weight: bold;">اسم المضيف</th>
                              <th style="padding: 15px; text-align: right; font-weight: bold;">تاريخ الحدث</th>
                              <th style="padding: 15px; text-align: right; font-weight: bold;">مكان الحدث</th>
                              <th style="padding: 15px; text-align: right; font-weight: bold;">نوع الباقة</th>
                              <th style="padding: 15px; text-align: right; font-weight: bold;">عدد الدعوات</th>
                              <th style="padding: 15px; text-align: right; font-weight: bold;">السعر</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${eventsTable}
                      </tbody>
                  </table>
              </div>
          </div>

          <div style="text-align: left; margin-top: 30px; padding: 20px; background: #C09B52; color: white; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 24px; font-weight: bold;">المجموع الكلي:</span>
                  <span style="font-size: 28px; font-weight: bold;">${data.totalAmount.toLocaleString('ar-SA')} ريال سعودي</span>
              </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #666; font-size: 14px;">تم إنشاء هذه الفاتورة تلقائياً من نظام My Invitation</p>
              <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} My Invitation. جميع الحقوق محفوظة.</p>
          </div>
      </div>
  </body>
  </html>
  `;

  const textTemplate = `
فاتورة دفع - My Invitation

تفاصيل الدفع:
- رقم الدفع: ${data.paymentId}
- تاريخ الدفع: ${data.paymentDate}
- طريقة الدفع: ${data.paymentMethod}
${data.transactionId ? `- رقم المعاملة: ${data.transactionId}` : ''}

تفاصيل العميل:
- الاسم: ${data.user.name}
- البريد الإلكتروني: ${data.user.email}
- رقم الهاتف: ${data.user.phone}
- المدينة: ${data.user.city}

تفاصيل المناسبات:
${data.events.map(event => `
- رقم الحدث: ${event.eventId}
- اسم المناسبة: ${event.eventName || 'غير محدد'}
- اسم المضيف: ${event.hostName}
- تاريخ الحدث: ${event.eventDate}
- مكان الحدث: ${event.eventLocation}
- نوع الباقة: ${event.packageType}
- عدد الدعوات: ${event.inviteCount}
- السعر: ${event.price.toLocaleString('ar-SA')} ريال
`).join('')}

المجموع الكلي: ${data.totalAmount.toLocaleString('ar-SA')} ريال سعودي

تم إنشاء هذه الفاتورة تلقائياً من نظام My Invitation
© ${new Date().getFullYear()} My Invitation. جميع الحقوق محفوظة.
  `;

  return {
    subject: `فاتورة دفع - ${data.paymentId} - ${data.totalAmount.toLocaleString('ar-SA')} ريال`,
    html: htmlTemplate,
    text: textTemplate
  };
}

/**
 * Create event details email template for support team
 */
createEventDetailsEmailTemplate(data: EventDetailsEmailData) {
  const eventsDetails = data.events.map(event => `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-right: 4px solid #C09B52;">
        <h3 style="color: #C09B52; margin-top: 0; margin-bottom: 15px;">${event.hostName}</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div><strong>رقم الحدث:</strong> ${event.eventId}</div>
            <div><strong>اسم المناسبة:</strong> ${event.eventName || 'غير محدد'}</div>
            <div><strong>نوع الباقة:</strong> ${event.packageType}</div>
            <div><strong>تاريخ الحدث:</strong> ${event.eventDate}</div>
            <div><strong>عدد الدعوات:</strong> ${event.inviteCount}</div>
            <div><strong>وقت البداية:</strong> ${event.startTime}</div>
            <div><strong>وقت النهاية:</strong> ${event.endTime}</div>
            <div><strong>بطاقات إضافية:</strong> ${event.additionalCards}</div>
            <div><strong>مشرفي البوابة:</strong> ${event.gateSupervisors}</div>
            <div><strong>التوصيل السريع:</strong> ${event.fastDelivery ? 'نعم' : 'لا'}</div>
            ${event.detectedCity ? `<div><strong>المدينة المكتشفة:</strong> ${event.detectedCity}</div>` : ''}
        </div>
        <div style="margin-top: 15px;">
            <strong>مكان الحدث:</strong> ${event.eventLocation}
        </div>
        <div style="margin-top: 15px;">
            <strong>نص الدعوة:</strong>
            <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 10px; border: 1px solid #e5e7eb;">
                ${event.invitationText}
            </div>
        </div>
        <div style="text-align: left; margin-top: 15px; padding: 10px; background: #C09B52; color: white; border-radius: 5px;">
            <strong>السعر: ${event.price.toLocaleString('ar-SA')} ريال سعودي</strong>
        </div>
    </div>
  `).join('');

  const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تفاصيل مناسبات جديدة - My Invitation</title>
  </head>
  <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #f8f9fa;">
      <div style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C09B52; padding-bottom: 20px;">
              <h1 style="color: #C09B52; margin: 0; font-size: 28px;">تفاصيل مناسبات جديدة</h1>
              <p style="color: #666; margin: 10px 0 0 0;">My Invitation - منصة الدعوات الإلكترونية</p>
          </div>

          <div style="margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 20px;">معلومات الدفع</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-right: 4px solid #C09B52;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                      <div><strong>رقم الدفع:</strong> ${data.paymentId}</div>
                      <div><strong>تاريخ الدفع:</strong> ${data.paymentDate}</div>
                      <div><strong>طريقة الدفع:</strong> ${data.paymentMethod}</div>
                      ${data.transactionId ? `<div><strong>رقم المعاملة:</strong> ${data.transactionId}</div>` : ''}
                  </div>
              </div>
          </div>

          <div style="margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 20px;">معلومات العميل</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                      <div><strong>الاسم:</strong> ${data.user.name}</div>
                      <div><strong>البريد الإلكتروني:</strong> ${data.user.email}</div>
                      <div><strong>رقم الهاتف:</strong> ${data.user.phone}</div>
                      <div><strong>المدينة:</strong> ${data.user.city}</div>
                  </div>
              </div>
          </div>

          <div style="margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 20px;">تفاصيل المناسبات (${data.events.length} مناسبة)</h2>
              ${eventsDetails}
          </div>

          <div style="text-align: left; margin-top: 30px; padding: 20px; background: #C09B52; color: white; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 24px; font-weight: bold;">المجموع الكلي:</span>
                  <span style="font-size: 28px; font-weight: bold;">${data.totalAmount.toLocaleString('ar-SA')} ريال سعودي</span>
              </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #666; font-size: 14px;">تم إرسال هذه التفاصيل تلقائياً من نظام My Invitation</p>
              <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} My Invitation. جميع الحقوق محفوظة.</p>
          </div>
      </div>
  </body>
  </html>
  `;

  const textTemplate = `
تفاصيل مناسبات جديدة - My Invitation

معلومات الدفع:
- رقم الدفع: ${data.paymentId}
- تاريخ الدفع: ${data.paymentDate}
- طريقة الدفع: ${data.paymentMethod}
${data.transactionId ? `- رقم المعاملة: ${data.transactionId}` : ''}

معلومات العميل:
- الاسم: ${data.user.name}
- البريد الإلكتروني: ${data.user.email}
- رقم الهاتف: ${data.user.phone}
- المدينة: ${data.user.city}

تفاصيل المناسبات (${data.events.length} مناسبة):
${data.events.map(event => `
${event.hostName}:
- رقم الحدث: ${event.eventId}
- نوع الباقة: ${event.packageType}
- تاريخ الحدث: ${event.eventDate}
- عدد الدعوات: ${event.inviteCount}
- وقت البداية: ${event.startTime}
- وقت النهاية: ${event.endTime}
- مكان الحدث: ${event.eventLocation}
- بطاقات إضافية: ${event.additionalCards}
- مشرفي البوابة: ${event.gateSupervisors}
- التوصيل السريع: ${event.fastDelivery ? 'نعم' : 'لا'}
${event.detectedCity ? `- المدينة المكتشفة: ${event.detectedCity}` : ''}
- نص الدعوة: ${event.invitationText}
- السعر: ${event.price.toLocaleString('ar-SA')} ريال
`).join('')}

المجموع الكلي: ${data.totalAmount.toLocaleString('ar-SA')} ريال سعودي

تم إرسال هذه التفاصيل تلقائياً من نظام My Invitation
© ${new Date().getFullYear()} My Invitation. جميع الحقوق محفوظة.
  `;

  return {
    subject: `تفاصيل مناسبات جديدة - ${data.events.length} مناسبة - ${data.totalAmount.toLocaleString('ar-SA')} ريال`,
    html: htmlTemplate,
    text: textTemplate
  };
}

/**
 * Send event approval email
 */
async sendEventApprovalEmail(data: EventApprovalEmailData): Promise<boolean> {
  try {
    logger.info('Sending event approval email', { 
      email: data.email, 
      eventName: data.eventName 
    });

    const template = this.createEventApprovalTemplate(data);
    const recipients = [new Recipient(data.email, data.name)];

    const emailParams = new EmailParams()
      .setFrom(this.sender)
      .setTo(recipients)
      .setSubject(template.subject)
      .setHtml(template.html)
      .setText(template.text);

    const response = await this.mailerSend.email.send(emailParams);

    if (response?.statusCode && response.statusCode >= 400) {
      throw new Error(`MailerSend API error: ${response.statusCode}`);
    }

    logger.info('Event approval email sent successfully', { 
      email: data.email,
      eventName: data.eventName 
    });
    return true;

  } catch (error: any) {
    logger.error('Failed to send event approval email', {
      email: data.email,
      eventName: data.eventName,
      error: error.message
    });
    throw new Error('فشل في إرسال بريد الموافقة على الحدث');
  }
}

  /**
   * Send detailed bill email to accountant
   */
  async sendBillEmail(data: BillEmailData): Promise<boolean> {
    try {
      logger.info('Sending bill email to accountant', { 
        paymentId: data.paymentId,
        totalAmount: data.totalAmount 
      });

      const template = this.createBillEmailTemplate(data);
      const recipients = [new Recipient('accountant@myinvitation-sa.com', 'محاسب My Invitation')];

      const emailParams = new EmailParams()
        .setFrom(this.sender)
        .setTo(recipients)
        .setSubject(template.subject)
        .setHtml(template.html)
        .setText(template.text);

      const response = await this.mailerSend.email.send(emailParams);

      if (response?.statusCode && response.statusCode >= 400) {
        throw new Error(`MailerSend API error: ${response.statusCode}`);
      }

      logger.info('Bill email sent successfully to accountant', { 
        paymentId: data.paymentId,
        totalAmount: data.totalAmount 
      });
      return true;

    } catch (error: any) {
      logger.error('Failed to send bill email to accountant', {
        paymentId: data.paymentId,
        totalAmount: data.totalAmount,
        error: error.message,
        fullError: error,
        apiResponse: error.response?.data,
        statusCode: error.response?.status
      });
      throw new Error('فشل في إرسال فاتورة الدفع للمحاسب');
    }
  }

  /**
   * Send bill email to user (customer)
   */
  async sendBillEmailToUser(data: BillEmailData): Promise<boolean> {
    try {
      logger.info('Sending bill email to user', { 
        email: data.user.email,
        paymentId: data.paymentId,
        totalAmount: data.totalAmount 
      });

      const template = this.createBillEmailTemplate(data);
      const recipients = [new Recipient(data.user.email, data.user.name)];

      const emailParams = new EmailParams()
        .setFrom(this.sender)
        .setTo(recipients)
        .setSubject(template.subject)
        .setHtml(template.html)
        .setText(template.text);

      const response = await this.mailerSend.email.send(emailParams);

      if (response?.statusCode && response.statusCode >= 400) {
        throw new Error(`MailerSend API error: ${response.statusCode}`);
      }

      logger.info('Bill email sent successfully to user', { 
        email: data.user.email,
        paymentId: data.paymentId,
        totalAmount: data.totalAmount 
      });
      return true;

    } catch (error: any) {
      logger.error('Failed to send bill email to user', {
        email: data.user.email,
        paymentId: data.paymentId,
        totalAmount: data.totalAmount,
        error: error.message
      });
      // Don't throw error - email sending failure shouldn't block the process
      return false;
    }
  }

  /**
   * Send event details email to support team
   */
  async sendEventDetailsEmail(data: EventDetailsEmailData): Promise<boolean> {
    try {
      logger.info('Sending event details email to support team', { 
        paymentId: data.paymentId,
        eventsCount: data.events.length 
      });

      const template = this.createEventDetailsEmailTemplate(data);
      
      // Send to multiple recipients
      const recipients = [
        new Recipient('customersupport@myinvitation-sa.com', 'دعم العملاء'),
        new Recipient('generalmanager@myinvitation-sa.com', 'المدير العام'),
        new Recipient('ahmed.maher@myinvitation-sa.com', 'أحمد ماهر')
      ];

      const emailParams = new EmailParams()
        .setFrom(this.sender)
        .setTo(recipients)
        .setSubject(template.subject)
        .setHtml(template.html)
        .setText(template.text);

      const response = await this.mailerSend.email.send(emailParams);

      if (response?.statusCode && response.statusCode >= 400) {
        throw new Error(`MailerSend API error: ${response.statusCode}`);
      }

      logger.info('Event details email sent successfully to support team', { 
        paymentId: data.paymentId,
        eventsCount: data.events.length 
      });
      return true;

    } catch (error: any) {
      logger.error('Failed to send event details email to support team', {
        paymentId: data.paymentId,
        eventsCount: data.events.length,
        error: error.message,
        fullError: error,
        apiResponse: error.response?.data,
        statusCode: error.response?.status
      });
      throw new Error('فشل في إرسال تفاصيل المناسبات لفريق الدعم');
    }
  }

  /**
   * Send contact email to customer support
   */
  async sendContactEmail(data: ContactEmailData): Promise<boolean> {
    try {
      logger.info('Sending contact email to customer support', {
        email: data.email,
        subject: data.subject,
        name: data.name
      });

      const template = this.createContactEmailTemplate(data);
      const recipients = [new Recipient('customersupport@myinvitation-sa.com', 'دعم العملاء - My Invitation')];

      const emailParams = new EmailParams()
        .setFrom(this.sender)
        .setTo(recipients)
        .setSubject(template.subject)
        .setHtml(template.html)
        .setText(template.text)
        .setReplyTo(new Recipient(data.email, data.name)); // Allow direct reply to customer

      const response = await this.mailerSend.email.send(emailParams);

      if (response?.statusCode && response.statusCode >= 400) {
        throw new Error(`MailerSend API error: ${response.statusCode}`);
      }

      logger.info('Contact email sent successfully to customer support', {
        email: data.email,
        subject: data.subject,
        name: data.name
      });
      return true;

    } catch (error: any) {
      logger.error('Failed to send contact email to customer support', {
        email: data.email,
        subject: data.subject,
        name: data.name,
        error: error.message
      });
      throw new Error('فشل في إرسال رسالة التواصل');
    }
  }

  /**
   * Send contact confirmation email to user
   */
  async sendContactConfirmationEmail(data: ContactConfirmationEmailData): Promise<boolean> {
    try {
      logger.info('Sending contact confirmation email', {
        email: data.email,
        subject: data.subject,
        name: data.name
      });

      const template = this.createContactConfirmationTemplate(data);
      const recipients = [new Recipient(data.email, data.name)];

      const emailParams = new EmailParams()
        .setFrom(this.sender)
        .setTo(recipients)
        .setSubject(template.subject)
        .setHtml(template.html)
        .setText(template.text);

      const response = await this.mailerSend.email.send(emailParams);

      if (response?.statusCode && response.statusCode >= 400) {
        throw new Error(`MailerSend API error: ${response.statusCode}`);
      }

      logger.info('Contact confirmation email sent successfully', {
        email: data.email,
        subject: data.subject,
        name: data.name
      });
      return true;

    } catch (error: any) {
      logger.error('Failed to send contact confirmation email', {
        email: data.email,
        subject: data.subject,
        name: data.name,
        error: error.message
      });
      // Don't throw error for confirmation emails - they're not critical
      return false;
    }
  }

  /**
   * General purpose email sender for future use
   */
  async sendEmail(
    to: { email: string; name: string },
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<boolean> {
    try {
      const recipients = [new Recipient(to.email, to.name)];

      const emailParams = new EmailParams()
        .setFrom(this.sender)
        .setTo(recipients)
        .setSubject(subject)
        .setHtml(htmlContent);

      if (textContent) {
        emailParams.setText(textContent);
      }

      const response = await this.mailerSend.email.send(emailParams);

      if (response?.statusCode && response.statusCode >= 400) {
        throw new Error(`MailerSend API error: ${response.statusCode}`);
      }

      logger.info('Email sent successfully', { email: to.email, subject });
      return true;

    } catch (error: any) {
      logger.error('Failed to send email', {
        email: to.email,
        subject,
        error: error.message
      });
      throw new Error('فشل في إرسال البريد الإلكتروني');
    }
  }
}



export const emailService = new EmailService();
// server/src/services/emailService.ts
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { logger } from '../config/logger';

export interface PasswordResetEmailData {
  name: string;
  email: string;
  resetLink: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
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
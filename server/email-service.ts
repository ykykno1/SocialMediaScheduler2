import nodemailer from 'nodemailer';
import { nanoid } from 'nanoid';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(config: EmailConfig, fromEmail: string) {
    this.transporter = nodemailer.createTransport(config);
    this.fromEmail = fromEmail;
  }

  /**
   * Send email verification message
   */
  async sendVerificationEmail(to: string, verificationCode: string): Promise<boolean> {
    const mailOptions = {
      from: this.fromEmail,
      to: to,
      subject: 'אימות כתובת מייל - רובוט שבת',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">רובוט שבת</h1>
            <h2 style="color: #374151; margin-bottom: 30px;">אימות כתובת מייל</h2>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              שלום,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              קוד האימות שלך הוא:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="
                background: #2563eb; 
                color: white; 
                padding: 15px 30px; 
                font-size: 24px; 
                font-weight: bold; 
                border-radius: 8px;
                letter-spacing: 3px;
                display: inline-block;
              ">${verificationCode}</span>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              הזן קוד זה באתר כדי לאמת את כתובת המייל שלך.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              קוד האימות תקף למשך 15 דקות בלבד.
            </p>
          </div>
          
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              © 2025 רובוט שבת - כל הזכויות שמורות
            </p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetCode: string): Promise<boolean> {
    const mailOptions = {
      from: this.fromEmail,
      to: to,
      subject: 'איפוס סיסמה - רובוט שבת',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">רובוט שבת</h1>
            <h2 style="color: #374151; margin-bottom: 30px;">איפוס סיסמה</h2>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              שלום,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              קוד איפוס הסיסמה שלך הוא:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="
                background: #dc2626; 
                color: white; 
                padding: 15px 30px; 
                font-size: 24px; 
                font-weight: bold; 
                border-radius: 8px;
                letter-spacing: 3px;
                display: inline-block;
              ">${resetCode}</span>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              הזן קוד זה באתר כדי לאפס את הסיסמה שלך.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              קוד איפוס הסיסמה תקף למשך 15 דקות בלבד.
            </p>
          </div>
          
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              © 2025 רובוט שבת - כל הזכויות שמורות
            </p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

/**
 * Generate 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create email service instance
 */
export function createEmailService(): EmailService | null {
  // Try Gmail SMTP first
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  
  if (gmailUser && gmailPass) {
    return new EmailService({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    }, gmailUser);
  }

  // Try Mailjet as fallback
  const mailjetUser = process.env.MAILJET_USER;
  const mailjetPass = process.env.MAILJET_PASSWORD;
  
  if (mailjetUser && mailjetPass) {
    return new EmailService({
      host: 'in-v3.mailjet.com',
      port: 587,
      secure: false,
      auth: {
        user: mailjetUser,
        pass: mailjetPass
      }
    }, process.env.MAILJET_FROM_EMAIL || mailjetUser);
  }

  console.warn('No email service configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD or MAILJET credentials');
  return null;
}

export const emailService = createEmailService();
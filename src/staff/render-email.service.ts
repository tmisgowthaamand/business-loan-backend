import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class RenderEmailService {
  private readonly logger = new Logger(RenderEmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private sendGridConfigured = false;

  constructor(private configService: ConfigService) {
    this.initializeEmailServices();
  }

  private initializeEmailServices() {
    this.logger.log('🚀 RENDER DEPLOYMENT - Initializing email services...');

    // Try to initialize SendGrid first (recommended for production)
    this.initializeSendGrid();

    // Try to initialize Gmail SMTP as fallback
    this.initializeGmailSMTP();

    // Log configuration status
    this.logEmailConfiguration();
  }

  private initializeSendGrid() {
    const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    
    if (sendGridApiKey && sendGridApiKey !== 'YOUR_SENDGRID_API_KEY_HERE') {
      try {
        sgMail.setApiKey(sendGridApiKey);
        this.sendGridConfigured = true;
        this.logger.log('✅ SendGrid email service configured for Render deployment');
      } catch (error) {
        this.logger.warn('⚠️ SendGrid configuration failed:', error.message);
      }
    } else {
      this.logger.warn('⚠️ SendGrid API key not configured');
    }
  }

  private initializeGmailSMTP() {
    const gmailEmail = this.configService.get<string>('GMAIL_EMAIL');
    const gmailPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');

    if (gmailEmail && gmailPassword) {
      try {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailEmail,
            pass: gmailPassword,
          },
        });
        this.logger.log('✅ Gmail SMTP service configured for Render deployment');
      } catch (error) {
        this.logger.warn('⚠️ Gmail SMTP configuration failed:', error.message);
      }
    } else {
      this.logger.warn('⚠️ Gmail SMTP credentials not configured');
    }
  }

  private logEmailConfiguration() {
    const isRender = this.configService.get<string>('RENDER') === 'true';
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    this.logger.log('📧 RENDER DEPLOYMENT - Email Service Status:');
    this.logger.log(`   - Environment: ${isRender ? 'Render' : 'Local'} (${isProduction ? 'Production' : 'Development'})`);
    this.logger.log(`   - SendGrid: ${this.sendGridConfigured ? '✅ Configured' : '❌ Not configured'}`);
    this.logger.log(`   - Gmail SMTP: ${this.transporter ? '✅ Configured' : '❌ Not configured'}`);

    if (!this.sendGridConfigured && !this.transporter) {
      this.logger.warn('⚠️ No email services configured - emails will be logged only');
      this.logEmailSetupInstructions();
    } else {
      this.logger.log('✅ Email system ready for Render deployment');
    }
  }

  private logEmailSetupInstructions() {
    const instructions = [
      '⚠️ Configure at least one email service for production',
      '📧 Recommended: SendGrid (free tier: 100 emails/day)',
      '🔑 Get SendGrid API key from https://sendgrid.com',
      '',
      '🔧 Render Environment Variables:',
      '🌐 Set BACKEND_URL environment variable on Render',
      '🔐 Add email service credentials to Render environment variables',
      '🧪 Test email delivery after deployment',
      '',
      '🏠 Local development: Email services will fallback to demo mode',
      '📝 Check console logs for manual email instructions',
      '',
      '✅ Email system ready for production deployment'
    ];

    instructions.forEach(instruction => {
      if (instruction) {
        this.logger.log(instruction);
      } else {
        this.logger.log('');
      }
    });
  }

  async sendVerificationEmail(to: string, name: string, verificationToken: string): Promise<boolean> {
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:5002';
    const verificationLink = `${backendUrl}/api/staff/verify/${verificationToken}`;

    const emailContent = {
      to,
      from: this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@businessloan.com',
      subject: 'Staff Account Verification - Business Loan Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Business Loan Portal</h2>
          <p>Hello ${name},</p>
          <p>Your staff account has been created successfully. Please click the link below to verify your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Account
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${verificationLink}</p>
          <p>This verification link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent from the Business Loan Portal system. If you didn't expect this email, please ignore it.
          </p>
        </div>
      `
    };

    try {
      // Try SendGrid first
      if (this.sendGridConfigured) {
        await sgMail.send(emailContent);
        this.logger.log(`✅ Verification email sent via SendGrid to: ${to}`);
        return true;
      }

      // Fallback to Gmail SMTP
      if (this.transporter) {
        await this.transporter.sendMail(emailContent);
        this.logger.log(`✅ Verification email sent via Gmail SMTP to: ${to}`);
        return true;
      }

      // No email service configured - log the email content
      this.logger.warn('📧 EMAIL SERVICE NOT CONFIGURED - Email content logged:');
      this.logger.log(`   To: ${to}`);
      this.logger.log(`   Subject: ${emailContent.subject}`);
      this.logger.log(`   Verification Link: ${verificationLink}`);
      this.logger.log('   Please manually send this verification link to the staff member.');

      return false;

    } catch (error) {
      this.logger.error('❌ Failed to send verification email:', error.message);
      
      // Log email content for manual sending
      this.logger.log('📧 Manual email instructions:');
      this.logger.log(`   Send to: ${to}`);
      this.logger.log(`   Subject: ${emailContent.subject}`);
      this.logger.log(`   Link: ${verificationLink}`);
      
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:5002';
    const resetLink = `${backendUrl}/api/staff/reset-password/${resetToken}`;

    const emailContent = {
      to,
      from: this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@businessloan.com',
      subject: 'Password Reset - Business Loan Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${resetLink}</p>
          <p>This reset link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent from the Business Loan Portal system.
          </p>
        </div>
      `
    };

    try {
      // Try SendGrid first
      if (this.sendGridConfigured) {
        await sgMail.send(emailContent);
        this.logger.log(`✅ Password reset email sent via SendGrid to: ${to}`);
        return true;
      }

      // Fallback to Gmail SMTP
      if (this.transporter) {
        await this.transporter.sendMail(emailContent);
        this.logger.log(`✅ Password reset email sent via Gmail SMTP to: ${to}`);
        return true;
      }

      // No email service configured - log the email content
      this.logger.warn('📧 EMAIL SERVICE NOT CONFIGURED - Email content logged:');
      this.logger.log(`   To: ${to}`);
      this.logger.log(`   Subject: ${emailContent.subject}`);
      this.logger.log(`   Reset Link: ${resetLink}`);

      return false;

    } catch (error) {
      this.logger.error('❌ Failed to send password reset email:', error.message);
      
      // Log email content for manual sending
      this.logger.log('📧 Manual email instructions:');
      this.logger.log(`   Send to: ${to}`);
      this.logger.log(`   Subject: ${emailContent.subject}`);
      this.logger.log(`   Link: ${resetLink}`);
      
      return false;
    }
  }

  getEmailServiceStatus() {
    return {
      sendGridConfigured: this.sendGridConfigured,
      gmailSMTPConfigured: !!this.transporter,
      hasEmailService: this.sendGridConfigured || !!this.transporter,
      environment: {
        isRender: this.configService.get<string>('RENDER') === 'true',
        isProduction: this.configService.get<string>('NODE_ENV') === 'production'
      }
    };
  }
}

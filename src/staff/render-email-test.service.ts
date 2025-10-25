import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class RenderEmailTestService {
  private readonly logger = new Logger(RenderEmailTestService.name);
  private transporter: nodemailer.Transporter | null = null;
  private sendGridConfigured = false;

  constructor(private configService: ConfigService) {
    this.initializeEmailServices();
  }

  private initializeEmailServices() {
    this.logger.log('🧪 RENDER EMAIL TEST - Initializing email services...');
    
    // Initialize SendGrid
    this.initializeSendGrid();
    
    // Initialize Gmail SMTP
    this.initializeGmailSMTP();
    
    // Log configuration status
    this.logEmailConfiguration();
  }

  private initializeSendGrid() {
    const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    
    this.logger.log('🔑 SENDGRID API KEY CHECK:');
    this.logger.log(`   - Present: ${!!sendGridApiKey}`);
    this.logger.log(`   - Length: ${sendGridApiKey?.length || 0}`);
    this.logger.log(`   - Starts with SG.: ${sendGridApiKey?.startsWith('SG.') || false}`);
    this.logger.log(`   - Preview: ${sendGridApiKey ? sendGridApiKey.substring(0, 8) + '...' : 'NOT SET'}`);
    
    if (sendGridApiKey && sendGridApiKey.startsWith('SG.')) {
      try {
        sgMail.setApiKey(sendGridApiKey);
        this.sendGridConfigured = true;
        this.logger.log('✅ SendGrid configured successfully');
      } catch (error) {
        this.logger.error('❌ SendGrid configuration failed:', error.message);
        this.sendGridConfigured = false;
      }
    } else {
      this.logger.warn('⚠️ SendGrid API key not configured or invalid format');
      this.sendGridConfigured = false;
    }
  }

  private initializeGmailSMTP() {
    const gmailEmail = this.configService.get<string>('GMAIL_EMAIL');
    const gmailPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');

    this.logger.log('📧 GMAIL SMTP CHECK:');
    this.logger.log(`   - Email Present: ${!!gmailEmail}`);
    this.logger.log(`   - Email: ${gmailEmail || 'NOT SET'}`);
    this.logger.log(`   - Password Present: ${!!gmailPassword}`);
    this.logger.log(`   - Password Length: ${gmailPassword?.length || 0}`);

    if (gmailEmail && gmailPassword) {
      try {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailEmail,
            pass: gmailPassword,
          },
        } as any);
        this.logger.log('✅ Gmail SMTP configured successfully');
      } catch (error) {
        this.logger.error('❌ Gmail SMTP configuration failed:', error.message);
        this.transporter = null;
      }
    } else {
      this.logger.warn('⚠️ Gmail SMTP credentials not configured');
      this.transporter = null;
    }
  }

  private logEmailConfiguration() {
    const isRender = this.configService.get<string>('RENDER') === 'true';
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    this.logger.log('🌐 RENDER EMAIL TEST - Configuration Status:');
    this.logger.log(`   - Environment: ${isRender ? 'Render' : 'Local'} (${isProduction ? 'Production' : 'Development'})`);
    this.logger.log(`   - SendGrid: ${this.sendGridConfigured ? '✅ Ready' : '❌ Not Ready'}`);
    this.logger.log(`   - Gmail SMTP: ${this.transporter ? '✅ Ready' : '❌ Not Ready'}`);

    if (!this.sendGridConfigured && !this.transporter) {
      this.logger.error('❌ NO EMAIL SERVICES CONFIGURED!');
      this.logSetupInstructions();
    }
  }

  private logSetupInstructions() {
    this.logger.log('');
    this.logger.log('🔧 RENDER EMAIL SETUP INSTRUCTIONS:');
    this.logger.log('');
    this.logger.log('📧 OPTION 1: SendGrid (RECOMMENDED for Render)');
    this.logger.log('   1. Sign up at https://app.sendgrid.com');
    this.logger.log('   2. Go to Settings > API Keys');
    this.logger.log('   3. Create API Key with Full Access');
    this.logger.log('   4. Go to Settings > Sender Authentication');
    this.logger.log('   5. Click "Verify a Single Sender"');
    this.logger.log('   6. Add and verify your email address');
    this.logger.log('   7. In Render Dashboard > Environment Variables:');
    this.logger.log('      - SENDGRID_API_KEY=SG.your-api-key-here');
    this.logger.log('      - SENDGRID_FROM_EMAIL=your-verified-email@domain.com');
    this.logger.log('   8. Redeploy your Render service');
    this.logger.log('');
    this.logger.log('📧 OPTION 2: Gmail SMTP (May be blocked on Render)');
    this.logger.log('   1. Enable 2FA on your Gmail account');
    this.logger.log('   2. Generate App Password: Google Account > Security > App passwords');
    this.logger.log('   3. In Render Dashboard > Environment Variables:');
    this.logger.log('      - GMAIL_EMAIL=your-email@gmail.com');
    this.logger.log('      - GMAIL_APP_PASSWORD=your-16-char-app-password');
    this.logger.log('   4. Redeploy your Render service');
    this.logger.log('');
  }

  async testSendGridEmail(testEmail: string): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.sendGridConfigured) {
      return {
        success: false,
        message: 'SendGrid not configured',
        details: {
          apiKey: !!this.configService.get('SENDGRID_API_KEY'),
          fromEmail: this.configService.get('SENDGRID_FROM_EMAIL') || 'NOT SET'
        }
      };
    }

    try {
      const fromEmail = this.configService.get('SENDGRID_FROM_EMAIL') || 'noreply@businessloan.com';
      
      const msg = {
        to: testEmail,
        from: {
          email: fromEmail,
          name: 'Business Loan System Test'
        },
        subject: '🧪 Render Email Test - SendGrid',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">📧 Render Email Test - SendGrid</h2>
            <p>Hello!</p>
            <p>This is a test email sent from your Render deployment using SendGrid.</p>
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; color: #1e40af;">✅ Email System Working!</h3>
              <p style="margin: 10px 0 0 0;">Your SendGrid configuration is working correctly on Render.</p>
            </div>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Platform: Render</li>
              <li>Service: SendGrid</li>
              <li>From: ${fromEmail}</li>
              <li>Time: ${new Date().toISOString()}</li>
            </ul>
            <p>If you received this email, your email system is ready for production!</p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated test email from the Business Loan Management System.
            </p>
          </div>
        `
      };

      this.logger.log(`🧪 Testing SendGrid email to: ${testEmail}`);
      this.logger.log(`📧 From: ${fromEmail}`);
      
      const result = await sgMail.send(msg);
      
      this.logger.log('✅ SendGrid test email sent successfully!');
      this.logger.log(`📧 Response status: ${result[0]?.statusCode || 'Unknown'}`);
      
      return {
        success: true,
        message: 'SendGrid test email sent successfully',
        details: {
          statusCode: result[0]?.statusCode,
          messageId: result[0]?.headers?.['x-message-id'],
          fromEmail: fromEmail
        }
      };
    } catch (error) {
      this.logger.error('❌ SendGrid test failed:', error.message);
      
      let errorDetails: any = {
        error: error.message,
        code: error.code
      };

      if (error.response?.body?.errors) {
        errorDetails.sendGridErrors = error.response.body.errors;
        this.logger.error('📧 SendGrid API errors:', JSON.stringify(error.response.body.errors, null, 2));
      }

      return {
        success: false,
        message: `SendGrid test failed: ${error.message}`,
        details: errorDetails
      };
    }
  }

  async testGmailSMTP(testEmail: string): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.transporter) {
      return {
        success: false,
        message: 'Gmail SMTP not configured',
        details: {
          email: this.configService.get('GMAIL_EMAIL') || 'NOT SET',
          password: !!this.configService.get('GMAIL_APP_PASSWORD')
        }
      };
    }

    try {
      const gmailEmail = this.configService.get('GMAIL_EMAIL');
      
      const mailOptions = {
        from: {
          name: 'Business Loan System Test',
          address: gmailEmail
        },
        to: testEmail,
        subject: '🧪 Render Email Test - Gmail SMTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">📧 Render Email Test - Gmail SMTP</h2>
            <p>Hello!</p>
            <p>This is a test email sent from your Render deployment using Gmail SMTP.</p>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; color: #dc2626;">⚠️ SMTP on Render</h3>
              <p style="margin: 10px 0 0 0;">Note: Render may block SMTP connections. SendGrid is recommended.</p>
            </div>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Platform: Render</li>
              <li>Service: Gmail SMTP</li>
              <li>From: ${gmailEmail}</li>
              <li>Time: ${new Date().toISOString()}</li>
            </ul>
            <p>If you received this email, Gmail SMTP is working on your Render deployment!</p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated test email from the Business Loan Management System.
            </p>
          </div>
        `
      };

      this.logger.log(`🧪 Testing Gmail SMTP to: ${testEmail}`);
      this.logger.log(`📧 From: ${gmailEmail}`);
      
      // Short timeout for Render
      const sendPromise = this.transporter.sendMail(mailOptions);
      const result = await Promise.race([
        sendPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMTP timeout (5s)')), 5000)
        )
      ]) as any;
      
      this.logger.log('✅ Gmail SMTP test email sent successfully!');
      this.logger.log(`📧 Message ID: ${result.messageId}`);
      
      return {
        success: true,
        message: 'Gmail SMTP test email sent successfully',
        details: {
          messageId: result.messageId,
          fromEmail: gmailEmail
        }
      };
    } catch (error) {
      this.logger.error('❌ Gmail SMTP test failed:', error.message);
      
      let errorMessage = `Gmail SMTP test failed: ${error.message}`;
      if (error.message.includes('timeout')) {
        errorMessage += ' (Render may be blocking SMTP connections)';
      }
      
      return {
        success: false,
        message: errorMessage,
        details: {
          error: error.message,
          code: error.code,
          suggestion: 'Consider using SendGrid for Render deployments'
        }
      };
    }
  }

  async runComprehensiveTest(testEmail: string): Promise<{
    sendGrid: { success: boolean; message: string; details?: any };
    gmailSMTP: { success: boolean; message: string; details?: any };
    recommendation: string;
  }> {
    this.logger.log('🧪 RENDER COMPREHENSIVE EMAIL TEST STARTING...');
    this.logger.log(`📧 Test email: ${testEmail}`);
    this.logger.log('===============================================');

    // Test SendGrid
    const sendGridResult = await this.testSendGridEmail(testEmail);
    
    // Test Gmail SMTP
    const gmailResult = await this.testGmailSMTP(testEmail);

    // Generate recommendation
    let recommendation = '';
    if (sendGridResult.success) {
      recommendation = '✅ SendGrid is working perfectly! This is the recommended solution for Render.';
    } else if (gmailResult.success) {
      recommendation = '⚠️ Gmail SMTP is working, but SendGrid is recommended for Render deployments.';
    } else {
      recommendation = '❌ Both email services failed. Please check your configuration and try again.';
    }

    this.logger.log('===============================================');
    this.logger.log('🧪 RENDER EMAIL TEST COMPLETED');
    this.logger.log(`📧 SendGrid: ${sendGridResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    this.logger.log(`📧 Gmail SMTP: ${gmailResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    this.logger.log(`💡 Recommendation: ${recommendation}`);
    this.logger.log('===============================================');

    return {
      sendGrid: sendGridResult,
      gmailSMTP: gmailResult,
      recommendation
    };
  }

  getEmailServiceStatus() {
    return {
      sendGrid: {
        configured: this.sendGridConfigured,
        apiKey: !!this.configService.get('SENDGRID_API_KEY'),
        fromEmail: this.configService.get('SENDGRID_FROM_EMAIL') || 'NOT SET'
      },
      gmailSMTP: {
        configured: !!this.transporter,
        email: this.configService.get('GMAIL_EMAIL') || 'NOT SET',
        password: !!this.configService.get('GMAIL_APP_PASSWORD')
      },
      environment: {
        isRender: this.configService.get('RENDER') === 'true',
        isProduction: this.configService.get('NODE_ENV') === 'production',
        platform: process.env.RENDER === 'true' ? 'Render' : 'Local'
      }
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { StaffRole } from './dto/staff.dto';

@Injectable()
export class ProfessionalEmailService {
  private readonly logger = new Logger(ProfessionalEmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeEmailService();
  }

  private async initializeEmailService() {
    try {
      // Use Gmail SMTP with app password for better deliverability
      const gmailEmail = this.configService.get<string>('GMAIL_EMAIL');
      const gmailPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');
      const isRender = process.env.RENDER === 'true';

      if (gmailEmail && gmailPassword) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // Use STARTTLS
          auth: {
            user: gmailEmail,
            pass: gmailPassword
          },
          // Anti-spam configurations
          tls: {
            rejectUnauthorized: false
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateLimit: 14, // messages per second
          // Render-specific timeout settings
          connectionTimeout: isRender ? 30000 : 60000, // 30s on Render, 60s locally
          greetingTimeout: isRender ? 15000 : 30000,   // 15s on Render, 30s locally
          socketTimeout: isRender ? 30000 : 60000      // 30s on Render, 60s locally
        });

        // Skip connection verification on Render to avoid blocking startup
        if (!isRender) {
          try {
            await Promise.race([
              this.transporter.verify(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Verification timeout')), 10000))
            ]);
            this.logger.log('✅ Professional email service initialized and verified');
          } catch (verifyError) {
            this.logger.warn('⚠️ Email verification failed, but service configured:', verifyError.message);
          }
        } else {
          this.logger.log('✅ Professional email service configured for Render (verification skipped)');
        }
      } else {
        this.logger.warn('⚠️ Gmail credentials not configured - email features disabled');
        this.logger.log('💡 Set GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables to enable email');
      }
    } catch (error) {
      this.logger.error('❌ Email service initialization failed:', error.message);
      this.logger.warn('📧 Email service will operate in fallback mode');
      // Don't throw error - let the service start without email
    }
  }

  async sendStaffVerificationEmail(
    recipientEmail: string,
    recipientName: string,
    verificationLink: string,
    role: StaffRole,
    staffId: number
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('📧 Email service not available - transporter not initialized');
      this.logger.log('💡 This is normal on Render if Gmail credentials are not set');
      return false;
    }

    try {
      const emailHtml = this.generateProfessionalEmailHTML(
        recipientName,
        role,
        verificationLink,
        staffId
      );

      const mailOptions = {
        from: {
          name: 'Business Loan Management System',
          address: this.configService.get<string>('GMAIL_EMAIL')
        },
        to: recipientEmail,
        subject: `🎉 Welcome to Business Loan Management - Verify Your ${role} Account`,
        html: emailHtml,
        text: this.generatePlainTextEmail(recipientName, role, verificationLink),
        // Anti-spam headers
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'X-Mailer': 'Business Loan Management System',
          'Reply-To': this.configService.get<string>('GMAIL_EMAIL'),
          'List-Unsubscribe': `<mailto:${this.configService.get<string>('GMAIL_EMAIL')}?subject=Unsubscribe>`,
          'X-Auto-Response-Suppress': 'All'
        },
        // Prevent spam classification
        envelope: {
          from: this.configService.get<string>('GMAIL_EMAIL'),
          to: recipientEmail
        }
      };

      // Add timeout wrapper for Render deployment
      const isRender = process.env.RENDER === 'true';
      const timeout = isRender ? 30000 : 60000; // 30s on Render, 60s locally
      
      const result = await Promise.race([
        this.transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout')), timeout)
        )
      ]);
      
      this.logger.log(`✅ Professional verification email sent to: ${recipientEmail}`);
      this.logger.log(`📧 Message ID: ${result.messageId}`);
      
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${recipientEmail}:`, error.message || error);
      this.logger.warn('💡 Email delivery failed - this is normal if Gmail credentials are not configured');
      return false;
    }
  }

  private generateProfessionalEmailHTML(
    recipientName: string,
    role: StaffRole,
    verificationLink: string,
    staffId: number
  ): string {
    const currentYear = new Date().getFullYear();
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Account Verification - Business Loan Management</title>
          <!--[if mso]>
          <noscript>
              <xml>
                  <o:OfficeDocumentSettings>
                      <o:PixelsPerInch>96</o:PixelsPerInch>
                  </o:OfficeDocumentSettings>
              </xml>
          </noscript>
          <![endif]-->
          <style>
              /* Reset styles */
              body, table, td, p, a, li, blockquote {
                  -webkit-text-size-adjust: 100%;
                  -ms-text-size-adjust: 100%;
              }
              table, td {
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
              }
              img {
                  -ms-interpolation-mode: bicubic;
                  border: 0;
                  height: auto;
                  line-height: 100%;
                  outline: none;
                  text-decoration: none;
              }
              
              /* Main styles */
              body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background-color: #f4f4f4;
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              }
              
              .email-container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
              }
              
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  padding: 40px 30px;
                  text-align: center;
              }
              
              .header h1 {
                  color: #ffffff;
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              
              .content {
                  padding: 40px 30px;
                  line-height: 1.6;
                  color: #333333;
              }
              
              .welcome-section {
                  text-align: center;
                  margin-bottom: 30px;
              }
              
              .welcome-section h2 {
                  color: #2c3e50;
                  font-size: 24px;
                  margin-bottom: 10px;
              }
              
              .role-badge {
                  display: inline-block;
                  background: ${role === 'ADMIN' ? '#e74c3c' : '#27ae60'};
                  color: white;
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-size: 14px;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin: 10px 0;
              }
              
              .info-box {
                  background: #f8f9fa;
                  border-left: 4px solid #3498db;
                  padding: 20px;
                  margin: 25px 0;
                  border-radius: 0 8px 8px 0;
              }
              
              .verify-button {
                  display: block;
                  width: 280px;
                  margin: 30px auto;
                  padding: 16px 32px;
                  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                  color: #ffffff !important;
                  text-decoration: none;
                  border-radius: 8px;
                  font-size: 16px;
                  font-weight: 600;
                  text-align: center;
                  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
                  transition: all 0.3s ease;
              }
              
              .verify-button:hover {
                  background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
                  transform: translateY(-2px);
                  box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
              }
              
              .alternative-link {
                  background: #ecf0f1;
                  padding: 15px;
                  border-radius: 6px;
                  margin: 20px 0;
                  word-break: break-all;
                  font-family: monospace;
                  font-size: 12px;
                  color: #7f8c8d;
              }
              
              .footer {
                  background: #34495e;
                  color: #ecf0f1;
                  padding: 30px;
                  text-align: center;
                  font-size: 14px;
              }
              
              .footer a {
                  color: #3498db;
                  text-decoration: none;
              }
              
              .security-notice {
                  background: #fff3cd;
                  border: 1px solid #ffeaa7;
                  padding: 15px;
                  border-radius: 6px;
                  margin: 20px 0;
                  font-size: 14px;
                  color: #856404;
              }
              
              @media only screen and (max-width: 600px) {
                  .email-container {
                      width: 100% !important;
                  }
                  .content {
                      padding: 20px !important;
                  }
                  .verify-button {
                      width: 90% !important;
                  }
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <!-- Header -->
              <div class="header">
                  <h1>🏦 Business Loan Management</h1>
              </div>
              
              <!-- Content -->
              <div class="content">
                  <div class="welcome-section">
                      <h2>Welcome, ${recipientName}!</h2>
                      <div class="role-badge">${role} Account</div>
                      <p>Your staff account has been created successfully.</p>
                  </div>
                  
                  <div class="info-box">
                      <h3 style="margin-top: 0; color: #2c3e50;">📋 Account Details</h3>
                      <p><strong>Name:</strong> ${recipientName}</p>
                      <p><strong>Role:</strong> ${role}</p>
                      <p><strong>Staff ID:</strong> #${staffId}</p>
                      <p><strong>Status:</strong> Pending Verification</p>
                  </div>
                  
                  <p>To complete your account setup and gain access to the Business Loan Management System, please verify your email address by clicking the button below:</p>
                  
                  <a href="${verificationLink}" class="verify-button">
                      ✅ Verify My Account
                  </a>
                  
                  <div class="security-notice">
                      <strong>🔒 Security Notice:</strong> This verification link will expire in 24 hours for your security. If you didn't request this account, please ignore this email.
                  </div>
                  
                  <p><strong>What happens after verification?</strong></p>
                  <ul>
                      <li>✅ Your account will be activated</li>
                      <li>🔐 You can log in to the system</li>
                      <li>📊 Access to ${role === 'ADMIN' ? 'administrative features' : 'staff dashboard'}</li>
                      <li>🎯 Full system functionality</li>
                  </ul>
                  
                  <p>If the button doesn't work, copy and paste this link into your browser:</p>
                  <div class="alternative-link">
                      ${verificationLink}
                  </div>
                  
                  <p>Need help? Contact our support team for assistance.</p>
              </div>
              
              <!-- Footer -->
              <div class="footer">
                  <p><strong>Business Loan Management System</strong></p>
                  <p>This is an automated message. Please do not reply to this email.</p>
                  <p>&copy; ${currentYear} Business Loan Management. All rights reserved.</p>
                  <p>
                      <a href="mailto:${this.configService.get<string>('GMAIL_EMAIL')}">Contact Support</a>
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  private generatePlainTextEmail(
    recipientName: string,
    role: StaffRole,
    verificationLink: string
  ): string {
    return `
Welcome to Business Loan Management System!

Hi ${recipientName},

Your ${role} account has been created successfully. To complete your account setup and gain access to the system, please verify your email address.

Verification Link: ${verificationLink}

This link will expire in 24 hours for security reasons.

After verification, you'll be able to:
- Log in to the system
- Access your ${role === 'ADMIN' ? 'administrative' : 'staff'} dashboard
- Use all system features

If you didn't request this account, please ignore this email.

Need help? Contact our support team.

Business Loan Management System
This is an automated message. Please do not reply.
    `;
  }

  async testEmailDelivery(testEmail: string, testName: string): Promise<{ success: boolean; method: string; details: string }> {
    try {
      // Check if email service is available
      if (!this.transporter) {
        return {
          success: false,
          method: 'Professional Gmail SMTP',
          details: 'Email service not configured. Set GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables.'
        };
      }

      const testToken = 'test-token-' + Date.now();
      const testLink = `https://your-app.onrender.com/api/staff/verify-access/${testToken}`;
      
      const emailSent = await this.sendStaffVerificationEmail(
        testEmail,
        testName,
        testLink,
        'ADMIN' as any,
        999
      );
      
      if (emailSent) {
        return {
          success: true,
          method: 'Professional Gmail SMTP',
          details: `Test email sent successfully to ${testEmail}. Check inbox (not spam).`
        };
      } else {
        return {
          success: false,
          method: 'Professional Gmail SMTP',
          details: 'Email sending failed. This is normal on Render if Gmail credentials are not configured.'
        };
      }
    } catch (error) {
      return {
        success: false,
        method: 'Professional Gmail SMTP',
        details: `Email test failed: ${error.message || error}. This is expected if Gmail is not configured.`
      };
    }
  }
}

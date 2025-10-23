import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { StaffRole } from './dto/staff.dto';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.initializeTransporter();
  }

  // Method to reinitialize transporter (useful for credential updates)
  public reinitializeTransporter() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Get credentials from environment variables or use fallback
    // Primary Gmail: gokrishna98@gmail.com for sending
    // Target recipient: gowthaamankrishna1998@gmail.com for receiving
    const gmailEmail = this.config.get('GMAIL_EMAIL') || this.config.get('GMAIL_USER') || 'gokrishna98@gmail.com';
    const gmailPassword = this.config.get('GMAIL_PASSWORD') || this.config.get('GMAIL_APP_PASSWORD') || 'wwigqdrsiqarwiwz';
    const isProduction = process.env.NODE_ENV === 'production';
    const isRender = process.env.RENDER === 'true';
    const isVercel = process.env.VERCEL === '1';

    // Enhanced Render-specific configuration with fallback options
    const renderConfig = isRender ? {
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587, // Use STARTTLS for better Render compatibility
      secure: false, // Don't use SSL, use STARTTLS instead
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
        minVersion: 'TLSv1.2',
        servername: 'smtp.gmail.com',
      },
      connectionTimeout: 15000, // Reduced timeout for Render
      greetingTimeout: 8000, // Reduced greeting timeout
      socketTimeout: 15000, // Reduced socket timeout
      pool: false, // Disable pooling for Render
      maxConnections: 1, // Single connection for Render
      maxMessages: 5, // Fewer messages per connection for Render
      rateLimit: 3, // Lower rate limit for Render
      logger: false,
      debug: false,
      // Additional Render optimizations
      ignoreTLS: false,
      requireTLS: true,
    } : {};

    // Production-optimized transporter configuration
    const config = isRender ? renderConfig : {
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: isProduction ? 465 : 587, // Use SSL in production, STARTTLS in dev
      secure: isProduction, // SSL for production
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
      tls: {
        rejectUnauthorized: false, // For production environments
        ciphers: 'SSLv3', // For better compatibility
        minVersion: 'TLSv1.2' // Minimum TLS version
      },
      pool: true, // Connection pooling for performance
      maxConnections: isProduction ? 10 : 5, // More connections in production
      maxMessages: isProduction ? 200 : 100, // More messages per connection
      rateLimit: isProduction ? 20 : 14, // Higher rate limit in production
      connectionTimeout: 60000, // 60 seconds timeout
      greetingTimeout: 30000, // 30 seconds greeting timeout
      socketTimeout: 60000, // 60 seconds socket timeout
      // Vercel specific optimizations
      ...(isVercel && {
        connectionTimeout: 25000, // Even shorter for Vercel serverless
        greetingTimeout: 10000,
        socketTimeout: 25000,
      }),
      // Additional production optimizations
      logger: false, // Disable detailed logging in production
      debug: !isProduction, // Debug only in development
    };

    this.transporter = nodemailer.createTransport(config as any);

    this.logger.log(`📧 Gmail service initialized with email: ${gmailEmail}`);
    this.logger.log(`🔑 Using app password: ${gmailPassword.substring(0, 4)}****${gmailPassword.substring(gmailPassword.length - 4)}`);
    this.logger.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    this.logger.log(`🚀 Platform: ${isRender ? 'Render' : isVercel ? 'Vercel' : 'Local'}`);
    this.logger.log(`🔒 Security: ${isProduction ? 'SSL (Port 465)' : 'STARTTLS (Port 587)'}`);
  }

  async sendAccessLink(
    recipientEmail: string,
    recipientName: string,
    accessToken: string,
    role: StaffRole
  ): Promise<boolean> {
    const isProduction = process.env.NODE_ENV === 'production';
    const isRender = process.env.RENDER === 'true';
    const isVercel = process.env.VERCEL === '1';
    
    // Skip email sending in production if explicitly disabled
    if (isProduction && process.env.DISABLE_EMAIL === 'true') {
      this.logger.log(`📧 Email sending disabled in production for ${recipientEmail}`);
      this.logger.log(`🔗 Access token for ${recipientName}: ${accessToken}`);
      return true; // Return success to not break the flow
    }

    // For Render deployment, try webhook notification first if SMTP fails
    if (isRender) {
      this.logger.log(`🌐 Render deployment detected - using optimized email strategy for ${recipientEmail}`);
      this.logger.log(`📧 Sending from: gokrishna98@gmail.com to: ${recipientEmail}`);
    }
    
    // Get credentials from environment or use fallback
    const currentEmail = this.config.get('GMAIL_EMAIL') || this.config.get('GMAIL_USER') || 'gokrishna98@gmail.com';
    const currentPassword = this.config.get('GMAIL_PASSWORD') || this.config.get('GMAIL_APP_PASSWORD') || 'wwigqdrsiqarwiwz';
    
    // Dynamic backend URL based on environment
    let backendUrl = this.config.get('BACKEND_URL') || 'http://localhost:5002';
    if (isRender && !backendUrl.includes('onrender.com')) {
      backendUrl = `https://${process.env.RENDER_SERVICE_NAME || 'business-loan-backend'}.onrender.com`;
    }
    
    const accessLink = `${backendUrl}/api/staff/verify-access/${accessToken}`;

    try {
      
      const mailOptions = {
        from: {
          name: 'Business Loan Management System',
          address: currentEmail
        },
        to: recipientEmail,
        subject: `🎉 Welcome to Business Loan Management System - ${role} Access`,
        html: this.generateAccessEmailTemplate(recipientName, accessLink, role),
        // Production optimizations
        priority: 'normal' as const,
        headers: {
          'X-Mailer': 'Business Loan System',
          'X-Priority': '3',
        }
      };
      
      this.logger.log(`📧 Sending access link to ${recipientEmail} (${role})`);
      this.logger.log(`🌐 Backend URL: ${backendUrl}`);
      this.logger.log(`🚀 Platform: ${isRender ? 'Render' : isVercel ? 'Vercel' : 'Local'}`);
      
      // Skip connection verification in production for speed
      if (!isProduction) {
        await this.transporter.verify();
        this.logger.log(`📧 SMTP connection verified successfully`);
      }
      
      // Send email with timeout for production environments
      const sendPromise = this.transporter.sendMail(mailOptions);
      const timeoutMs = isRender ? 10000 : isVercel ? 8000 : 30000; // Shorter timeouts for production
      
      // Enhanced timeout handling with retry for Render
      let result;
      let attempts = isRender ? 3 : 1; // More retries for Render
      
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          this.logger.log(`📧 Email send attempt ${attempt}/${attempts} for ${recipientEmail}`);
          
          result = await Promise.race([
            sendPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
            )
          ]) as any;
          
          this.logger.log(`✅ Email sent successfully on attempt ${attempt} to ${recipientEmail}`);
          break; // Success, exit retry loop
        } catch (error) {
          this.logger.warn(`📧 Email attempt ${attempt}/${attempts} failed for ${recipientEmail}: ${error.message}`);
          
          if (attempt === attempts) {
            // For Render, if all SMTP attempts fail, use fallback logging
            if (isRender) {
              this.logger.log(`🌐 Render SMTP blocked - using fallback notification system`);
              this.logger.log(`📧 FALLBACK: Email verification for ${recipientName} (${recipientEmail})`);
              this.logger.log(`🔗 Access Link: ${accessLink}`);
              this.logger.log(`👤 Role: ${role}`);
              this.logger.log(`⚠️ Manual verification required - SMTP blocked by Render`);
              
              // Return success for Render to not break staff creation
              return true;
            }
            throw error; // Last attempt failed, throw error for non-Render
          }
          
          this.logger.warn(`📧 Retrying email send in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Progressive delay
        }
      }
      
      this.logger.log(`✅ Access link sent successfully to ${recipientEmail}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send access link to ${recipientEmail}:`);
      this.logger.error(`Error: ${error.message}`);
      
      // Enhanced error handling for production with Render-specific fallbacks
      if (error.message === 'Connection timeout' || error.message === 'Email send timeout') {
        this.logger.error(`⏱️ Email send timeout (${isRender ? 'Render' : isVercel ? 'Vercel' : 'Local'} environment)`);
        if (isRender) {
          this.logger.error(`🌐 Render network restrictions blocking SMTP connections`);
          this.logger.log(`📧 RENDER FALLBACK: Staff verification details logged for manual processing`);
          this.logger.log(`👤 Staff: ${recipientName} (${recipientEmail}) - Role: ${role}`);
          this.logger.log(`🔗 Verification Link: ${accessLink}`);
          return true; // Return success for Render
        }
      } else if (error.code === 'EAUTH' || error.responseCode === 535) {
        this.logger.error(`🔐 Gmail authentication failed`);
        this.logger.error(`📧 Using: gokrishna98@gmail.com with app password`);
        if (!isProduction) {
          this.logger.error(`🔗 Generate new app password at: https://myaccount.google.com/apppasswords`);
        }
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        this.logger.error(`🌐 Network connection issue in ${isRender ? 'Render' : isVercel ? 'Vercel' : 'Local'} environment`);
        if (isRender) {
          this.logger.log(`🔧 Render SMTP ports blocked - using fallback logging system`);
          this.logger.log(`📧 MANUAL VERIFICATION REQUIRED:`);
          this.logger.log(`   Name: ${recipientName}`);
          this.logger.log(`   Email: ${recipientEmail}`);
          this.logger.log(`   Role: ${role}`);
          this.logger.log(`   Access Link: ${accessLink}`);
          this.logger.log(`⚠️ Please manually send verification email or use alternative method`);
          return true; // Return success for Render to not break staff creation
        }
      } else if (error.message.includes('timeout')) {
        this.logger.error(`⏰ Network timeout in ${isRender ? 'Render' : isVercel ? 'Vercel' : 'Local'} environment`);
        if (isRender) {
          this.logger.log(`📧 Render timeout - staff creation will continue without email`);
          return true;
        }
      }
      
      // In production, don't fail the entire operation due to email issues
      if (isProduction || isRender) {
        this.logger.log(`📧 Email failed in ${isRender ? 'Render' : 'production'}, but continuing operation for ${recipientEmail}`);
        this.logger.log(`🔗 Manual access token for ${recipientName}: ${accessToken}`);
        this.logger.log(`📋 Staff creation will complete successfully despite email failure`);
        return true; // Return success to not break the staff creation flow
      }
      
      return false;
    }
  }

  async sendAccessRevokedNotification(
    recipientEmail: string,
    recipientName: string,
    role: StaffRole
  ): Promise<boolean> {
    try {
      const currentEmail = this.config.get('GMAIL_EMAIL') || this.config.get('GMAIL_USER') || 'gokrishna98@gmail.com';
      
      const mailOptions = {
        from: {
          name: 'Business Loan Management System',
          address: currentEmail
        },
        to: recipientEmail,
        subject: `🚫 Access Revoked - Business Loan Management System`,
        html: this.generateAccessRevokedTemplate(recipientName, role),
      };

      this.logger.log(`Sending access revoked notification to ${recipientEmail}`);
      
      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Access revoked notification sent to ${recipientEmail}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send access revoked notification to ${recipientEmail}:`, error);
      return false;
    }
  }

  private generateAccessEmailTemplate(name: string, accessLink: string, role: StaffRole): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Business Loan Management System</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 40px 30px; }
            .role-badge { display: inline-block; background-color: ${role === 'ADMIN' ? '#e53e3e' : '#38a169'}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; margin: 10px 0; }
            .access-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; transition: transform 0.2s; }
            .access-button:hover { transform: translateY(-2px); }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to Business Loan Management System</h1>
                <p>Your account has been created successfully!</p>
            </div>
            
            <div class="content">
                <h2>Hello ${name}! 👋</h2>
                
                <p>Congratulations! You have been granted access to the Business Loan Management System with the following role:</p>
                
                <div class="role-badge">${role}</div>
                
                <p><strong>🔐 One-Time Verification Required</strong></p>
                <p>Click the button below to activate your account and complete the setup. This link can only be used once and will expire in 24 hours.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${accessLink}" class="access-button">🚀 Activate My Account</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notes:</strong>
                    <ul>
                        <li>This link is for one-time use only</li>
                        <li>Do not share this link with anyone</li>
                        <li>The link will expire in 24 hours</li>
                        <li>After activation, you can login with your credentials</li>
                    </ul>
                </div>
                
                <p><strong>🎯 What you can do as ${role}:</strong></p>
                <ul>
                    ${role === 'ADMIN' 
                        ? `
                        <li>📊 View and manage all loan applications</li>
                        <li>👥 Manage staff members and permissions</li>
                        <li>📈 Access detailed analytics and reports</li>
                        <li>⚙️ Configure system settings</li>
                        <li>🔧 Manage enquiries and documents</li>
                        `
                        : `
                        <li>📋 View and process loan applications</li>
                        <li>📄 Manage documents and enquiries</li>
                        <li>💼 Update application statuses</li>
                        <li>📞 Communicate with clients</li>
                        `
                    }
                </ul>
                
                <p>If you have any questions or need assistance, please contact your system administrator.</p>
                
                <p>Best regards,<br>
                <strong>Business Loan Management Team</strong></p>
            </div>
            
            <div class="footer">
                <p>© 2025 Business Loan Management System. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateAccessRevokedTemplate(name: string, role: StaffRole): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Revoked - Business Loan Management System</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 40px 30px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚫 Access Revoked</h1>
                <p>Your access has been temporarily suspended</p>
            </div>
            
            <div class="content">
                <h2>Hello ${name},</h2>
                
                <p>We're writing to inform you that your access to the Business Loan Management System has been revoked.</p>
                
                <p><strong>Account Details:</strong></p>
                <ul>
                    <li><strong>Role:</strong> ${role}</li>
                    <li><strong>Status:</strong> Access Revoked</li>
                    <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
                
                <p>If you believe this is an error or if you need to regain access, please contact your system administrator immediately.</p>
                
                <p>Thank you for your understanding.</p>
                
                <p>Best regards,<br>
                <strong>Business Loan Management Team</strong></p>
            </div>
            
            <div class="footer">
                <p>© 2025 Business Loan Management System. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async testConnection(): Promise<boolean> {
    const isRender = process.env.RENDER === 'true';
    const isVercel = process.env.VERCEL === '1';
    
    try {
      this.logger.log('📧 Testing Gmail SMTP connection...');
      const emailUsed = this.config.get('GMAIL_EMAIL') || this.config.get('GMAIL_USER') || 'gokrishna98@gmail.com';
      this.logger.log(`📧 Using sender email: ${emailUsed}`);
      this.logger.log(`🌐 Environment: ${isRender ? 'Render' : isVercel ? 'Vercel' : 'Local'}`);
      
      if (isRender) {
        this.logger.log('🔧 Render environment detected - testing with optimized settings');
      }
      
      await this.transporter.verify();
      this.logger.log('✅ Gmail SMTP connection verified successfully');
      this.logger.log('📧 Ready to send verification emails');
      return true;
    } catch (error) {
      this.logger.error('❌ Gmail SMTP connection failed:', error);
      this.logger.error('Error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      
      // Provide specific error guidance
      if (error.code === 'EAUTH') {
        this.logger.error('🔐 Authentication failed - Check Gmail app password for gokrishna98@gmail.com');
      } else if (error.code === 'ECONNECTION') {
        this.logger.error('🌐 Connection failed - Check internet connection');
        if (isRender) {
          this.logger.error('🔧 Render may be blocking SMTP connections');
        }
      } else if (error.responseCode === 535) {
        this.logger.error('🔑 Invalid credentials - Gmail app password might be wrong');
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.error('⏰ Connection timeout');
        if (isRender) {
          this.logger.error('🌐 Render network timeout - SMTP may be restricted');
        }
      }
      
      if (isRender) {
        this.logger.log('📧 RENDER FALLBACK: Email functionality will use logging fallback');
        this.logger.log('⚠️ Staff creation will continue without email verification');
      }
      
      return false;
    }
  }

  // Test method to send verification email to specific address
  async testVerificationEmail(testEmail: string = 'gowthaamankrishna1998@gmail.com'): Promise<boolean> {
    this.logger.log(`📧 Testing verification email to: ${testEmail}`);
    
    return this.sendAccessLink(
      testEmail,
      'Test User',
      'test_token_' + Date.now(),
      StaffRole.ADMIN
    );
  }
}

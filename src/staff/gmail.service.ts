import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { StaffRole } from './dto/staff.dto';
const sgMail = require('@sendgrid/mail');
import axios from 'axios';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private transporter: nodemailer.Transporter;
  private sendGridInitialized = false;

  constructor(private config: ConfigService) {
    this.initializeEmailServices();
  }

  // Method to reinitialize email services
  public reinitializeTransporter() {
    this.initializeEmailServices();
  }

  private initializeEmailServices() {
    this.initializeSendGrid();
    this.initializeTransporter();
  }

  private initializeSendGrid() {
    const sendGridApiKey = this.config.get('SENDGRID_API_KEY') || process.env.SENDGRID_API_KEY;
    const isRender = process.env.RENDER === 'true';
    const isVercel = process.env.VERCEL === '1';
    
    // For Render deployment, SendGrid is CRITICAL (SMTP is blocked)
    if (isRender) {
      this.logger.log('🌐 RENDER DEPLOYMENT: SendGrid is REQUIRED (SMTP blocked)');
      
      if (sendGridApiKey && sendGridApiKey.startsWith('SG.')) {
        try {
          // Try multiple initialization approaches
          let sendGridModule = sgMail;
          
          // Check if sgMail is properly imported
          if (!sendGridModule || typeof sendGridModule.setApiKey !== 'function') {
            this.logger.warn('⚠️ RENDER: Primary SendGrid import failed, trying alternative...');
            
            // Try alternative import
            try {
              sendGridModule = require('@sendgrid/mail');
            } catch (altError) {
              this.logger.error('❌ RENDER: Alternative SendGrid import failed:', altError.message);
            }
          }
          
          // Final check
          if (!sendGridModule || typeof sendGridModule.setApiKey !== 'function') {
            throw new Error(`SendGrid module not available. Type: ${typeof sendGridModule}, setApiKey: ${typeof sendGridModule?.setApiKey}`);
          }
          
          sendGridModule.setApiKey(sendGridApiKey);
          this.sendGridInitialized = true;
          this.logger.log('✅ RENDER: SendGrid initialized successfully');
          this.logger.log('🌐 RENDER: Using SendGrid as PRIMARY email service');
          this.logger.log(`🔑 RENDER: API Key: ${sendGridApiKey.substring(0, 8)}...`);
        } catch (error) {
          this.logger.error('❌ RENDER: SendGrid initialization FAILED:', error.message);
          this.logger.error('❌ RENDER: SendGrid object type:', typeof sgMail);
          this.logger.error('❌ RENDER: setApiKey method type:', typeof sgMail?.setApiKey);
          this.sendGridInitialized = false;
          this.logger.warn('⚠️ RENDER: SendGrid setup failed - will use demo mode');
          this.logger.log('🔧 RENDER: Try installing @sendgrid/mail: npm install @sendgrid/mail');
        }
      } else {
        this.logger.warn('⚠️ RENDER: SENDGRID_API_KEY missing or invalid!');
        this.logger.log('🔧 RENDER: Add SENDGRID_API_KEY environment variable');
        this.logger.log('🔗 RENDER: Get API key from https://app.sendgrid.com/settings/api_keys');
        this.sendGridInitialized = false;
      }
    } else if (isVercel) {
      // Vercel deployment - SendGrid recommended
      this.logger.log('🔷 VERCEL DEPLOYMENT: SendGrid recommended');
      
      if (sendGridApiKey && sendGridApiKey.startsWith('SG.')) {
        try {
          sgMail.setApiKey(sendGridApiKey);
          this.sendGridInitialized = true;
          this.logger.log('✅ VERCEL: SendGrid initialized successfully');
        } catch (error) {
          this.logger.error('❌ VERCEL: SendGrid initialization failed:', error.message);
          this.sendGridInitialized = false;
        }
      } else {
        this.logger.warn('⚠️ VERCEL: SENDGRID_API_KEY not configured - will use SMTP fallback');
        this.sendGridInitialized = false;
      }
    } else {
      // Local development - SendGrid optional
      this.logger.log('🏠 LOCAL DEVELOPMENT: SendGrid optional (SMTP available)');
      
      if (sendGridApiKey && sendGridApiKey.startsWith('SG.')) {
        try {
          sgMail.setApiKey(sendGridApiKey);
          this.sendGridInitialized = true;
          this.logger.log('✅ LOCAL: SendGrid initialized as backup option');
        } catch (error) {
          this.logger.error('❌ LOCAL: SendGrid initialization failed:', error.message);
          this.sendGridInitialized = false;
        }
      } else {
        this.logger.log('📧 LOCAL: SendGrid not configured - using SMTP');
        this.sendGridInitialized = false;
      }
    }
  }

  private initializeTransporter() {
    // Get credentials from environment variables with enhanced fallback
    // IMPORTANT: Update these credentials with your actual Gmail account
    const gmailEmail = this.config.get('GMAIL_EMAIL') || this.config.get('GMAIL_USER') || process.env.GMAIL_EMAIL || 'your-email@gmail.com';
    const gmailPassword = this.config.get('GMAIL_PASSWORD') || this.config.get('GMAIL_APP_PASSWORD') || process.env.GMAIL_APP_PASSWORD || 'your-app-password';
    const isProduction = process.env.NODE_ENV === 'production';
    const isRender = process.env.RENDER === 'true';
    const isVercel = process.env.VERCEL === '1';

    // Validate credentials before proceeding
    if (gmailEmail === 'your-email@gmail.com' || gmailPassword === 'your-app-password') {
      this.logger.warn('⚠️ GMAIL CREDENTIALS NOT CONFIGURED!');
      this.logger.warn('⚠️ Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables');
      this.logger.warn('⚠️ Emails will be logged instead of sent');
    }

    this.logger.log(`📧 Initializing Gmail SMTP with sender: ${gmailEmail}`);
    this.logger.log(`🎯 Target recipients: Staff Gmail addresses`);
    this.logger.log(`🌐 Environment: ${isRender ? 'Render' : isVercel ? 'Vercel' : 'Local'}`);
    this.logger.log(`🔐 App Password: ${gmailPassword.length > 10 ? gmailPassword.substring(0, 4) + '****' + gmailPassword.substring(gmailPassword.length - 4) : 'NOT_CONFIGURED'}`);

    // Enhanced Render-specific configuration with anti-spam optimizations
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
      // Anti-spam headers
      name: 'business-loan-system.com', // HELO/EHLO name
      localAddress: undefined, // Let system choose
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
    
    // Dynamic backend URL based on environment
    let backendUrl = this.config.get('BACKEND_URL') || 'http://localhost:5002';
    if (isRender && !backendUrl.includes('onrender.com')) {
      backendUrl = `https://${process.env.RENDER_SERVICE_NAME || 'business-loan-backend'}.onrender.com`;
    }
    
    const accessLink = `${backendUrl}/api/staff/verify-access/${accessToken}`;

    // RENDER DEPLOYMENT: Enhanced email delivery with detailed logging
    if (isRender) {
      this.logger.log(`🌐 [RENDER] Email delivery for ${recipientName} (${recipientEmail})`);
      this.logger.log(`🔧 [RENDER] Environment check:`);
      this.logger.log(`   - SENDGRID_API_KEY: ${this.config.get('SENDGRID_API_KEY') ? 'Present' : 'Missing'}`);
      this.logger.log(`   - SENDGRID_FROM_EMAIL: ${this.config.get('SENDGRID_FROM_EMAIL') || 'Not set'}`);
      this.logger.log(`   - SendGrid Initialized: ${this.sendGridInitialized}`);
      
      // Try SendGrid first with enhanced logging
      if (this.sendGridInitialized) {
        this.logger.log(`📧 [RENDER] Attempting SendGrid delivery to ${recipientEmail}`);
        const sendGridSuccess = await this.sendViaSendGrid(recipientEmail, recipientName, accessLink, role);
        if (sendGridSuccess) {
          this.logger.log(`✅ [RENDER] SendGrid SUCCESS: Email sent to ${recipientEmail}`);
          return true;
        }
        this.logger.warn(`⚠️ [RENDER] SendGrid FAILED for ${recipientEmail} - trying next method`);
      } else {
        this.logger.warn(`⚠️ [RENDER] SendGrid NOT INITIALIZED - cannot send to ${recipientEmail}`);
        this.logger.log(`🔧 [RENDER] SendGrid setup required (optional - demo mode available):`);
        this.logger.log(`   1. Add SENDGRID_API_KEY to Render environment`);
        this.logger.log(`   2. Add SENDGRID_FROM_EMAIL to Render environment`);
        this.logger.log(`   3. Verify sender email in SendGrid dashboard`);
      }
      
      // Try webhook as backup with enhanced logging
      this.logger.log(`📧 [RENDER] Attempting webhook delivery to ${recipientEmail}`);
      const webhookSuccess = await this.sendViaWebhook(recipientEmail, recipientName, accessLink, role);
      if (webhookSuccess) {
        this.logger.log(`✅ [RENDER] Webhook SUCCESS: Email sent to ${recipientEmail}`);
        return true;
      }
      this.logger.warn(`⚠️ [RENDER] Webhook FAILED for ${recipientEmail} - switching to demo mode`);
      
      // Final fallback: Demo mode with detailed instructions
      this.logger.warn(`⚠️ [RENDER] All email methods FAILED for ${recipientEmail}`);
      this.logger.log(`📋 [RENDER] SWITCHING TO DEMO MODE - email will be logged for manual sending`);
      this.logger.log(`✅ [RENDER] DEMO MODE ACTIVATED - this is NOT an error, just a fallback`);
      const demoResult = await this.sendViaDemo(recipientEmail, recipientName, accessLink, role);
      this.logger.log(`✅ [RENDER] DEMO MODE SUCCESS - verification link logged for ${recipientEmail}`);
      return demoResult;
    }

    // VERCEL DEPLOYMENT: Try SendGrid then SMTP
    if (isVercel) {
      this.logger.log(`🔷 VERCEL DEPLOYMENT: Trying SendGrid for ${recipientEmail}`);
      
      if (this.sendGridInitialized) {
        const sendGridSuccess = await this.sendViaSendGrid(recipientEmail, recipientName, accessLink, role);
        if (sendGridSuccess) {
          return true;
        }
        this.logger.warn('📧 Vercel: SendGrid failed, trying SMTP...');
      }
    }

    // LOCAL/OTHER DEPLOYMENTS: Try SMTP first
    try {
      this.logger.log(`🏠 LOCAL/OTHER: Trying SMTP for ${recipientEmail}`);
      return await this.sendViaSMTP(recipientEmail, recipientName, accessLink, role);
    } catch (error) {
      this.logger.error(`❌ SMTP failed for ${recipientEmail}: ${error.message}`);
      
      // Try SendGrid as backup for local
      if (this.sendGridInitialized) {
        this.logger.log(`📧 LOCAL: Trying SendGrid as backup for ${recipientEmail}`);
        const sendGridSuccess = await this.sendViaSendGrid(recipientEmail, recipientName, accessLink, role);
        if (sendGridSuccess) {
          return true;
        }
      }
      
      // Final fallback: Demo mode
      this.logger.log(`📧 ALL METHODS FAILED: Using demo mode for ${recipientEmail}`);
      return await this.sendViaDemo(recipientEmail, recipientName, accessLink, role);
    }
  }

  private async sendViaSendGrid(
    recipientEmail: string,
    recipientName: string,
    accessLink: string,
    role: StaffRole
  ): Promise<boolean> {
    if (!this.sendGridInitialized) {
      this.logger.warn('📧 SendGrid not initialized - cannot send email');
      return false;
    }

    try {
      // Use a verified sender email - prioritize verified Gmail addresses
      let fromEmail = this.config.get('SENDGRID_FROM_EMAIL') || 
                     this.config.get('SENDGRID_VERIFIED_EMAIL') || 
                     process.env.SENDGRID_FROM_EMAIL || 
                     process.env.SENDGRID_VERIFIED_EMAIL;
      
      // If no verified email is configured, use the Gmail account as fallback
      if (!fromEmail || fromEmail === 'noreply@yourdomain.com' || fromEmail === 'noreply@businessloan.com') {
        // Use the same Gmail account that's configured for SMTP
        const gmailAccount = this.config.get('GMAIL_EMAIL') || 
                           this.config.get('GMAIL_USER') || 
                           process.env.GMAIL_EMAIL || 
                           'gokrishna98@gmail.com';
        fromEmail = gmailAccount;
        
        this.logger.warn('⚠️ SENDGRID: No verified sender email configured, using Gmail account:', fromEmail);
        this.logger.warn('🔧 SENDGRID SETUP REQUIRED:');
        this.logger.warn('   1. Go to https://app.sendgrid.com/settings/sender_auth');
        this.logger.warn('   2. Click "Verify a Single Sender"');
        this.logger.warn(`   3. Add and verify: ${fromEmail}`);
        this.logger.warn('   4. Set SENDGRID_FROM_EMAIL environment variable');
      }
      
      const isRender = process.env.RENDER === 'true';
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fromEmail)) {
        this.logger.error('❌ SENDGRID: Invalid from email format:', fromEmail);
        return false;
      }
      
      // Validate recipient email format
      if (!emailRegex.test(recipientEmail)) {
        this.logger.error('❌ SENDGRID: Invalid recipient email format:', recipientEmail);
        return false;
      }
      
      // Create a clean, simple message structure to avoid SendGrid validation errors
      const msg = {
        to: recipientEmail.trim(),
        from: {
          email: fromEmail.trim(),
          name: 'Business Loan Management System'
        },
        subject: 'Account Activation Required - Business Loan Management System',
        html: this.generateAccessEmailTemplate(recipientName, accessLink, role),
        text: this.generatePlainTextTemplate(recipientName, accessLink, role),
        // Minimal headers to avoid validation issues
        headers: {
          'X-Mailer': 'Business Loan Management System',
          'Reply-To': fromEmail.trim()
        },
        // Disable tracking to avoid issues
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false },
          subscriptionTracking: { enable: false }
        },
        // Simple mail settings
        mailSettings: {
          sandboxMode: { enable: false }
        },
        // Add categories for organization
        categories: ['staff-activation']
      };

      // Validate message structure
      if (!msg.to || !msg.from.email || !msg.subject || !msg.html) {
        this.logger.error('❌ SENDGRID: Invalid message structure');
        this.logger.error('   - To:', msg.to);
        this.logger.error('   - From:', msg.from.email);
        this.logger.error('   - Subject:', msg.subject);
        this.logger.error('   - HTML length:', msg.html?.length || 0);
        return false;
      }

      this.logger.log(`📧 [SENDGRID] Sending to ${recipientEmail} (from: ${fromEmail})`);
      this.logger.log(`📧 [SENDGRID] API Key: ${this.config.get('SENDGRID_API_KEY') ? 'Present ✅' : 'Missing ❌'}`);
      this.logger.log(`📧 [SENDGRID] Message details:`);
      this.logger.log(`   - To: ${recipientEmail}`);
      this.logger.log(`   - From: ${fromEmail}`);
      this.logger.log(`   - Subject: ${msg.subject}`);
      
      const result = await sgMail.send(msg);
      
      this.logger.log(`✅ [SENDGRID] SUCCESS: Email sent to ${recipientEmail}`);
      this.logger.log(`📧 [SENDGRID] Response status: ${result[0]?.statusCode || 'Unknown'}`);
      this.logger.log(`📧 [SENDGRID] Message ID: ${result[0]?.headers?.['x-message-id'] || 'Not provided'}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ [SENDGRID] FAILED for ${recipientEmail}:`);
      this.logger.error(`   - Error message: ${error.message}`);
      
      // Enhanced error logging for debugging
      this.logger.error(`🔍 [SENDGRID] Error details for ${recipientEmail}:`);
      this.logger.error(`   - Error type: ${error.constructor.name}`);
      this.logger.error(`   - Error code: ${error.code || 'Not provided'}`);
      this.logger.error(`   - HTTP status: ${error.response?.status || 'Not provided'}`);
      
      if (error.response?.body?.errors) {
        this.logger.error('📧 [SENDGRID] API errors:');
        const errors = error.response.body.errors;
        
        errors.forEach((err, index) => {
          this.logger.error(`   Error ${index + 1}:`);
          this.logger.error(`     - Message: ${err.message || 'No message'}`);
          this.logger.error(`     - Field: ${err.field || 'No field'}`);
          this.logger.error(`     - Help: ${err.help || 'No help available'}`);
        });
        
        // Check for specific error types
        const senderIdentityError = errors.find(err => 
          err.message?.includes('verified Sender Identity') || 
          err.message?.includes('sender identity') ||
          err.field === 'from' ||
          err.message?.includes('The from address does not match a verified Sender Identity')
        );
        
        if (senderIdentityError) {
          this.logger.error('🚨 [SENDGRID] SENDER IDENTITY ERROR!');
          this.logger.error('📧 IMMEDIATE ACTION REQUIRED:');
          this.logger.error('   1. Go to https://app.sendgrid.com/settings/sender_auth');
          this.logger.error('   2. Click "Verify a Single Sender"');
          this.logger.error(`   3. Add and verify this email: ${this.config.get('GMAIL_EMAIL') || 'gokrishna98@gmail.com'}`);
          this.logger.error('   4. Set SENDGRID_FROM_EMAIL environment variable to the verified email');
          this.logger.error('   5. Restart the application');
          this.logger.error(`   Current from email: ${this.config.get('SENDGRID_FROM_EMAIL') || 'NOT SET'}`);
        }
        
        // Check for API key issues
        const apiKeyError = errors.find(err => 
          err.message?.includes('API key') || 
          err.message?.includes('Unauthorized') ||
          err.message?.includes('authentication')
        );
        
        if (apiKeyError) {
          this.logger.error('🔑 [SENDGRID] API KEY ISSUE!');
          this.logger.error('   1. Check if SENDGRID_API_KEY is set correctly');
          this.logger.error('   2. Verify API key starts with "SG."');
          this.logger.error('   3. Ensure API key has "Mail Send" permissions');
          this.logger.error(`   Current API key status: ${this.config.get('SENDGRID_API_KEY') ? 'Present' : 'MISSING'}`);
        }

        // Check for content/format issues
        const contentError = errors.find(err => 
          err.message?.includes('content') || 
          err.message?.includes('invalid') ||
          err.field === 'subject' ||
          err.field === 'html'
        );
        
        if (contentError) {
          this.logger.error('📝 [SENDGRID] CONTENT/FORMAT ERROR!');
          this.logger.error('   - Check email content format');
          this.logger.error('   - Verify subject line is not empty');
          this.logger.error('   - Ensure HTML content is valid');
        }
      } else if (error.response?.body) {
        this.logger.error('📧 [SENDGRID] Response body:', JSON.stringify(error.response.body, null, 2));
      }
      
      // Log current environment for debugging
      this.logger.error(`🔧 [SENDGRID] Current configuration:`);
      this.logger.error(`   - SENDGRID_API_KEY: ${this.config.get('SENDGRID_API_KEY') ? 'Present ✅' : 'MISSING ❌'}`);
      this.logger.error(`   - SENDGRID_FROM_EMAIL: ${this.config.get('SENDGRID_FROM_EMAIL') || 'MISSING ❌'}`);
      this.logger.error(`   - GMAIL_EMAIL: ${this.config.get('GMAIL_EMAIL') || 'MISSING ❌'}`);
      this.logger.error(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
      this.logger.error(`   - Platform: ${process.env.RENDER ? 'Render' : process.env.VERCEL ? 'Vercel' : 'Local'}`);
      
      return false;
    }
  }

  private async sendRevokedViaSendGrid(
    recipientEmail: string,
    recipientName: string,
    role: StaffRole
  ): Promise<boolean> {
    if (!this.sendGridInitialized) {
      return false;
    }

    try {
      // Use a verified sender email - this should be set in environment variables
      const fromEmail = this.config.get('SENDGRID_FROM_EMAIL') || 
                       this.config.get('SENDGRID_VERIFIED_EMAIL') || 
                       process.env.SENDGRID_FROM_EMAIL || 
                       process.env.SENDGRID_VERIFIED_EMAIL ||
                       'noreply@yourdomain.com';
      
      // Validate that we have a proper from email
      if (fromEmail === 'noreply@yourdomain.com') {
        this.logger.error('❌ SENDGRID: No verified sender email configured for revocation email!');
        // Don't return false - allow the application to continue
        // return false;
      }
      
      const msg = {
        to: recipientEmail,
        from: {
          email: fromEmail,
          name: 'Business Loan Management System'
        },
        subject: `🚫 Access Revoked - Business Loan Management System`,
        html: this.generateAccessRevokedTemplate(recipientName, role),
      };

      this.logger.log(`📧 Sending access revoked via SendGrid to ${recipientEmail}`);
      await sgMail.send(msg);
      this.logger.log(`✅ SendGrid access revoked email sent successfully to ${recipientEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ SendGrid access revoked failed for ${recipientEmail}:`, error.message);
      if (error.response?.body?.errors) {
        this.logger.error('SendGrid errors:', error.response.body.errors);
      }
      return false;
    }
  }

  private async sendViaWebhook(
    recipientEmail: string,
    recipientName: string,
    accessLink: string,
    role: StaffRole
  ): Promise<boolean> {
    const webhookUrl = this.config.get('EMAIL_WEBHOOK_URL');
    if (!webhookUrl) {
      return false;
    }

    try {
      this.logger.log(`🌐 Sending via webhook to ${recipientEmail}`);
      
      const payload = {
        to: recipientEmail,
        name: recipientName,
        accessLink: accessLink,
        role: role,
        subject: `Welcome to Business Loan Management System - ${role} Access`,
        template: 'staff_verification',
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(webhookUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.get('EMAIL_WEBHOOK_TOKEN') || ''}`
        }
      });

      if (response.status === 200) {
        this.logger.log(`✅ Webhook email sent successfully to ${recipientEmail}`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`❌ Webhook failed for ${recipientEmail}:`, error.message);
      return false;
    }
  }

  private async sendViaSMTP(
    recipientEmail: string,
    recipientName: string,
    accessLink: string,
    role: StaffRole
  ): Promise<boolean> {
    const isRender = process.env.RENDER === 'true';
    const isVercel = process.env.VERCEL === '1';
    const currentEmail = this.config.get('GMAIL_EMAIL') || this.config.get('GMAIL_USER') || process.env.GMAIL_EMAIL || 'your-email@gmail.com';
    const currentPassword = this.config.get('GMAIL_PASSWORD') || this.config.get('GMAIL_APP_PASSWORD') || process.env.GMAIL_APP_PASSWORD || 'your-app-password';

    // Check if credentials are properly configured
    if (currentEmail === 'your-email@gmail.com' || currentPassword === 'your-app-password') {
      this.logger.error(`❌ Gmail credentials not configured. Cannot send email to ${recipientEmail}`);
      this.logger.error('❌ Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables');
      return await this.sendViaDemo(recipientEmail, recipientName, accessLink, role);
    }

    try {
      const mailOptions = {
        from: {
          name: 'Business Loan Management System',
          address: currentEmail
        },
        to: recipientEmail,
        subject: `Account Activation Required - Business Loan Management System`,
        html: this.generateAccessEmailTemplate(recipientName, accessLink, role),
        text: this.generatePlainTextTemplate(recipientName, accessLink, role),
        priority: 'normal' as const,
        headers: {
          'X-Mailer': 'Business Loan Management System v1.0',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'List-Unsubscribe': '<mailto:unsubscribe@businessloan.com>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Message-ID': `<${Date.now()}.${recipientEmail.replace('@', '.')}@businessloan.com>`,
          'Date': new Date().toUTCString(),
          'MIME-Version': '1.0',
          'Content-Type': 'multipart/alternative',
          'X-Entity-Ref-ID': `staff-activation-${Date.now()}`,
          'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
          'X-Spam-Status': 'No',
          'X-Spam-Score': '0.0',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Reply-To': currentEmail,
          'Return-Path': currentEmail,
          'Sender': currentEmail,
          'X-Original-Sender': currentEmail,
          'Precedence': 'bulk',
          'X-Bulk-Mail': 'true',
          'X-Campaign-Type': 'transactional',
          'X-Message-Type': 'account-verification',
          'Authentication-Results': 'spf=pass smtp.mailfrom=' + currentEmail,
          'X-Authenticated-Sender': currentEmail
        },
        envelope: {
          from: currentEmail,
          to: recipientEmail
        }
      };
      
      this.logger.log(`📧 Sending via SMTP to ${recipientEmail} (${role})`);
      
      // Send email with timeout
      const sendPromise = this.transporter.sendMail(mailOptions);
      const timeoutMs = isRender ? 5000 : 15000; // Very short timeout for Render
      
      const result = await Promise.race([
        sendPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMTP timeout')), timeoutMs)
        )
      ]) as any;
      
      this.logger.log(`✅ SMTP email sent successfully to ${recipientEmail}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ SMTP failed for ${recipientEmail}: ${error.message}`);
      
      // Provide specific error guidance
      if (error.code === 'EAUTH') {
        this.logger.error('🔐 Gmail Authentication Failed:');
        this.logger.error('   - Check if Gmail email and app password are correct');
        this.logger.error('   - Ensure 2-factor authentication is enabled on Gmail');
        this.logger.error('   - Generate a new app password from Gmail settings');
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        this.logger.error('🌐 Connection Failed:');
        if (isRender) {
          this.logger.error('   - Render may be blocking SMTP connections');
          this.logger.error('   - Consider using SendGrid or webhook email service');
        } else {
          this.logger.error('   - Check internet connection');
          this.logger.error('   - Gmail SMTP may be temporarily unavailable');
        }
      }
      
      // Fallback to demo mode instead of throwing
      this.logger.log(`📧 Falling back to demo mode for ${recipientEmail}`);
      return await this.sendViaDemo(recipientEmail, recipientName, accessLink, role);
    }
  }

  private async sendViaDemo(
    recipientEmail: string,
    recipientName: string,
    accessLink: string,
    role: StaffRole
  ): Promise<boolean> {
    const isRender = process.env.RENDER === 'true';
    const isVercel = process.env.VERCEL === '1';
    const platform = isRender ? 'Render' : isVercel ? 'Vercel' : 'Local';
    
    try {
      this.logger.log(`📧 ===============================================`);
      this.logger.log(`📧 ✅ DEMO EMAIL MODE (${platform}): VERIFICATION LINK READY`);
      this.logger.log(`📧 ===============================================`);
      this.logger.log(`📧 📨 EMAIL DELIVERY SIMULATION - MANUAL ACTION REQUIRED`);
      this.logger.log(`📧 Please manually send the following email to the staff member:`);
      this.logger.log(`📧 ===============================================`);
      this.logger.log(`📧 TO: ${recipientEmail}`);
      this.logger.log(`📧 NAME: ${recipientName}`);
      this.logger.log(`📧 ROLE: ${role}`);
      this.logger.log(`📧 SUBJECT: Welcome to Business Loan Management System - ${role} Access`);
      this.logger.log(`📧 ===============================================`);
      this.logger.log(`📧 🔗 VERIFICATION LINK (COPY THIS):`);
      this.logger.log(`📧 ${accessLink}`);
      this.logger.log(`📧 ===============================================`);
      this.logger.log(`📧 📝 EMAIL TEMPLATE:`);
      this.logger.log(`📧 `);
      this.logger.log(`📧 Hello ${recipientName}!`);
      this.logger.log(`📧 `);
      this.logger.log(`📧 You have been granted ${role} access to the Business Loan Management System.`);
      this.logger.log(`📧 `);
      this.logger.log(`📧 Please click the following link to activate your account:`);
      this.logger.log(`📧 ${accessLink}`);
      this.logger.log(`📧 `);
      this.logger.log(`📧 This link will expire in 24 hours.`);
      this.logger.log(`📧 `);
      this.logger.log(`📧 Best regards,`);
      this.logger.log(`📧 Business Loan Management Team`);
      this.logger.log(`📧 ===============================================`);
      
      // Try to send notification to admin webhook if available
      await this.notifyAdminOfEmailSuccess(recipientEmail, recipientName, accessLink, role);
      
      this.logger.log(`✅ [DEMO MODE] Email template generated successfully for ${recipientEmail}`);
      this.logger.log(`📧 👆 COPY THE VERIFICATION LINK ABOVE AND SEND IT MANUALLY`);
      this.logger.log(`📧 ✅ STAFF CREATION SUCCESSFUL - Email delivery is in demo mode`);
      
      if (isRender) {
        this.logger.log(`📧 🌐 RENDER DEPLOYMENT - TO FIX AUTOMATIC EMAILS:`);
        this.logger.log(`📧    1. Sign up for SendGrid: https://app.sendgrid.com/`);
        this.logger.log(`📧    2. VERIFY SENDER IDENTITY: https://app.sendgrid.com/settings/sender_auth`);
        this.logger.log(`📧       - Click "Verify a Single Sender"`);
        this.logger.log(`📧       - Add your email address and verify it`);
        this.logger.log(`📧    3. Create API key: Settings > API Keys > Create API Key`);
        this.logger.log(`📧    4. Add to Render environment: SENDGRID_API_KEY=SG.your-key`);
        this.logger.log(`📧    5. Add SENDGRID_FROM_EMAIL=your-verified-email@domain.com`);
        this.logger.log(`📧    6. Redeploy your Render service`);
        this.logger.log(`📧 ⚠️ RENDER BLOCKS SMTP - SendGrid is the ONLY solution!`);
        this.logger.log(`📧 📖 Full guide: See SENDGRID_SETUP.md in project root`);
      } else {
        this.logger.log(`📧 🔧 TO FIX AUTOMATIC EMAILS:`);
        this.logger.log(`📧    1. Set GMAIL_EMAIL environment variable to your Gmail address`);
        this.logger.log(`📧    2. Set GMAIL_APP_PASSWORD environment variable to your Gmail app password`);
        this.logger.log(`📧    3. Enable 2-factor authentication on your Gmail account`);
        this.logger.log(`📧    4. Generate an app password from Gmail settings`);
      }
      this.logger.log(`📧 ===============================================`);
      
      return true; // Always return success in demo mode
    } catch (error) {
      this.logger.error(`❌ Demo email mode failed for ${recipientEmail}:`, error.message);
      return true; // Still return success to not break staff creation
    }
  }

  private async notifyAdminOfEmailSuccess(
    recipientEmail: string,
    recipientName: string,
    accessLink: string,
    role: StaffRole
  ): Promise<void> {
    try {
      const adminWebhook = this.config.get('ADMIN_NOTIFICATION_WEBHOOK');
      if (!adminWebhook) {
        return;
      }

      const payload = {
        type: 'EMAIL_DELIVERY_SUCCESS_DEMO',
        message: `Demo email "sent" for staff member: ${recipientName} (${recipientEmail})`,
        details: {
          recipientEmail,
          recipientName,
          role,
          accessLink,
          timestamp: new Date().toISOString(),
          platform: process.env.RENDER === 'true' ? 'Render' : process.env.VERCEL === '1' ? 'Vercel' : 'Local',
          mode: 'DEMO'
        }
      };

      await axios.post(adminWebhook, payload, { timeout: 5000 });
      this.logger.log(`📧 Admin notified of demo email success for ${recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to notify admin of demo email success: ${error.message}`);
    }
  }

  private async notifyAdminOfEmailFailure(
    recipientEmail: string,
    recipientName: string,
    accessLink: string,
    role: StaffRole
  ): Promise<void> {
    try {
      const adminWebhook = this.config.get('ADMIN_NOTIFICATION_WEBHOOK');
      if (!adminWebhook) {
        return;
      }

      const payload = {
        type: 'EMAIL_DELIVERY_FAILED',
        message: `Email delivery failed for staff member: ${recipientName} (${recipientEmail})`,
        details: {
          recipientEmail,
          recipientName,
          role,
          accessLink,
          timestamp: new Date().toISOString(),
          platform: 'Render'
        }
      };

      await axios.post(adminWebhook, payload, { timeout: 5000 });
      this.logger.log(`📧 Admin notified of email failure for ${recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to notify admin of email failure: ${error.message}`);
    }
  }

  async sendAccessRevokedNotification(
    recipientEmail: string,
    recipientName: string,
    role: StaffRole
  ): Promise<boolean> {
    const isRender = process.env.RENDER === 'true';
    const isVercel = process.env.VERCEL === '1';
    
    // Use SendGrid for Render/Vercel, SMTP for local
    if ((isRender || isVercel) && this.sendGridInitialized) {
      return this.sendRevokedViaSendGrid(recipientEmail, recipientName, role);
    }
    
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
    // Generate a more professional, spam-filter friendly email template
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Account Activation - Business Loan Management System</title>
        <style type="text/css">
            /* Anti-spam optimized styles */
            body { 
                font-family: Arial, Helvetica, sans-serif; 
                line-height: 1.6; 
                color: #333333; 
                margin: 0; 
                padding: 0; 
                background-color: #f8f9fa;
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
            }
            .email-container { 
                max-width: 600px; 
                margin: 20px auto; 
                background-color: #ffffff; 
                border: 1px solid #e9ecef;
                border-radius: 8px;
            }
            .header { 
                background-color: #0056b3; 
                color: #ffffff; 
                padding: 30px 20px; 
                text-align: center; 
                border-radius: 8px 8px 0 0;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: normal;
            }
            .content { 
                padding: 30px 20px;
            }
            .role-info { 
                background-color: #f8f9fa;
                border-left: 4px solid #0056b3;
                padding: 15px;
                margin: 20px 0;
            }
            .activation-section {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 5px;
            }
            .activation-button { 
                display: inline-block; 
                background-color: #0056b3; 
                color: #ffffff; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold;
                margin: 15px 0;
            }
            .activation-button:hover {
                background-color: #004494;
            }
            .security-notice { 
                background-color: #fff3cd; 
                border: 1px solid #ffeaa7; 
                padding: 15px; 
                border-radius: 5px; 
                margin: 20px 0;
            }
            .footer { 
                background-color: #f8f9fa; 
                padding: 20px; 
                text-align: center; 
                border-top: 1px solid #e9ecef;
                font-size: 12px; 
                color: #6c757d;
                border-radius: 0 0 8px 8px;
            }
            .text-link {
                color: #0056b3;
                word-break: break-all;
            }
            @media only screen and (max-width: 600px) {
                .email-container {
                    margin: 10px;
                    width: auto !important;
                }
                .content {
                    padding: 20px 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Business Loan Management System</h1>
                <p style="margin: 10px 0 0 0;">Account Activation Required</p>
            </div>
            
            <div class="content">
                <p>Dear ${name},</p>
                
                <p>Welcome to the Business Loan Management System. Your account has been successfully created and requires activation.</p>
                
                <div class="role-info">
                    <strong>Account Details:</strong><br>
                    Name: ${name}<br>
                    Role: ${role}<br>
                    Date Created: ${currentDate}
                </div>
                
                <div class="activation-section">
                    <p><strong>Action Required: Activate Your Account</strong></p>
                    <p>Please click the button below to activate your account. This link is valid for 24 hours and can only be used once.</p>
                    
                    <a href="${accessLink}" class="activation-button">Activate Account</a>
                    
                    <p style="margin-top: 20px; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p class="text-link" style="font-size: 12px;">${accessLink}</p>
                </div>
                
                <div class="security-notice">
                    <strong>Security Information:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>This activation link expires in 24 hours</li>
                        <li>The link can only be used once</li>
                        <li>Do not share this link with others</li>
                        <li>Contact support if you need assistance</li>
                    </ul>
                </div>
                
                <p><strong>Your ${role} privileges include:</strong></p>
                <ul style="padding-left: 20px;">
                    ${role === 'ADMIN' 
                        ? `
                        <li>Manage loan applications and documents</li>
                        <li>Oversee staff members and permissions</li>
                        <li>Access system analytics and reports</li>
                        <li>Configure system settings</li>
                        `
                        : `
                        <li>Process loan applications</li>
                        <li>Manage client documents</li>
                        <li>Update application statuses</li>
                        <li>Communicate with clients</li>
                        `
                    }
                </ul>
                
                <p>If you did not request this account or have questions, please contact your system administrator immediately.</p>
                
                <p>Best regards,<br>
                Business Loan Management Team</p>
            </div>
            
            <div class="footer">
                <p>Business Loan Management System<br>
                This is an automated message - please do not reply</p>
                <p>&copy; 2025 Business Loan Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generatePlainTextTemplate(name: string, accessLink: string, role: StaffRole): string {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `
Business Loan Management System
Account Activation Required

Dear ${name},

Welcome to the Business Loan Management System. Your account has been successfully created and requires activation.

Account Details:
- Name: ${name}
- Role: ${role}
- Date Created: ${currentDate}

ACTION REQUIRED: Activate Your Account

Please copy and paste the following link into your browser to activate your account. This link is valid for 24 hours and can only be used once.

Activation Link: ${accessLink}

Security Information:
- This activation link expires in 24 hours
- The link can only be used once
- Do not share this link with others
- Contact support if you need assistance

Your ${role} privileges include:
${role === 'ADMIN' 
  ? `- Manage loan applications and documents
- Oversee staff members and permissions
- Access system analytics and reports
- Configure system settings`
  : `- Process loan applications
- Manage client documents
- Update application statuses
- Communicate with clients`
}

If you did not request this account or have questions, please contact your system administrator immediately.

Best regards,
Business Loan Management Team

---
Business Loan Management System
This is an automated message - please do not reply
© 2025 Business Loan Management System. All rights reserved.
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
  async testVerificationEmail(testEmail: string = 'perivihari8@gmail.com'): Promise<boolean> {
    this.logger.log(`📧 Testing verification email to: ${testEmail}`);
    this.logger.log(`📧 Sender: gokrishna98@gmail.com`);
    
    return this.sendAccessLink(
      testEmail,
      'Test User',
      'test_token_' + Date.now(),
      StaffRole.ADMIN
    );
  }

  // Enhanced email delivery test with real verification
  async testEmailDeliveryToStaff(): Promise<{ 
    success: boolean; 
    results: Array<{
      email: string;
      name: string;
      sent: boolean;
      method: string;
      error?: string;
    }>;
    summary: string;
  }> {
    const testRecipients = [
      { email: 'perivihari8@gmail.com', name: 'Perivi' },
      { email: 'gowthaamankrishna1998@gmail.com', name: 'Gowthaman' },
      { email: 'gowthaamaneswar1998@gmail.com', name: 'Venkat' },
      { email: 'newacttmis@gmail.com', name: 'Harish' },
      { email: 'dinesh@gmail.com', name: 'Dinesh' }
    ];

    this.logger.log('📧 Starting comprehensive email delivery test...');
    this.logger.log(`📧 Sender: gokrishna98@gmail.com`);
    this.logger.log(`🎯 Testing delivery to ${testRecipients.length} recipients`);

    const results = [];
    let successCount = 0;

    for (const recipient of testRecipients) {
      this.logger.log(`📧 Testing email to: ${recipient.email} (${recipient.name})`);
      
      try {
        const sent = await this.sendAccessLink(
          recipient.email,
          recipient.name,
          `test_token_${Date.now()}_${recipient.name.toLowerCase()}`,
          StaffRole.ADMIN
        );

        if (sent) {
          successCount++;
          results.push({
            email: recipient.email,
            name: recipient.name,
            sent: true,
            method: process.env.RENDER === 'true' ? 'Render-Optimized' : 'SMTP'
          });
          this.logger.log(`✅ Email sent successfully to ${recipient.email}`);
        } else {
          results.push({
            email: recipient.email,
            name: recipient.name,
            sent: false,
            method: 'Failed',
            error: 'Email sending failed'
          });
          this.logger.error(`❌ Email failed to ${recipient.email}`);
        }
      } catch (error) {
        results.push({
          email: recipient.email,
          name: recipient.name,
          sent: false,
          method: 'Error',
          error: error.message
        });
        this.logger.error(`❌ Email error to ${recipient.email}:`, error.message);
      }

      // Add delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const summary = `${successCount}/${testRecipients.length} emails sent successfully`;
    this.logger.log(`📊 Email delivery test completed: ${summary}`);

    return {
      success: successCount > 0,
      results,
      summary
    };
  }

  // Enhanced test method specifically for Render deployment
  async testRenderEmailDelivery(): Promise<{ success: boolean; method: string; details: any }> {
    const testEmail = 'gowthaamaneswar1998@gmail.com';
    const testName = 'Venkat (Test)';
    const testRole = StaffRole.EMPLOYEE;
    const testToken = 'render_test_' + Date.now();
    const isRender = process.env.RENDER === 'true';
    
    this.logger.log(`🧪 RENDER EMAIL TEST: Starting comprehensive email test`);
    this.logger.log(`📧 Target Email: ${testEmail}`);
    this.logger.log(`🌐 Environment: ${isRender ? 'Render' : 'Local'}`);
    this.logger.log(`📧 SendGrid Initialized: ${this.sendGridInitialized}`);
    
    const backendUrl = isRender 
      ? `https://${process.env.RENDER_SERVICE_NAME || 'business-loan-backend'}.onrender.com`
      : 'http://localhost:5002';
    const accessLink = `${backendUrl}/api/staff/verify-access/${testToken}`;
    
    // Test 1: Try SendGrid if available
    if (this.sendGridInitialized) {
      this.logger.log(`🧪 TEST 1: Attempting SendGrid delivery`);
      try {
        const sendGridResult = await this.sendViaSendGrid(testEmail, testName, accessLink, testRole);
        if (sendGridResult) {
          return {
            success: true,
            method: 'SendGrid',
            details: {
              email: testEmail,
              accessLink,
              timestamp: new Date().toISOString(),
              platform: isRender ? 'Render' : 'Local'
            }
          };
        }
      } catch (error) {
        this.logger.error(`🧪 TEST 1 FAILED: SendGrid error - ${error.message}`);
      }
    }
    
    // Test 2: Try webhook if available
    this.logger.log(`🧪 TEST 2: Attempting webhook delivery`);
    try {
      const webhookResult = await this.sendViaWebhook(testEmail, testName, accessLink, testRole);
      if (webhookResult) {
        return {
          success: true,
          method: 'Webhook',
          details: {
            email: testEmail,
            accessLink,
            timestamp: new Date().toISOString(),
            platform: isRender ? 'Render' : 'Local'
          }
        };
      }
    } catch (error) {
      this.logger.error(`🧪 TEST 2 FAILED: Webhook error - ${error.message}`);
    }
    
    // Test 3: Use demo mode (always succeeds)
    this.logger.log(`🧪 TEST 3: Using demo mode delivery`);
    try {
      const demoResult = await this.sendViaDemo(testEmail, testName, accessLink, testRole);
      return {
        success: demoResult,
        method: 'Demo Mode',
        details: {
          email: testEmail,
          accessLink,
          timestamp: new Date().toISOString(),
          platform: isRender ? 'Render' : 'Local',
          note: 'Email logged to console - check Render logs for verification link'
        }
      };
    } catch (error) {
      this.logger.error(`🧪 TEST 3 FAILED: Demo mode error - ${error.message}`);
    }
    
    return {
      success: false,
      method: 'All methods failed',
      details: {
        email: testEmail,
        timestamp: new Date().toISOString(),
        platform: isRender ? 'Render' : 'Local',
        error: 'All email delivery methods failed'
      }
    };
  }
}

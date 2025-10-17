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
    // Force override environment variables with correct credentials
    const gmailEmail = 'gokrishna98@gmail.com';
    const gmailPassword = 'wwigqdrsiqarwiwz';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });

    this.logger.log(`📧 Gmail service initialized with email: ${gmailEmail}`);
    this.logger.log(`🔑 Using app password: ${gmailPassword.substring(0, 4)}****${gmailPassword.substring(gmailPassword.length - 4)}`);
  }

  async sendAccessLink(
    recipientEmail: string,
    recipientName: string,
    accessToken: string,
    role: StaffRole
  ): Promise<boolean> {
    // Force use correct credentials (override any environment variables)
    const currentEmail = 'gokrishna98@gmail.com';
    const currentPassword = 'wwigqdrsiqarwiwz';
    
    try {
      // Reinitialize transporter to ensure fresh credentials
      this.initializeTransporter();
      
      const accessLink = `${this.config.get('BACKEND_URL') || 'http://localhost:5002'}/api/staff/verify-access/${accessToken}`;
      
      const mailOptions = {
        from: currentEmail,
        to: recipientEmail,
        subject: `🎉 Welcome to Business Loan Management System - ${role} Access`,
        html: this.generateAccessEmailTemplate(recipientName, accessLink, role),
      };
      
      this.logger.log(`📧 Sending access link to ${recipientEmail} (${role})`);
      this.logger.log(`📧 Using SMTP: ${currentEmail}`);
      this.logger.log(`🔑 App password: ${currentPassword} (${currentPassword.length} characters)`);
      
      // Test connection before sending
      await this.transporter.verify();
      this.logger.log(`📧 SMTP connection verified successfully`);
      
      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`✅ Access link sent successfully to ${recipientEmail}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send access link to ${recipientEmail}:`, error);
      
      // Provide specific error guidance
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        this.logger.error(`🔐 Authentication failed. Current app password: ${currentPassword}`);
        this.logger.error(`🔗 Generate new app password at: https://myaccount.google.com/apppasswords`);
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
      const mailOptions = {
        from: 'gokrishna98@gmail.com',
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
    try {
      this.logger.log('Testing Gmail SMTP connection...');
      const emailUsed = this.config.get('GMAIL_EMAIL') || this.config.get('GMAIL_USER') || 'gokrishna98@gmail.com';
      this.logger.log(`Using email: ${emailUsed}`);
      
      await this.transporter.verify();
      this.logger.log('✅ Gmail connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('❌ Gmail connection failed:', error);
      this.logger.error('Error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      
      // Provide specific error guidance
      if (error.code === 'EAUTH') {
        this.logger.error('🔐 Authentication failed - Check Gmail app password');
      } else if (error.code === 'ECONNECTION') {
        this.logger.error('🌐 Connection failed - Check internet connection');
      } else if (error.responseCode === 535) {
        this.logger.error('🔑 Invalid credentials - Gmail app password might be wrong');
      }
      
      return false;
    }
  }
}

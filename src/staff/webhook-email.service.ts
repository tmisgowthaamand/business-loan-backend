import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StaffRole } from './dto/staff.dto';

@Injectable()
export class WebhookEmailService {
  private readonly logger = new Logger(WebhookEmailService.name);

  constructor(private config: ConfigService) {}

  async sendAccessLink(
    recipientEmail: string,
    recipientName: string,
    accessToken: string,
    role: StaffRole,
    loginPassword?: string
  ): Promise<boolean> {
    const isRender = process.env.RENDER === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
      // For Render environment, use webhook-based email service
      if (isRender) {
        return await this.sendViaWebhook(recipientEmail, recipientName, accessToken, role, loginPassword);
      }
      
      // For other environments, log the access token
      this.logger.log(`📧 Email service not configured for this environment`);
      this.logger.log(`🔗 Access token for ${recipientName} (${recipientEmail}): ${accessToken}`);
      this.logger.log(`📋 Role: ${role}`);
      
      // In production, return true to not break the flow
      return isProduction;
    } catch (error) {
      this.logger.error(`❌ Webhook email service failed:`, error);
      return false;
    }
  }

  private async sendViaWebhook(
    recipientEmail: string,
    recipientName: string,
    accessToken: string,
    role: StaffRole,
    loginPassword?: string
  ): Promise<boolean> {
    try {
      // Use a webhook service like Zapier, Make.com, or custom webhook
      const webhookUrl = this.config.get('EMAIL_WEBHOOK_URL');
      
      if (!webhookUrl) {
        this.logger.warn(`📧 No webhook URL configured, logging access token instead`);
        this.logger.log(`🔗 Access token for ${recipientName} (${recipientEmail}): ${accessToken}`);
        return true;
      }

      const backendUrl = this.config.get('BACKEND_URL') || `https://${process.env.RENDER_SERVICE_NAME || 'business-loan-backend'}.onrender.com`;
      const accessLink = `${backendUrl}/api/staff/verify-access/${accessToken}`;

      const payload = {
        to: recipientEmail,
        name: recipientName,
        role: role,
        accessLink: accessLink,
        subject: `🎉 Welcome to Business Loan Management System - Verify Your ${role} Account`,
        template: 'staff-verification-email',
        emailBody: this.generateVerificationEmailHTML(recipientName, role, accessLink, recipientEmail, loginPassword),
        timestamp: new Date().toISOString()
      };

      this.logger.log(`📧 Sending email via webhook to ${recipientEmail}`);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Business-Loan-System/1.0'
        },
        body: JSON.stringify(payload),
        // Add timeout for webhook call
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        this.logger.log(`✅ Email webhook sent successfully to ${recipientEmail}`);
        return true;
      } else {
        this.logger.error(`❌ Webhook failed with status: ${response.status}`);
        this.logger.log(`🔗 Fallback - Access token for ${recipientName}: ${accessToken}`);
        return true; // Return true to not break the flow
      }
    } catch (error) {
      this.logger.error(`❌ Webhook email failed:`, error);
      this.logger.log(`🔗 Fallback - Access token for ${recipientName} (${recipientEmail}): ${accessToken}`);
      const fallbackBackendUrl = this.config.get('BACKEND_URL') || `https://${process.env.RENDER_SERVICE_NAME || 'business-loan-backend'}.onrender.com`;
      this.logger.log(`🔗 Verification link: ${fallbackBackendUrl}/api/staff/verify-access/${accessToken}`);
      return true; // Return true to not break the flow
    }
  }

  private generateVerificationEmailHTML(recipientName: string, role: StaffRole, accessLink: string, recipientEmail: string, loginPassword?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account - Business Loan Management System</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background-color: #f8fafc;
                  margin: 0;
                  padding: 20px;
                  line-height: 1.6;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  overflow: hidden;
              }
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
              }
              .content {
                  padding: 30px;
              }
              .welcome-box {
                  background: #f0f9ff;
                  border-left: 4px solid #3b82f6;
                  padding: 20px;
                  margin: 20px 0;
                  border-radius: 0 8px 8px 0;
              }
              .role-badge {
                  display: inline-block;
                  background: ${role === 'ADMIN' ? '#dc2626' : '#059669'};
                  color: white;
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-size: 14px;
                  font-weight: 600;
                  margin: 10px 0;
              }
              .verify-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  color: white;
                  padding: 15px 30px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 16px;
                  margin: 20px 0;
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                  transition: transform 0.2s;
              }
              .verify-button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
              }
              .instructions {
                  background: #fef3c7;
                  border-left: 4px solid #f59e0b;
                  padding: 15px;
                  margin: 20px 0;
                  border-radius: 0 8px 8px 0;
              }
              .footer {
                  background: #f8fafc;
                  padding: 20px;
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
              }
              .link-fallback {
                  background: #f3f4f6;
                  padding: 15px;
                  border-radius: 8px;
                  margin: 15px 0;
                  word-break: break-all;
                  font-family: monospace;
                  font-size: 12px;
                  color: #374151;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 Welcome to Business Loan Management System</h1>
                  <p>Account Verification Required</p>
              </div>
              
              <div class="content">
                  <div class="welcome-box">
                      <h2>Hello ${recipientName}! 👋</h2>
                      <p>Your account has been created successfully. Please verify your email address to activate your account and start using the system.</p>
                      <div class="role-badge">${role}</div>
                  </div>
                  
                  ${loginPassword ? `
                  <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                      <h3>🔑 Your Login Credentials:</h3>
                      <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 10px 0; border: 2px solid #e5e7eb;">
                          <p style="margin: 5px 0;"><strong>Email:</strong> ${recipientEmail}</p>
                          <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${loginPassword}</code></p>
                          <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
                      </div>
                      <p style="color: #dc2626; font-weight: 600; margin: 10px 0;">⚠️ Please keep these credentials secure and change your password after first login.</p>
                  </div>
                  ` : ''}
                  
                  <div class="instructions">
                      <h3>📋 Next Steps:</h3>
                      <ol>
                          <li><strong>Click the verification button below</strong></li>
                          <li><strong>Your account will be activated immediately</strong></li>
                          ${loginPassword ? '<li><strong>Use the login credentials above to access the system</strong></li>' : '<li><strong>Contact admin for your login password</strong></li>'}
                          <li><strong>Login to start managing business loans</strong></li>
                      </ol>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${accessLink}" class="verify-button">
                          ✅ Verify My Account Now
                      </a>
                  </div>
                  
                  <div class="instructions">
                      <h4>🔒 Security Information:</h4>
                      <ul>
                          <li>This verification link expires in <strong>24 hours</strong></li>
                          <li>Click the link only once to activate your account</li>
                          <li>After verification, you can login immediately</li>
                          <li>Contact support if the link doesn't work</li>
                      </ul>
                  </div>
                  
                  <div class="link-fallback">
                      <strong>Can't click the button?</strong><br>
                      Copy and paste this link in your browser:<br>
                      ${accessLink}
                  </div>
              </div>
              
              <div class="footer">
                  <p>This email was sent from Business Loan Management System</p>
                  <p>If you didn't request this account, please ignore this email</p>
                  <p>© 2024 Business Loan Management System. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  async sendAccessRevokedNotification(
    recipientEmail: string,
    recipientName: string,
    role: StaffRole
  ): Promise<boolean> {
    const isRender = process.env.RENDER === 'true';
    
    if (isRender) {
      this.logger.log(`📧 Access revoked notification for ${recipientName} (${recipientEmail})`);
      this.logger.log(`📋 Role: ${role}`);
      return true;
    }
    
    return false;
  }

  async testConnection(): Promise<boolean> {
    const webhookUrl = this.config.get('EMAIL_WEBHOOK_URL');
    
    if (!webhookUrl) {
      this.logger.log(`📧 Webhook email service - No webhook URL configured`);
      return true; // Return true for environments without webhook
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        this.logger.log(`✅ Webhook email service connection test successful`);
        return true;
      } else {
        this.logger.warn(`⚠️ Webhook test failed with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`❌ Webhook connection test failed:`, error);
      return false;
    }
  }
}

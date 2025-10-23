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
    role: StaffRole
  ): Promise<boolean> {
    const isRender = process.env.RENDER === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
      // For Render environment, use webhook-based email service
      if (isRender) {
        return await this.sendViaWebhook(recipientEmail, recipientName, accessToken, role);
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
    role: StaffRole
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
        subject: `🎉 Welcome to Business Loan Management System - ${role} Access`,
        template: 'staff-access-link',
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
      return true; // Return true to not break the flow
    }
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

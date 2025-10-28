import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  async handleWhatsappWebhook(body: any) {
    try {
      // Parse WhatsApp webhook payload
      // This is a basic implementation - you'd need to adapt based on your WhatsApp provider

      if (body.messages && body.messages.length > 0) {
        const message = body.messages[0];
        const phoneNumber = message.from;
        const text = message.text?.body;

        if (text && phoneNumber) {
          // Create enquiry from WhatsApp message
          const enquiry = await this.prisma.enquiry.create({
            data: {
              name: 'WhatsApp Lead',
              mobile: phoneNumber,
              businessType: 'WhatsApp Enquiry',
              comments: 'NO_RESPONSE',
              interestStatus: 'INTERESTED',
            },
          });

          console.log('Created enquiry from WhatsApp:', enquiry.id);
        }
      }

      return { status: 'received' };
    } catch (error) {
      console.error('WhatsApp webhook error:', error);
      return { status: 'error', message: error.message };
    }
  }

  async handleCashfreeWebhook(body: any) {
    try {
      // Handle Cashfree webhook notifications
      // This would be implemented based on Cashfree's webhook format

      if (body.event_type && body.application_id) {
        // Update application status based on webhook
        console.log('Cashfree webhook received:', body.event_type);

        // You would update the CashfreeApplication status here
        // based on the webhook payload
      }

      return { status: 'received' };
    } catch (error) {
      console.error('Cashfree webhook error:', error);
      return { status: 'error', message: error.message };
    }
  }
}

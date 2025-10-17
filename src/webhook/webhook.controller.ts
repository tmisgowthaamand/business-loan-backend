import { Controller, Post, Body } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('whatsapp')
  handleWhatsapp(@Body() body: any) {
    return this.webhookService.handleWhatsappWebhook(body);
  }

  @Post('cashfree')
  handleCashfree(@Body() body: any) {
    return this.webhookService.handleCashfreeWebhook(body);
  }
}

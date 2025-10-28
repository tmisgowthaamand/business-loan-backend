import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { GmailService } from './gmail.service';
import { WebhookEmailService } from './webhook-email.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    ConfigModule, 
    forwardRef(() => NotificationsModule),
    forwardRef(() => SupabaseModule)
  ],
  controllers: [StaffController],
  providers: [StaffService, GmailService, WebhookEmailService],
  exports: [StaffService, GmailService, WebhookEmailService],
})
export class StaffModule {}

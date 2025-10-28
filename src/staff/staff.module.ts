import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { GmailService } from './gmail.service';
import { WebhookEmailService } from './webhook-email.service';
import { ProfessionalEmailService } from './professional-email.service';
import { EmailVerificationController } from './email-verification.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    ConfigModule, 
    forwardRef(() => NotificationsModule),
    forwardRef(() => SupabaseModule)
  ],
  controllers: [StaffController, EmailVerificationController],
  providers: [StaffService, GmailService, WebhookEmailService, ProfessionalEmailService],
  exports: [StaffService, GmailService, WebhookEmailService, ProfessionalEmailService],
})
export class StaffModule {}

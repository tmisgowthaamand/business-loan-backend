import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { GmailService } from './gmail.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    ConfigModule, 
    forwardRef(() => NotificationsModule),
    forwardRef(() => SupabaseModule)
  ],
  controllers: [StaffController],
  providers: [StaffService, GmailService],
  exports: [StaffService, GmailService],
})
export class StaffModule {}

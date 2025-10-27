import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { EnquiryModule } from './enquiry/enquiry.module';
import { DocumentModule } from './document/document.module';
import { ShortlistModule } from './shortlist/shortlist.module';
import { StaffModule } from './staff/staff.module';
import { CashfreeModule } from './cashfree/cashfree.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    EnquiryModule,
    DocumentModule,
    ShortlistModule,
    StaffModule,
    CashfreeModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

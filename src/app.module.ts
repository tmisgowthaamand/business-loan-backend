import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { SupabaseModule } from './supabase/supabase.module';
import { HealthModule } from './health/health.module';
import { MockModule } from './mock/mock.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { EnquiryModule } from './enquiry/enquiry.module';
import { DocumentModule } from './document/document.module';
import { ShortlistModule } from './shortlist/shortlist.module';
import { CashfreeModule } from './cashfree/cashfree.module';
import { WebhookModule } from './webhook/webhook.module';
import { StaffModule } from './staff/staff.module';
import { GeminiModule } from './gemini/gemini.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    MockModule,
    AuthModule,
    UserModule,
    EnquiryModule,
    DocumentModule,
    ShortlistModule,
    CashfreeModule,
    WebhookModule,
    StaffModule,
    GeminiModule,
    NotificationsModule,
    TransactionModule,
    SupabaseModule, // Moved to end to avoid dependency issues
  ],
  providers: [PrismaService],
})
export class AppModule {}

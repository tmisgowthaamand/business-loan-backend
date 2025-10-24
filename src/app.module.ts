import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
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
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule, // Add common module first for global services
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
    DashboardModule,
    SupabaseModule, // Moved to end to avoid dependency issues
  ],
  controllers: [AppController],
  providers: [PrismaService, AppService],
})
export class AppModule {}

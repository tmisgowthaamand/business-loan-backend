import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { AutoSyncModule } from './database/auto-sync.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 1000, // 1000 requests per 15 minutes
      }
    ]),
    CommonModule, // Add common module first for global services
    PublicModule, // Public endpoints (no authentication required)
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
    AutoSyncModule,
    SupabaseModule, // Moved to end to avoid dependency issues
  ],
  controllers: [AppController],
  providers: [
    PrismaService, 
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

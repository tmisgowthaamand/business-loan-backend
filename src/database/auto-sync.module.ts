import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutoSyncService } from './auto-sync.service';
import { AutoSyncController } from './auto-sync.controller';
import { SupabaseSyncTestController } from './supabase-sync-test.controller';
import { DeploymentSyncTestController } from './deployment-sync-test.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { EnquiryModule } from '../enquiry/enquiry.module';
import { DocumentModule } from '../document/document.module';
import { ShortlistModule } from '../shortlist/shortlist.module';
import { CashfreeModule } from '../cashfree/cashfree.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    forwardRef(() => EnquiryModule),
    forwardRef(() => DocumentModule),
    forwardRef(() => ShortlistModule),
    forwardRef(() => CashfreeModule),
    forwardRef(() => StaffModule),
  ],
  controllers: [AutoSyncController, SupabaseSyncTestController, DeploymentSyncTestController],
  providers: [AutoSyncService],
  exports: [AutoSyncService]
})
export class AutoSyncModule {}

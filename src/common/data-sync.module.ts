import { Module } from '@nestjs/common';
import { DataSyncService } from './data-sync.service';
import { DataSyncController } from './data-sync.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { EnquiryModule } from '../enquiry/enquiry.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    SupabaseModule,
    EnquiryModule,
    StaffModule,
  ],
  controllers: [DataSyncController],
  providers: [DataSyncService],
  exports: [DataSyncService],
})
export class DataSyncModule {}

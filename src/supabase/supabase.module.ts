import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { SupabaseController } from './supabase.controller';
import { SupabaseClearSyncController } from './supabase-clear-sync.controller';
import { EnquiryModule } from '../enquiry/enquiry.module';
import { DocumentModule } from '../document/document.module';
import { ShortlistModule } from '../shortlist/shortlist.module';
import { CashfreeModule } from '../cashfree/cashfree.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => EnquiryModule),
    forwardRef(() => DocumentModule),
    forwardRef(() => ShortlistModule),
    forwardRef(() => CashfreeModule),
    forwardRef(() => StaffModule),
  ],
  controllers: [SupabaseController, SupabaseClearSyncController],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {
  constructor() {
    console.log('🔧 SupabaseModule constructor called - module should be loading');
    console.log('📋 SupabaseModule registering SupabaseController and SupabaseService');
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutoSyncService } from './auto-sync.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule
  ],
  providers: [AutoSyncService],
  exports: [AutoSyncService]
})
export class AutoSyncModule {}

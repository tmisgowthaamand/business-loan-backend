import { Module, Global } from '@nestjs/common';
import { PersistenceService } from './services/persistence.service';
import { IdGeneratorService } from './services/id-generator.service';
import { UnifiedSupabaseSyncService } from './services/unified-supabase-sync.service';

@Global()
@Module({
  providers: [PersistenceService, IdGeneratorService, UnifiedSupabaseSyncService],
  exports: [PersistenceService, IdGeneratorService, UnifiedSupabaseSyncService],
})
export class CommonModule {}

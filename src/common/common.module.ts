import { Module, forwardRef, Global } from '@nestjs/common';
import { PersistenceService } from './services/persistence.service';
import { IdGeneratorService } from './services/id-generator.service';
import { UnifiedSupabaseSyncService } from './services/unified-supabase-sync.service';
import { DataInitializationService } from './services/data-initialization.service';
import { DataVisibilityController } from './controllers/data-visibility.controller';
import { AutoSyncController } from './controllers/auto-sync.controller';
import { EnquiryModule } from '../enquiry/enquiry.module';
import { DocumentModule } from '../document/document.module';
import { ShortlistModule } from '../shortlist/shortlist.module';
import { StaffModule } from '../staff/staff.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CashfreeModule } from '../cashfree/cashfree.module';
import { TransactionModule } from '../transaction/transaction.module';

@Global()
@Module({
  controllers: [DataVisibilityController, AutoSyncController],
  providers: [PersistenceService, IdGeneratorService, UnifiedSupabaseSyncService, DataInitializationService],
  exports: [PersistenceService, IdGeneratorService, UnifiedSupabaseSyncService, DataInitializationService],
  imports: [
    forwardRef(() => EnquiryModule),
    forwardRef(() => DocumentModule),
    forwardRef(() => ShortlistModule),
    forwardRef(() => StaffModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => CashfreeModule),
    forwardRef(() => TransactionModule)
  ]
})
export class CommonModule {}

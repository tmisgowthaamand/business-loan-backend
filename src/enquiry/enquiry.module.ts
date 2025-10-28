import { Module, forwardRef } from '@nestjs/common';
import { EnquiryController } from './enquiry.controller';
import { EnquiryService } from './enquiry.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { StaffModule } from '../staff/staff.module';
import { DocumentModule } from '../document/document.module';
import { ShortlistModule } from '../shortlist/shortlist.module';
import { CashfreeModule } from '../cashfree/cashfree.module';
import { AutoSyncModule } from '../database/auto-sync.module';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    forwardRef(() => StaffModule),
    forwardRef(() => DocumentModule),
    forwardRef(() => ShortlistModule),
    forwardRef(() => CashfreeModule),
    AutoSyncModule
  ],
  controllers: [EnquiryController],
  providers: [EnquiryService, PrismaService],
  exports: [EnquiryService],
})
export class EnquiryModule {}

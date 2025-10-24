import { Module, forwardRef } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { EnquiryModule } from '../enquiry/enquiry.module';
import { DocumentModule } from '../document/document.module';
import { ShortlistModule } from '../shortlist/shortlist.module';
import { StaffModule } from '../staff/staff.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CashfreeModule } from '../cashfree/cashfree.module';
import { TransactionModule } from '../transaction/transaction.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => EnquiryModule),
    forwardRef(() => DocumentModule),
    forwardRef(() => ShortlistModule),
    forwardRef(() => StaffModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => CashfreeModule),
    forwardRef(() => TransactionModule),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

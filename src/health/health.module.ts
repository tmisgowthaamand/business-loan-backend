import { Module, forwardRef } from '@nestjs/common';
import { HealthController } from './health.controller';
import { EnquiryModule } from '../enquiry/enquiry.module';
import { DocumentModule } from '../document/document.module';
import { ShortlistModule } from '../shortlist/shortlist.module';
import { StaffModule } from '../staff/staff.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => EnquiryModule),
    forwardRef(() => DocumentModule),
    forwardRef(() => ShortlistModule),
    forwardRef(() => StaffModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [HealthController],
})
export class HealthModule {}

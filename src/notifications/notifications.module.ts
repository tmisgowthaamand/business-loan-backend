import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    forwardRef(() => StaffModule), // Import StaffModule to access GmailService
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

import { Module, forwardRef } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EnquiryModule } from '../enquiry/enquiry.module';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    forwardRef(() => EnquiryModule),
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}

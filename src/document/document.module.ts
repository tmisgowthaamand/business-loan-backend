import { Module, forwardRef } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { PrismaService } from '../prisma/prisma.service';
import { EnquiryModule } from '../enquiry/enquiry.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => EnquiryModule), // Add EnquiryModule to access EnquiryService
    forwardRef(() => NotificationsModule), // Add NotificationsModule to access NotificationsService
  ],
  controllers: [DocumentController],
  providers: [DocumentService, PrismaService],
  exports: [DocumentService], // Export DocumentService so it can be used in other modules
})
export class DocumentModule {}

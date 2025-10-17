import { Module, forwardRef } from '@nestjs/common';
import { ShortlistController } from './shortlist.controller';
import { ShortlistService } from './shortlist.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EnquiryModule } from '../enquiry/enquiry.module';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    forwardRef(() => EnquiryModule)
  ],
  controllers: [ShortlistController],
  providers: [ShortlistService, PrismaService],
  exports: [ShortlistService], // Export ShortlistService for use in other modules
})
export class ShortlistModule {}

import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { EnquiryModule } from '../enquiry/enquiry.module';

@Module({
  imports: [EnquiryModule],
  controllers: [PublicController],
})
export class PublicModule {}

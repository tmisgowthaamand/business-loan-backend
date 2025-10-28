import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SimpleStaffController } from './simple-staff.controller';
import { SimpleStaffService } from './simple-staff.service';
import { ProfessionalEmailService } from './professional-email.service';

@Module({
  imports: [ConfigModule],
  controllers: [SimpleStaffController],
  providers: [SimpleStaffService, ProfessionalEmailService],
  exports: [SimpleStaffService, ProfessionalEmailService],
})
export class SimpleStaffModule {}

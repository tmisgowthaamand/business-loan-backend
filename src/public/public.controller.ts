import { Controller, Post, Body } from '@nestjs/common';
import { EnquiryService } from '../enquiry/enquiry.service';
import { CreateEnquiryDto } from '../enquiry/dto';

@Controller('public')
export class PublicController {
  constructor(private readonly enquiryService: EnquiryService) {}

  @Post('apply')
  async submitLoanApplication(@Body() createEnquiryDto: CreateEnquiryDto) {
    // Public endpoint for loan applications - no authentication required
    // Use a default system user ID for public applications
    const systemUserId = 1;
    
    // Add source tracking for public applications
    const enquiryData = {
      ...createEnquiryDto,
      source: 'PUBLIC_APPLICATION',
      interestStatus: 'INTERESTED' as any,
    };

    return this.enquiryService.create(enquiryData, systemUserId);
  }
}

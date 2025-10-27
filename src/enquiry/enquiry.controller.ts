import { Controller, Get, Post, Body, Param, Query, Delete, Patch } from '@nestjs/common';
import { EnquiryService } from './enquiry.service';

@Controller('enquiries')
export class EnquiryController {
  constructor(private readonly enquiryService: EnquiryService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.enquiryService.findAll(query);
  }

  @Post()
  create(@Body() createEnquiryDto: any) {
    return this.enquiryService.create(createEnquiryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enquiryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnquiryDto: any) {
    return this.enquiryService.update(+id, updateEnquiryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enquiryService.remove(+id);
  }
}

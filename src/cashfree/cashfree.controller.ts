import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { CashfreeService } from './cashfree.service';
import { CreateCashfreeApplicationDto } from './dto/create-cashfree-application.dto';
import { UpdateCashfreeApplicationDto } from './dto/update-cashfree-application.dto';

@Controller('cashfree')
export class CashfreeController {
  constructor(private readonly cashfreeService: CashfreeService) {}

  @Post('apply')
  async createApplication(@Body() createCashfreeApplicationDto: CreateCashfreeApplicationDto) {
    console.log('💳 Creating payment gateway application:', createCashfreeApplicationDto);
    return this.cashfreeService.createApplication(createCashfreeApplicationDto);
  }

  @Get()
  async findAll(@Query('userId') userId?: string) {
    console.log('💳 Fetching all payment applications');
    return this.cashfreeService.findAll(userId ? { id: parseInt(userId) } : undefined);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log('💳 Fetching payment application:', id);
    return this.cashfreeService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCashfreeApplicationDto: UpdateCashfreeApplicationDto) {
    console.log('💳 Updating payment application:', id, updateCashfreeApplicationDto);
    return this.cashfreeService.update(+id, updateCashfreeApplicationDto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() statusUpdate: { status: string }) {
    console.log('💳 Updating payment status:', id, statusUpdate);
    return this.cashfreeService.updateStatus(+id, statusUpdate.status);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    console.log('💳 Deleting payment application:', id);
    return this.cashfreeService.remove(+id);
  }
}

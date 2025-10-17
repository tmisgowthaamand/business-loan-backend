import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';

// @UseGuards(JwtGuard) // Temporarily disabled for demo
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    // Mock user ID for demo
    const mockUserId = 1;
    return this.transactionService.create(createTransactionDto, mockUserId);
  }

  @Get()
  findAll() {
    // Mock user for demo
    const mockUser = { id: 1, role: 'ADMIN' };
    return this.transactionService.findAll(mockUser as User);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.transactionService.findOne(+id);
    return result;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    // Mock user ID for demo
    const mockUserId = 1;
    return this.transactionService.update(+id, updateTransactionDto, mockUserId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // Mock user ID for demo
    const mockUserId = 1;
    return this.transactionService.remove(+id, mockUserId);
  }
}

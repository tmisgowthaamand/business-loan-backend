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
import { JwtGuard, RolesGuard } from '../auth/guard';
import { GetUser, Roles } from '../auth/decorator';
import { User } from '@prisma/client';

@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto, @GetUser() user: User) {
    const userId = user?.id || 1;
    return this.transactionService.create(createTransactionDto, userId);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.transactionService.findAll(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @GetUser() user: User) {
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

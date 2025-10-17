import { IsString, IsNotEmpty, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}

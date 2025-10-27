import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCashfreeApplicationDto {
  @IsNumber()
  shortlistId: number;

  @IsNumber()
  loanAmount: number;

  @IsOptional()
  @IsNumber()
  tenure?: number;

  @IsOptional()
  @IsNumber()
  interestRate?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

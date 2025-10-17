import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean, IsNumberString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateCashfreeApplicationDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = parseInt(value);
    return isNaN(num) ? undefined : num;
  })
  shortlistId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = parseFloat(String(value));
    return isNaN(num) ? undefined : num;
  })
  loanAmount?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    // Handle cases like "6 Months" by extracting just the number
    const stringValue = String(value).trim();
    const numericPart = stringValue.match(/^\d+/);
    if (numericPart) {
      const num = parseInt(numericPart[0]);
      return isNaN(num) ? undefined : num;
    }
    const num = parseInt(value);
    return isNaN(num) ? undefined : num;
  })
  tenure?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = parseFloat(String(value));
    return isNaN(num) ? undefined : num;
  })
  interestRate?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = parseFloat(String(value));
    return isNaN(num) ? undefined : num;
  })
  processingFee?: number;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  collateral?: string;

  @IsOptional()
  @IsString()
  guarantor?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  ifscCode?: string;

  @IsOptional()
  @IsString()
  panCard?: string;

  @IsOptional()
  @IsString()
  aadharCard?: string;

  @IsOptional()
  @IsBoolean()
  salarySlips?: boolean;

  @IsOptional()
  @IsBoolean()
  itrReturns?: boolean;

  @IsOptional()
  @IsBoolean()
  businessProof?: boolean;

  @IsOptional()
  @IsBoolean()
  addressProof?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  appliedAt?: Date;
}

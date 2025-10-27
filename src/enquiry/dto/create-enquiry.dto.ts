import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEmail, IsEnum, Length, Matches, Min, Max } from 'class-validator';
import { CommentStatus, InterestStatus } from '@prisma/client';

export class CreateEnquiryDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces' })
  name?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsNotEmpty()
  @IsString()
  @Length(10, 10, { message: 'Mobile number must be exactly 10 digits' })
  @Matches(/^[0-9]+$/, { message: 'Mobile number can only contain digits' })
  mobile: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  businessCategory?: string;

  @IsOptional()
  @IsNumber()
  @Min(10000, { message: 'Minimum loan amount is ₹10,000' })
  @Max(100000000, { message: 'Maximum loan amount is ₹10 crores' })
  loanAmount?: number;

  @IsOptional()
  @IsString()
  loanPurpose?: string;

  @IsOptional()
  @IsNumber()
  monthlyTurnover?: number;

  @IsOptional()
  @IsNumber()
  businessAge?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  gst?: string;

  @IsOptional()
  @IsEnum(CommentStatus)
  comments?: CommentStatus;

  @IsOptional()
  @IsEnum(InterestStatus)
  interestStatus?: InterestStatus;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  assignedStaff?: string;
}

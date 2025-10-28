import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEmail, IsEnum } from 'class-validator';
import { CommentStatus, InterestStatus } from '@prisma/client';

export class CreateEnquiryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsNotEmpty()
  @IsString()
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

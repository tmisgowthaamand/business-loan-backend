import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateShortlistDto {
  @IsNotEmpty()
  @IsNumber()
  enquiryId: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  businessNature?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  propPvt?: string;

  @IsOptional()
  @IsString()
  gst?: string;

  @IsOptional()
  @IsString()
  businessPan?: string;

  @IsOptional()
  @IsString()
  iec?: string;

  @IsOptional()
  @IsBoolean()
  newCurrentAccount?: boolean;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  gateway?: string;

  @IsOptional()
  @IsString()
  transaction?: string;

  @IsOptional()
  @IsString()
  bankStatementDuration?: string;

  @IsOptional()
  @IsNumber()
  loanAmount?: number;

  @IsOptional()
  @IsNumber()
  cap?: number;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  gstStatus?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  hasGst?: string;

  @IsOptional()
  @IsString()
  hasBusinessPan?: string;

  @IsOptional()
  @IsString()
  hasIec?: string;

  @IsOptional()
  @IsString()
  hasNewCurrentAccount?: string;

  @IsOptional()
  @IsString()
  hasWebsite?: string;

  @IsOptional()
  @IsString()
  hasGateway?: string;

  @IsOptional()
  @IsString()
  staff?: string;

  @IsOptional()
  @IsString()
  interestStatus?: string;
}

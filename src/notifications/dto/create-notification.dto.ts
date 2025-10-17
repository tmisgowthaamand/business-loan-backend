import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  type: 'NEW_ENQUIRY' | 'DOCUMENT_UPLOADED' | 'DOCUMENT_VERIFIED' | 'SHORTLISTED' | 'PAYMENT_APPLIED' | 'STAFF_ADDED';

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsEnum(['HIGH', 'MEDIUM', 'LOW'])
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

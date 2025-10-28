import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  type: 'NEW_ENQUIRY' | 'DOCUMENT_UPLOADED' | 'DOCUMENT_VERIFIED' | 'DOCUMENT_DELETED' | 'SHORTLISTED' | 'PAYMENT_APPLIED' | 'STAFF_ADDED' | 'STAFF_VERIFIED' | 'TRANSACTION_CREATED' | 'TRANSACTION_UPDATED' | 'STATUS_UPDATED' | 'ENQUIRY_ASSIGNED' | 'ENQUIRY_COMPLETED';

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

import { IsNotEmpty, IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  enquiryId: number;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsOptional()
  @IsString()
  assignedStaff?: string;
}

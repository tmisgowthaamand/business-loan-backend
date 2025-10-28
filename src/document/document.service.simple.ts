import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService, 
    private config: ConfigService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    createDocumentDto: CreateDocumentDto,
    userId: number,
  ) {
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    // Validate file type (only PDF)
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    try {
      // Mock implementation for demo mode
      const fileName = `documents/${Date.now()}-${file.originalname}`;
      
      // Return mock document data
      return {
        id: Math.floor(Math.random() * 1000),
        fileName: file.originalname,
        documentType: createDocumentDto.type,
        url: `https://example.com/documents/${fileName}`,
        status: 'PENDING',
        uploadedAt: new Date()
      };

    } catch (error) {
      console.error('Document upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload document');
    }
  }

  async findAll(user: User) {
    return [];
  }

  async findByEnquiry(enquiryId: number) {
    return [];
  }

  async findOne(id: number) {
    throw new NotFoundException('Document not found');
  }

  async verifyDocument(id: number, userId: number) {
    return { message: 'Document verified successfully' };
  }

  async remove(id: number, userId: number) {
    return { message: 'Document deleted successfully' };
  }
}

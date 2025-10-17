import { Module, forwardRef } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
  ],
  controllers: [DocumentController],
  providers: [DocumentService, PrismaService],
  exports: [DocumentService], // Export DocumentService so it can be used in other modules
})
export class DocumentModule {}

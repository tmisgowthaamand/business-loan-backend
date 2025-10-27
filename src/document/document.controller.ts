import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { DocumentService } from './document.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  findAll() {
    return this.documentService.findAll();
  }

  @Post()
  create(@Body() createDocumentDto: any) {
    return this.documentService.create(createDocumentDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(+id);
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body() verifyDto: { verified: boolean; verifiedBy?: string }) {
    return this.documentService.verify(+id, verifyDto.verified, verifyDto.verifiedBy);
  }

  @Get('enquiry/:enquiryId')
  findByEnquiry(@Param('enquiryId') enquiryId: string) {
    return this.documentService.findByEnquiry(+enquiryId);
  }

  @Get('enquiry/:enquiryId/status')
  getVerificationStatus(@Param('enquiryId') enquiryId: string) {
    return this.documentService.getVerificationStatus(+enquiryId);
  }

  @Get(':id/view')
  async viewDocument(@Param('id') id: string) {
    // This would serve the actual PDF file
    // For now, return document info
    const document = await this.documentService.findOne(+id);
    if (!document) {
      throw new Error('Document not found');
    }
    return {
      message: 'Document viewing endpoint',
      document: document,
      viewUrl: `http://localhost:5002/api/documents/${id}/view`
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentService.remove(+id);
  }
}

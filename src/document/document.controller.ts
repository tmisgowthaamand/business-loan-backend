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
  verify(@Param('id') id: string) {
    return this.documentService.verify(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentService.remove(+id);
  }
}

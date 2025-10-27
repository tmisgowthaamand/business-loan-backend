import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { ShortlistService } from './shortlist.service';

@Controller('shortlist')
export class ShortlistController {
  constructor(private readonly shortlistService: ShortlistService) {}

  @Get()
  findAll() {
    return this.shortlistService.findAll();
  }

  @Post()
  create(@Body() createShortlistDto: any) {
    return this.shortlistService.create(createShortlistDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shortlistService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShortlistDto: any) {
    return this.shortlistService.update(+id, updateShortlistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shortlistService.remove(+id);
  }
}

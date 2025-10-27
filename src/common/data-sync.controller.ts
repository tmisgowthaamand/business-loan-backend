import { Controller, Get, Post } from '@nestjs/common';
import { DataSyncService } from './data-sync.service';

@Controller('data-sync')
export class DataSyncController {
  constructor(private readonly dataSyncService: DataSyncService) {}

  @Get('status')
  async getDataStatus() {
    return this.dataSyncService.getDataStatus();
  }

  @Post('force-sync')
  async forceSyncAll() {
    return this.dataSyncService.forceSyncAll();
  }

  @Get('health')
  async getHealthCheck() {
    const status = await this.dataSyncService.getDataStatus();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      dataSync: status,
      message: 'Data sync service is running'
    };
  }
}

import { Controller, Get, Post } from '@nestjs/common';
import { RenderDataSyncService } from '../services/render-data-sync.service';

@Controller('render-sync')
export class RenderSyncController {
  constructor(private readonly renderDataSyncService: RenderDataSyncService) {}

  @Get('status')
  async getSyncStatus() {
    try {
      const status = await this.renderDataSyncService.getSyncStatus();
      return {
        message: 'Render data sync status retrieved',
        ...status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Error getting sync status',
        error: error.message,
        timestamp: new Date().toISOString(),
        isHealthy: false
      };
    }
  }

  @Get('stats')
  async getDataStats() {
    try {
      const stats = await this.renderDataSyncService.getDataStats();
      return {
        message: 'Data statistics retrieved successfully',
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Error getting data statistics',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('force-sync')
  async forceSyncAll() {
    try {
      const result = await this.renderDataSyncService.forceSyncAll();
      return {
        message: 'Force sync completed successfully',
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Force sync failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('health')
  async healthCheck() {
    try {
      const status = await this.renderDataSyncService.getSyncStatus();
      const stats = await this.renderDataSyncService.getDataStats();
      
      return {
        message: 'Render deployment health check',
        status: 'healthy',
        dataSync: status,
        dataStats: stats,
        environment: {
          isRender: process.env.RENDER === 'true',
          nodeEnv: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        message: 'Health check failed',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

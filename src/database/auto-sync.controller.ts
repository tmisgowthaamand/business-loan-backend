import { Controller, Get, Post, Body } from '@nestjs/common';
import { AutoSyncService } from './auto-sync.service';

@Controller('auto-sync')
export class AutoSyncController {
  constructor(private readonly autoSyncService: AutoSyncService) {}

  @Get('status')
  getSyncStatus() {
    return {
      message: 'Auto-sync status retrieved',
      status: this.autoSyncService.getSyncStatus(),
      timestamp: new Date().toISOString()
    };
  }

  @Get('test-connection')
  async testConnection() {
    const connected = await this.autoSyncService.testConnection();
    return {
      message: 'Database connection test completed',
      connected: connected,
      status: connected ? 'SUCCESS' : 'FAILED',
      timestamp: new Date().toISOString()
    };
  }

  @Post('force-sync-all')
  async forceSyncAll(@Body() data: {
    enquiries?: any[];
    documents?: any[];
    shortlists?: any[];
    staff?: any[];
    cashfreeApplications?: any[];
    transactions?: any[];
  }) {
    const result = await this.autoSyncService.syncAllData(data);
    return {
      message: 'Force sync completed',
      result: result,
      timestamp: new Date().toISOString()
    };
  }

  @Get('report')
  async getSyncReport() {
    const status = this.autoSyncService.getSyncStatus();
    const connected = await this.autoSyncService.testConnection();
    
    return {
      message: 'Auto-sync comprehensive report',
      autoSync: {
        enabled: status.enabled,
        supabaseAvailable: status.supabaseAvailable,
        databaseConnected: connected
      },
      environment: status.environment,
      recommendations: status.enabled ? [
        '✅ Auto-sync is active and working',
        '📊 All data operations will automatically sync to Supabase',
        '🔄 Database updates happen in real-time'
      ] : [
        '⚠️ Auto-sync is disabled (development mode)',
        '🏠 Using local file storage only',
        '🚀 Deploy to Render to enable auto-sync'
      ],
      timestamp: new Date().toISOString()
    };
  }
}

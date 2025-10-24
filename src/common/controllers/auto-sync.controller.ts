import { Controller, Get, Post, BadRequestException } from '@nestjs/common';
import { UnifiedSupabaseSyncService } from '../services/unified-supabase-sync.service';

@Controller('auto-sync')
export class AutoSyncController {
  constructor(
    private readonly unifiedSupabaseSync: UnifiedSupabaseSyncService,
  ) {}

  // Get sync status for all modules
  @Get('status')
  async getSyncStatus() {
    try {
      console.log('📊 Getting auto-sync status for all modules...');
      return await this.unifiedSupabaseSync.getSyncStatus();
    } catch (error) {
      console.error('❌ Get sync status failed:', error);
      throw new BadRequestException(`Failed to get sync status: ${error.message}`);
    }
  }

  // Test Supabase connection
  @Get('test-connection')
  async testConnection() {
    try {
      console.log('🔗 Testing Supabase connection...');
      const isConnected = await this.unifiedSupabaseSync.testConnection();
      
      return {
        connected: isConnected,
        timestamp: new Date().toISOString(),
        message: isConnected ? 'Supabase connection successful' : 'Supabase connection failed'
      };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw new BadRequestException(`Connection test failed: ${error.message}`);
    }
  }

  // Force sync all modules (for deployment initialization)
  @Post('force-sync-all')
  async forceSyncAll() {
    try {
      console.log('🚀 Starting force sync for all modules...');
      const results = await this.unifiedSupabaseSync.forceSyncAllModules();
      
      return {
        message: 'Force sync completed for all modules',
        results,
        timestamp: new Date().toISOString(),
        totalSuccess: Object.values(results).reduce((sum: number, result: any) => sum + result.success, 0),
        totalFailed: Object.values(results).reduce((sum: number, result: any) => sum + result.failed, 0)
      };
    } catch (error) {
      console.error('❌ Force sync all failed:', error);
      throw new BadRequestException(`Force sync failed: ${error.message}`);
    }
  }

  // Get comprehensive sync report
  @Get('report')
  async getSyncReport() {
    try {
      console.log('📋 Generating comprehensive sync report...');
      
      const status = await this.unifiedSupabaseSync.getSyncStatus();
      const connectionTest = await this.unifiedSupabaseSync.testConnection();
      
      // Load data counts from files
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      
      const dataCounts = {
        enquiries: 0,
        documents: 0,
        shortlists: 0,
        staff: 0,
        payments: 0
      };

      try {
        const enquiriesFile = path.join(dataDir, 'enquiries.json');
        if (fs.existsSync(enquiriesFile)) {
          const enquiries = JSON.parse(fs.readFileSync(enquiriesFile, 'utf8'));
          dataCounts.enquiries = enquiries.length;
        }
      } catch (error) {
        console.log('Could not load enquiries count:', error.message);
      }

      try {
        const documentsFile = path.join(dataDir, 'documents.json');
        if (fs.existsSync(documentsFile)) {
          const documents = JSON.parse(fs.readFileSync(documentsFile, 'utf8'));
          dataCounts.documents = documents.length;
        }
      } catch (error) {
        console.log('Could not load documents count:', error.message);
      }

      try {
        const shortlistsFile = path.join(dataDir, 'shortlists.json');
        if (fs.existsSync(shortlistsFile)) {
          const shortlists = JSON.parse(fs.readFileSync(shortlistsFile, 'utf8'));
          dataCounts.shortlists = shortlists.length;
        }
      } catch (error) {
        console.log('Could not load shortlists count:', error.message);
      }

      try {
        const staffFile = path.join(dataDir, 'staff.json');
        if (fs.existsSync(staffFile)) {
          const staff = JSON.parse(fs.readFileSync(staffFile, 'utf8'));
          dataCounts.staff = staff.length;
        }
      } catch (error) {
        console.log('Could not load staff count:', error.message);
      }

      try {
        const paymentsFile = path.join(dataDir, 'payments.json');
        if (fs.existsSync(paymentsFile)) {
          const payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
          dataCounts.payments = payments.length;
        }
      } catch (error) {
        console.log('Could not load payments count:', error.message);
      }

      return {
        timestamp: new Date().toISOString(),
        environment: status.environment,
        syncStatus: status,
        supabaseConnection: connectionTest,
        localDataCounts: dataCounts,
        totalLocalRecords: Object.values(dataCounts).reduce((sum, count) => sum + count, 0),
        recommendations: this.generateRecommendations(status, connectionTest, dataCounts)
      };
    } catch (error) {
      console.error('❌ Generate sync report failed:', error);
      throw new BadRequestException(`Failed to generate sync report: ${error.message}`);
    }
  }

  private generateRecommendations(status: any, connectionTest: boolean, dataCounts: any): string[] {
    const recommendations: string[] = [];

    if (!connectionTest) {
      recommendations.push('🔴 Supabase connection failed - check credentials and network');
    }

    if (!status.syncEnabled) {
      recommendations.push('🟡 Auto-sync is disabled - only enabled in production deployments');
    }

    if (status.syncEnabled && connectionTest) {
      recommendations.push('🟢 Auto-sync is properly configured and ready');
    }

    const totalRecords = Object.values(dataCounts).reduce((sum: number, count: number) => sum + count, 0);
    if (totalRecords === 0) {
      recommendations.push('🟡 No local data found - consider initializing with sample data');
    } else {
      recommendations.push(`🟢 Found ${totalRecords} local records ready for sync`);
    }

    if (status.environment === 'Render' || status.environment === 'Vercel') {
      recommendations.push('🟢 Running in deployment environment - auto-sync will work');
    } else {
      recommendations.push('🟡 Running locally - auto-sync is disabled for development');
    }

    return recommendations;
  }
}

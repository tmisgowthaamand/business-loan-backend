import { Injectable, Logger, Optional } from '@nestjs/common';
import { EnquiryService } from '../../enquiry/enquiry.service';
import { ShortlistService } from '../../shortlist/shortlist.service';
import { StaffService } from '../../staff/staff.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RenderDataSyncService {
  private readonly logger = new Logger(RenderDataSyncService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly syncFile = path.join(this.dataDir, 'render-sync.json');

  constructor(
    @Optional() private enquiryService?: EnquiryService,
    @Optional() private shortlistService?: ShortlistService,
    @Optional() private staffService?: StaffService,
  ) {
    this.initializeSync();
  }

  private async initializeSync() {
    try {
      const isRender = process.env.RENDER === 'true';
      const isProduction = process.env.NODE_ENV === 'production';

      if (isRender || isProduction) {
        this.logger.log('🚀 [RENDER] Initializing data synchronization service...');
        
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
          fs.mkdirSync(this.dataDir, { recursive: true });
          this.logger.log('📁 [RENDER] Created data directory for persistence');
        }

        // Start periodic sync
        this.startPeriodicSync();
      }
    } catch (error) {
      this.logger.error('❌ [RENDER] Error initializing sync service:', error);
    }
  }

  private startPeriodicSync() {
    // Sync data every 5 minutes to ensure consistency
    setInterval(async () => {
      await this.syncAllData();
    }, 5 * 60 * 1000);

    this.logger.log('⏰ [RENDER] Periodic data sync started (every 5 minutes)');
  }

  async syncAllData() {
    try {
      this.logger.log('🔄 [RENDER] Starting comprehensive data sync...');

      const syncData = {
        timestamp: new Date().toISOString(),
        environment: process.env.RENDER === 'true' ? 'render' : 'production',
        modules: {}
      };

      // Sync enquiries
      if (this.enquiryService) {
        try {
          const enquiries = await this.enquiryService.findAll({}, null);
          syncData.modules['enquiries'] = {
            count: enquiries.length,
            lastUpdated: new Date().toISOString(),
            sampleNames: enquiries.slice(0, 3).map(e => e.name || e.businessName)
          };
          this.logger.log(`✅ [RENDER] Synced ${enquiries.length} enquiries`);
        } catch (error) {
          this.logger.warn('⚠️ [RENDER] Enquiry sync failed:', error.message);
        }
      }

      // Documents sync would go here when document service is available
      syncData.modules['documents'] = {
        count: 0,
        lastUpdated: new Date().toISOString(),
        note: 'Document service not available'
      };

      // Sync shortlist
      if (this.shortlistService) {
        try {
          const shortlists = await this.shortlistService.findAll(null);
          syncData.modules['shortlist'] = {
            count: shortlists.length,
            lastUpdated: new Date().toISOString()
          };
          this.logger.log(`✅ [RENDER] Synced ${shortlists.length} shortlists`);
        } catch (error) {
          this.logger.warn('⚠️ [RENDER] Shortlist sync failed:', error.message);
        }
      }

      // Sync staff
      if (this.staffService) {
        try {
          const staff = await this.staffService.getAllStaff();
          syncData.modules['staff'] = {
            count: staff.length,
            lastUpdated: new Date().toISOString()
          };
          this.logger.log(`✅ [RENDER] Synced ${staff.length} staff members`);
        } catch (error) {
          this.logger.warn('⚠️ [RENDER] Staff sync failed:', error.message);
        }
      }

      // Save sync status
      fs.writeFileSync(this.syncFile, JSON.stringify(syncData, null, 2));
      this.logger.log('💾 [RENDER] Data sync completed and saved');

      return syncData;
    } catch (error) {
      this.logger.error('❌ [RENDER] Comprehensive data sync failed:', error);
      throw error;
    }
  }

  async getSyncStatus() {
    try {
      if (fs.existsSync(this.syncFile)) {
        const syncData = JSON.parse(fs.readFileSync(this.syncFile, 'utf8'));
        return {
          ...syncData,
          isHealthy: this.isDataHealthy(syncData),
          uptime: this.calculateUptime(syncData.timestamp)
        };
      }
      return {
        status: 'No sync data available',
        isHealthy: false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('❌ [RENDER] Error getting sync status:', error);
      return {
        status: 'Error reading sync data',
        error: error.message,
        isHealthy: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  private isDataHealthy(syncData: any): boolean {
    try {
      // Check if sync is recent (within last 10 minutes)
      const lastSync = new Date(syncData.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - lastSync.getTime();
      const isRecent = timeDiff < 10 * 60 * 1000; // 10 minutes

      // Check if we have data in key modules
      const hasEnquiries = syncData.modules?.enquiries?.count > 0;
      const hasStaff = syncData.modules?.staff?.count > 0;

      return isRecent && hasEnquiries && hasStaff;
    } catch (error) {
      return false;
    }
  }

  private calculateUptime(timestamp: string): string {
    try {
      const start = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return 'Unknown';
    }
  }

  // Force sync all data immediately
  async forceSyncAll() {
    this.logger.log('⚡ [RENDER] Force syncing all data...');
    return await this.syncAllData();
  }

  // Get data statistics for monitoring
  async getDataStats() {
    try {
      const stats = {
        enquiries: 0,
        documents: 0,
        shortlist: 0,
        staff: 0,
        payments: 0,
        timestamp: new Date().toISOString()
      };

      if (this.enquiryService) {
        const enquiries = await this.enquiryService.findAll({});
        stats.enquiries = enquiries.length;
      }

      // Documents stats would go here when service is available
      stats.documents = 0;

      if (this.shortlistService) {
        const shortlists = await this.shortlistService.findAll(null);
        stats.shortlist = shortlists.length;
      }

      if (this.staffService) {
        const staff = await this.staffService.getAllStaff();
        stats.staff = staff.length;
      }

      return stats;
    } catch (error) {
      this.logger.error('❌ [RENDER] Error getting data stats:', error);
      throw error;
    }
  }
}

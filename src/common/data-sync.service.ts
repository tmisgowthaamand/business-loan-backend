import { Injectable, Logger, Optional } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EnquiryService } from '../enquiry/enquiry.service';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(
    @Optional() private readonly supabaseService?: SupabaseService,
    @Optional() private readonly enquiryService?: EnquiryService,
    @Optional() private readonly staffService?: StaffService,
  ) {
    // Start periodic sync for Render deployment
    if (this.isRenderDeployment()) {
      this.startPeriodicSync();
    }
  }

  private isRenderDeployment(): boolean {
    return process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
  }

  private startPeriodicSync() {
    this.logger.log('🔄 Starting periodic data sync for Render deployment...');
    
    // Sync every 5 minutes
    this.syncInterval = setInterval(async () => {
      await this.syncAllData();
    }, 5 * 60 * 1000);

    // Initial sync
    setTimeout(() => this.syncAllData(), 10000); // Wait 10 seconds after startup
  }

  async syncAllData() {
    if (!this.supabaseService?.isConnected()) {
      this.logger.warn('⚠️ Supabase not connected, skipping sync');
      return;
    }

    this.logger.log('🔄 Starting comprehensive data sync...');

    try {
      await Promise.all([
        this.syncEnquiries(),
        this.syncStaff(),
        this.ensureDataConsistency(),
      ]);

      this.logger.log('✅ Data sync completed successfully');
    } catch (error) {
      this.logger.error('❌ Data sync failed:', error);
    }
  }

  private async syncEnquiries() {
    if (!this.enquiryService) return;

    try {
      const enquiries = await this.enquiryService.findAll();
      
      if (enquiries && enquiries.length > 0) {
        const supabase = this.supabaseService!.getClient();
        
        for (const enquiry of enquiries) {
          await supabase
            .from('enquiries')
            .upsert(enquiry, { onConflict: 'id' });
        }

        this.logger.log(`🔄 Synced ${enquiries.length} enquiries to Supabase`);
      }
    } catch (error) {
      this.logger.error('❌ Failed to sync enquiries:', error);
    }
  }

  private async syncStaff() {
    if (!this.staffService) return;

    try {
      const staffResult = await this.staffService.findAll();
      const staff = staffResult.staff || [];
      
      if (staff.length > 0) {
        const supabase = this.supabaseService!.getClient();
        
        for (const member of staff) {
          await supabase
            .from('staff')
            .upsert({
              id: member.id,
              name: member.name,
              email: member.email,
              role: member.role,
              department: member.department,
              phone: member.phone,
              status: member.status,
              has_access: member.hasAccess,
              verified: member.verified,
              client_name: member.clientName,
              created_at: member.createdAt,
              updated_at: member.updatedAt,
            }, { onConflict: 'email' });
        }

        this.logger.log(`🔄 Synced ${staff.length} staff members to Supabase`);
      }
    } catch (error) {
      this.logger.error('❌ Failed to sync staff:', error);
    }
  }

  private async ensureDataConsistency() {
    try {
      const supabase = this.supabaseService!.getClient();
      
      // Check enquiries count
      const { count: enquiriesCount } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true });

      // Check staff count
      const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true });

      this.logger.log(`📊 Supabase data consistency: ${enquiriesCount} enquiries, ${staffCount} staff`);

      // If no data in Supabase, force sync from local storage
      if (enquiriesCount === 0 || staffCount === 0) {
        this.logger.log('🔄 No data in Supabase, forcing initial sync...');
        await this.syncAllData();
      }
    } catch (error) {
      this.logger.error('❌ Failed to check data consistency:', error);
    }
  }

  async getDataStatus() {
    try {
      const supabase = this.supabaseService?.getClient();
      
      if (!supabase) {
        return {
          status: 'disconnected',
          message: 'Supabase not connected',
          data: {
            enquiries: 0,
            staff: 0,
            lastSync: null
          }
        };
      }

      const [enquiriesResult, staffResult] = await Promise.all([
        supabase.from('enquiries').select('*', { count: 'exact', head: true }),
        supabase.from('staff').select('*', { count: 'exact', head: true })
      ]);

      return {
        status: 'connected',
        message: 'Data sync active',
        data: {
          enquiries: enquiriesResult.count || 0,
          staff: staffResult.count || 0,
          lastSync: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('❌ Failed to get data status:', error);
      return {
        status: 'error',
        message: error.message,
        data: {
          enquiries: 0,
          staff: 0,
          lastSync: null
        }
      };
    }
  }

  async forceSyncAll() {
    this.logger.log('🚀 Force syncing all data...');
    await this.syncAllData();
    return this.getDataStatus();
  }

  onModuleDestroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.logger.log('🛑 Data sync service stopped');
    }
  }
}

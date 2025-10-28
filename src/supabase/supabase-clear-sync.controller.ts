import { Controller, Post, Get } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { EnquiryService } from '../enquiry/enquiry.service';
import { DocumentService } from '../document/document.service';
import { ShortlistService } from '../shortlist/shortlist.service';
import { CashfreeService } from '../cashfree/cashfree.service';
import { StaffService } from '../staff/staff.service';

@Controller('supabase')
export class SupabaseClearSyncController {
  constructor(
    private supabaseService: SupabaseService,
    private enquiryService: EnquiryService,
    private documentService: DocumentService,
    private shortlistService: ShortlistService,
    private cashfreeService: CashfreeService,
    private staffService: StaffService,
  ) {}

  @Post('clear-all-and-sync')
  async clearAllAndSyncCurrentData() {
    console.log('🧹 Starting complete Supabase clear and sync operation...');
    
    const results = {
      cleared: {
        enquiries: 0,
        documents: 0,
        shortlists: 0,
        payments: 0,
        staff: 0,
        documentFiles: 0
      },
      synced: {
        enquiries: 0,
        documents: 0,
        shortlists: 0,
        payments: 0,
        staff: 0
      },
      errors: {
        enquiries: 0,
        documents: 0,
        shortlists: 0,
        payments: 0,
        staff: 0
      }
    };

    try {
      // Step 1: Clear all existing data from Supabase
      console.log('🗑️ Step 1: Clearing existing Supabase data...');
      
      // Clear all tables
      const clearOperations = [
        { table: 'CashfreeApplication', name: 'payments' },
        { table: 'Documents', name: 'documents' },
        { table: 'DocumentCollection', name: 'documentCollection' },
        { table: 'Shortlist', name: 'shortlists' },
        { table: 'Enquiry', name: 'enquiries' },
        { table: 'Staff', name: 'staff' }
      ];

      for (const operation of clearOperations) {
        try {
          const { error } = await this.supabaseService.client
            .from(operation.table)
            .delete()
            .neq('id', 0); // Delete all records
          
          if (error) {
            console.error(`❌ Error clearing ${operation.table}:`, error);
          } else {
            console.log(`✅ Cleared all records from ${operation.table}`);
            results.cleared[operation.name] = 1;
          }
        } catch (error) {
          console.error(`❌ Failed to clear ${operation.table}:`, error);
        }
      }

      // Step 2: Clear document storage bucket
      console.log('🗑️ Step 2: Clearing document storage bucket...');
      try {
        const { data: files, error: listError } = await this.supabaseService.client
          .storage
          .from('documents')
          .list();

        if (!listError && files && files.length > 0) {
          const filePaths = files.map(file => file.name);
          const { error: deleteError } = await this.supabaseService.client
            .storage
            .from('documents')
            .remove(filePaths);

          if (deleteError) {
            console.error('❌ Error clearing document storage:', deleteError);
          } else {
            console.log(`✅ Cleared ${filePaths.length} files from document storage`);
            results.cleared.documentFiles = filePaths.length;
          }
        }
      } catch (error) {
        console.error('❌ Failed to clear document storage:', error);
      }

      // Step 3: Sync all current local data to Supabase
      console.log('🔄 Step 3: Syncing current local data to Supabase...');

      // Sync Enquiries
      try {
        const enquiryResult = await this.enquiryService.syncAllEnquiriesToSupabase();
        results.synced.enquiries = enquiryResult.synced || 0;
        results.errors.enquiries = enquiryResult.errors || 0;
        console.log(`✅ Enquiries synced: ${results.synced.enquiries}, errors: ${results.errors.enquiries}`);
      } catch (error) {
        console.error('❌ Failed to sync enquiries:', error);
        results.errors.enquiries = 1;
      }

      // Sync Documents
      try {
        const documentResult = await this.documentService.syncAllDocumentsToSupabase();
        results.synced.documents = documentResult.synced || 0;
        results.errors.documents = documentResult.errors || 0;
        console.log(`✅ Documents synced: ${results.synced.documents}, errors: ${results.errors.documents}`);
      } catch (error) {
        console.error('❌ Failed to sync documents:', error);
        results.errors.documents = 1;
      }

      // Sync Shortlists
      try {
        const shortlistResult = await this.shortlistService.syncAllShortlistsToSupabase();
        results.synced.shortlists = shortlistResult.synced || 0;
        results.errors.shortlists = shortlistResult.errors || 0;
        console.log(`✅ Shortlists synced: ${results.synced.shortlists}, errors: ${results.errors.shortlists}`);
      } catch (error) {
        console.error('❌ Failed to sync shortlists:', error);
        results.errors.shortlists = 1;
      }

      // Sync Payment Applications
      try {
        const paymentResult = await this.cashfreeService.syncAllPaymentsToSupabaseEnhanced();
        results.synced.payments = paymentResult.synced || 0;
        results.errors.payments = paymentResult.errors || 0;
        console.log(`✅ Payments synced: ${results.synced.payments}, errors: ${results.errors.payments}`);
      } catch (error) {
        console.error('❌ Failed to sync payments:', error);
        results.errors.payments = 1;
      }

      // Sync Staff (temporarily disabled due to StaffService issues)
      try {
        // const staffResult = await this.staffService.syncAllStaffToSupabase();
        results.synced.staff = 0; // staffResult.synced || 0;
        results.errors.staff = 0; // staffResult.errors || 0;
        console.log(`⚠️ Staff sync temporarily disabled - using SimpleStaffService instead`);
      } catch (error) {
        console.error('❌ Failed to sync staff:', error);
        results.errors.staff = 1;
      }

      console.log('🎉 Complete clear and sync operation finished!');
      
      return {
        message: 'Successfully cleared existing Supabase data and synced current application data',
        timestamp: new Date().toISOString(),
        results,
        summary: {
          totalCleared: Object.values(results.cleared).reduce((a, b) => a + b, 0),
          totalSynced: Object.values(results.synced).reduce((a, b) => a + b, 0),
          totalErrors: Object.values(results.errors).reduce((a, b) => a + b, 0)
        }
      };

    } catch (error) {
      console.error('❌ Error in complete clear and sync operation:', error);
      return {
        message: 'Error during clear and sync operation',
        error: error.message,
        timestamp: new Date().toISOString(),
        results
      };
    }
  }

  @Get('sync-status')
  async getAllSyncStatus() {
    console.log('📊 Getting sync status for all modules...');
    
    try {
      const [
        enquiryStatus,
        documentStatus,
        shortlistStatus,
        paymentStatus,
        staffStatus
      ] = await Promise.all([
        this.enquiryService.getSupabaseSyncStatus(),
        this.documentService.getSupabaseSyncStatus(),
        this.shortlistService.getShortlistsSyncStatus(),
        this.cashfreeService.getPaymentsSyncStatus(),
        // this.staffService.getStaffSyncStatus() // Temporarily disabled
        Promise.resolve({ localCount: 0, supabaseCount: 0, synced: true }) // Placeholder for staff sync status
      ]);

      return {
        message: 'Sync status retrieved for all modules',
        timestamp: new Date().toISOString(),
        modules: {
          enquiries: enquiryStatus,
          documents: documentStatus,
          shortlists: shortlistStatus,
          payments: paymentStatus,
          staff: staffStatus
        },
        summary: {
          totalLocal: (enquiryStatus.localCount || 0) + 
                    (documentStatus.localCount || 0) + 
                    (shortlistStatus.localCount || 0) + 
                    (paymentStatus.localCount || 0) + 
                    (staffStatus.localCount || 0),
          totalSupabase: (enquiryStatus.supabaseCount || 0) + 
                        (documentStatus.supabaseCount || 0) + 
                        (shortlistStatus.supabaseCount || 0) + 
                        (paymentStatus.supabaseCount || 0) + 
                        (staffStatus.supabaseCount || 0)
        }
      };

    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      return {
        message: 'Error retrieving sync status',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('clear-supabase-only')
  async clearSupabaseOnly() {
    console.log('🧹 Clearing only Supabase data (keeping local data)...');
    
    const results = {
      cleared: {
        enquiries: 0,
        documents: 0,
        shortlists: 0,
        payments: 0,
        staff: 0,
        documentFiles: 0
      }
    };

    try {
      // Clear all tables
      const clearOperations = [
        { table: 'CashfreeApplication', name: 'payments' },
        { table: 'Documents', name: 'documents' },
        { table: 'DocumentCollection', name: 'documentCollection' },
        { table: 'Shortlist', name: 'shortlists' },
        { table: 'Enquiry', name: 'enquiries' },
        { table: 'Staff', name: 'staff' }
      ];

      for (const operation of clearOperations) {
        try {
          const { error } = await this.supabaseService.client
            .from(operation.table)
            .delete()
            .neq('id', 0); // Delete all records
          
          if (error) {
            console.error(`❌ Error clearing ${operation.table}:`, error);
          } else {
            console.log(`✅ Cleared all records from ${operation.table}`);
            results.cleared[operation.name] = 1;
          }
        } catch (error) {
          console.error(`❌ Failed to clear ${operation.table}:`, error);
        }
      }

      // Clear document storage bucket
      try {
        const { data: files, error: listError } = await this.supabaseService.client
          .storage
          .from('documents')
          .list();

        if (!listError && files && files.length > 0) {
          const filePaths = files.map(file => file.name);
          const { error: deleteError } = await this.supabaseService.client
            .storage
            .from('documents')
            .remove(filePaths);

          if (deleteError) {
            console.error('❌ Error clearing document storage:', deleteError);
          } else {
            console.log(`✅ Cleared ${filePaths.length} files from document storage`);
            results.cleared.documentFiles = filePaths.length;
          }
        }
      } catch (error) {
        console.error('❌ Failed to clear document storage:', error);
      }

      return {
        message: 'Successfully cleared all Supabase data (local data preserved)',
        timestamp: new Date().toISOString(),
        results,
        summary: {
          totalCleared: Object.values(results.cleared).reduce((a, b) => a + b, 0)
        }
      };

    } catch (error) {
      console.error('❌ Error clearing Supabase data:', error);
      return {
        message: 'Error clearing Supabase data',
        error: error.message,
        timestamp: new Date().toISOString(),
        results
      };
    }
  }
}

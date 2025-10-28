import { Controller, Get, Post, Body } from '@nestjs/common';
import { EnquiryService } from '../enquiry/enquiry.service';
import { DocumentService } from '../document/document.service';
import { ShortlistService } from '../shortlist/shortlist.service';
import { CashfreeService } from '../cashfree/cashfree.service';
import { StaffService } from '../staff/staff.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('api/supabase-sync-test')
export class SupabaseSyncTestController {
  constructor(
    private enquiryService: EnquiryService,
    private documentService: DocumentService,
    private shortlistService: ShortlistService,
    private cashfreeService: CashfreeService,
    private staffService: StaffService,
    private supabaseService: SupabaseService,
  ) {}

  @Post('test-enquiry-sync')
  async testEnquirySync() {
    try {
      console.log('🧪 [RENDER] Testing enquiry sync with fixed schema...');
      
      // Create a test enquiry
      const testEnquiry = {
        name: 'TEST SYNC USER',
        mobile: '9999999999',
        businessType: 'Testing',
        businessName: 'Test Business',
        loanAmount: 100000,
        interestStatus: 'INTERESTED' as any // Use as any to bypass enum validation for test
      };

      // Create enquiry (this should trigger auto-sync)
      const result = await this.enquiryService.create(testEnquiry, 1);
      
      return {
        success: true,
        message: 'Test enquiry created and sync attempted',
        enquiryId: result.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Test enquiry sync failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('status')
  async getSupabaseSyncStatus() {
    try {
      console.log('🧪 [RENDER] Testing Supabase sync status for all modules...');
      
      const results = {
        timestamp: new Date().toISOString(),
        environment: {
          isRender: process.env.RENDER === 'true',
          nodeEnv: process.env.NODE_ENV,
          supabaseConfigured: !!this.supabaseService,
        },
        modules: {
          enquiries: { local: 0, supabase: 0, synced: false },
          documents: { local: 0, supabase: 0, synced: false },
          shortlist: { local: 0, supabase: 0, synced: false },
          cashfree: { local: 0, supabase: 0, synced: false },
          staff: { local: 0, supabase: 0, synced: false },
        },
        errors: []
      };

      // Test Enquiries
      try {
        const enquiries = await this.enquiryService.findAll({}, null);
        results.modules.enquiries.local = enquiries?.length || 0;
        
        const { data: supabaseEnquiries } = await this.supabaseService.client
          .from('enquiries')
          .select('id', { count: 'exact', head: true });
        results.modules.enquiries.supabase = supabaseEnquiries?.length || 0;
        results.modules.enquiries.synced = results.modules.enquiries.local > 0 && results.modules.enquiries.supabase > 0;
        
        console.log(`📋 Enquiries: Local=${results.modules.enquiries.local}, Supabase=${results.modules.enquiries.supabase}`);
      } catch (error) {
        results.errors.push(`Enquiries test failed: ${error.message}`);
      }

      // Test Documents
      try {
        const documents = await this.documentService.findAll({ id: 1 } as any);
        results.modules.documents.local = documents?.length || 0;
        
        const { data: supabaseDocuments } = await this.supabaseService.client
          .from('documents')
          .select('id', { count: 'exact', head: true });
        results.modules.documents.supabase = supabaseDocuments?.length || 0;
        results.modules.documents.synced = results.modules.documents.local > 0 && results.modules.documents.supabase > 0;
        
        console.log(`📄 Documents: Local=${results.modules.documents.local}, Supabase=${results.modules.documents.supabase}`);
      } catch (error) {
        results.errors.push(`Documents test failed: ${error.message}`);
      }

      // Test Shortlist
      try {
        const shortlists = await this.shortlistService.findAll({ id: 1 } as any);
        results.modules.shortlist.local = shortlists?.length || 0;
        
        const { data: supabaseShortlists } = await this.supabaseService.client
          .from('shortlist')
          .select('id', { count: 'exact', head: true });
        results.modules.shortlist.supabase = supabaseShortlists?.length || 0;
        results.modules.shortlist.synced = results.modules.shortlist.local > 0 && results.modules.shortlist.supabase > 0;
        
        console.log(`📝 Shortlist: Local=${results.modules.shortlist.local}, Supabase=${results.modules.shortlist.supabase}`);
      } catch (error) {
        results.errors.push(`Shortlist test failed: ${error.message}`);
      }

      // Test Cashfree
      try {
        const payments = await this.cashfreeService.findAll({ id: 1 } as any);
        results.modules.cashfree.local = payments?.length || 0;
        
        const { data: supabasePayments } = await this.supabaseService.client
          .from('payment_gateways')
          .select('id', { count: 'exact', head: true });
        results.modules.cashfree.supabase = supabasePayments?.length || 0;
        results.modules.cashfree.synced = results.modules.cashfree.local > 0 && results.modules.cashfree.supabase > 0;
        
        console.log(`💳 Cashfree: Local=${results.modules.cashfree.local}, Supabase=${results.modules.cashfree.supabase}`);
      } catch (error) {
        results.errors.push(`Cashfree test failed: ${error.message}`);
      }

      // Test Staff
      try {
        const staff = await this.staffService.getAllStaff();
        results.modules.staff.local = staff?.length || 0;
        
        const { data: supabaseStaff } = await this.supabaseService.client
          .from('staff')
          .select('id', { count: 'exact', head: true });
        results.modules.staff.supabase = supabaseStaff?.length || 0;
        results.modules.staff.synced = results.modules.staff.local > 0 && results.modules.staff.supabase > 0;
        
        console.log(`👤 Staff: Local=${results.modules.staff.local}, Supabase=${results.modules.staff.supabase}`);
      } catch (error) {
        results.errors.push(`Staff test failed: ${error.message}`);
      }

      const totalSynced = Object.values(results.modules).filter(m => m.synced).length;
      const totalModules = Object.keys(results.modules).length;
      
      console.log(`✅ [RENDER] Sync test completed: ${totalSynced}/${totalModules} modules synced`);
      
      return {
        success: true,
        message: `Supabase sync test completed: ${totalSynced}/${totalModules} modules synced`,
        syncedModules: totalSynced,
        totalModules: totalModules,
        syncPercentage: Math.round((totalSynced / totalModules) * 100),
        ...results
      };
    } catch (error) {
      console.error('❌ [RENDER] Supabase sync test failed:', error);
      return {
        success: false,
        message: 'Supabase sync test failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('force-sync-all')
  async forceSyncAllModules() {
    try {
      console.log('🚀 [RENDER] Force syncing all modules to Supabase...');
      
      const results = {
        timestamp: new Date().toISOString(),
        modules: {
          enquiries: { synced: 0, errors: 0 },
          documents: { synced: 0, errors: 0 },
          shortlist: { synced: 0, errors: 0 },
          cashfree: { synced: 0, errors: 0 },
          staff: { synced: 0, errors: 0 },
        },
        totalSynced: 0,
        totalErrors: 0
      };

      // Force sync Enquiries
      try {
        const enquiryResult = await this.enquiryService.syncAllToSupabase();
        results.modules.enquiries.synced = enquiryResult.synced || 0;
        results.modules.enquiries.errors = enquiryResult.errors || 0;
        console.log(`📋 Enquiries sync: ${results.modules.enquiries.synced} synced, ${results.modules.enquiries.errors} errors`);
      } catch (error) {
        results.modules.enquiries.errors = 1;
        console.error('❌ Enquiries sync failed:', error.message);
      }

      // Force sync Documents
      try {
        await this.documentService.clearAndSyncAllDocumentsToSupabase();
        results.modules.documents.synced = 1; // Assume success if no error
        console.log(`📄 Documents sync completed`);
      } catch (error) {
        results.modules.documents.errors = 1;
        console.error('❌ Documents sync failed:', error.message);
      }

      // Force sync Shortlist
      try {
        const shortlistResult = await this.shortlistService.clearAndSyncAllShortlistsToSupabase();
        results.modules.shortlist.synced = shortlistResult.synced || 0;
        results.modules.shortlist.errors = shortlistResult.errors || 0;
        console.log(`📝 Shortlist sync: ${results.modules.shortlist.synced} synced, ${results.modules.shortlist.errors} errors`);
      } catch (error) {
        results.modules.shortlist.errors = 1;
        console.error('❌ Shortlist sync failed:', error.message);
      }

      // Force sync Cashfree
      try {
        const cashfreeResult = await this.cashfreeService.clearAndSyncAllPaymentsToSupabase();
        results.modules.cashfree.synced = cashfreeResult.synced || 0;
        results.modules.cashfree.errors = cashfreeResult.errors || 0;
        console.log(`💳 Cashfree sync: ${results.modules.cashfree.synced} synced, ${results.modules.cashfree.errors} errors`);
      } catch (error) {
        results.modules.cashfree.errors = 1;
        console.error('❌ Cashfree sync failed:', error.message);
      }

      // Force sync Staff
      try {
        const staffResult = await this.staffService.syncAllStaffToSupabase();
        results.modules.staff.synced = staffResult.synced || 0;
        results.modules.staff.errors = staffResult.errors || 0;
        console.log(`👤 Staff sync: ${results.modules.staff.synced} synced, ${results.modules.staff.errors} errors`);
      } catch (error) {
        results.modules.staff.errors = 1;
        console.error('❌ Staff sync failed:', error.message);
      }

      // Calculate totals
      results.totalSynced = Object.values(results.modules).reduce((sum, module) => sum + module.synced, 0);
      results.totalErrors = Object.values(results.modules).reduce((sum, module) => sum + module.errors, 0);

      console.log(`✅ [RENDER] Force sync completed: ${results.totalSynced} records synced, ${results.totalErrors} errors`);

      return {
        success: results.totalErrors === 0,
        message: `Force sync completed: ${results.totalSynced} records synced, ${results.totalErrors} errors`,
        ...results
      };
    } catch (error) {
      console.error('❌ [RENDER] Force sync failed:', error);
      return {
        success: false,
        message: 'Force sync failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('table-status')
  async getSupabaseTableStatus() {
    try {
      console.log('🔍 [RENDER] Checking Supabase table status...');
      
      const tables = ['enquiries', 'documents', 'shortlist', 'payment_gateways', 'staff'];
      const results = {
        timestamp: new Date().toISOString(),
        tables: {},
        totalTables: tables.length,
        existingTables: 0,
        errors: []
      };

      for (const table of tables) {
        try {
          const { data, error, count } = await this.supabaseService.client
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (error) {
            results.tables[table] = {
              exists: false,
              count: 0,
              error: error.message
            };
            results.errors.push(`Table ${table}: ${error.message}`);
          } else {
            results.tables[table] = {
              exists: true,
              count: count || 0,
              error: null
            };
            results.existingTables++;
          }
        } catch (error) {
          results.tables[table] = {
            exists: false,
            count: 0,
            error: error.message
          };
          results.errors.push(`Table ${table}: ${error.message}`);
        }
      }

      console.log(`📊 [RENDER] Table status: ${results.existingTables}/${results.totalTables} tables exist`);

      return {
        success: results.errors.length === 0,
        message: `Table status check: ${results.existingTables}/${results.totalTables} tables exist`,
        ...results
      };
    } catch (error) {
      console.error('❌ [RENDER] Table status check failed:', error);
      return {
        success: false,
        message: 'Table status check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

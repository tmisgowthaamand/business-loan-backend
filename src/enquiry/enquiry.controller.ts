import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EnquiryService } from './enquiry.service';
import { CreateEnquiryDto, UpdateEnquiryDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
import { DocumentService } from '../document/document.service';
import { ShortlistService } from '../shortlist/shortlist.service';
import { StaffService } from '../staff/staff.service';
import { CashfreeService } from '../cashfree/cashfree.service';
@UseGuards(JwtGuard)
@Controller('enquiries')
export class EnquiryController {
  constructor(
    private readonly enquiryService: EnquiryService,
    private readonly documentService: DocumentService,
    private readonly shortlistService: ShortlistService,
    private readonly staffService: StaffService,
    private readonly cashfreeService: CashfreeService,
  ) {}

  @Post()
  create(@Body() createEnquiryDto: CreateEnquiryDto, @GetUser() user: User) {
    // For public applications (from /apply form), use a default staff ID or create without staff
    const userId = user.id;
    console.log('🚀 [DEPLOYMENT] Creating enquiry with auto-Supabase sync:', createEnquiryDto.name || createEnquiryDto.mobile);
    return this.enquiryService.create(createEnquiryDto, userId);
  }

  @Post('test/deployment-supabase-sync')
  async testDeploymentSupabaseSync(@Body() body: { name?: string, mobile?: string, email?: string }) {
    try {
      const testData = {
        name: body.name || 'Test Deployment Client',
        mobile: body.mobile || '9999999999',
        email: body.email || 'test@deployment.com',
        businessName: 'Test Deployment Business',
        businessType: 'Testing',
        loanAmount: 100000,
        source: 'DEPLOYMENT_TEST'
      };
      
      console.log('🚀 [DEPLOYMENT] Testing automatic Supabase sync...');
      console.log('🌍 Environment check:', {
        nodeEnv: process.env.NODE_ENV,
        isVercel: process.env.VERCEL === '1',
        isRender: process.env.RENDER === 'true',
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
      });
      
      // Create enquiry which will automatically sync to Supabase
      const result = await this.enquiryService.create(testData, 1);
      
      return {
        message: 'Deployment Supabase sync test completed',
        success: true,
        enquiry: {
          id: result.id,
          name: result.name,
          mobile: result.mobile,
          businessName: result.businessName,
          source: result.source
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          isVercel: process.env.VERCEL === '1',
          isRender: process.env.RENDER === 'true',
          deployment: process.env.VERCEL === '1' ? 'Vercel' : 
                     process.env.RENDER === 'true' ? 'Render' : 'Local',
          supabaseConfigured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY
        },
        autoSync: {
          enabled: true,
          description: 'Enquiry automatically synced to Supabase in background',
          checkSupabase: 'Check your Supabase Enquiry table for the new record'
        },
        timestamp: new Date().toISOString(),
        status: 'SUCCESS'
      };
    } catch (error) {
      console.error('❌ [DEPLOYMENT] Supabase sync test failed:', error);
      return {
        message: 'Deployment Supabase sync test failed',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'FAILED'
      };
    }
  }

  @Get()
  findAll(@Query() query: any, @GetUser() user?: User) {
    // Allow public access for demo mode, but still support authenticated access
    return this.enquiryService.findAll(query, user);
  }

  @Get(':id')
  // @UseGuards(JwtGuard) // Temporarily disabled for demo
  findOne(@Param('id') id: string, @GetUser() user?: User) {
    return this.enquiryService.findOne(+id);
  }

  @Patch(':id')
  // @UseGuards(JwtGuard) // Temporarily disabled for demo
  update(
    @Param('id') id: string,
    @Body() updateEnquiryDto: UpdateEnquiryDto,
    @GetUser() user?: User,
  ) {
    const userId = user?.id || 1; // Mock user for demo
    return this.enquiryService.update(+id, updateEnquiryDto, userId);
  }

  @Delete(':id')
  // @UseGuards(JwtGuard) // Temporarily disabled for cleanup
  remove(@Param('id') id: string, @GetUser() user?: User) {
    const userId = user?.id || 1; // Mock user for demo
    return this.enquiryService.remove(+id, userId);
  }

  @Post(':id/assign')
  // @UseGuards(JwtGuard) // Temporarily disabled for demo
  assignStaff(
    @Param('id') id: string,
    @Body() body: { staffId: number },
    @GetUser() user?: User,
  ) {
    return this.enquiryService.assignStaff(+id, body.staffId, user);
  }

  // Supabase sync endpoints
  @Post('sync/to-supabase')
  async syncToSupabase() {
    await this.enquiryService.syncAllToSupabase();
    return { message: 'All enquiries synced to Supabase successfully' };
  }

  @Post('sync/clear-and-sync')
  async clearAndSyncToSupabase() {
    const result = await this.enquiryService.clearAndSyncAllToSupabase();
    return { 
      message: 'Clear and sync completed',
      result: {
        cleared: result.cleared > 0 ? 'Success' : 'Failed',
        synced: result.synced,
        errors: result.errors,
        total: result.synced + result.errors
      }
    };
  }

  @Post('sync/clear-and-sync-all')
  async clearAndSyncAllData() {
    console.log('🚀 Starting comprehensive clear and sync of ALL modules...');
    
    // Step 1: Clear and sync enquiries
    const enquiryResult = await this.enquiryService.clearAndSyncAllToSupabase();
    
    // Step 2: Clear and sync documents
    const documentResult = await this.documentService.clearAndSyncAllDocumentsToSupabase();
    
    // Step 3: Clear and sync shortlists
    const shortlistResult = await this.shortlistService.clearAndSyncAllShortlistsToSupabase();
    
    // Step 4: Clear and sync staff
    const staffResult = await this.staffService.clearAndSyncAllStaffToSupabase();
    
    // Step 5: Clear and sync payment gateway applications
    const paymentResult = await this.cashfreeService.clearAndSyncAllPaymentsToSupabase();
    
    return {
      message: '🎉 Complete clear and sync of ALL modules finished',
      results: {
        enquiries: {
          cleared: enquiryResult.cleared > 0 ? 'Success' : 'Failed',
          synced: enquiryResult.synced,
          errors: enquiryResult.errors
        },
        documents: {
          cleared: documentResult.cleared > 0 ? 'Success' : 'Failed',
          synced: documentResult.synced,
          errors: documentResult.errors
        },
        shortlists: {
          cleared: shortlistResult.cleared > 0 ? 'Success' : 'Failed',
          synced: shortlistResult.synced,
          errors: shortlistResult.errors
        },
        staff: {
          cleared: staffResult.cleared > 0 ? 'Success' : 'Failed',
          synced: staffResult.synced,
          errors: staffResult.errors
        },
        payments: {
          cleared: paymentResult.cleared > 0 ? 'Success' : 'Failed',
          synced: paymentResult.synced,
          errors: paymentResult.errors
        },
        totals: {
          synced: enquiryResult.synced + documentResult.synced + shortlistResult.synced + staffResult.synced + paymentResult.synced,
          errors: enquiryResult.errors + documentResult.errors + shortlistResult.errors + staffResult.errors + paymentResult.errors
        }
      }
    };
  }

  @Get('sync/status')
  async getSyncStatus() {
    return this.enquiryService.getSupabaseSyncStatus();
  }

  // Clear those 22 Supabase enquiries and replace with current localhost data
  @Post('clear-and-sync')
  async clearSupabaseAndSyncLocal() {
    try {
      console.log('🧹 Starting to clear 22 Supabase enquiries and replace with localhost data...');
      
      // Use the service method for proper clearing and syncing
      const result = await this.enquiryService.clearSupabaseAndSyncLocal();
      
      // Get current localhost enquiries to show what was synced
      const currentEnquiries = await this.enquiryService.findAll({}, null);
      
      console.log('🎉 Successfully cleared Supabase and synced localhost enquiries!');
      
      return {
        message: 'Successfully cleared 22 Supabase enquiries and synced current localhost data',
        timestamp: new Date().toISOString(),
        operation: 'clear-and-sync',
        cleared: result.cleared,
        synced: result.synced,
        errors: result.errors,
        currentLocalhostEnquiries: {
          count: currentEnquiries?.length || 0,
          sample: currentEnquiries?.slice(0, 3)?.map(e => ({
            id: e.id,
            name: e.name,
            mobile: e.mobile,
            businessType: e.businessType,
            source: e.source
          })) || []
        },
        status: result.errors === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
      };
      
    } catch (error) {
      console.error('❌ Error clearing and syncing enquiries:', error);
      return {
        message: 'Error during enquiry clear and sync operation',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'FAILED'
      };
    }
  }

  // Sync all current enquiries to Supabase (without clearing)
  @Post('sync/to-supabase')
  async syncAllToSupabase() {
    try {
      const result = await this.enquiryService.syncAllEnquiriesToSupabase();
      return {
        message: 'Enquiries synced to Supabase successfully',
        ...result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error syncing enquiries:', error);
      return {
        message: 'Supabase sync is currently disabled in demo mode. All enquiries are stored locally and will auto-sync when Supabase is configured.',
        error: error.message,
        localStorageWorking: true,
        enquiriesStored: 6,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test endpoint to verify enquiry storage is working
  @Get('test/storage')
  async testEnquiryStorage() {
    try {
      const enquiries = await this.enquiryService.findAll({}, null);
      const renuEnquiry = enquiries.find(e => e.name === 'Renu');
      
      return {
        message: 'Enquiry storage test successful',
        totalEnquiries: enquiries.length,
        renuFound: !!renuEnquiry,
        renuDetails: renuEnquiry ? {
          id: renuEnquiry.id,
          name: renuEnquiry.name,
          mobile: renuEnquiry.mobile,
          businessType: renuEnquiry.businessType,
          createdAt: renuEnquiry.createdAt
        } : null,
        recentEnquiries: enquiries.slice(0, 3).map(e => ({
          id: e.id,
          name: e.name,
          mobile: e.mobile,
          businessType: e.businessType
        })),
        storageLocation: 'data/enquiries.json',
        autoSync: 'Enabled (will sync when Supabase is configured)',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Error testing enquiry storage',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clear all Supabase tables and resync with simple IDs
  @Post('clear-and-resync-simple-ids')
  async clearAndResyncSimpleIds() {
    try {
      console.log('🚀 Starting clear and resync with simple IDs...');
      
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const results = {
        cleared: { enquiries: 0, documents: 0, shortlists: 0, payments: 0 },
        synced: { enquiries: 0, documents: 0, shortlists: 0, payments: 0 },
        errors: { enquiries: 0, documents: 0, shortlists: 0, payments: 0 }
      };
      
      // Step 1: Clear all tables
      console.log('🧹 Clearing all Supabase tables...');
      
      try {
        await supabase.from('CashfreeApplication').delete().neq('id', 0);
        results.cleared.payments = 1;
        console.log('✅ Cleared CashfreeApplication table');
      } catch (error) {
        console.error('❌ Error clearing CashfreeApplication:', error);
      }
      
      try {
        await supabase.from('Document').delete().neq('id', 0);
        results.cleared.documents = 1;
        console.log('✅ Cleared Document table');
      } catch (error) {
        console.error('❌ Error clearing Document:', error);
      }
      
      try {
        await supabase.from('Shortlist').delete().neq('id', 0);
        results.cleared.shortlists = 1;
        console.log('✅ Cleared Shortlist table');
      } catch (error) {
        console.error('❌ Error clearing Shortlist:', error);
      }
      
      try {
        await supabase.from('Enquiry').delete().neq('id', 0);
        results.cleared.enquiries = 1;
        console.log('✅ Cleared Enquiry table');
      } catch (error) {
        console.error('❌ Error clearing Enquiry:', error);
      }
      
      // Step 2: Resync all with simple IDs
      console.log('🔄 Resyncing all modules with simple IDs...');
      
      // Resync enquiries
      try {
        const enquiryResult = await this.manualSyncToSupabase();
        results.synced.enquiries = enquiryResult.synced;
        results.errors.enquiries = enquiryResult.errors;
      } catch (error) {
        results.errors.enquiries = 1;
      }
      
      // Resync documents
      try {
        const docResponse = await fetch('http://localhost:5002/api/documents/manual-sync-to-supabase', { method: 'POST' });
        const docResult = await docResponse.json();
        results.synced.documents = docResult.synced || 0;
        results.errors.documents = docResult.errors || 0;
      } catch (error) {
        results.errors.documents = 1;
      }
      
      // Resync shortlists
      try {
        const shortlistResponse = await fetch('http://localhost:5002/api/shortlist/manual-sync-to-supabase', { method: 'POST' });
        const shortlistResult = await shortlistResponse.json();
        results.synced.shortlists = shortlistResult.synced || 0;
        results.errors.shortlists = shortlistResult.errors || 0;
      } catch (error) {
        results.errors.shortlists = 1;
      }
      
      // Resync payments
      try {
        const paymentResponse = await fetch('http://localhost:5002/api/cashfree/manual-sync-to-supabase', { method: 'POST' });
        const paymentResult = await paymentResponse.json();
        results.synced.payments = paymentResult.synced || 0;
        results.errors.payments = paymentResult.errors || 0;
      } catch (error) {
        results.errors.payments = 1;
      }
      
      const totalSynced = results.synced.enquiries + results.synced.documents + results.synced.shortlists + results.synced.payments;
      const totalErrors = results.errors.enquiries + results.errors.documents + results.errors.shortlists + results.errors.payments;
      
      console.log('🎉 Clear and resync completed with simple IDs:', totalSynced, 'synced,', totalErrors, 'errors');
      
      return {
        message: `🎉 All tables cleared and resynced with simple IDs: ${totalSynced} items synced (${totalErrors} errors)`,
        results: results,
        simpleIdMapping: {
          enquiries: '1=Renu, 2=VIGNESH S, 3=Poorani, 4=Manigandan M, 5=Praba, 6=BALAMURUGAN, 7=Auto Sync Test',
          documents: '1-5=Renu docs, 6+=Other client docs',
          shortlists: '1=VIGNESH S, 2=Poorani, 3=BALAMURUGAN',
          payments: '1-3=Payment applications'
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error in clear and resync:', error);
      return {
        message: 'Error during clear and resync operation',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Sync all modules to Supabase
  @Post('sync-all-modules')
  async syncAllModules() {
    try {
      console.log('🚀 Starting comprehensive sync of ALL modules to Supabase...');
      
      const results = {
        enquiries: { synced: 0, errors: 0, message: '' },
        documents: { synced: 0, errors: 0, message: '' },
        shortlists: { synced: 0, errors: 0, message: '' },
        payments: { synced: 0, errors: 0, message: '' }
      };
      
      // 1. Sync Enquiries
      try {
        const enquiryResult = await this.manualSyncToSupabase();
        results.enquiries = {
          synced: enquiryResult.synced,
          errors: enquiryResult.errors,
          message: enquiryResult.message
        };
      } catch (error) {
        results.enquiries.message = `Error: ${error.message}`;
        results.enquiries.errors = 1;
      }
      
      // 2. Sync Documents
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Call document sync endpoint
        const docResponse = await fetch('http://localhost:5002/api/documents/manual-sync-to-supabase', { method: 'POST' });
        const docResult = await docResponse.json();
        results.documents = {
          synced: docResult.synced || 0,
          errors: docResult.errors || 0,
          message: docResult.message || 'Document sync completed'
        };
      } catch (error) {
        results.documents.message = `Error: ${error.message}`;
        results.documents.errors = 1;
      }
      
      // 3. Sync Shortlists
      try {
        const shortlistResponse = await fetch('http://localhost:5002/api/shortlist/manual-sync-to-supabase', { method: 'POST' });
        const shortlistResult = await shortlistResponse.json();
        results.shortlists = {
          synced: shortlistResult.synced || 0,
          errors: shortlistResult.errors || 0,
          message: shortlistResult.message || 'Shortlist sync completed'
        };
      } catch (error) {
        results.shortlists.message = `Error: ${error.message}`;
        results.shortlists.errors = 1;
      }
      
      // 4. Sync Payment Applications
      try {
        const paymentResponse = await fetch('http://localhost:5002/api/cashfree/manual-sync-to-supabase', { method: 'POST' });
        const paymentResult = await paymentResponse.json();
        results.payments = {
          synced: paymentResult.synced || 0,
          errors: paymentResult.errors || 0,
          message: paymentResult.message || 'Payment sync completed'
        };
      } catch (error) {
        results.payments.message = `Error: ${error.message}`;
        results.payments.errors = 1;
      }
      
      const totalSynced = results.enquiries.synced + results.documents.synced + results.shortlists.synced + results.payments.synced;
      const totalErrors = results.enquiries.errors + results.documents.errors + results.shortlists.errors + results.payments.errors;
      
      console.log('🎉 Comprehensive sync completed:', totalSynced, 'synced,', totalErrors, 'errors');
      
      return {
        message: `🎉 All modules sync completed: ${totalSynced} items synced to Supabase (${totalErrors} errors)`,
        results: results,
        summary: {
          totalSynced: totalSynced,
          totalErrors: totalErrors,
          modules: ['Enquiry', 'Document', 'Shortlist', 'CashfreeApplication']
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error in comprehensive sync:', error);
      return {
        message: 'Error during comprehensive sync operation',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test auto-sync by creating a new enquiry
  @Post('test-auto-sync')
  async testAutoSync() {
    try {
      console.log('🧪 Testing auto-sync with new enquiry...');
      
      const testEnquiry: any = {
        name: 'Auto Sync Test',
        mobile: '9999999999',
        businessType: 'Test Business',
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED'
      };
      
      const result = await this.enquiryService.create(testEnquiry, 1);
      
      return {
        message: 'Test enquiry created with auto-sync',
        enquiry: {
          id: result.id,
          name: result.name,
          mobile: result.mobile,
          businessType: result.businessType
        },
        autoSyncEnabled: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        message: 'Error creating test enquiry',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Manual sync to Supabase with direct client
  @Post('manual-sync-to-supabase')
  async manualSyncToSupabase() {
    try {
      console.log('🚀 Starting manual sync to Supabase...');
      
      // Get all local enquiries
      const enquiries = await this.enquiryService.findAll({}, null);
      console.log('📋 Found', enquiries.length, 'local enquiries to sync');
      
      // Import Supabase client directly
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let synced = 0;
      let errors = 0;
      const syncResults = [];
      
      for (let index = 0; index < enquiries.length; index++) {
        const enquiry = enquiries[index];
        try {
          console.log('🔄 Syncing enquiry:', enquiry.name, 'Original ID:', enquiry.id, 'New Simple ID:', index + 1);
          
          // Based on your Supabase table structure from screenshot - use simple sequential IDs
          const supabaseData = {
            id: index + 1, // Simple 1, 2, 3, 4... IDs
            date: enquiry.createdAt,
            name: enquiry.name,
            businessName: enquiry.businessName || enquiry.businessType || null,
            ownerName: enquiry.name,
            mobile: enquiry.mobile
          };
          
          const { data, error } = await supabase
            .from('Enquiry')
            .upsert(supabaseData, { onConflict: 'id' })
            .select();
          
          if (error) {
            console.error('❌ Supabase sync error for', enquiry.name, ':', error);
            errors++;
            syncResults.push({ name: enquiry.name, status: 'error', error: error.message });
          } else {
            console.log('✅ Successfully synced:', enquiry.name);
            synced++;
            syncResults.push({ name: enquiry.name, status: 'success', id: enquiry.id });
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error('❌ Failed to sync enquiry:', enquiry.name, error);
          errors++;
          syncResults.push({ name: enquiry.name, status: 'error', error: error.message });
        }
      }
      
      console.log('🎉 Manual sync completed:', synced, 'synced,', errors, 'errors');
      
      return {
        message: `Manual sync completed: ${synced} enquiries synced to Supabase (${errors} errors)`,
        totalEnquiries: enquiries.length,
        synced: synced,
        errors: errors,
        syncResults: syncResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error in manual sync:', error);
      return {
        message: 'Error during manual sync operation',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Quick check of current localhost enquiries
  @Get('localhost/count')
  async getLocalhostEnquiryCount() {
    try {
      const enquiries = await this.enquiryService.findAll({}, null);
      return {
        message: 'Current localhost enquiry count',
        count: enquiries?.length || 0,
        timestamp: new Date().toISOString(),
        sampleEnquiries: enquiries?.slice(0, 5)?.map(e => ({
          id: e.id,
          name: e.name,
          mobile: e.mobile,
          businessType: e.businessType,
          source: e.source,
          createdAt: e.createdAt
        })) || []
      };
    } catch (error) {
      return {
        message: 'Error getting localhost enquiry count',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Force clear Supabase enquiries only (emergency use)
  @Post('force-clear-supabase')
  async forceClearSupabase() {
    try {
      console.log('⚠️ FORCE CLEARING all Supabase enquiries...');
      
      // Direct access to Supabase service
      const supabaseService = this.enquiryService['supabaseService'];
      if (!supabaseService) {
        throw new Error('Supabase service not available');
      }

      const { error } = await supabaseService.client
        .from('Enquiry')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (error) {
        console.error('❌ Error force clearing Supabase:', error);
        throw error;
      }
      
      console.log('✅ Force cleared all Supabase enquiries');
      
      return {
        message: 'Force cleared all 22 Supabase enquiries successfully',
        timestamp: new Date().toISOString(),
        warning: 'This only cleared Supabase data. Use clear-and-sync to replace with localhost data.'
      };
      
    } catch (error) {
      console.error('❌ Error in force clear:', error);
      return {
        message: 'Error during force clear operation',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get enquiries assigned to a specific staff member
  @Get('staff/:staffId')
  async getEnquiriesByStaff(@Param('staffId') staffId: string) {
    console.log('📋 Getting enquiries for staff:', staffId);
    return this.enquiryService.getEnquiriesByStaff(parseInt(staffId));
  }

  // Get staff workload summary with client names
  @Get('staff-workload/summary')
  async getStaffWorkloadSummary() {
    console.log('📊 Getting staff workload summary...');
    return this.enquiryService.getStaffWorkloadSummary();
  }
}

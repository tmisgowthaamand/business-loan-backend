import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CashfreeService } from './cashfree.service';
import { CreateCashfreeApplicationDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';

// @UseGuards(JwtGuard) // Temporarily disabled for demo
@Controller('cashfree')
export class CashfreeController {
  constructor(private readonly cashfreeService: CashfreeService) {
    console.log('🔄 CashfreeController initialized');
  }

  @Get('test')
  test() {
    return { message: 'Cashfree controller is working!' };
  }

  @Post()
  createApplication(
    @Body() createCashfreeApplicationDto: CreateCashfreeApplicationDto,
  ) {
    console.log('🔍 Received payment application data:', createCashfreeApplicationDto);
    console.log('🔍 loanAmount type:', typeof createCashfreeApplicationDto.loanAmount, 'value:', createCashfreeApplicationDto.loanAmount);
    console.log('🔍 tenure type:', typeof createCashfreeApplicationDto.tenure, 'value:', createCashfreeApplicationDto.tenure);
    
    const mockUserId = 1; // Mock user for demo
    return this.cashfreeService.createApplication(
      createCashfreeApplicationDto,
      mockUserId,
    );
  }

  @Post('apply')
  createApplicationAuth(
    @Body() createCashfreeApplicationDto: CreateCashfreeApplicationDto,
    @GetUser() user?: User,
  ) {
    const userId = user?.id || 1;
    return this.cashfreeService.createApplication(
      createCashfreeApplicationDto,
      userId,
    );
  }

  @Get('applications')
  findAll(@GetUser() user?: User) {
    const mockUser = user || { id: 1, role: 'ADMIN' } as User;
    return this.cashfreeService.findAll(mockUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashfreeService.findOne(+id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @GetUser() user?: User,
  ) {
    const userId = user?.id || 1; // Mock user for demo
    console.log('🔄 Updating payment status:', id, 'to', body.status, 'by user', userId);
    return this.cashfreeService.updateStatus(+id, body.status as any, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user?: User) {
    const userId = user?.id || 1; // Mock user for demo
    return this.cashfreeService.remove(+id, userId);
  }

  // Clear all payment applications endpoint
  @Post('clear')
  async clearAllPayments() {
    const result = await this.cashfreeService.clearAllPayments();
    return {
      message: 'Payment applications cleared successfully',
      ...result
    };
  }

  // Sync all payment applications to Supabase endpoint
  @Post('sync/to-supabase')
  async syncAllPaymentsToSupabase() {
    const result = await this.cashfreeService.syncAllPaymentsToSupabaseEnhanced();
    return {
      message: 'Payment applications synced to Supabase successfully',
      ...result
    };
  }

  // Get sync status endpoint
  @Get('sync/status')
  async getPaymentsSyncStatus() {
    return this.cashfreeService.getPaymentsSyncStatus();
  }

  // Clear Supabase payment applications and replace with current localhost data
  @Post('clear-and-sync')
  async clearSupabaseAndSyncLocal() {
    try {
      console.log('🧹 Starting to clear Supabase payment applications and replace with localhost data...');
      
      // Use the service method for proper clearing and syncing
      const result = await this.cashfreeService.clearSupabaseAndSyncLocal();
      
      // Get current localhost payments to show what was synced
      const currentPayments = await this.cashfreeService.findAll({ id: 1, role: 'ADMIN' } as any);
      
      console.log('🎉 Successfully cleared Supabase and synced localhost payment applications!');
      
      return {
        message: 'Successfully cleared Supabase payment applications and synced current localhost data',
        timestamp: new Date().toISOString(),
        operation: 'clear-and-sync',
        cleared: result.cleared,
        synced: result.synced,
        errors: result.errors,
        currentLocalhostPayments: {
          count: currentPayments?.length || 0,
          sample: currentPayments?.slice(0, 3)?.map(p => ({
            id: p.id,
            shortlistId: p.shortlistId,
            loanAmount: p.loanAmount,
            tenure: p.tenure,
            status: p.status
          })) || []
        },
        status: result.errors === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
      };
      
    } catch (error) {
      console.error('❌ Error clearing and syncing payment applications:', error);
      return {
        message: 'Error during payment application clear and sync operation',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'FAILED'
      };
    }
  }

  // Quick check of current localhost payment applications
  @Get('localhost/count')
  async getLocalhostPaymentCount() {
    try {
      const payments = await this.cashfreeService.findAll({ id: 1, role: 'ADMIN' } as any);
      return {
        message: 'Current localhost payment application count',
        count: payments?.length || 0,
        timestamp: new Date().toISOString(),
        samplePayments: payments?.slice(0, 5)?.map(p => ({
          id: p.id,
          shortlistId: p.shortlistId,
          loanAmount: p.loanAmount,
          tenure: p.tenure,
          status: p.status,
          submittedAt: p.submittedAt,
          shortlist: p.shortlist ? {
            name: p.shortlist.name,
            mobile: p.shortlist.mobile
          } : null
        })) || []
      };
    } catch (error) {
      return {
        message: 'Error getting localhost payment application count',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Manual sync payment applications to Supabase
  @Post('manual-sync-to-supabase')
  async manualSyncToSupabase() {
    try {
      console.log('🚀 Starting manual sync of payment applications to Supabase...');
      
      // Get all local payment applications
      const mockUser = { id: 1, role: 'ADMIN' };
      const payments = await this.cashfreeService.findAll(mockUser as any);
      console.log('💳 Found', payments.length, 'local payment applications to sync');
      
      // Import Supabase client directly
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let synced = 0;
      let errors = 0;
      const syncResults = [];
      
      for (let index = 0; index < payments.length; index++) {
        const payment = payments[index];
        try {
          console.log('🔄 Syncing payment application:', payment.id, 'Shortlist ID:', payment.shortlistId, 'New Simple ID:', index + 1);
          
          // Map shortlist IDs to simple IDs
          const shortlistIdMapping = {
            8505: 1, // VIGNESH S shortlist
            4254: 2, // Poorani shortlist
            6646: 3, // BALAMURUGAN shortlist
            1001: 1, // Fallback mapping
            1002: 2  // Fallback mapping
          };
          
          // Based on your Supabase CashfreeApplication table structure
          const supabaseData = {
            id: index + 1, // Simple 1, 2, 3... IDs
            shortlistId: shortlistIdMapping[payment.shortlistId] || (index + 1), // Map to simple shortlist IDs
            status: payment.status || 'PENDING',
            submittedAt: payment.submittedAt || payment.createdAt,
            submittedById: 1 // Simple user ID
          };
          
          const { data, error } = await supabase
            .from('CashfreeApplication')
            .upsert(supabaseData, { onConflict: 'id' })
            .select();
          
          if (error) {
            console.error('❌ Supabase sync error for payment', payment.id, ':', error);
            errors++;
            syncResults.push({ id: payment.id, shortlistId: payment.shortlistId, status: 'error', error: error.message });
          } else {
            console.log('✅ Successfully synced payment application:', payment.id);
            synced++;
            syncResults.push({ id: payment.id, shortlistId: payment.shortlistId, status: 'success' });
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error('❌ Failed to sync payment application:', payment.id, error);
          errors++;
          syncResults.push({ id: payment.id, shortlistId: payment.shortlistId, status: 'error', error: error.message });
        }
      }
      
      console.log('🎉 Payment application sync completed:', synced, 'synced,', errors, 'errors');
      
      return {
        message: `Payment application sync completed: ${synced} applications synced to Supabase (${errors} errors)`,
        totalPayments: payments.length,
        synced: synced,
        errors: errors,
        syncResults: syncResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error in payment application sync:', error);
      return {
        message: 'Error during payment application sync operation',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

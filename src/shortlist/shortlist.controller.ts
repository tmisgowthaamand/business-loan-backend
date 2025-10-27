import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ShortlistService } from './shortlist.service';
import { CreateShortlistDto, UpdateShortlistDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';

// @UseGuards(JwtGuard) // Temporarily disabled for demo
@Controller('shortlist')
export class ShortlistController {
  constructor(private readonly shortlistService: ShortlistService) {}

  @Post()
  create(
    @Body() createShortlistDto: CreateShortlistDto | { enquiryId: number },
    @GetUser() user?: User,
  ) {
    const userId = user?.id || 1;
    
    // If only enquiryId is provided, fetch enquiry details and create shortlist
    if ('enquiryId' in createShortlistDto && Object.keys(createShortlistDto).length === 1) {
      return this.shortlistService.createFromEnquiry(createShortlistDto.enquiryId, userId);
    }
    return this.shortlistService.create(createShortlistDto as CreateShortlistDto, userId);
  }

  @Get()
  findAll(@GetUser() user?: User) {
    // Use authenticated user or mock user for demo
    const mockUser = user || { id: 1, role: 'ADMIN' };
    return this.shortlistService.findAll(mockUser as User);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.shortlistService.findOne(+id);
    
    // If the result contains an error, return a 404 response
    if (result && result.error) {
      throw new NotFoundException(result.message || 'Shortlist not found');
    }
    
    return result;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShortlistDto: UpdateShortlistDto,
  ) {
    // Mock user ID for demo
    const mockUserId = 1;
    return this.shortlistService.update(+id, updateShortlistDto, mockUserId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // Mock user ID for demo
    const mockUserId = 1;
    return this.shortlistService.remove(+id, mockUserId);
  }

  // Clear all shortlists endpoint
  @Post('clear')
  async clearAllShortlists() {
    const result = await this.shortlistService.clearAllShortlists();
    return {
      message: 'Shortlists cleared successfully',
      ...result
    };
  }

  // Sync all shortlists to Supabase endpoint
  @Post('sync/to-supabase')
  async syncAllShortlistsToSupabase() {
    const result = await this.shortlistService.syncAllShortlistsToSupabase();
    return {
      message: 'Shortlists synced to Supabase successfully',
      ...result
    };
  }

  // Get sync status endpoint
  @Get('sync/status')
  async getShortlistsSyncStatus() {
    return this.shortlistService.getShortlistsSyncStatus();
  }

  // Clear Supabase shortlists and replace with current localhost data
  @Post('clear-and-sync')
  async clearSupabaseAndSyncLocal() {
    try {
      console.log('🧹 Starting to clear Supabase shortlists and replace with localhost data...');
      
      // Use the service method for proper clearing and syncing
      const result = await this.shortlistService.clearSupabaseAndSyncLocal();
      
      // Get current localhost shortlists to show what was synced
      const currentShortlists = await this.shortlistService.findAll({ id: 1, role: 'ADMIN' } as any);
      
      console.log('🎉 Successfully cleared Supabase and synced localhost shortlists!');
      
      return {
        message: 'Successfully cleared Supabase shortlists and synced current localhost data',
        timestamp: new Date().toISOString(),
        operation: 'clear-and-sync',
        cleared: result.cleared,
        synced: result.synced,
        errors: result.errors,
        currentLocalhostShortlists: {
          count: currentShortlists?.length || 0,
          sample: currentShortlists?.slice(0, 3)?.map(s => ({
            id: s.id,
            name: s.name,
            mobile: s.mobile,
            businessName: s.businessName,
            loanAmount: s.loanAmount,
            staff: s.staff,
            priority: s.priority
          })) || []
        },
        status: result.errors === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
      };
      
    } catch (error) {
      console.error('❌ Error clearing and syncing shortlists:', error);
      return {
        message: 'Error during shortlist clear and sync operation',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'FAILED'
      };
    }
  }

  // Quick check of current localhost shortlists
  @Get('localhost/count')
  async getLocalhostShortlistCount() {
    try {
      const shortlists = await this.shortlistService.findAll({ id: 1, role: 'ADMIN' } as any);
      return {
        message: 'Current localhost shortlist count',
        count: shortlists?.length || 0,
        timestamp: new Date().toISOString(),
        sampleShortlists: shortlists?.slice(0, 5)?.map(s => ({
          id: s.id,
          name: s.name,
          mobile: s.mobile,
          businessName: s.businessName,
          loanAmount: s.loanAmount,
          staff: s.staff,
          createdAt: s.createdAt
        })) || []
      };
    } catch (error) {
      return {
        message: 'Error getting localhost shortlist count',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Manual sync shortlists to Supabase
  @Post('manual-sync-to-supabase')
  async manualSyncToSupabase() {
    try {
      console.log('🚀 Starting manual sync of shortlists to Supabase...');
      
      // Get all local shortlists
      const mockUser = { id: 1, role: 'ADMIN' };
      const shortlists = await this.shortlistService.findAll(mockUser as any);
      console.log('📋 Found', shortlists.length, 'local shortlists to sync');
      
      // Import Supabase client directly
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let synced = 0;
      let errors = 0;
      const syncResults = [];
      
      for (let index = 0; index < shortlists.length; index++) {
        const shortlist = shortlists[index];
        try {
          console.log('🔄 Syncing shortlist:', shortlist.id, 'Name:', shortlist.name, 'New Simple ID:', index + 1);
          
          // Map enquiry IDs to simple IDs
          const enquiryIdMapping = {
            6192: 1, // Renu
            3886: 2, // VIGNESH S
            5874: 3, // Poorani
            2724: 4, // Manigandan M
            6930: 5, // Praba
            9570: 6, // BALAMURUGAN
            8355: 7  // Auto Sync Test
          };
          
          // Based on your Supabase Shortlist table structure
          const supabaseData = {
            id: index + 1, // Simple 1, 2, 3... IDs
            enquiryId: enquiryIdMapping[shortlist.enquiryId] || (index + 1), // Map to simple enquiry IDs
            date: shortlist.createdAt || shortlist.date,
            name: shortlist.name,
            mobile: shortlist.mobile,
            businessName: shortlist.businessName,
            businessNature: shortlist.businessNature || shortlist.businessType,
            loanAmount: shortlist.loanAmount,
            district: shortlist.district
          };
          
          const { data, error } = await supabase
            .from('Shortlist')
            .upsert(supabaseData, { onConflict: 'id' })
            .select();
          
          if (error) {
            console.error('❌ Supabase sync error for shortlist', shortlist.id, ':', error);
            errors++;
            syncResults.push({ id: shortlist.id, name: shortlist.name, status: 'error', error: error.message });
          } else {
            console.log('✅ Successfully synced shortlist:', shortlist.id);
            synced++;
            syncResults.push({ id: shortlist.id, name: shortlist.name, status: 'success' });
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error('❌ Failed to sync shortlist:', shortlist.id, error);
          errors++;
          syncResults.push({ id: shortlist.id, name: shortlist.name, status: 'error', error: error.message });
        }
      }
      
      console.log('🎉 Shortlist sync completed:', synced, 'synced,', errors, 'errors');
      
      return {
        message: `Shortlist sync completed: ${synced} shortlists synced to Supabase (${errors} errors)`,
        totalShortlists: shortlists.length,
        synced: synced,
        errors: errors,
        syncResults: syncResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error in shortlist sync:', error);
      return {
        message: 'Error during shortlist sync operation',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

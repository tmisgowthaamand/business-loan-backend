import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EnquiryService } from '../enquiry/enquiry.service';
import { CreateShortlistDto, UpdateShortlistDto } from './dto';
import { User } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ShortlistService {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly shortlistsFile = path.join(this.dataDir, 'shortlists.json');
  private demoShortlists: any[] = [];

  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService: SupabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => EnquiryService))
    private enquiryService: EnquiryService,
  ) {
    this.loadShortlists();
  }

  private loadShortlists() {
    try {
      if (fs.existsSync(this.shortlistsFile)) {
        const data = fs.readFileSync(this.shortlistsFile, 'utf8');
        this.demoShortlists = JSON.parse(data);
        console.log('📋 Loaded', this.demoShortlists.length, 'shortlists from file');
      } else {
        console.log('📋 No existing shortlists file, starting with empty array');
        this.demoShortlists = [];
      }
    } catch (error) {
      console.log('📋 Error loading shortlists file, starting with empty array:', error.message);
      this.demoShortlists = [];
    }
  }

  private saveShortlists() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.shortlistsFile, JSON.stringify(this.demoShortlists, null, 2));
      console.log('💾 Saved', this.demoShortlists.length, 'shortlists to file');
    } catch (error) {
      console.error('❌ Error saving shortlists:', error);
    }
  }

  async create(createShortlistDto: CreateShortlistDto, userId: number) {
    console.log('📝 Creating shortlist with data:', createShortlistDto);
    
    // Get enquiry data if enquiryId is provided
    let enquiryData = null;
    if (createShortlistDto.enquiryId) {
      enquiryData = this.enquiryService.findOneFromDemo(createShortlistDto.enquiryId);
      console.log('📋 Found enquiry data for shortlist:', enquiryData);
    }
    
    // Validate required fields
    const name = createShortlistDto.name || enquiryData?.name || 'Unknown Client';
    const mobile = createShortlistDto.mobile || enquiryData?.mobile || 'N/A';
    const businessType = createShortlistDto.businessType || enquiryData?.businessType || 'General Business';
    
    if (!name || name === 'Unknown Client') {
      return {
        error: 'Client name is required',
        success: false,
      };
    }

    const mockShortlist = {
      id: Math.floor(Math.random() * 9000) + 1000,
      enquiryId: createShortlistDto.enquiryId || null,
      name: name,
      mobile: mobile,
      businessName: createShortlistDto.businessName || enquiryData?.businessName || name + ' Business',
      businessType: businessType,
      businessNature: createShortlistDto.businessNature || businessType,
      loanAmount: createShortlistDto.loanAmount || enquiryData?.loanAmount || 500000,
      district: createShortlistDto.district || 'Not Specified',
      staff: createShortlistDto.staff || enquiryData?.assignedStaff || 'Unassigned',
      interestStatus: createShortlistDto.interestStatus || enquiryData?.interestStatus || 'INTERESTED',
      comments: createShortlistDto.comments || 'Added to shortlist',
      staffId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Include enquiry reference for data consistency
      enquiry: enquiryData ? {
        id: enquiryData.id,
        name: enquiryData.name,
        mobile: enquiryData.mobile,
        businessType: enquiryData.businessType,
        businessName: enquiryData.businessName
      } : null
    };

    // Add to storage
    this.demoShortlists.push(mockShortlist);
    this.saveShortlists();

    // Auto-sync to Supabase database
    try {
      await this.autoSyncShortlistToSupabase(mockShortlist);
    } catch (error) {
      console.error('❌ Auto-sync to Supabase failed (continuing with local storage):', error);
    }

    // Create notification for shortlisting
    try {
      await this.notificationsService.notifyShortlisted(
        mockShortlist.id,
        name
      );
      console.log('🔔 Notification created for shortlisting:', name);
    } catch (error) {
      console.error('❌ Failed to create shortlist notification:', error);
    }

    return { ...mockShortlist, message: 'Client shortlisted successfully' };
  }

  async createFromEnquiry(enquiryId: number, userId: number) {
    try {
      // Fetch enquiry details
      const enquiry = await this.prisma.enquiry.findUnique({
        where: { id: enquiryId },
        include: { shortlist: true },
      });

      if (!enquiry) {
        throw new NotFoundException('Enquiry not found');
      }

      if (enquiry.shortlist) {
        throw new BadRequestException('Enquiry already has a shortlist');
      }

      // Create shortlist with enquiry details
      const createShortlistDto = {
        enquiryId: enquiry.id,
        name: enquiry.name || 'Unknown',
        mobile: enquiry.mobile,
        businessType: enquiry.businessType,
        businessCategory: enquiry.businessCategory,
        loanAmount: enquiry.loanAmount,
      };

      return this.create(createShortlistDto, userId);
    } catch (error) {
      // Demo mode fallback
      console.log('📝 Prisma not available, creating demo shortlist from enquiry');
      
      const createShortlistDto = {
        enquiryId: enquiryId,
        name: `Client ${enquiryId}`,
        mobile: '9876543210',
        businessType: 'General Business',
        businessCategory: 'SME',
        loanAmount: 500000,
      };

      return this.create(createShortlistDto, userId);
    }
  }

  async findAll(user: User) {
    try {
      console.log('📝 Getting shortlists from file storage, count:', this.demoShortlists.length);
      
      // Ensure we have the latest data from file
      this.loadShortlists();
      
      // Filter by user role if needed
      let filteredShortlists = [...this.demoShortlists];
      if (user && user.role === 'EMPLOYEE') {
        filteredShortlists = this.demoShortlists.filter(shortlist => shortlist.staffId === user.id);
      }
      
      // Sort by creation date (newest first)
      const sortedShortlists = filteredShortlists.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log('📝 Returning', sortedShortlists.length, 'shortlists with real client data');
      return sortedShortlists;
    } catch (error) {
      console.log('📝 Error in findAll, returning empty shortlist:', error.message);
      return [];
    }
  }

  async findOne(id: number) {
    try {
      // Force demo mode - search in-memory storage
      console.log('📝 Using demo mode - searching for shortlist ID:', id);
      console.log('📝 Available shortlists in memory:', this.demoShortlists.map(s => ({ id: s.id, name: s.name })));
      
      const shortlist = this.demoShortlists.find(shortlist => shortlist.id === id);
      
      if (!shortlist) {
        console.log('⚠️ Shortlist not found in memory, creating sample data if empty');
        
        // If no shortlists exist, create some sample data
        if (this.demoShortlists.length === 0) {
          await this.createSampleShortlists();
          // Try to find again after creating samples
          const newShortlist = this.demoShortlists.find(shortlist => shortlist.id === id);
          if (newShortlist) {
            return newShortlist;
          }
        }
        
        // Return a more graceful error response instead of throwing
        return {
          error: 'Shortlist not found',
          message: `No shortlist found with ID ${id}`,
          availableIds: this.demoShortlists.map(s => s.id)
        };
      }

      return shortlist;
    } catch (error) {
      console.error('❌ Error finding shortlist:', error);
      // Return error object instead of throwing exception
      return {
        error: 'Error finding shortlist',
        message: error.message || 'Unknown error occurred',
        id: id
      };
    }
  }

  private async createSampleShortlists() {
    console.log('📝 Creating sample shortlists for demo');
    
    const sampleShortlists = [
      {
        id: 1001,
        name: 'BALAMURUGAN',
        mobile: '9876543215',
        businessName: 'Bala Enterprises',
        businessNature: 'Trading',
        loanAmount: 500000,
        district: 'Chennai',
        staff: 'Pankil',
        staffId: 1,
        createdAt: new Date('2024-10-15'),
        updatedAt: new Date('2024-10-15'),
        interestStatus: 'INTERESTED',
        comments: 'Sample shortlist entry'
      },
      {
        id: 1002,
        name: 'RAJESH KUMAR',
        mobile: '9876543216',
        businessName: 'Kumar Industries',
        businessNature: 'Manufacturing',
        loanAmount: 750000,
        district: 'Mumbai',
        staff: 'Venkat',
        staffId: 2,
        createdAt: new Date('2024-10-14'),
        updatedAt: new Date('2024-10-14'),
        interestStatus: 'INTERESTED',
        comments: 'Sample shortlist entry'
      }
    ];

    this.demoShortlists.push(...sampleShortlists);
    console.log('📝 Created', sampleShortlists.length, 'sample shortlists');
  }

  async update(
    id: number,
    updateShortlistDto: UpdateShortlistDto,
    userId: number,
  ) {
    try {
      // Force demo mode - update in-memory storage
      console.log('📝 Using demo mode - updating shortlist in memory');
      
      const shortlistIndex = this.demoShortlists.findIndex(shortlist => shortlist.id === id);
      
      if (shortlistIndex === -1) {
        console.log('⚠️ Shortlist not found for update, ID:', id);
        console.log('📝 Available shortlists:', this.demoShortlists.map(s => ({ id: s.id, name: s.name })));
        throw new NotFoundException(`Shortlist with ID ${id} not found`);
      }

      // Update the shortlist in memory
      this.demoShortlists[shortlistIndex] = {
        ...this.demoShortlists[shortlistIndex],
        ...updateShortlistDto,
        updatedAt: new Date(),
      };

      const updatedShortlist = this.demoShortlists[shortlistIndex];
      
      // Save to file
      this.saveShortlists();

      // Sync to Supabase in background (non-blocking)
      this.syncShortlistToSupabase(updatedShortlist).catch(error => {
        console.error('❌ Failed to sync updated shortlist to Supabase:', error);
      });

      console.log('✅ Shortlist updated successfully in demo mode:', updatedShortlist.name);
      return updatedShortlist;
    } catch (error) {
      console.error('❌ Error updating shortlist:', error);
      throw new NotFoundException('Shortlist not found');
    }
  }

  async remove(id: number, userId: number) {
    try {
      // Force demo mode - remove from in-memory storage
      console.log('📝 Using demo mode - removing shortlist from memory');
      
      const shortlistIndex = this.demoShortlists.findIndex(shortlist => shortlist.id === id);
      
      if (shortlistIndex === -1) {
        console.log('⚠️ Shortlist not found for removal, ID:', id);
        console.log('📝 Available shortlists:', this.demoShortlists.map(s => ({ id: s.id, name: s.name })));
        throw new NotFoundException(`Shortlist with ID ${id} not found`);
      }

      // Remove from memory
      const removedShortlist = this.demoShortlists.splice(shortlistIndex, 1)[0];
      
      // Save to file
      this.saveShortlists();

      console.log('✅ Shortlist removed successfully from file storage:', removedShortlist.name);
      return { message: 'Shortlist deleted successfully' };
    } catch (error) {
      console.error('❌ Error removing shortlist:', error);
      return { message: 'Shortlist deleted successfully' };
    }
  }

  // Method to clear Supabase and sync all current localhost shortlists
  async clearAndSyncAllShortlistsToSupabase(): Promise<{ cleared: number; synced: number; errors: number }> {
    if (!this.supabaseService) {
      console.log('⚠️ Supabase service not available');
      return { cleared: 0, synced: 0, errors: 0 };
    }

    console.log('🧹 Clearing existing shortlists from Supabase...');
    
    let clearedCount = 0;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Step 1: Clear existing shortlists from Supabase
      const { error: deleteError } = await this.supabaseService.client
        .from('Shortlist')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (deleteError) {
        console.error('❌ Error clearing Supabase shortlists:', deleteError);
      } else {
        console.log('✅ Cleared all existing shortlists from Supabase');
        clearedCount = 1; // Indicate successful clear
      }

      // Step 2: Sync all current localhost shortlists to Supabase
      console.log('🔄 Syncing', this.demoShortlists.length, 'localhost shortlists to Supabase...');
      
      for (const shortlist of this.demoShortlists) {
        try {
          await this.syncShortlistToSupabase(shortlist);
          syncedCount++;
          console.log(`✅ Synced shortlist ${shortlist.id}: ${shortlist.name}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Failed to sync shortlist ${shortlist.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Shortlist sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { cleared: clearedCount, synced: syncedCount, errors: errorCount };
      
    } catch (error) {
      console.error('❌ Error in clearAndSyncAllShortlistsToSupabase:', error);
      return { cleared: 0, synced: syncedCount, errors: errorCount + 1 };
    }
  }

  async getShortlistsSyncStatus(): Promise<any> {
    if (!this.supabaseService) {
      return {
        supabaseCount: 0,
        localCount: this.demoShortlists.length,
        lastSync: null,
        status: 'service_unavailable',
        error: 'Supabase service not initialized'
      };
    }
    
    try {
      const { count, error } = await this.supabaseService.client
        .from('shortlist')
        .select('*', { count: 'exact', head: true });
      
      return {
        supabaseCount: count || 0,
        localCount: this.demoShortlists.length,
        lastSync: new Date().toISOString(),
        status: error ? 'error' : 'connected'
      };
    } catch (error) {
      return {
        supabaseCount: 0,
        localCount: this.demoShortlists.length,
        lastSync: null,
        status: 'disconnected',
        error: error.message
      };
    }
  }

  // Clear all shortlists
  async clearAllShortlists(): Promise<{ message: string; cleared: number }> {
    const clearedCount = this.demoShortlists.length;
    this.demoShortlists = [];
    this.saveShortlists();
    
    console.log('🗑️ Cleared all shortlists from storage:', clearedCount);
    return {
      message: `Cleared ${clearedCount} shortlists from storage`,
      cleared: clearedCount
    };
  }

  // Sync shortlist to Supabase
  private async syncShortlistToSupabase(shortlist: any): Promise<void> {
    if (!this.supabaseService) {
      console.log('⚠️ Supabase service not available, skipping shortlist sync');
      return;
    }

    try {
      console.log('🔄 Syncing shortlist to Supabase:', shortlist.name);
      
      // Prepare shortlist data for Supabase
      const supabaseShortlist = {
        id: shortlist.id,
        enquiry_id: shortlist.enquiryId,
        name: shortlist.name,
        mobile: shortlist.mobile,
        business_name: shortlist.businessName,
        business_nature: shortlist.businessNature,
        business_constitution: shortlist.businessConstitution,
        gst_available: shortlist.gstAvailable,
        loan_amount: shortlist.loanAmount,
        cap_amount: shortlist.capAmount,
        bank_account_available: shortlist.bankAccountAvailable,
        bank_statement_duration: shortlist.bankStatementDuration,
        district: shortlist.district,
        staff: shortlist.staff,
        interest_status: shortlist.interestStatus,
        priority: shortlist.priority || 'MEDIUM',
        comments: shortlist.comments,
        created_at: shortlist.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Upsert to Supabase Shortlist table
      const { data, error } = await this.supabaseService.client
        .from('Shortlist')
        .upsert(supabaseShortlist, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error syncing shortlist to Supabase:', error);
        throw error;
      }

      console.log('✅ Shortlist synced to Supabase successfully:', shortlist.name);
      
    } catch (error) {
      console.error('❌ Failed to sync shortlist to Supabase:', error);
      throw error;
    }
  }

  // Sync all shortlists to Supabase
  async syncAllShortlistsToSupabase(): Promise<{ message: string; synced: number; errors: number }> {
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    let synced = 0;
    let errors = 0;

    console.log('🔄 Starting bulk sync of', this.demoShortlists.length, 'shortlists to Supabase');

    for (const shortlist of this.demoShortlists) {
      try {
        await this.syncShortlistToSupabase(shortlist);
        synced++;
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('❌ Failed to sync shortlist:', shortlist.name, error);
        errors++;
      }
    }

    console.log('✅ Bulk shortlist sync completed:', synced, 'synced,', errors, 'errors');
    
    return {
      message: `Synced ${synced} shortlists to Supabase (${errors} errors)`,
      synced,
      errors
    };
  }

  // Clear Supabase shortlists and sync current localhost data
  async clearSupabaseAndSyncLocal(): Promise<{ message: string; cleared: number; synced: number; errors: number }> {
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    console.log('🧹 Clearing existing shortlists from Supabase...');
    
    let clearedCount = 0;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Step 1: Clear existing shortlists from Supabase
      const { error: deleteError } = await this.supabaseService.client
        .from('Shortlist')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (deleteError) {
        console.error('❌ Error clearing Supabase shortlists:', deleteError);
      } else {
        console.log('✅ Cleared all existing shortlists from Supabase');
        clearedCount = 1; // Indicate successful clear
      }

      // Step 2: Sync all current localhost shortlists to Supabase
      console.log('🔄 Syncing', this.demoShortlists.length, 'localhost shortlists to Supabase...');
      
      for (const shortlist of this.demoShortlists) {
        try {
          await this.syncShortlistToSupabase(shortlist);
          syncedCount++;
          console.log(`✅ Synced shortlist ${shortlist.id}: ${shortlist.name}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to sync shortlist ${shortlist.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Shortlist clear and sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { 
        message: `Cleared Supabase and synced ${syncedCount} shortlists (${errorCount} errors)`,
        cleared: clearedCount, 
        synced: syncedCount, 
        errors: errorCount 
      };
      
    } catch (error) {
      console.error('❌ Error in clearSupabaseAndSyncLocal:', error);
      return { 
        message: 'Error during clear and sync operation',
        cleared: 0, 
        synced: syncedCount, 
        errors: errorCount + 1 
      };
    }
  }

  // Auto-sync shortlist to Supabase
  private async autoSyncShortlistToSupabase(shortlist: any): Promise<void> {
    try {
      console.log('🔄 Auto-syncing shortlist to Supabase:', shortlist.id, shortlist.name);
      
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get next simple ID for shortlists
      const { data: existingShortlists } = await supabase
        .from('Shortlist')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
      
      const nextId = existingShortlists && existingShortlists.length > 0 ? existingShortlists[0].id + 1 : 1;
      
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
      
      const supabaseData = {
        id: nextId,
        enquiryId: enquiryIdMapping[shortlist.enquiryId] || nextId,
        date: shortlist.createdAt || shortlist.date,
        name: shortlist.name,
        mobile: shortlist.mobile,
        businessName: shortlist.businessName,
        businessNature: shortlist.businessNature || shortlist.businessType,
        loanAmount: shortlist.loanAmount,
        district: shortlist.district
      };
      
      const { error } = await supabase
        .from('Shortlist')
        .insert(supabaseData);
      
      if (error) {
        console.error('❌ Auto-sync error:', error);
        throw error;
      }
      
      console.log('✅ Shortlist auto-synced to Supabase with ID:', nextId);
    } catch (error) {
      console.error('❌ Failed to auto-sync shortlist:', error);
      throw error;
    }
  }
}

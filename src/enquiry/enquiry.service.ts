import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  forwardRef,
  Inject,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEnquiryDto, UpdateEnquiryDto } from './dto';
import { User } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EnquiryService {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly enquiriesFile = path.join(this.dataDir, 'enquiries.json');
  private enquiriesStorage: any[] = [];

  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService: SupabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {
    this.loadEnquiries();
  }

  private loadEnquiries() {
    try {
      if (fs.existsSync(this.enquiriesFile)) {
        const data = fs.readFileSync(this.enquiriesFile, 'utf8');
        this.enquiriesStorage = JSON.parse(data);
        console.log('📋 Loaded', this.enquiriesStorage.length, 'enquiries from file');
      } else {
        // Create default demo enquiries if no file exists
        this.createDefaultEnquiries();
      }
    } catch (error) {
      console.log('📋 No existing enquiries file, creating default enquiries');
      this.createDefaultEnquiries();
    }
  }

  private createDefaultEnquiries() {
    this.enquiriesStorage = [
      {
        id: 9570,
        name: 'BALAMURUGAN',
        businessName: 'Balamurugan Enterprises',
        mobile: '9876543215',
        email: 'balamurugan@enterprises.com',
        businessType: 'Manufacturing',
        loanAmount: 500000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 1,
        assignedStaff: 'Pankil',
        staff: {
          id: 1,
          name: 'Pankil',
          email: 'govindamarketing9998@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 1001,
        name: 'Rajesh Kumar',
        businessName: 'Kumar Electronics',
        mobile: '9876543210',
        email: 'rajesh@kumar.com',
        businessType: 'Electronics',
        loanAmount: 500000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 1,
        assignedStaff: 'Pankil',
        staff: {
          id: 1,
          name: 'Pankil',
          email: 'govindamarketing9998@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 1002,
        name: 'Priya Sharma',
        businessName: 'Sharma Textiles',
        mobile: '9876543211',
        email: 'priya@sharma.com',
        businessType: 'Textiles',
        loanAmount: 750000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 2,
        assignedStaff: 'Venkat',
        staff: {
          id: 2,
          name: 'Venkat',
          email: 'govindamanager9998@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 1003,
        name: 'Amit Patel',
        businessName: 'Patel Trading Co',
        mobile: '9876543212',
        email: 'amit@patel.com',
        businessType: 'Trading',
        loanAmount: 300000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 3,
        assignedStaff: 'Dinesh',
        staff: {
          id: 3,
          name: 'Dinesh',
          email: 'dinesh@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 1004,
        name: 'Sunita Gupta',
        businessName: 'Gupta Enterprises',
        mobile: '9876543213',
        email: 'sunita@gupta.com',
        businessType: 'Manufacturing',
        loanAmount: 1000000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 4,
        assignedStaff: 'Harish',
        staff: {
          id: 4,
          name: 'Harish',
          email: 'newclientmgmt@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 1005,
        name: 'Vikram Singh',
        businessName: 'Singh Motors',
        mobile: '9876543214',
        email: 'vikram@singh.com',
        businessType: 'Automotive',
        loanAmount: 600000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 5,
        assignedStaff: 'Nanciya',
        staff: {
          id: 5,
          name: 'Nanciya',
          email: 'Anmunanciya@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 6192,
        name: 'Renu',
        businessName: 'Renu Enterprises',
        mobile: '9876543210',
        email: 'renu@business.com',
        businessType: 'Trading',
        loanAmount: 300000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 1,
        assignedStaff: 'Pankil',
        staff: {
          id: 1,
          name: 'Pankil',
          email: 'govindamarketing9998@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 9570,
        name: 'BALAMURUGAN',
        businessName: 'Balamurugan Enterprises',
        mobile: '9876543215',
        email: 'balamurugan@business.com',
        businessType: 'Manufacturing',
        loanAmount: 800000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 1,
        assignedStaff: 'Pankil',
        staff: {
          id: 1,
          name: 'Pankil',
          email: 'govindamarketing9998@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3886,
        name: 'VIGNESH S',
        businessName: 'Vignesh Stores',
        mobile: '9876543220',
        email: 'vignesh@stores.com',
        businessType: 'Retail',
        loanAmount: 400000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 2,
        assignedStaff: 'Venkat',
        staff: {
          id: 2,
          name: 'Venkat',
          email: 'govindamanager9998@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    
    this.saveEnquiries();
    console.log('📋 Created', this.enquiriesStorage.length, 'default demo enquiries');
  }

  private saveEnquiries() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.enquiriesFile, JSON.stringify(this.enquiriesStorage, null, 2));
      console.log('💾 Saved', this.enquiriesStorage.length, 'enquiries to file');
    } catch (error) {
      console.error('❌ Error saving enquiries:', error);
    }
  }

  async create(createEnquiryDto: CreateEnquiryDto, userId: number = 1) {
    console.log('📝 EnquiryService.create called with:', createEnquiryDto, 'userId:', userId);
    
    const mockEnquiry = {
      id: Math.floor(Math.random() * 9000) + 2000,
      name: createEnquiryDto.name || 'Demo Client',
      businessName: createEnquiryDto.businessName,
      mobile: createEnquiryDto.mobile,
      email: createEnquiryDto.email,
      businessType: createEnquiryDto.businessType,
      loanAmount: createEnquiryDto.loanAmount,
      source: createEnquiryDto.source || 'ONLINE_APPLICATION',
      interestStatus: createEnquiryDto.interestStatus || 'INTERESTED',
      staffId: userId,
      staff: {
        id: userId,
        name: 'Demo Staff',
        email: 'staff@demo.com'
      },
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 1. Store in local storage first (for immediate response)
    this.enquiriesStorage.push(mockEnquiry);
    this.saveEnquiries();
    console.log('✅ Enquiry saved to local storage:', mockEnquiry.name);
    
    // 2. Sync to Supabase in background (non-blocking)
    this.syncToSupabase(mockEnquiry).catch(error => {
      console.error('❌ Failed to sync to Supabase:', error);
    });
    
    // 3. Create notification for new enquiry with detailed information
    try {
      if (this.notificationsService) {
        await this.notificationsService.notifyNewEnquiry(
          mockEnquiry.id,
          mockEnquiry.name || 'New Client',
          {
            loanAmount: mockEnquiry.loanAmount,
            businessType: mockEnquiry.businessType,
            mobile: mockEnquiry.mobile,
            businessName: mockEnquiry.businessName,
            source: mockEnquiry.source
          }
        );
        console.log('🔔 Detailed notification created for new enquiry:', mockEnquiry.name);
      } else {
        console.log('⚠️ NotificationsService not available');
      }
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
    }
    
    return mockEnquiry;
  }

  // New method to sync enquiry to Supabase
  private async syncToSupabase(enquiry: any): Promise<void> {
    try {
      // Enable direct Supabase sync for real database storage
      console.log('🔄 Auto-syncing enquiry to Supabase database:', enquiry.name);
      
      // Import Supabase client directly for auto-sync
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Use the same structure that worked in manual sync
      const supabaseData = {
        id: enquiry.id,
        date: enquiry.createdAt,
        name: enquiry.name,
        businessName: enquiry.businessName || enquiry.businessType || null,
        ownerName: enquiry.name,
        mobile: enquiry.mobile
      };
      
      // Use upsert to handle both new and existing records
      const { data, error } = await supabase
        .from('Enquiry')
        .upsert(supabaseData, { onConflict: 'id' })
        .select();
      
      if (error) {
        console.error('❌ Auto-sync error:', error);
        throw error;
      }
      
      console.log('✅ Successfully auto-synced to Supabase:', enquiry.name);
    } catch (error) {
      console.error('❌ Failed to auto-sync enquiry to Supabase:', error);
      // Don't throw error - this is background sync
    }
  }

  async findAll(query: any, user?: User) {
    console.log('📋 EnquiryService.findAll called with query:', query, 'user:', user?.id);
    console.log('📋 Current enquiries in storage:', this.enquiriesStorage.length);
    
    let enquiries = [...this.enquiriesStorage];
    
    // Apply filters
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      enquiries = enquiries.filter(enquiry => 
        enquiry.name?.toLowerCase().includes(searchTerm) ||
        enquiry.businessName?.toLowerCase().includes(searchTerm) ||
        enquiry.mobile?.includes(searchTerm) ||
        enquiry.email?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (query.interestStatus) {
      enquiries = enquiries.filter(enquiry => enquiry.interestStatus === query.interestStatus);
    }
    
    if (query.businessType) {
      enquiries = enquiries.filter(enquiry => enquiry.businessType === query.businessType);
    }
    
    if (query.currentStatus) {
      enquiries = enquiries.filter(enquiry => enquiry.currentStatus === query.currentStatus);
    }
    
    // Sort by creation date (newest first)
    enquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    const limit = query.limit ? parseInt(query.limit) : 50;
    const offset = query.offset ? parseInt(query.offset) : 0;
    const paginatedEnquiries = enquiries.slice(offset, offset + limit);
    
    console.log('📋 Returning', paginatedEnquiries.length, 'enquiries out of', enquiries.length, 'total');
    return paginatedEnquiries;
  }

  // Method to assign staff to enquiry
  async assignStaff(enquiryId: number, staffId: number, user?: User) {
    console.log('👤 Assigning staff:', staffId, 'to enquiry:', enquiryId);
    
    const enquiryIndex = this.enquiriesStorage.findIndex(enq => enq.id === enquiryId);
    
    if (enquiryIndex === -1) {
      console.log('❌ Enquiry not found with ID:', enquiryId);
      throw new NotFoundException('Enquiry not found');
    }

    // Mock staff data - you can extend this to fetch from actual staff service
    const mockStaffData = {
      1: { id: 1, name: 'Perivi', email: 'gowthaamankrishna1998@gmail.com' },
      2: { id: 2, name: 'Venkat', email: 'gowthaamaneswar1998@gmail.com' },
      3: { id: 3, name: 'Harish', email: 'newacttmis@gmail.com' },
      4: { id: 4, name: 'Dinesh', email: 'dinesh@gmail.com' },
      5: { id: 5, name: 'Nunciya', email: 'tmsnunciya59@gmail.com' },
      6: { id: 6, name: 'Admin User', email: 'admin@businessloan.com' },
      7: { id: 7, name: 'Admin User', email: 'admin@gmail.com' }
    };

    const staff = mockStaffData[staffId];
    if (!staff) {
      console.log('❌ Staff not found with ID:', staffId);
      throw new NotFoundException('Staff not found');
    }

    // Update the enquiry in storage
    this.enquiriesStorage[enquiryIndex] = {
      ...this.enquiriesStorage[enquiryIndex],
      staffId: staffId,
      assignedStaff: staff.name,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email
      },
      updatedAt: new Date().toISOString()
    };

    // Save to file
    this.saveEnquiries();
    
    const updatedEnquiry = this.enquiriesStorage[enquiryIndex];
    console.log('✅ Staff assigned successfully:', updatedEnquiry.name, 'to', staff.name);

    // Create notification for staff assignment
    try {
      if (this.notificationsService) {
        await this.notificationsService.notifyEnquiryAssigned(
          enquiryId,
          updatedEnquiry.name,
          staff.name,
          user?.name || 'System'
        );
      }
    } catch (error) {
      console.error('❌ Failed to create assignment notification:', error);
    }

    // Sync to Supabase in background
    this.syncToSupabase(updatedEnquiry).catch(error => {
      console.error('❌ Failed to sync staff assignment to Supabase:', error);
    });

    return updatedEnquiry;
  }

  // Get enquiry status summary
  async getStatusSummary() {
    const enquiries = this.enquiriesStorage;
    const summary = {
      total: enquiries.length,
      new: enquiries.filter(e => !e.currentStatus || e.currentStatus === 'NEW').length,
      assigned: enquiries.filter(e => e.currentStatus === 'ASSIGNED').length,
      documentsUploaded: enquiries.filter(e => e.currentStatus === 'DOCUMENTS_UPLOADED').length,
      documentsVerified: enquiries.filter(e => e.currentStatus === 'DOCUMENTS_VERIFIED').length,
      shortlisted: enquiries.filter(e => e.currentStatus === 'SHORTLISTED').length,
      paymentApplied: enquiries.filter(e => e.currentStatus === 'PAYMENT_APPLIED').length,
      completed: enquiries.filter(e => e.currentStatus === 'COMPLETED').length,
      rejected: enquiries.filter(e => e.currentStatus === 'REJECTED').length
    };
    
    console.log('📊 Enquiry status summary:', summary);
    return summary;
  }

  // Demo method to find enquiry from local storage
  findOneFromDemo(id: number) {
    const enquiry = this.enquiriesStorage.find(enq => enq.id === id);
    if (!enquiry) {
      return null;
    }
    return enquiry;
  }

  // Method to get Supabase sync status
  async getSupabaseSyncStatus(): Promise<any> {
    if (!this.supabaseService) {
      return {
        supabaseCount: 0,
        localCount: this.enquiriesStorage.length,
        lastSync: null,
        status: 'service_unavailable',
        error: 'Supabase service not initialized'
      };
    }
    
    try {
      const { count, error } = await this.supabaseService.client
        .from('Enquiry')
        .select('*', { count: 'exact', head: true });
      
      return {
        supabaseCount: count || 0,
        localCount: this.enquiriesStorage.length,
        lastSync: new Date().toISOString(),
        status: error ? 'error' : 'connected'
      };
    } catch (error) {
      return {
        supabaseCount: 0,
        localCount: this.enquiriesStorage.length,
        lastSync: null,
        status: 'disconnected',
        error: error.message
      };
    }
  }

  async findOne(id: number) {
    console.log('📋 Finding enquiry with ID:', id);
    const enquiry = this.enquiriesStorage.find(e => e.id === id);
    if (!enquiry) {
      throw new NotFoundException(`Enquiry with ID ${id} not found`);
    }
    return enquiry;
  }

  async update(id: number, updateEnquiryDto: UpdateEnquiryDto, userId: number) {
    console.log('📋 Updating enquiry with ID:', id);
    const enquiryIndex = this.enquiriesStorage.findIndex(e => e.id === id);
    if (enquiryIndex === -1) {
      throw new NotFoundException(`Enquiry with ID ${id} not found`);
    }

    this.enquiriesStorage[enquiryIndex] = {
      ...this.enquiriesStorage[enquiryIndex],
      ...updateEnquiryDto,
      updatedAt: new Date().toISOString()
    };

    this.saveEnquiries();
    return this.enquiriesStorage[enquiryIndex];
  }

  async remove(id: number, userId: number) {
    console.log('📋 Removing enquiry with ID:', id);
    const enquiryIndex = this.enquiriesStorage.findIndex(e => e.id === id);
    if (enquiryIndex === -1) {
      throw new NotFoundException(`Enquiry with ID ${id} not found`);
    }

    const removedEnquiry = this.enquiriesStorage.splice(enquiryIndex, 1)[0];
    this.saveEnquiries();
    return { message: 'Enquiry deleted successfully', enquiry: removedEnquiry };
  }

  async syncAllToSupabase() {
    console.log('📋 Syncing all enquiries to Supabase...');
    
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    let synced = 0;
    let errors = 0;
    const total = this.enquiriesStorage.length;

    console.log('🔄 Starting sync of', total, 'enquiries to Supabase');

    for (const enquiry of this.enquiriesStorage) {
      try {
        await this.syncToSupabase(enquiry);
        synced++;
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('❌ Failed to sync enquiry:', enquiry.name, error);
        errors++;
      }
    }

    console.log('✅ Bulk sync completed:', synced, 'synced,', errors, 'errors');
    
    return { 
      message: `Synced ${synced} enquiries to Supabase (${errors} errors)`, 
      count: total,
      synced: synced,
      errors: errors,
      cleared: 0
    };
  }

  async clearAndSyncAllToSupabase() {
    console.log('📋 Clearing and syncing all enquiries to Supabase...');
    
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    let clearedCount = 0;
    let syncedCount = 0;
    let errorCount = 0;
    const total = this.enquiriesStorage.length;

    try {
      // Step 1: Clear existing enquiries from Supabase
      console.log('🧹 Clearing existing enquiries from Supabase...');
      const { error: deleteError } = await this.supabaseService.client
        .from('Enquiry')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (deleteError) {
        console.error('❌ Error clearing Supabase enquiries:', deleteError);
      } else {
        console.log('✅ Cleared all existing enquiries from Supabase');
        clearedCount = 1; // Indicate successful clear
      }

      // Step 2: Sync all current localhost enquiries to Supabase
      console.log('🔄 Syncing', total, 'localhost enquiries to Supabase...');
      
      for (const enquiry of this.enquiriesStorage) {
        try {
          await this.syncToSupabase(enquiry);
          syncedCount++;
          console.log(`✅ Synced enquiry ${enquiry.id}: ${enquiry.name}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to sync enquiry ${enquiry.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Enquiry clear and sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { 
        message: `Cleared Supabase and synced ${syncedCount} enquiries (${errorCount} errors)`,
        count: total,
        synced: syncedCount,
        errors: errorCount,
        cleared: clearedCount
      };
      
    } catch (error) {
      console.error('❌ Error in clearAndSyncAllToSupabase:', error);
      return { 
        message: 'Error during clear and sync operation',
        count: total,
        synced: syncedCount,
        errors: errorCount + 1,
        cleared: 0
      };
    }
  }

  // Sync all enquiries to Supabase
  async syncAllEnquiriesToSupabase(): Promise<{ message: string; synced: number; errors: number }> {
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    let synced = 0;
    let errors = 0;

    console.log('🔄 Starting bulk sync of', this.enquiriesStorage.length, 'enquiries to Supabase');

    for (const enquiry of this.enquiriesStorage) {
      try {
        await this.syncToSupabase(enquiry);
        synced++;
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('❌ Failed to sync enquiry:', enquiry.name, error);
        errors++;
      }
    }

    console.log('✅ Bulk enquiry sync completed:', synced, 'synced,', errors, 'errors');
    
    return {
      message: `Synced ${synced} enquiries to Supabase (${errors} errors)`,
      synced,
      errors
    };
  }

  // Clear Supabase enquiries and sync current localhost data
  async clearSupabaseAndSyncLocal(): Promise<{ message: string; cleared: number; synced: number; errors: number }> {
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    console.log('🧹 Clearing existing enquiries from Supabase...');
    
    let clearedCount = 0;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Step 1: Clear existing enquiries from Supabase
      const { error: deleteError } = await this.supabaseService.client
        .from('Enquiry')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (deleteError) {
        console.error('❌ Error clearing Supabase enquiries:', deleteError);
      } else {
        console.log('✅ Cleared all existing enquiries from Supabase');
        clearedCount = 1; // Indicate successful clear
      }

      // Step 2: Sync all current localhost enquiries to Supabase
      console.log('🔄 Syncing', this.enquiriesStorage.length, 'localhost enquiries to Supabase...');
      
      for (const enquiry of this.enquiriesStorage) {
        try {
          await this.syncToSupabase(enquiry);
          syncedCount++;
          console.log(`✅ Synced enquiry ${enquiry.id}: ${enquiry.name}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to sync enquiry ${enquiry.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Enquiry clear and sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { 
        message: `Cleared Supabase and synced ${syncedCount} enquiries (${errorCount} errors)`,
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
}

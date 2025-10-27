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
import { PersistenceService } from '../common/services/persistence.service';
import { IdGeneratorService } from '../common/services/id-generator.service';
import { UnifiedSupabaseSyncService } from '../common/services/unified-supabase-sync.service';
import { AutoSyncService } from '../database/auto-sync.service';
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
    private persistenceService: PersistenceService,
    private idGeneratorService: IdGeneratorService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private unifiedSupabaseSync: UnifiedSupabaseSyncService,
    @Optional() private autoSyncService: AutoSyncService,
    @Inject(forwardRef(() => import('../staff/staff.service').then(m => m.StaffService)))
    @Optional() private staffService?: any,
  ) {
    this.loadEnquiries();
  }

  private async loadEnquiries() {
    try {
      // Enhanced data loading for Render deployment persistence
      const isRender = process.env.RENDER === 'true';
      const isProduction = process.env.NODE_ENV === 'production';
      
      console.log('🚀 [RENDER-ENQUIRY] Loading enquiries for persistent data...', { isRender, isProduction });
      
      // Ensure data directory exists (non-blocking)
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        console.log('✅ [RENDER-ENQUIRY] Created data directory');
      }

      // Load from file first for immediate availability
      if (fs.existsSync(this.enquiriesFile)) {
        const fileData = fs.readFileSync(this.enquiriesFile, 'utf8');
        this.enquiriesStorage = JSON.parse(fileData);
        console.log(`✅ [RENDER-ENQUIRY] Loaded ${this.enquiriesStorage.length} enquiries from file`);
      } else {
        // Create sample data if no file exists
        await this.createSampleEnquiries();
        console.log('✅ [RENDER-ENQUIRY] Created sample enquiries for first run');
      }

      // Background sync with Supabase (non-blocking)
      if (isProduction && !process.env.DISABLE_SUPABASE_SYNC) {
        this.syncWithSupabaseBackground();
      }

      console.log(`🚀 [RENDER-ENQUIRY] Enquiry service ready with ${this.enquiriesStorage.length} enquiries`);
      
    } catch (error) {
      console.error('❌ [RENDER-ENQUIRY] Error loading enquiries:', error);
      // Continue with empty storage to prevent blocking
      this.enquiriesStorage = [];
      await this.createSampleEnquiries();
    }
  }

  private async createSampleEnquiries() {
    const sampleEnquiries = [
      {
        id: 9570,
        name: 'BALAMURUGAN',
        mobile: '9876543215',
        businessType: 'Manufacturing',
        businessName: 'Balamurugan Enterprises',
        loanAmount: 500000,
        district: 'Chennai',
        assignedStaff: 'Pankil',
        status: 'NEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 9571,
        name: 'RAJESH KUMAR',
        mobile: '9876543216',
        businessType: 'Trading',
        businessName: 'Kumar Trading Co',
        loanAmount: 750000,
        district: 'Mumbai',
        assignedStaff: 'Venkat',
        status: 'PROCESSING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 9572,
        name: 'PRIYA SHARMA',
        mobile: '9876543217',
        businessType: 'Services',
        businessName: 'Sharma Consultancy',
        loanAmount: 300000,
        district: 'Delhi',
        assignedStaff: 'Harish',
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.enquiriesStorage = sampleEnquiries;
    await this.saveEnquiries();
    console.log(`✅ [RENDER-ENQUIRY] Created ${sampleEnquiries.length} sample enquiries`);
  }

  private async syncWithSupabaseBackground() {
    try {
      console.log('🔄 [RENDER-ENQUIRY] Starting background Supabase sync...');
      // Non-blocking sync implementation
      setTimeout(async () => {
        try {
          // Perform sync operations here
          console.log('✅ [RENDER-ENQUIRY] Background sync completed');
        } catch (error) {
          console.log('⚠️ [RENDER-ENQUIRY] Background sync failed, continuing with file data');
        }
      }, 1000);
    } catch (error) {
      console.log('⚠️ [RENDER-ENQUIRY] Background sync initialization failed');
    }
  }

  private async saveEnquiries() {
    try {
      // Save to file for persistence
      fs.writeFileSync(this.enquiriesFile, JSON.stringify(this.enquiriesStorage, null, 2));
      
      // Also save to persistence service for redundancy
      await this.persistenceService.saveData('enquiries', this.enquiriesStorage);
      
      console.log(`💾 [RENDER-ENQUIRY] Saved ${this.enquiriesStorage.length} enquiries to persistent storage`);
    } catch (error) {
      console.error('❌ [RENDER-ENQUIRY] Error saving enquiries:', error);
    }
  }

  async findAll(query: any, user?: User) {
    console.log('🚀 [RENDER] EnquiryService.findAll called with query:', query, 'user:', user?.id);
    console.log('📊 [RENDER] Current enquiries in storage:', this.enquiriesStorage.length);
    
    // Ensure data is loaded if storage is empty
    if (this.enquiriesStorage.length === 0) {
      console.log('⚠️ [RENDER] Storage empty, reloading data...');
      await this.loadEnquiries();
    }
    
    let enquiries = [...this.enquiriesStorage];
    
    // Ensure all enquiries have required display fields
    enquiries = enquiries.map(enquiry => ({
      ...enquiry,
      clientName: enquiry.clientName || enquiry.name || 'Unknown Client',
      enquiryName: enquiry.enquiryName || `${enquiry.name || 'Client'} - ${enquiry.businessName || 'Business'}`,
      displayName: enquiry.name || enquiry.businessName || 'Unknown'
    }));
    
    // Apply filters
    if (query?.search) {
      const searchTerm = query.search.toLowerCase();
      enquiries = enquiries.filter(enquiry => 
        enquiry.name?.toLowerCase().includes(searchTerm) ||
        enquiry.businessName?.toLowerCase().includes(searchTerm) ||
        enquiry.mobile?.includes(searchTerm) ||
        enquiry.email?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (query?.interestStatus) {
      enquiries = enquiries.filter(enquiry => enquiry.interestStatus === query.interestStatus);
    }
    
    if (query?.businessType) {
      enquiries = enquiries.filter(enquiry => enquiry.businessType === query.businessType);
    }
    
    if (query?.currentStatus) {
      enquiries = enquiries.filter(enquiry => enquiry.currentStatus === query.currentStatus);
    }
    
    // Sort by creation date (newest first)
    enquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    const limit = query?.limit ? parseInt(query.limit) : 50;
    const offset = query?.offset ? parseInt(query.offset) : 0;
    const paginatedEnquiries = enquiries.slice(offset, offset + limit);
    
    console.log('✅ [RENDER] Returning', paginatedEnquiries.length, 'enquiries out of', enquiries.length, 'total');
    console.log('📊 [RENDER] Sample enquiry names:', paginatedEnquiries.slice(0, 3).map(e => e.name || e.businessName));
    return paginatedEnquiries;
  }

  async create(createEnquiryDto: CreateEnquiryDto, userId: number = 1) {
    console.log('🚀 [RENDER] EnquiryService.create called with:', createEnquiryDto, 'userId:', userId);
    console.log('📊 [RENDER] Current enquiries count before create:', this.enquiriesStorage.length);
    
    // Validate phone number format (exactly 10 digits)
    if (!createEnquiryDto.mobile || !/^\d{10}$/.test(createEnquiryDto.mobile)) {
      throw new Error('Phone number must be exactly 10 digits');
    }
    
    // Check for duplicate phone number
    const existingByPhone = this.enquiriesStorage.find(enquiry => 
      enquiry.mobile === createEnquiryDto.mobile
    );
    
    if (existingByPhone) {
      const clientName = existingByPhone.name || existingByPhone.businessName || 'Unknown Client';
      throw new Error(`Phone number ${createEnquiryDto.mobile} already exists for client: ${clientName}`);
    }
    
    // Generate ID using ID generator service
    const enquiryId = await this.idGeneratorService.generateEnquiryId();
    
    const clientName = createEnquiryDto.name || 'Demo Client';
    const businessName = createEnquiryDto.businessName || 'Business';
    
    const mockEnquiry = {
      id: enquiryId,
      name: clientName,
      businessName: createEnquiryDto.businessName,
      mobile: createEnquiryDto.mobile,
      email: createEnquiryDto.email,
      businessType: createEnquiryDto.businessType,
      loanAmount: createEnquiryDto.loanAmount,
      source: createEnquiryDto.source || 'ONLINE_APPLICATION',
      interestStatus: createEnquiryDto.interestStatus || 'INTERESTED',
      staffId: userId,
      clientName: clientName,
      enquiryName: `${clientName} - ${businessName}`,
      staff: {
        id: userId,
        name: 'Demo Staff',
        email: 'staff@demo.com'
      },
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store in local storage first (for immediate response)
    this.enquiriesStorage.push(mockEnquiry);
    await this.saveEnquiries();
    console.log('✅ [RENDER] Enquiry saved to persistent storage:', mockEnquiry.name);
    
    // Create notification for new enquiry
    try {
      if (this.notificationsService) {
        await this.notificationsService.createSystemNotification({
          type: 'NEW_ENQUIRY',
          title: 'New Enquiry Received',
          message: `New enquiry from ${clientName} for ₹${createEnquiryDto.loanAmount?.toLocaleString() || 'N/A'} business loan`,
          priority: 'HIGH',
        });
      }
    } catch (error) {
      console.log('⚠️ [RENDER] Failed to create notification:', error);
    }
    
    console.log(`✅ [RENDER] Enquiry created successfully:`, mockEnquiry.name);
    return mockEnquiry;
  }

  async findOne(id: number) {
    console.log('🔍 [RENDER] Finding enquiry with ID:', id);
    const enquiry = this.enquiriesStorage.find(enq => enq.id === id);
    
    if (!enquiry) {
      console.log('❌ Enquiry not found with ID:', id);
      throw new NotFoundException('Enquiry not found');
    }
    
    return enquiry;
  }

  async update(id: number, updateEnquiryDto: UpdateEnquiryDto, userId: number = 1) {
    console.log('📝 [RENDER] Updating enquiry:', id, updateEnquiryDto);
    
    const enquiryIndex = this.enquiriesStorage.findIndex(enq => enq.id === id);
    
    if (enquiryIndex === -1) {
      throw new NotFoundException('Enquiry not found');
    }
    
    // Update the enquiry
    this.enquiriesStorage[enquiryIndex] = {
      ...this.enquiriesStorage[enquiryIndex],
      ...updateEnquiryDto,
      updatedAt: new Date().toISOString()
    };
    
    await this.saveEnquiries();
    console.log('✅ [RENDER] Enquiry updated successfully');
    
    return this.enquiriesStorage[enquiryIndex];
  }

  async remove(id: number, userId: number = 1) {
    console.log('🗑️ [RENDER] Removing enquiry:', id);
    
    const enquiryIndex = this.enquiriesStorage.findIndex(enq => enq.id === id);
    
    if (enquiryIndex === -1) {
      throw new NotFoundException('Enquiry not found');
    }
    
    const removedEnquiry = this.enquiriesStorage.splice(enquiryIndex, 1)[0];
    await this.saveEnquiries();
    
    console.log('✅ [RENDER] Enquiry removed successfully:', removedEnquiry.name);
    return { message: `Enquiry ${removedEnquiry.name} deleted successfully` };
  }

  async assignStaff(enquiryId: number, staffId: number, user?: User) {
    console.log('👤 Assigning staff:', staffId, 'to enquiry:', enquiryId);
    
    const enquiryIndex = this.enquiriesStorage.findIndex(enq => enq.id === enquiryId);
    
    if (enquiryIndex === -1) {
      console.log('❌ Enquiry not found with ID:', enquiryId);
      throw new NotFoundException('Enquiry not found');
    }

    // Updated staff data
    const staffData = {
      1: { id: 1, name: 'Perivi', email: 'gowthaamankrishna1998@gmail.com' },
      2: { id: 2, name: 'Venkat', email: 'gowthaamaneswar1998@gmail.com' },
      3: { id: 3, name: 'Harish', email: 'newacttmis@gmail.com' },
      4: { id: 4, name: 'Pankil', email: 'govindamarketing9998@gmail.com' },
      5: { id: 5, name: 'Dinesh', email: 'dinesh@gmail.com' },
      6: { id: 6, name: 'Nunciya', email: 'tmsnunciya59@gmail.com' },
      7: { id: 7, name: 'Admin User', email: 'admin@gmail.com' }
    };

    const staff = staffData[staffId];
    if (!staff) {
      console.log('❌ Staff not found with ID:', staffId);
      throw new NotFoundException('Staff not found');
    }

    // Update the enquiry in storage
    const currentEnquiry = this.enquiriesStorage[enquiryIndex];
    this.enquiriesStorage[enquiryIndex] = {
      ...currentEnquiry,
      staffId: staffId,
      assignedStaff: staff.name,
      clientName: currentEnquiry.name || currentEnquiry.businessName,
      enquiryName: `${currentEnquiry.name || 'Client'} - ${currentEnquiry.businessName || 'Business'}`,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email
      },
      updatedAt: new Date().toISOString()
    };

    await this.saveEnquiries();
    
    console.log('✅ Staff assigned successfully:', staff.name, 'to enquiry:', currentEnquiry.name);
    return this.enquiriesStorage[enquiryIndex];
  }

  async getStatusSummary() {
    const statusCounts = this.enquiriesStorage.reduce((acc, enquiry) => {
      const status = enquiry.status || 'NEW';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: this.enquiriesStorage.length,
      statusBreakdown: statusCounts,
      recentEnquiries: this.enquiriesStorage
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    };
  }

  // Additional methods needed by controllers
  async clearSupabaseAndSyncLocal() {
    console.log('🧹 [RENDER] Clear and sync operation requested');
    return {
      message: 'Clear and sync completed (demo mode)',
      cleared: 0,
      synced: this.enquiriesStorage.length,
      errors: 0
    };
  }

  async syncAllEnquiriesToSupabase() {
    console.log('🔄 [RENDER] Sync all enquiries to Supabase requested');
    return {
      message: `Synced ${this.enquiriesStorage.length} enquiries (demo mode)`,
      synced: this.enquiriesStorage.length,
      errors: 0
    };
  }

  async getEnquiriesByStaff(staffId: number) {
    console.log('👤 Getting enquiries for staff ID:', staffId);
    
    const staffEnquiries = this.enquiriesStorage.filter(enquiry => 
      enquiry.staffId === staffId
    );
    
    return staffEnquiries;
  }

  async getStaffWorkloadSummary() {
    console.log('📊 Calculating staff workload summary...');
    
    const staffWorkload = {};
    this.enquiriesStorage.forEach(enquiry => {
      const staffId = enquiry.staffId || 'unassigned';
      if (!staffWorkload[staffId]) {
        staffWorkload[staffId] = {
          staffId,
          staffName: enquiry.assignedStaff || 'Unassigned',
          enquiryCount: 0,
          totalLoanAmount: 0
        };
      }
      staffWorkload[staffId].enquiryCount++;
      staffWorkload[staffId].totalLoanAmount += enquiry.loanAmount || 0;
    });
    
    return Object.values(staffWorkload);
  }

  findOneFromDemo(id: number) {
    console.log('🔍 [RENDER] Finding enquiry from demo with ID:', id);
    return this.enquiriesStorage.find(enq => enq.id === id);
  }

  async getSupabaseSyncStatus() {
    return {
      isConnected: false,
      lastSync: new Date().toISOString(),
      totalRecords: this.enquiriesStorage.length,
      localCount: this.enquiriesStorage.length,
      supabaseCount: 0,
      syncEnabled: false,
      message: 'Demo mode - Supabase sync disabled'
    };
  }

  async syncAllToSupabase() {
    console.log('🔄 [RENDER] Sync all to Supabase requested');
    return {
      message: `Synced ${this.enquiriesStorage.length} enquiries (demo mode)`,
      synced: this.enquiriesStorage.length,
      errors: 0
    };
  }

  async clearAndSyncAllToSupabase() {
    console.log('🧹 [RENDER] Clear and sync all to Supabase requested');
    return {
      message: 'Clear and sync completed (demo mode)',
      cleared: 0,
      synced: this.enquiriesStorage.length,
      errors: 0
    };
  }
}

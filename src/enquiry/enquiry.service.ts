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
      
      console.log('📋 Loading enquiries...', { isRender, isProduction });
      
      // Use persistence service for production-ready data loading
      const enquiries = await this.persistenceService.loadData('enquiries', []);
      
      if (enquiries && enquiries.length > 0) {
        this.enquiriesStorage = enquiries;
        console.log('✅ Loaded', this.enquiriesStorage.length, 'enquiries from persistence service');
        
        // Ensure all enquiries have required fields for display
        this.enquiriesStorage = this.enquiriesStorage.map(enquiry => ({
          ...enquiry,
          clientName: enquiry.clientName || enquiry.name || enquiry.businessName,
          enquiryName: enquiry.enquiryName || `${enquiry.name || 'Client'} - ${enquiry.businessName || 'Business'}`
        }));
        
        // Save back to ensure consistency
        if (isRender || isProduction) {
          await this.saveEnquiries();
          console.log('💾 Enhanced enquiry data saved for deployment');
        }
      } else {
        // Create default demo enquiries if no data exists
        console.log('📋 No existing enquiries found, creating defaults...');
        await this.createDefaultEnquiries();
      }
    } catch (error) {
      console.log('📋 Error loading enquiries, creating default enquiries:', error.message);
      await this.createDefaultEnquiries();
    }
  }

  private async createDefaultEnquiries() {
    this.enquiriesStorage = [
      {
        id: 1,
        name: 'BALAMURUGAN',
        businessName: 'Balamurugan Enterprises',
        mobile: '9876543215',
        email: 'balamurugan@enterprises.com',
        businessType: 'Manufacturing',
        loanAmount: 500000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 4,
        assignedStaff: 'Pankil',
        clientName: 'BALAMURUGAN',
        enquiryName: 'BALAMURUGAN - Balamurugan Enterprises',
        staff: {
          id: 4,
          name: 'Pankil',
          email: 'govindamarketing9998@gmail.com',
          clientName: 'Pankil'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Rajesh Kumar',
        businessName: 'Kumar Electronics',
        mobile: '9876543210',
        email: 'rajesh@kumar.com',
        businessType: 'Electronics',
        loanAmount: 500000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 1,
        assignedStaff: 'Perivi',
        staff: {
          id: 1,
          name: 'Perivi',
          email: 'gowthaamankrishna1998@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
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
          email: 'gowthaamaneswar1998@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 4,
        name: 'Amit Patel',
        businessName: 'Patel Trading Co',
        mobile: '9876543212',
        email: 'amit@patel.com',
        businessType: 'Trading',
        loanAmount: 300000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 5,
        assignedStaff: 'Dinesh',
        staff: {
          id: 5,
          name: 'Dinesh',
          email: 'dinesh@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 5,
        name: 'Sunita Gupta',
        businessName: 'Gupta Enterprises',
        mobile: '9876543213',
        email: 'sunita@gupta.com',
        businessType: 'Manufacturing',
        loanAmount: 1000000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 3,
        assignedStaff: 'Harish',
        staff: {
          id: 3,
          name: 'Harish',
          email: 'newacttmis@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 6,
        name: 'Vikram Singh',
        businessName: 'Singh Motors',
        mobile: '9876543214',
        email: 'vikram@singh.com',
        businessType: 'Automotive',
        loanAmount: 600000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 6,
        assignedStaff: 'Nunciya',
        staff: {
          id: 6,
          name: 'Nunciya',
          email: 'tmsnunciya59@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 7,
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
        id: 8,
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
        id: 9,
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
          email: 'gowthaamaneswar1998@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 10,
        name: 'Poorani',
        businessName: 'Poorani Textiles',
        mobile: '9876543221',
        email: 'poorani@textiles.com',
        businessType: 'Textiles',
        loanAmount: 750000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 4,
        assignedStaff: 'Harish',
        staff: {
          id: 4,
          name: 'Harish',
          email: 'newacttmis@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 11,
        name: 'Manigandan M',
        businessName: 'Manigandan Industries',
        mobile: '9876543222',
        email: 'manigandan@industries.com',
        businessType: 'Manufacturing',
        loanAmount: 1000000,
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
        id: 12,
        name: 'Praba',
        businessName: 'Praba Enterprises',
        mobile: '9876543223',
        email: 'praba@enterprises.com',
        businessType: 'Services',
        loanAmount: 400000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 5,
        assignedStaff: 'Nunciya',
        staff: {
          id: 5,
          name: 'Nunciya',
          email: 'tmsnunciya59@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 13,
        name: 'Deepak Verma',
        businessName: 'Verma Construction',
        mobile: '9876543228',
        email: 'deepak@verma.com',
        businessType: 'Construction',
        loanAmount: 850000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 5,
        assignedStaff: 'Nunciya',
        staff: {
          id: 5,
          name: 'Nunciya',
          email: 'tmsnunciya59@gmail.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 14,
        name: 'Neha Agarwal',
        businessName: 'Agarwal Enterprises',
        mobile: '9876543229',
        email: 'neha@agarwal.com',
        businessType: 'Trading',
        loanAmount: 650000,
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        staffId: 6,
        assignedStaff: 'Admin User',
        staff: {
          id: 6,
          name: 'Admin User',
          email: 'admin@businessloan.com'
        },
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    
    // Save using persistence service for production compatibility
    await this.persistenceService.saveData('enquiries', this.enquiriesStorage);
    console.log('📋 Created', this.enquiriesStorage.length, 'COMPLETE demo enquiries for deployment');
    
    // Create notifications for all enquiries
    try {
      for (const enquiry of this.enquiriesStorage) {
        await this.notificationsService.notifyNewEnquiry(
          enquiry.id,
          enquiry.name,
          {
            loanAmount: enquiry.loanAmount,
            businessType: enquiry.businessType,
            mobile: enquiry.mobile,
            assignedStaff: enquiry.assignedStaff
          }
        );
      }
      console.log('🔔 Created notifications for all', this.enquiriesStorage.length, 'enquiries');
    } catch (error) {
      console.log('⚠️ Error creating notifications:', error.message);
    }
  }

  private async saveEnquiries() {
    try {
      const isRender = process.env.RENDER === 'true';
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Enhanced saving for Render deployment with retry mechanism
      let saveAttempts = 0;
      const maxAttempts = 3;
      
      while (saveAttempts < maxAttempts) {
        try {
          // Use persistence service for production-ready saving
          await this.persistenceService.saveData('enquiries', this.enquiriesStorage);
          console.log('💾 Saved', this.enquiriesStorage.length, 'enquiries via persistence service');
          
          // Additional backup save for Render deployment
          if (isRender || isProduction) {
            // Create backup timestamp
            const backupData = {
              timestamp: new Date().toISOString(),
              environment: isRender ? 'render' : 'production',
              count: this.enquiriesStorage.length,
              enquiries: this.enquiriesStorage
            };
            
            await this.persistenceService.saveData('enquiries_backup', backupData);
            console.log('🔄 Backup saved for deployment persistence');
          }
          
          break; // Success, exit retry loop
        } catch (saveError) {
          saveAttempts++;
          console.error(`❌ Save attempt ${saveAttempts} failed:`, saveError.message);
          
          if (saveAttempts >= maxAttempts) {
            throw saveError;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('❌ Error saving enquiries after all attempts:', error);
      // Don't throw error to prevent breaking the application flow
    }
  }

  async create(createEnquiryDto: CreateEnquiryDto, userId: number = 1) {
    console.log('📝 EnquiryService.create called with:', createEnquiryDto, 'userId:', userId);
    
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
    
    // Check for duplicate name (case-insensitive)
    const existingByName = this.enquiriesStorage.find(enquiry => 
      (enquiry.name && enquiry.name.toLowerCase() === createEnquiryDto.name?.toLowerCase()) ||
      (enquiry.businessName && enquiry.businessName.toLowerCase() === createEnquiryDto.businessName?.toLowerCase())
    );
    
    if (existingByName) {
      const existingName = existingByName.name || existingByName.businessName;
      throw new Error(`Client "${existingName}" already exists with phone number: ${existingByName.mobile}`);
    }
    
    // Generate 1-2 digit ID using ID generator service
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
      clientName: clientName, // Add client name for display
      enquiryName: `${clientName} - ${businessName}`, // Add enquiry name for staff display
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
    await this.saveEnquiries();
    console.log('✅ Enquiry saved to local storage:', mockEnquiry.name);
    
    // 2. Auto-sync to Supabase using unified sync service (non-blocking)
    this.autoSyncEnquiry(mockEnquiry).catch(error => {
      console.error('❌ Failed to auto-sync enquiry:', error);
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

  // Auto-sync enquiry using unified sync service
  private async autoSyncEnquiry(enquiry: any): Promise<void> {
    try {
      await this.unifiedSupabaseSync.autoSync(enquiry, 'enquiry');
    } catch (error) {
      console.error('❌ Auto-sync enquiry failed:', error);
    }
  }

  // Enhanced method to automatically sync enquiry to Supabase for Vercel & Render
  private async syncToSupabase(enquiry: any): Promise<void> {
    // Only sync in actual production deployments
    const isProduction = process.env.NODE_ENV === 'production';
    const isRenderProduction = process.env.RENDER === 'true' && isProduction;
    const isVercelProduction = process.env.VERCEL === '1' && isProduction;
    
    // Skip sync in development or local environments
    if (!isProduction || (!isRenderProduction && !isVercelProduction)) {
      console.log('🔧 [DEV] Skipping Supabase sync - not in production deployment');
      console.log('🔧 Environment:', {
        nodeEnv: process.env.NODE_ENV,
        isRender: process.env.RENDER === 'true',
        isVercel: process.env.VERCEL === '1',
        isProduction,
        skipSync: true
      });
      return;
    }
    
    try {
      console.log('🚀 [DEPLOYMENT] Auto-syncing enquiry to Supabase:', enquiry.name);
      console.log('🌍 Environment:', {
        nodeEnv: process.env.NODE_ENV,
        isVercel: process.env.VERCEL === '1',
        isRender: process.env.RENDER === 'true',
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
      });
      
      // Use environment variables for deployment security
      const supabaseUrl = process.env.SUPABASE_URL || 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      // Import Supabase client for deployment-ready sync
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Enhanced duplicate check for deployment reliability
      const { data: existingByPhone, error: checkError } = await supabase
        .from('Enquiry')
        .select('id, name, mobile')
        .eq('mobile', enquiry.mobile)
        .maybeSingle(); // Use maybeSingle to avoid errors when no match
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking duplicates in Supabase:', checkError);
        throw checkError;
      }
      
      if (existingByPhone) {
        console.log('⚠️ Phone number already exists in Supabase, skipping sync:', enquiry.mobile);
        return;
      }
      
      // Enhanced data structure for deployment compatibility
      const supabaseData = {
        id: enquiry.id,
        date: enquiry.createdAt,
        name: enquiry.name,
        businessName: enquiry.businessName || enquiry.businessType || null,
        ownerName: enquiry.name,
        mobile: enquiry.mobile,
        email: enquiry.email || null,
        businessType: enquiry.businessType || 'General Business',
        loanAmount: enquiry.loanAmount || null,
        source: enquiry.source || 'WEBSITE',
        interestStatus: enquiry.interestStatus || 'INTERESTED',
        staffId: enquiry.staffId || 1,
        assignedStaff: enquiry.staff?.name || 'Auto-Assigned',
        createdAt: enquiry.createdAt,
        updatedAt: enquiry.updatedAt
      };
      
      // Deployment-ready insert with enhanced error handling
      const { data, error } = await supabase
        .from('Enquiry')
        .insert(supabaseData)
        .select();
      
      if (error) {
        console.error('❌ [DEPLOYMENT] Auto-sync error:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ [DEPLOYMENT] Successfully auto-synced to Supabase:', {
        name: enquiry.name,
        id: enquiry.id,
        mobile: enquiry.mobile,
        supabaseId: data?.[0]?.id,
        environment: process.env.VERCEL === '1' ? 'Vercel' : 
                    process.env.RENDER === 'true' ? 'Render' : 'Local'
      });
    } catch (error) {
      console.error('❌ [DEPLOYMENT] Failed to auto-sync enquiry to Supabase:', error);
      console.error('❌ Sync failure details:', {
        enquiryId: enquiry.id,
        enquiryName: enquiry.name,
        error: error.message,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isVercel: process.env.VERCEL === '1',
          isRender: process.env.RENDER === 'true'
        }
      });
      // Don't throw error - this is background sync, shouldn't break the main flow
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

    // Updated staff data with correct IDs and names for proper client display
    const staffData = {
      1: { id: 1, name: 'Perivi', email: 'gowthaamankrishna1998@gmail.com', clientName: 'Perivi' },
      2: { id: 2, name: 'Venkat', email: 'gowthaamaneswar1998@gmail.com', clientName: 'Venkat' },
      3: { id: 3, name: 'Harish', email: 'newacttmis@gmail.com', clientName: 'Harish' },
      4: { id: 4, name: 'Pankil', email: 'govindamarketing9998@gmail.com', clientName: 'Pankil' },
      5: { id: 5, name: 'Dinesh', email: 'dinesh@gmail.com', clientName: 'Dinesh' },
      6: { id: 6, name: 'Nanciya', email: 'tmsnunciya59@gmail.com', clientName: 'Nanciya' },
      7: { id: 7, name: 'Admin User', email: 'admin@gmail.com', clientName: 'Admin User' }
    };

    const staff = staffData[staffId];
    if (!staff) {
      console.log('❌ Staff not found with ID:', staffId);
      throw new NotFoundException('Staff not found');
    }

    // Update the enquiry in storage with enhanced client information
    const currentEnquiry = this.enquiriesStorage[enquiryIndex];
    this.enquiriesStorage[enquiryIndex] = {
      ...currentEnquiry,
      staffId: staffId,
      assignedStaff: staff.name,
      clientName: currentEnquiry.name || currentEnquiry.businessName, // Add client name for display
      enquiryName: `${currentEnquiry.name || 'Client'} - ${currentEnquiry.businessName || 'Business'}`, // Combined enquiry name
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        clientName: staff.clientName
      },
      updatedAt: new Date().toISOString()
    };

    // Save to file
    await this.saveEnquiries();
    
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

    // Update staff service with new assignment for dashboard
    try {
      if (this.staffService) {
        await this.staffService.updateStaffAssignment(staffId, updatedEnquiry);
        console.log('✅ Staff dashboard updated with new assignment');
      }
    } catch (error) {
      console.error('❌ Failed to update staff dashboard:', error);
    }

    // Auto-sync updated enquiry to Supabase in background
    this.autoSyncEnquiry(updatedEnquiry).catch(error => {
      console.error('❌ Failed to auto-sync staff assignment:', error);
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

    await this.saveEnquiries();
    return this.enquiriesStorage[enquiryIndex];
  }

  async remove(id: number, userId: number) {
    console.log('📋 Removing enquiry with ID:', id);
    const enquiryIndex = this.enquiriesStorage.findIndex(e => e.id === id);
    if (enquiryIndex === -1) {
      throw new NotFoundException(`Enquiry with ID ${id} not found`);
    }

    const removedEnquiry = this.enquiriesStorage.splice(enquiryIndex, 1)[0];
    await this.saveEnquiries();
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

  // Get enquiries assigned to a specific staff member
  async getEnquiriesByStaff(staffId: number) {
    console.log('👤 Getting enquiries for staff ID:', staffId);
    
    const staffEnquiries = this.enquiriesStorage.filter(enquiry => 
      enquiry.staffId === staffId
    );
    
    // Enhance enquiries with proper display information
    const enhancedEnquiries = staffEnquiries.map(enquiry => ({
      ...enquiry,
      clientName: enquiry.clientName || enquiry.name || enquiry.businessName,
      enquiryName: enquiry.enquiryName || `${enquiry.name || 'Client'} - ${enquiry.businessName || 'Business'}`,
      displayName: enquiry.name || enquiry.businessName || 'Unknown Client'
    }));
    
    console.log(`📋 Found ${enhancedEnquiries.length} enquiries for staff ${staffId}`);
    return enhancedEnquiries;
  }

  // Get staff workload summary
  async getStaffWorkloadSummary() {
    console.log('📊 Calculating staff workload summary...');
    
    const staffWorkload = {};
    
    // Count enquiries per staff member
    this.enquiriesStorage.forEach(enquiry => {
      const staffId = enquiry.staffId;
      const staffName = enquiry.assignedStaff || enquiry.staff?.name || 'Unassigned';
      
      if (!staffWorkload[staffId]) {
        staffWorkload[staffId] = {
          staffId: staffId,
          staffName: staffName,
          totalEnquiries: 0,
          clients: []
        };
      }
      
      staffWorkload[staffId].totalEnquiries++;
      staffWorkload[staffId].clients.push({
        id: enquiry.id,
        clientName: enquiry.clientName || enquiry.name || enquiry.businessName,
        enquiryName: enquiry.enquiryName || `${enquiry.name || 'Client'} - ${enquiry.businessName || 'Business'}`,
        loanAmount: enquiry.loanAmount,
        businessType: enquiry.businessType,
        mobile: enquiry.mobile,
        createdAt: enquiry.createdAt
      });
    });
    
    const summary = Object.values(staffWorkload);
    console.log('📊 Staff workload summary:', summary.length, 'staff members');
    
    return summary;
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

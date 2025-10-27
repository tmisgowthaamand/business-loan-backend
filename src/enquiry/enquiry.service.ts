import { Injectable, Logger, Optional } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EnquiryService {
  private readonly logger = new Logger(EnquiryService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly enquiriesFile = path.join(this.dataDir, 'enquiries.json');
  private enquiriesStorage: any[] = [];

  constructor(@Optional() private readonly supabaseService?: SupabaseService) {
    this.initializeEnquiries();
  }

  private async initializeEnquiries() {
    this.logger.log('🔧 Initializing enquiry service...');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Load existing enquiries from file
    await this.loadEnquiries();

    // If no enquiries exist, create sample data
    if (this.enquiriesStorage.length === 0) {
      await this.createSampleEnquiries();
    }

    this.logger.log(`✅ Enquiry service initialized with ${this.enquiriesStorage.length} enquiries`);
  }

  private async loadEnquiries() {
    try {
      if (fs.existsSync(this.enquiriesFile)) {
        const fileData = fs.readFileSync(this.enquiriesFile, 'utf8');
        this.enquiriesStorage = JSON.parse(fileData);
        this.logger.log(`📂 Loaded ${this.enquiriesStorage.length} enquiries from file`);
      }
    } catch (error) {
      this.logger.error('❌ Error loading enquiries from file:', error);
      this.enquiriesStorage = [];
    }
  }

  private async saveEnquiries() {
    try {
      fs.writeFileSync(this.enquiriesFile, JSON.stringify(this.enquiriesStorage, null, 2));
      this.logger.log(`💾 Saved ${this.enquiriesStorage.length} enquiries to file`);
    } catch (error) {
      this.logger.error('❌ Error saving enquiries to file:', error);
    }
  }

  private async createSampleEnquiries() {
    const sampleEnquiries = [
      {
        id: 1,
        name: 'BALAMURUGAN',
        businessName: 'Balamurugan Enterprises',
        mobile: '9876543215',
        email: 'balamurugan@enterprises.com',
        businessType: 'Manufacturing',
        loanAmount: 500000,
        district: 'Chennai',
        constitution: 'Proprietorship',
        gstStatus: 'Registered',
        capAmount: 50000,
        bankAccount: 'Yes',
        statementDuration: '12 months',
        status: 'APPROVED',
        priority: 'High',
        assignedStaff: 'Perivi',
        source: 'ONLINE_APPLICATION',
        interestStatus: 'Very Interested',
        createdAt: new Date('2024-10-16T10:37:11.406Z').toISOString(),
        updatedAt: new Date('2024-10-16T10:37:11.406Z').toISOString()
      },
      {
        id: 2,
        name: 'VIGNESH S',
        businessName: 'Vignesh Trading',
        mobile: '9876543220',
        email: 'vignesh@trading.com',
        businessType: 'Trading',
        loanAmount: 300000,
        district: 'Coimbatore',
        constitution: 'Partnership',
        gstStatus: 'Registered',
        capAmount: 30000,
        bankAccount: 'Yes',
        statementDuration: '6 months',
        status: 'PROCESSING',
        priority: 'Medium',
        assignedStaff: 'Venkat',
        source: 'WALK_IN',
        interestStatus: 'Interested',
        createdAt: new Date('2024-10-15T09:20:30.123Z').toISOString(),
        updatedAt: new Date('2024-10-15T09:20:30.123Z').toISOString()
      },
      {
        id: 3,
        name: 'Poorani',
        businessName: 'Poorani Textiles',
        mobile: '9876543221',
        email: 'poorani@textiles.com',
        businessType: 'Textiles',
        loanAmount: 750000,
        district: 'Madurai',
        constitution: 'Private Limited',
        gstStatus: 'Registered',
        capAmount: 75000,
        bankAccount: 'Yes',
        statementDuration: '12 months',
        status: 'DOCUMENT_VERIFICATION',
        priority: 'High',
        assignedStaff: 'Harish',
        source: 'REFERRAL',
        interestStatus: 'Very Interested',
        createdAt: new Date('2024-10-14T14:15:45.789Z').toISOString(),
        updatedAt: new Date('2024-10-14T14:15:45.789Z').toISOString()
      },
      {
        id: 4,
        name: 'Manigandan M',
        businessName: 'Manigandan Industries',
        mobile: '9876543222',
        email: 'manigandan@industries.com',
        businessType: 'Manufacturing',
        loanAmount: 1000000,
        district: 'Salem',
        constitution: 'Private Limited',
        gstStatus: 'Registered',
        capAmount: 100000,
        bankAccount: 'Yes',
        statementDuration: '18 months',
        status: 'SHORTLISTED',
        priority: 'High',
        assignedStaff: 'Dinesh',
        source: 'ONLINE_APPLICATION',
        interestStatus: 'Very Interested',
        createdAt: new Date('2024-10-13T11:30:15.456Z').toISOString(),
        updatedAt: new Date('2024-10-13T11:30:15.456Z').toISOString()
      },
      {
        id: 5,
        name: 'Rajesh Kumar',
        businessName: 'Kumar Exports',
        mobile: '9876543224',
        email: 'rajesh@kumarexports.com',
        businessType: 'Export',
        loanAmount: 800000,
        district: 'Chennai',
        constitution: 'Private Limited',
        gstStatus: 'Registered',
        capAmount: 80000,
        bankAccount: 'Yes',
        statementDuration: '24 months',
        status: 'APPROVED',
        priority: 'High',
        assignedStaff: 'Perivi',
        source: 'ONLINE_APPLICATION',
        interestStatus: 'Very Interested',
        createdAt: new Date('2024-10-10T14:20:15.789Z').toISOString(),
        updatedAt: new Date('2024-10-10T14:20:15.789Z').toISOString()
      }
    ];

    this.enquiriesStorage = sampleEnquiries;
    await this.saveEnquiries();
    this.logger.log(`✅ Created ${sampleEnquiries.length} sample enquiries with persistent data`);
  }

  async findAll(query?: any) {
    try {
      // Try to get from Supabase first if available
      if (this.supabaseService?.isConnected()) {
        const supabase = this.supabaseService.getClient();
        const { data: supabaseEnquiries, error } = await supabase
          .from('enquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && supabaseEnquiries && supabaseEnquiries.length > 0) {
          this.logger.log(`📊 Retrieved ${supabaseEnquiries.length} enquiries from Supabase`);
          return supabaseEnquiries;
        }
      }

      // Fallback to local storage
      return this.enquiriesStorage.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      this.logger.error('❌ Error fetching enquiries:', error);
      return this.enquiriesStorage;
    }
  }

  async create(createEnquiryDto: any) {
    const newEnquiry = {
      id: Date.now(),
      ...createEnquiryDto,
      status: createEnquiryDto.status || 'NEW',
      priority: createEnquiryDto.priority || 'Medium',
      source: createEnquiryDto.source || 'ONLINE_APPLICATION',
      interestStatus: createEnquiryDto.interestStatus || 'Interested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to local storage
    this.enquiriesStorage.push(newEnquiry);
    await this.saveEnquiries();

    // Sync to Supabase in background
    this.syncToSupabase(newEnquiry);

    this.logger.log(`✅ Created new enquiry: ${newEnquiry.name}`);
    return newEnquiry;
  }

  async findOne(id: number) {
    try {
      // Try Supabase first
      if (this.supabaseService?.isConnected()) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
          .from('enquiries')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return data;
        }
      }

      // Fallback to local storage
      return this.enquiriesStorage.find(enquiry => enquiry.id === id);
    } catch (error) {
      this.logger.error('❌ Error finding enquiry:', error);
      return this.enquiriesStorage.find(enquiry => enquiry.id === id);
    }
  }

  async update(id: number, updateEnquiryDto: any) {
    const index = this.enquiriesStorage.findIndex(enquiry => enquiry.id === id);
    if (index !== -1) {
      this.enquiriesStorage[index] = { 
        ...this.enquiriesStorage[index], 
        ...updateEnquiryDto,
        updatedAt: new Date().toISOString()
      };
      await this.saveEnquiries();

      // Sync to Supabase in background
      this.syncToSupabase(this.enquiriesStorage[index]);

      return this.enquiriesStorage[index];
    }
    return null;
  }

  async remove(id: number) {
    const index = this.enquiriesStorage.findIndex(enquiry => enquiry.id === id);
    if (index !== -1) {
      const removed = this.enquiriesStorage.splice(index, 1);
      await this.saveEnquiries();
      return removed[0];
    }
    return null;
  }

  private async syncToSupabase(enquiry: any) {
    if (!this.supabaseService?.isConnected()) return;

    try {
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase
        .from('enquiries')
        .upsert(enquiry, { onConflict: 'id' });

      if (error) {
        this.logger.error('❌ Failed to sync enquiry to Supabase:', error);
      } else {
        this.logger.log(`🔄 Synced enquiry ${enquiry.name} to Supabase`);
      }
    } catch (error) {
      this.logger.error('❌ Error syncing to Supabase:', error);
    }
  }
}

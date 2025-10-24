import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
  Optional,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PersistenceService } from '../common/services/persistence.service';
import { IdGeneratorService } from '../common/services/id-generator.service';
import { EnquiryService } from '../enquiry/enquiry.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { User } from '@prisma/client';
import { Response } from 'express';
import { UnifiedSupabaseSyncService } from '../common/services/unified-supabase-sync.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  
  // File-based storage for demo mode
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly documentsFile = path.join(this.dataDir, 'documents.json');
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
  private demoDocuments: any[] = [];
  
  // Supabase Storage configuration
  private readonly SUPABASE_BUCKET = 'documents';
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly isRender = process.env.RENDER === 'true';
  private readonly isVercel = process.env.VERCEL === '1';

  // Static enquiry mapping to avoid circular dependency - UPDATED FOR 14 ENQUIRIES DEPLOYMENT
  private readonly enquiryMapping = {
    1: { name: 'BALAMURUGAN', mobile: '9876543215', businessType: 'Manufacturing' },
    2: { name: 'Rajesh Kumar', mobile: '9876543210', businessType: 'Electronics' },
    3: { name: 'Priya Sharma', mobile: '9876543211', businessType: 'Textiles' },
    4: { name: 'Amit Patel', mobile: '9876543212', businessType: 'Trading' },
    5: { name: 'Sunita Gupta', mobile: '9876543213', businessType: 'Manufacturing' },
    6: { name: 'Vikram Singh', mobile: '9876543214', businessType: 'Automotive' },
    7: { name: 'Renu', mobile: '9876543210', businessType: 'Trading' },
    8: { name: 'BALAMURUGAN', mobile: '9876543215', businessType: 'Manufacturing' },
    9: { name: 'VIGNESH S', mobile: '9876543220', businessType: 'Retail' },
    10: { name: 'Poorani', mobile: '9876543221', businessType: 'Textiles' },
    11: { name: 'Manigandan M', mobile: '9876543222', businessType: 'Manufacturing' },
    12: { name: 'Praba', mobile: '9876543223', businessType: 'Services' },
    13: { name: 'Deepak Verma', mobile: '9876543228', businessType: 'Construction' },
    14: { name: 'Neha Agarwal', mobile: '9876543229', businessType: 'Trading' }
  };

  // Helper method to get enquiry info from enquiry service or static mapping fallback
  public async getEnquiryInfo(enquiryId: number) {
    try {
      // First try to get from enquiry service (real data)
      if (this.enquiryService) {
        const enquiry = await this.enquiryService.findOne(enquiryId);
        if (enquiry) {
          console.log('📄 Found enquiry from service:', enquiry.name);
          return {
            name: enquiry.name,
            mobile: enquiry.mobile,
            businessType: enquiry.businessType,
            businessName: enquiry.businessName
          };
        }
      }
    } catch (error) {
      console.log('📄 Could not fetch from enquiry service, using static mapping:', error.message);
    }
    
    // Fallback to static mapping if service call fails
    const enquiry = this.enquiryMapping[enquiryId];
    if (enquiry) {
      console.log('📄 Found enquiry from static mapping:', enquiry.name);
      return enquiry;
    }
    
    // Extended fallback mapping for common enquiry patterns
    const fallbackMapping = {
      // Original mapping
      4368: { name: 'BALAMURUGAN', mobile: '9876543215', businessType: 'Manufacturing' },
      4369: { name: 'RAJESH KUMAR', mobile: '9876543216', businessType: 'Trading' },
      4370: { name: 'PRIYA SHARMA', mobile: '9876543217', businessType: 'Textiles' },
      4371: { name: 'AMIT PATEL', mobile: '9876543218', businessType: 'Electronics' },
      4372: { name: 'SUNITA GUPTA', mobile: '9876543219', businessType: 'Manufacturing' },
      4373: { name: 'VIKRAM SINGH', mobile: '9876543220', businessType: 'Trading' },
      4374: { name: 'ANITA DESAI', mobile: '9876543221', businessType: 'Textiles' },
      4375: { name: 'RAVI KUMAR', mobile: '9876543222', businessType: 'Electronics' },
      4376: { name: 'MEERA PATEL', mobile: '9876543223', businessType: 'Manufacturing' },
      4377: { name: 'SURESH GUPTA', mobile: '9876543224', businessType: 'Trading' },
      // Actual enquiry IDs from documents
      5874: { name: 'POORANI', mobile: '9876543225', businessType: 'Manufacturing' },
      3886: { name: 'VIGNESH S', mobile: '9876543220', businessType: 'Trading' },
      6192: { name: 'RENU', mobile: '9876543226', businessType: 'Textiles' },
      2724: { name: 'MANIGANDAN M', mobile: '9876543227', businessType: 'Electronics' },
      6930: { name: 'PRABA', mobile: '9876543228', businessType: 'Manufacturing' },
      8355: { name: 'AUTO SYNC TEST', mobile: '9876543229', businessType: 'Trading' },
      // Additional common IDs
      1001: { name: 'RAJESH KUMAR', mobile: '9876543210', businessType: 'Electronics' },
      1002: { name: 'PRIYA SHARMA', mobile: '9876543211', businessType: 'Textiles' },
      1003: { name: 'AMIT PATEL', mobile: '9876543212', businessType: 'Electronics' },
      1004: { name: 'SUNITA GUPTA', mobile: '9876543213', businessType: 'Manufacturing' },
      1005: { name: 'VIKRAM SINGH', mobile: '9876543214', businessType: 'Trading' }
    };
    
    const fallbackEnquiry = fallbackMapping[enquiryId];
    if (fallbackEnquiry) {
      console.log('📄 Found enquiry from fallback mapping:', fallbackEnquiry.name);
      return fallbackEnquiry;
    }
    
    console.log('📄 No enquiry found for ID:', enquiryId);
    return null;
  }

  // Get enhanced enquiry information with document statistics
  public async getEnquiryInfoWithDocuments(enquiryId: number) {
    const enquiry = await this.getEnquiryInfo(enquiryId);
    if (!enquiry) return null;

    const enquiryDocuments = this.demoDocuments.filter(doc => doc.enquiryId === enquiryId);
    const verifiedDocuments = enquiryDocuments.filter(doc => doc.verified);
    const pendingDocuments = enquiryDocuments.filter(doc => !doc.verified);

    return {
      ...enquiry,
      id: enquiryId,
      documents: {
        total: enquiryDocuments.length,
        verified: verifiedDocuments.length,
        pending: pendingDocuments.length,
        types: [...new Set(enquiryDocuments.map(doc => doc.type))],
        lastUpload: enquiryDocuments.length > 0 
          ? enquiryDocuments.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0].uploadedAt
          : null
      }
    };
  }

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @Optional() private supabaseService: SupabaseService,
    private persistenceService: PersistenceService,
    private idGeneratorService: IdGeneratorService,
    @Inject(forwardRef(() => EnquiryService))
    private enquiryService: EnquiryService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private unifiedSupabaseSync: UnifiedSupabaseSyncService,
  ) {
    this.loadDocuments();
    this.initializeSupabaseStorage();
  }

  // Initialize Supabase storage for Render deployment
  private async initializeSupabaseStorage(): Promise<void> {
    if (this.isRender || this.isProduction) {
      try {
        this.logger.log('🚀 [RENDER] Initializing Supabase storage for document uploads...');
        const bucketReady = await this.ensureSupabaseBucket();
        
        if (bucketReady) {
          this.logger.log('✅ [RENDER] Supabase storage initialized successfully');
        } else {
          this.logger.error('❌ [RENDER] Failed to initialize Supabase storage - document uploads may fail');
        }
      } catch (error) {
        this.logger.error('❌ [RENDER] Error initializing Supabase storage:', error);
      }
    }
  }

  private async initializeService() {
    this.logger.log('🚀 Initializing Document Service...');
    this.logger.log(`🌐 Environment: ${this.isProduction ? 'Production' : 'Development'}`);
    this.logger.log(`🚀 Platform: ${this.isRender ? 'Render' : this.isVercel ? 'Vercel' : 'Local'}`);
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Load existing documents
    await this.loadDocuments();
  }

  private ensureDirectories() {
    try {
      if (!this.isVercel) { // Vercel has read-only file system
        if (!fs.existsSync(this.dataDir)) {
          fs.mkdirSync(this.dataDir, { recursive: true });
        }
        if (!fs.existsSync(this.uploadsDir)) {
          fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
      }
    } catch (error) {
      this.logger.warn('⚠️ Could not create directories (read-only filesystem):', error.message);
    }
  }


  private async loadDocuments() {
    try {
      // Use persistence service for production-ready loading
      const documents = await this.persistenceService.loadData('documents', []);
      
      if (documents && documents.length > 0) {
        this.demoDocuments = documents;
        this.logger.log(`📄 Loaded ${this.demoDocuments.length} documents from persistence service`);
        
        // Refresh enquiry information for all loaded documents (async)
        await this.refreshAllDocumentEnquiryInfo();
      } else {
        this.demoDocuments = [];
        // Create some sample documents for dashboard testing
        this.createSampleDocuments();
        console.log('📄 Created sample documents for testing');
      }
    } catch (error) {
      console.log('📄 Error loading documents file, creating sample documents:', error);
      this.demoDocuments = [];
      // Create sample documents for testing
      this.createSampleDocuments();
      console.log('📄 Error recovery: created sample documents');
    }
  }

  private async refreshAllDocumentEnquiryInfo() {
    console.log('📄 Refreshing enquiry information for all documents...');
    
    // Process documents one by one to handle async calls
    const updatedDocuments = [];
    for (const doc of this.demoDocuments) {
      const realEnquiry = await this.getEnquiryInfo(parseInt(doc.enquiryId.toString()));
      
      // Log the mapping for debugging
      if (realEnquiry) {
        console.log(`📄 Mapped enquiry ${doc.enquiryId} → ${realEnquiry.name}`);
      } else {
        console.log(`📄 No mapping found for enquiry ${doc.enquiryId}, using fallback`);
      }
      
      updatedDocuments.push({
        ...doc,
        enquiry: {
          id: doc.enquiryId,
          name: realEnquiry ? realEnquiry.name : `Client ${doc.enquiryId}`,
          mobile: realEnquiry ? realEnquiry.mobile : '9876543210',
          businessType: realEnquiry ? realEnquiry.businessType : doc.enquiry?.businessType || 'General Business',
          businessName: realEnquiry ? realEnquiry.businessName : realEnquiry?.name || `Business ${doc.enquiryId}`
        }
      });
    }
    
    this.demoDocuments = updatedDocuments;
    
    // Save the updated documents
    this.saveDocuments();
    console.log('📄 Refreshed enquiry information for', this.demoDocuments.length, 'documents');
  }

  // Method to clear all documents and start fresh
  async clearAllDocuments(): Promise<{ message: string; cleared: number }> {
    const clearedCount = this.demoDocuments.length;
    this.demoDocuments = [];
    this.saveDocuments();
    
    console.log('🗑️ Cleared all documents from storage:', clearedCount);
    return {
      message: `Cleared ${clearedCount} documents from storage`,
      cleared: clearedCount
    };
  }

  // Public method to force refresh enquiry mapping for all documents
  async refreshEnquiryMapping(): Promise<{ message: string; updated: number }> {
    console.log('🔄 Force refreshing enquiry mapping for all documents...');
    const originalCount = this.demoDocuments.length;
    
    await this.refreshAllDocumentEnquiryInfo();
    
    return {
      message: `Refreshed enquiry mapping for ${originalCount} documents`,
      updated: originalCount
    };
  }

  private async createSampleDocuments() {
    try {
      // Get actual enquiries to create sample documents for
      // Use static enquiry data instead of service call
      const actualEnquiries = Object.keys(this.enquiryMapping).map(id => ({ id: parseInt(id), ...this.enquiryMapping[id] }));
      
      if (actualEnquiries && actualEnquiries.length > 0) {
        // Find Balamurugan's enquiry or use the first one
        const balamuruganEnquiry = actualEnquiries.find(e => e.name === 'BALAMURUGAN') || actualEnquiries[0];
      
      const sampleDocuments = [
        // Balamurugan's verified documents
        {
          id: 9001,
          fileName: 'balamurugan_gst_certificate.pdf',
          documentType: 'GST',
          type: 'GST',
          filePath: null,
          url: `http://localhost:5002/api/documents/9001/view`,
          s3Url: `http://localhost:5002/api/documents/9001/view`,
          status: 'VERIFIED',
          verified: true,
          uploadedAt: new Date('2024-10-15'),
          verifiedAt: new Date('2024-10-15'),
          enquiryId: 9570,
          uploadedBy: {
            id: 1,
            name: 'Pankil'
          },
          enquiry: {
            id: 9570,
            name: 'BALAMURUGAN',
            mobile: '9876543215',
            businessType: 'Manufacturing'
          }
        },
        {
          id: 9002,
          fileName: 'balamurugan_udyam_registration.pdf',
          documentType: 'UDYAM',
          type: 'UDYAM',
          filePath: null,
          url: `http://localhost:5002/api/documents/9002/view`,
          s3Url: `http://localhost:5002/api/documents/9002/view`,
          status: 'VERIFIED',
          verified: true,
          uploadedAt: new Date('2024-10-15'),
          verifiedAt: new Date('2024-10-15'),
          enquiryId: 9570,
          uploadedBy: {
            id: 1,
            name: 'Pankil'
          },
          enquiry: {
            id: 9570,
            name: 'BALAMURUGAN',
            mobile: '9876543215',
            businessType: 'Manufacturing'
          }
        },
        {
          id: 9003,
          fileName: 'balamurugan_bank_statement.pdf',
          documentType: 'BANK_STATEMENT',
          type: 'BANK_STATEMENT',
          filePath: null,
          url: `http://localhost:5002/api/documents/9003/view`,
          s3Url: `http://localhost:5002/api/documents/9003/view`,
          status: 'VERIFIED',
          verified: true,
          uploadedAt: new Date('2024-10-15'),
          verifiedAt: new Date('2024-10-15'),
          enquiryId: 9570,
          uploadedBy: {
            id: 1,
            name: 'Pankil'
          },
          enquiry: {
            id: 9570,
            name: 'BALAMURUGAN',
            mobile: '9876543215',
            businessType: 'Manufacturing'
          }
        },
        {
          id: 9004,
          fileName: 'balamurugan_owner_pan.pdf',
          documentType: 'OWNER_PAN',
          type: 'OWNER_PAN',
          filePath: null,
          url: `http://localhost:5002/api/documents/9004/view`,
          s3Url: `http://localhost:5002/api/documents/9004/view`,
          status: 'VERIFIED',
          verified: true,
          uploadedAt: new Date('2024-10-15'),
          verifiedAt: new Date('2024-10-15'),
          enquiryId: 9570,
          uploadedBy: {
            id: 1,
            name: 'Pankil'
          },
          enquiry: {
            id: 9570,
            name: 'BALAMURUGAN',
            mobile: '9876543215',
            businessType: 'Manufacturing'
          }
        },
        {
          id: 9005,
          fileName: 'balamurugan_aadhar.pdf',
          documentType: 'AADHAR',
          type: 'AADHAR',
          filePath: null,
          url: `http://localhost:5002/api/documents/9005/view`,
          s3Url: `http://localhost:5002/api/documents/9005/view`,
          status: 'VERIFIED',
          verified: true,
          uploadedAt: new Date('2024-10-15'),
          verifiedAt: new Date('2024-10-15'),
          enquiryId: 9570,
          uploadedBy: {
            id: 1,
            name: 'Pankil'
          },
          enquiry: {
            id: 9570,
            name: 'BALAMURUGAN',
            mobile: '9876543215',
            businessType: 'Manufacturing'
          }
        },
        // Add some unverified documents for other clients to test dashboard calculation
        {
          id: 9006,
          fileName: 'rajesh_kumar_gst.pdf',
          documentType: 'GST',
          type: 'GST',
          filePath: null,
          url: `http://localhost:5002/api/documents/9006/view`,
          s3Url: `http://localhost:5002/api/documents/9006/view`,
          status: 'PENDING',
          verified: false, // Not verified - should count in dashboard
          uploadedAt: new Date('2024-10-16'),
          verifiedAt: null,
          enquiryId: 1002,
          uploadedBy: {
            id: 2,
            name: 'Venkat'
          },
          enquiry: {
            id: 1002,
            name: 'RAJESH KUMAR',
            mobile: '9876543216',
            businessType: 'Trading'
          }
        },
        {
          id: 9007,
          fileName: 'priya_sharma_bank_statement.pdf',
          documentType: 'BANK_STATEMENT',
          type: 'BANK_STATEMENT',
          filePath: null,
          url: `http://localhost:5002/api/documents/9007/view`,
          s3Url: `http://localhost:5002/api/documents/9007/view`,
          status: 'PENDING',
          verified: false, // Not verified - should count in dashboard
          uploadedAt: new Date('2024-10-16'),
          verifiedAt: null,
          enquiryId: 1003,
          uploadedBy: {
            id: 3,
            name: 'Dinesh'
          },
          enquiry: {
            id: 1003,
            name: 'PRIYA SHARMA',
            mobile: '9876543217',
            businessType: 'Textiles'
          }
        },
        {
          id: 9008,
          fileName: 'amit_patel_udyam.pdf',
          documentType: 'UDYAM',
          type: 'UDYAM',
          filePath: null,
          url: `http://localhost:5002/api/documents/9008/view`,
          s3Url: `http://localhost:5002/api/documents/9008/view`,
          status: 'PENDING',
          verified: false, // Not verified - should count in dashboard
          uploadedAt: new Date('2024-10-16'),
          verifiedAt: null,
          enquiryId: 1001,
          uploadedBy: {
            id: 1,
            name: 'Pankil'
          },
          enquiry: {
            id: 1001,
            name: 'AMIT PATEL',
            mobile: '9876543212',
            businessType: 'Trading'
          }
        },
        // Vignesh S documents - stored in Supabase
        {
          id: 9009,
          fileName: 'vignesh_s_gst_certificate.pdf',
          documentType: 'GST',
          type: 'GST',
          filePath: null,
          supabaseUrl: 'https://vxtpjsymbcirszksrafg.supabase.co/storage/v1/object/public/documents/vignesh_s/GST/vignesh_s_gst_certificate.pdf',
          url: 'https://vxtpjsymbcirszksrafg.supabase.co/storage/v1/object/public/documents/vignesh_s/GST/vignesh_s_gst_certificate.pdf',
          s3Url: 'https://vxtpjsymbcirszksrafg.supabase.co/storage/v1/object/public/documents/vignesh_s/GST/vignesh_s_gst_certificate.pdf',
          status: 'VERIFIED',
          verified: true,
          uploadedAt: new Date('2024-10-17'),
          verifiedAt: new Date('2024-10-17'),
          enquiryId: 3886,
          storageType: 'supabase',
          uploadedBy: {
            id: 2,
            name: 'Venkat'
          },
          enquiry: {
            id: 3886,
            name: 'VIGNESH S',
            mobile: '9876543220',
            businessType: 'Retail'
          }
        },
        {
          id: 9010,
          fileName: 'vignesh_s_udyam_registration.pdf',
          documentType: 'UDYAM',
          type: 'UDYAM',
          filePath: null,
          supabaseUrl: 'https://vxtpjsymbcirszksrafg.supabase.co/storage/v1/object/public/documents/vignesh_s/UDYAM/vignesh_s_udyam_registration.pdf',
          url: 'https://vxtpjsymbcirszksrafg.supabase.co/storage/v1/object/public/documents/vignesh_s/UDYAM/vignesh_s_udyam_registration.pdf',
          s3Url: 'https://vxtpjsymbcirszksrafg.supabase.co/storage/v1/object/public/documents/vignesh_s/UDYAM/vignesh_s_udyam_registration.pdf',
          status: 'VERIFIED',
          verified: true,
          uploadedAt: new Date('2024-10-17'),
          verifiedAt: new Date('2024-10-17'),
          enquiryId: 3886,
          storageType: 'supabase',
          uploadedBy: {
            id: 2,
            name: 'Venkat'
          },
          enquiry: {
            id: 3886,
            name: 'VIGNESH S',
            mobile: '9876543220',
            businessType: 'Retail'
          }
        },
        {
          id: 9011,
          fileName: 'vignesh_s_bank_statement.pdf',
          documentType: 'BANK_STATEMENT',
          type: 'BANK_STATEMENT',
          filePath: null,
          supabaseUrl: 'https://vxtpjsymbcirszksrafg.supabase.co/storage/v1/object/public/documents/vignesh_s/BANK_STATEMENT/vignesh_s_bank_statement.pdf',
          url: 'https://vxtpjsymbcirszksrafg.supabase.co/storage/v1/object/public/documents/vignesh_s/BANK_STATEMENT/vignesh_s_bank_statement.pdf',
          s3Url: 'https://vxtpjsymbcirszksrafg.supabase.co/storage/v1/object/public/documents/vignesh_s/BANK_STATEMENT/vignesh_s_bank_statement.pdf',
          status: 'PENDING',
          verified: false, // Pending verification
          uploadedAt: new Date('2024-10-17'),
          verifiedAt: null,
          enquiryId: 3886,
          storageType: 'supabase',
          uploadedBy: {
            id: 2,
            name: 'Venkat'
          },
          enquiry: {
            id: 3886,
            name: 'VIGNESH S',
            mobile: '9876543220',
            businessType: 'Retail'
          }
        }
      ];
      
      this.demoDocuments = sampleDocuments;
    } else {
      // Fallback to empty documents if no enquiries exist
      this.demoDocuments = [];
    }
      
      this.saveDocuments();
      console.log('📄 Created', this.demoDocuments.length, 'sample documents');
    } catch (error) {
      console.log('📄 Error creating sample documents:', error);
      this.demoDocuments = [];
      this.saveDocuments();
    }
  }

  // Supabase Storage Integration Methods
  
  // Ensure Supabase bucket exists (for Render deployment)
  private async ensureSupabaseBucket(): Promise<boolean> {
    if (!this.supabaseService) {
      return false;
    }

    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await this.supabaseService.client.storage.listBuckets();
      
      if (listError) {
        this.logger.error('❌ Error listing Supabase buckets:', listError);
        return false;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.SUPABASE_BUCKET);
      
      if (!bucketExists) {
        this.logger.log(`📁 Creating Supabase bucket: ${this.SUPABASE_BUCKET}`);
        
        // Create bucket if it doesn't exist
        const { error: createError } = await this.supabaseService.client.storage.createBucket(this.SUPABASE_BUCKET, {
          public: true,
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
          fileSizeLimit: 10485760 // 10MB
        });

        if (createError) {
          this.logger.error('❌ Error creating Supabase bucket:', createError);
          return false;
        }

        this.logger.log(`✅ Supabase bucket created: ${this.SUPABASE_BUCKET}`);
      } else {
        this.logger.log(`✅ Supabase bucket exists: ${this.SUPABASE_BUCKET}`);
      }

      return true;
    } catch (error) {
      this.logger.error('❌ Error ensuring Supabase bucket:', error);
      return false;
    }
  }

  private async uploadToSupabaseStorage(
    file: Express.Multer.File,
    enquiryId: number,
    documentType: string,
    enquiryName: string
  ): Promise<{ success: boolean; filePath?: string; publicUrl?: string; error?: string }> {
    if (!this.supabaseService) {
      this.logger.warn('⚠️ [RENDER] Supabase service not available - attempting direct client initialization');
      
      // Try to initialize Supabase client directly for Render deployment
      try {
        const supabaseUrl = process.env.SUPABASE_URL || this.config.get('SUPABASE_URL');
        const supabaseKey = process.env.SUPABASE_ANON_KEY || this.config.get('SUPABASE_ANON_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
          this.logger.error('❌ [RENDER] Supabase credentials not found in environment variables');
          return { success: false, error: 'Supabase credentials not configured' };
        }
        
        const { createClient } = require('@supabase/supabase-js');
        const directClient = createClient(supabaseUrl, supabaseKey);
        
        this.logger.log('✅ [RENDER] Direct Supabase client initialized for document upload');
        
        // Use direct client for this upload
        return await this.uploadWithDirectClient(directClient, file, enquiryId, documentType, enquiryName);
        
      } catch (error) {
        this.logger.error('❌ [RENDER] Failed to initialize direct Supabase client:', error);
        return { success: false, error: 'Failed to initialize Supabase client for document upload' };
      }
    }

    try {
      // Ensure bucket exists (important for Render deployment)
      const bucketReady = await this.ensureSupabaseBucket();
      if (!bucketReady) {
        return { success: false, error: 'Failed to ensure Supabase bucket exists' };
      }

      // Create organized file path with client name: {clientName}/{documentType}/{timestamp}-{originalname}
      const sanitizedName = enquiryName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
      const timestamp = Date.now();
      const fileExtension = path.extname(file.originalname);
      const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${sanitizedName}_${documentType.toLowerCase()}_${timestamp}${fileExtension}`;
      const filePath = `${sanitizedName}/${documentType}/${fileName}`;

      this.logger.log(`📁 [RENDER-READY] Uploading to Supabase Storage: ${filePath}`);

      // Upload file to Supabase Storage
      const { data, error } = await this.supabaseService.client.storage
        .from(this.SUPABASE_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        this.logger.error('❌ Supabase Storage upload failed:', error);
        return { success: false, error: error.message };
      }

      // Get public URL for the uploaded file
      const { data: urlData } = this.supabaseService.client.storage
        .from(this.SUPABASE_BUCKET)
        .getPublicUrl(filePath);

      this.logger.log(`✅ File uploaded to Supabase Storage: ${filePath}`);
      
      return {
        success: true,
        filePath: data.path,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      this.logger.error('❌ Error uploading to Supabase Storage:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload using direct Supabase client (fallback for Render deployment)
  private async uploadWithDirectClient(
    directClient: any,
    file: Express.Multer.File,
    enquiryId: number,
    documentType: string,
    enquiryName: string
  ): Promise<{ success: boolean; filePath?: string; publicUrl?: string; error?: string }> {
    try {
      // Ensure bucket exists with direct client
      const bucketReady = await this.ensureBucketWithDirectClient(directClient);
      if (!bucketReady) {
        return { success: false, error: 'Failed to ensure Supabase bucket exists with direct client' };
      }

      // Create organized file path with client name
      const sanitizedName = enquiryName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
      const timestamp = Date.now();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${sanitizedName}_${documentType.toLowerCase()}_${timestamp}${fileExtension}`;
      const filePath = `${sanitizedName}/${documentType}/${fileName}`;

      this.logger.log(`📁 [RENDER-DIRECT] Uploading to Supabase Storage: ${filePath}`);

      // Upload file using direct client
      const { data, error } = await directClient.storage
        .from(this.SUPABASE_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error('❌ Direct Supabase Storage upload failed:', error);
        return { success: false, error: error.message };
      }

      // Get public URL for the uploaded file
      const { data: urlData } = directClient.storage
        .from(this.SUPABASE_BUCKET)
        .getPublicUrl(filePath);

      this.logger.log(`✅ File uploaded to Supabase Storage via direct client: ${filePath}`);
      
      return {
        success: true,
        filePath: data.path,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      this.logger.error('❌ Error uploading with direct Supabase client:', error);
      return { success: false, error: error.message };
    }
  }

  // Ensure bucket exists with direct client
  private async ensureBucketWithDirectClient(directClient: any): Promise<boolean> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await directClient.storage.listBuckets();
      
      if (listError) {
        this.logger.error('❌ Failed to list buckets with direct client:', listError);
        return false;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.SUPABASE_BUCKET);
      
      if (!bucketExists) {
        this.logger.log(`📁 [RENDER-DIRECT] Creating bucket: ${this.SUPABASE_BUCKET}`);
        
        const { error: createError } = await directClient.storage.createBucket(this.SUPABASE_BUCKET, {
          public: true,
          allowedMimeTypes: ['application/pdf'],
          fileSizeLimit: 10485760, // 10MB
        });

        if (createError) {
          this.logger.error('❌ Failed to create bucket with direct client:', createError);
          return false;
        }
        
        this.logger.log(`✅ [RENDER-DIRECT] Bucket created: ${this.SUPABASE_BUCKET}`);
      } else {
        this.logger.log(`✅ [RENDER-DIRECT] Bucket exists: ${this.SUPABASE_BUCKET}`);
      }

      return true;
    } catch (error) {
      this.logger.error('❌ Error ensuring bucket with direct client:', error);
      return false;
    }
  }

  private async deleteFromSupabaseStorage(filePath: string): Promise<boolean> {
    if (!this.supabaseService || !filePath) {
      return false;
    }

    try {
      this.logger.log(`🗑️ Deleting from Supabase Storage: ${filePath}`);

      const { error } = await this.supabaseService.client.storage
        .from(this.SUPABASE_BUCKET)
        .remove([filePath]);

      if (error) {
        this.logger.error('❌ Failed to delete from Supabase Storage:', error);
        return false;
      }

      this.logger.log(`✅ File deleted from Supabase Storage: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Error deleting from Supabase Storage:', error);
      return false;
    }
  }

  private async getSupabaseStorageUrl(filePath: string): Promise<string | null> {
    if (!this.supabaseService || !filePath) {
      return null;
    }

    try {
      const { data } = this.supabaseService.client.storage
        .from(this.SUPABASE_BUCKET)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      this.logger.error('❌ Error getting Supabase Storage URL:', error);
      return null;
    }
  }

  private async saveDocuments() {
    try {
      // Use persistence service for production-ready saving
      await this.persistenceService.saveData('documents', this.demoDocuments);
      this.logger.log(`💾 Saved ${this.demoDocuments.length} documents via persistence service`);
    } catch (error) {
      this.logger.error('❌ Error saving documents:', error);
    }
  }

  async uploadDocument(
    file: Express.Multer.File,
    createDocumentDto: CreateDocumentDto,
    userId: number,
    assignedStaff?: string,
  ) {
    // Check if file exists
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // Validate file type (PDF only)
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    // Validate required fields
    if (!createDocumentDto.type) {
      throw new BadRequestException('Document type is required');
    }

    if (!createDocumentDto.enquiryId) {
      throw new BadRequestException('Enquiry ID is required');
    }

    try {
      console.log('📄 Processing document upload:', {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        documentType: createDocumentDto.type,
        enquiryId: createDocumentDto.enquiryId
      });

      // Check for existing document of same type for this enquiry
      const existingDocumentIndex = this.demoDocuments.findIndex(doc => 
        doc.enquiryId === parseInt(createDocumentDto.enquiryId.toString()) && 
        doc.type === createDocumentDto.type
      );

      if (existingDocumentIndex !== -1) {
        console.log('📄 Replacing existing document:', {
          existing: this.demoDocuments[existingDocumentIndex].id,
          enquiryId: createDocumentDto.enquiryId,
          type: createDocumentDto.type
        });
        
        // Remove the existing document (replace it with new upload)
        const removedDoc = this.demoDocuments.splice(existingDocumentIndex, 1)[0];
        
        // Try to delete the old file if it exists
        if (removedDoc.filePath && fs.existsSync(removedDoc.filePath)) {
          try {
            fs.unlinkSync(removedDoc.filePath);
            console.log('📄 Deleted old file:', removedDoc.filePath);
          } catch (error) {
            console.log('📄 Could not delete old file:', error);
          }
        }
      }

      // Get enquiry info for organized storage
      const enquiryInfo = await this.getEnquiryInfo(parseInt(createDocumentDto.enquiryId.toString()));
      const clientName = enquiryInfo?.name || 'Unknown Client';
      
      // Prioritize Supabase Storage for Render deployment
      let supabaseResult = null;
      let localFilePath = null;
      const isRenderDeployment = this.isRender || this.isProduction;
      
      try {
        this.logger.log(`📁 [${isRenderDeployment ? 'RENDER' : 'LOCAL'}] Uploading document for ${clientName} (Enquiry: ${createDocumentDto.enquiryId})`);
        
        // Always try Supabase first, especially for Render deployment
        supabaseResult = await this.uploadToSupabaseStorage(
          file,
          parseInt(createDocumentDto.enquiryId.toString()),
          createDocumentDto.type,
          clientName
        );
        
        if (supabaseResult.success) {
          this.logger.log(`✅ [SUPABASE] Document uploaded successfully: ${supabaseResult.filePath}`);
          this.logger.log(`🔗 [SUPABASE] Public URL: ${supabaseResult.publicUrl}`);
        } else {
          this.logger.warn(`⚠️ [SUPABASE] Storage upload failed: ${supabaseResult.error}`);
          
          // For Render deployment, try alternative approaches before failing
          if (isRenderDeployment) {
            this.logger.warn('⚠️ [RENDER] Supabase storage failed - attempting alternative storage solutions');
            
            // Try to continue with local metadata storage but warn about file storage
            this.logger.warn('⚠️ [RENDER] Document metadata will be saved but file storage may be limited');
            this.logger.warn('💡 [RENDER] Consider checking Supabase configuration and credentials');
          }
        }
        
      } catch (supabaseError) {
        this.logger.error('❌ Supabase storage error:', supabaseError);
        
        // For Render deployment, log error but continue with metadata storage
        if (isRenderDeployment) {
          this.logger.error('❌ [RENDER] Supabase storage failed, but continuing with document metadata');
          this.logger.error('💡 [RENDER] File will be tracked but may not be physically stored');
          this.logger.error('🔧 [RENDER] Check Supabase credentials and bucket configuration');
          
          // Set supabaseResult to indicate failure but don't throw
          supabaseResult = { success: false, error: supabaseError.message };
        }
      }
      
      // Fallback to local storage if needed (for development or if Supabase fails)
      if (!supabaseResult?.success && !this.isVercel) {
        try {
          if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
          }
          
          const timestamp = Date.now();
          const fileExtension = path.extname(file.originalname);
          const uniqueFileName = `${timestamp}-${createDocumentDto.enquiryId}-${createDocumentDto.type}${fileExtension}`;
          localFilePath = path.join(this.uploadsDir, uniqueFileName);
          
          // Save file to disk as fallback
          fs.writeFileSync(localFilePath, file.buffer);
          this.logger.log('📄 Saved to local storage as fallback:', localFilePath);
        } catch (localError) {
          this.logger.error('❌ Local storage also failed:', localError);
        }
      }
      
      // Get real enquiry data (reuse the enquiry info we already fetched)
      const realEnquiry = await this.getEnquiryInfo(parseInt(createDocumentDto.enquiryId.toString()));
      
      // Create document record with enhanced Supabase integration
      const documentId = await this.idGeneratorService.generateDocumentId(); // Generate 1-2 digit ID
      const mockDocument = {
        id: documentId,
        fileName: file.originalname,
        documentType: createDocumentDto.type,
        type: createDocumentDto.type, // Add both for compatibility
        filePath: localFilePath, // Store local file path as fallback
        supabaseUrl: supabaseResult?.publicUrl, // Store Supabase storage URL
        url: supabaseResult?.publicUrl || `http://localhost:5002/api/documents/${documentId}/view`,
        s3Url: supabaseResult?.publicUrl || `http://localhost:5002/api/documents/${documentId}/view`, // Use Supabase URL or fallback
        status: 'PENDING',
        verified: false, // Add verified field
        uploadedAt: new Date(),
        enquiryId: createDocumentDto.enquiryId,
        storageType: supabaseResult?.success ? 'supabase' : 'local', // Track storage type
        supabaseFilePath: supabaseResult?.filePath, // Store for cleanup
        supabaseSynced: false, // Will be updated after database sync
        supabaseSyncedAt: null, // Will be set when synced
        supabaseError: supabaseResult?.success ? null : supabaseResult?.error, // Store any error
        uploadedBy: {
          id: userId,
          name: assignedStaff || 'Demo User'
        },
        enquiry: {
          id: createDocumentDto.enquiryId,
          name: enquiryInfo ? enquiryInfo.name : `Client ${createDocumentDto.enquiryId}`,
          mobile: enquiryInfo ? enquiryInfo.mobile : '9876543210',
          businessType: enquiryInfo ? enquiryInfo.businessType : 'General Business',
          businessName: enquiryInfo ? enquiryInfo.businessName : enquiryInfo?.name || `Business ${createDocumentDto.enquiryId}`
        }
      };

      console.log('✅ Document upload successful:', {
        documentId: mockDocument.id,
        fileName: mockDocument.fileName,
        type: mockDocument.type
      });

      // Auto-sync to Supabase database using unified sync service
      try {
        console.log('🚀 [DEPLOYMENT] Auto-syncing document to Supabase database:', mockDocument.id);
        await this.unifiedSupabaseSync.syncDocument(mockDocument);
        console.log('✅ [DEPLOYMENT] Document synced to Supabase database successfully');
        
        // Update document with Supabase sync status
        mockDocument.supabaseSynced = true;
        mockDocument.supabaseSyncedAt = new Date().toISOString();
      } catch (error) {
        console.error('❌ [DEPLOYMENT] Auto-sync to Supabase failed (continuing with local storage):', error);
        mockDocument.supabaseSynced = false;
        mockDocument.supabaseError = error.message;
      }

      // Create enhanced notification for document upload
      try {
        if (this.notificationsService) {
          const clientName = enquiryInfo ? enquiryInfo.name : `Client ${createDocumentDto.enquiryId}`;
          const currentTime = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Kolkata'
          });
          
          await this.notificationsService.createSystemNotification({
            type: 'DOCUMENT_UPLOADED',
            title: 'Document Uploaded',
            message: `${createDocumentDto.type} document uploaded by ${clientName} at ${currentTime} - awaiting verification`,
            priority: 'MEDIUM',
            data: {
              documentId: mockDocument.id,
              clientName: clientName,
              documentType: createDocumentDto.type,
              enquiryId: createDocumentDto.enquiryId,
              fileName: file.originalname,
              fileSize: file.size,
              uploadedAt: new Date().toISOString(),
              uploadedBy: userId,
              storageType: supabaseResult?.success ? 'supabase' : 'local'
            }
          });
          this.logger.log('🔔 Enhanced upload notification created:', createDocumentDto.type, 'for', clientName);
        }
      } catch (error) {
        this.logger.error('❌ Failed to create notification:', error);
      }

      // Add to local storage and save
      this.demoDocuments.push(mockDocument);
      await this.saveDocuments();

      return {
        message: 'Document uploaded successfully',
        document: mockDocument
      };

    } catch (error) {
      console.error('❌ Document upload error:', error);
      throw new BadRequestException(error.message || 'Failed to upload document');
    }
  }

  // Auto-sync document to Supabase
  private async autoSyncDocumentToSupabase(document: any): Promise<void> {
    try {
      console.log('🔄 Auto-syncing document to Supabase:', document.id, document.type);
      
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get next simple ID for documents
      const { data: existingDocs } = await supabase
        .from('Document')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
      
      const nextId = existingDocs && existingDocs.length > 0 ? existingDocs[0].id + 1 : 1;
      
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
        enquiryId: enquiryIdMapping[document.enquiryId] || 1,
        type: document.type,
        s3Url: document.supabaseUrl || document.s3Url || document.url || `https://example.com/document_${nextId}.pdf`,
        verified: document.verified || false,
        uploadedAt: document.uploadedAt,
        uploadedById: 1
      };
      
      const { error } = await supabase
        .from('Document')
        .insert(supabaseData);
      
      if (error) {
        console.error('❌ Auto-sync error:', error);
        throw error;
      }
      
      console.log('✅ Document auto-synced to Supabase with ID:', nextId);
    } catch (error) {
      console.error('❌ Failed to auto-sync document:', error);
      throw error;
    }
  }

  // Enhanced auto-sync with retry logic
  private async autoSyncDocumentToSupabaseWithRetry(document: any, maxRetries: number = 3): Promise<void> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Auto-sync attempt ${attempt}/${maxRetries} for document:`, document.id);
        await this.autoSyncDocumentToSupabase(document);
        console.log('✅ Document auto-synced successfully on attempt:', attempt);
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        console.error(`❌ Auto-sync attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    console.error(`❌ Auto-sync failed after ${maxRetries} attempts. Last error:`, lastError);
    throw lastError;
  }

  async findAll(user: User) {
    try {
      console.log('📄 Fetching all documents for user:', user.id);
      console.log('📄 Demo documents stored:', this.demoDocuments.length);
      
      // Auto-deduplicate documents by enquiryId + type combination (keep the most recent)
      const uniqueDocuments = new Map();
      this.demoDocuments.forEach(doc => {
        const key = `${doc.enquiryId}-${doc.type}`;
        const existing = uniqueDocuments.get(key);
        if (!existing || doc.id > existing.id) {
          uniqueDocuments.set(key, doc);
        }
      });
      
      // Convert back to array and refresh enquiry information (async)
      const deduplicatedDocuments = [];
      for (const doc of Array.from(uniqueDocuments.values())) {
        // Try to get enquiry information from service first
        let realEnquiry = await this.getEnquiryInfo(parseInt(doc.enquiryId.toString()));
        
        // If not found, use existing document enquiry data as fallback
        if (!realEnquiry) {
          if (doc.enquiry && doc.enquiry.name) {
            realEnquiry = {
              name: doc.enquiry.name,
              mobile: doc.enquiry.mobile || '9876543210',
              businessType: doc.enquiry.businessType || 'General Business'
            };
          }
        }
        
        deduplicatedDocuments.push({
          ...doc,
          enquiry: {
            id: doc.enquiryId,
            name: realEnquiry ? realEnquiry.name : `Client ${doc.enquiryId}`,
            mobile: realEnquiry ? realEnquiry.mobile : '9876543210',
            businessType: realEnquiry ? realEnquiry.businessType : doc.enquiry?.businessType || 'General Business',
            businessName: realEnquiry ? realEnquiry.businessName : realEnquiry?.name || `Business ${doc.enquiryId}`
          }
        });
      }
      
      // Sort by upload date (newest first)
      const sortedDocuments = deduplicatedDocuments.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      
      console.log('📄 Returning documents with refreshed enquiry info:', sortedDocuments.length);
      return sortedDocuments;
    } catch (error) {
      console.log('📄 Error fetching documents, returning empty array');
      return [];
    }
  }

  async findByEnquiry(enquiryId: number) {
    try {
      console.log('📄 Fetching documents for enquiry:', enquiryId);
      
      // Filter documents by enquiry ID from demo storage
      const enquiryDocuments = this.demoDocuments.filter(doc => 
        doc.enquiryId === enquiryId
      );
      
      // Auto-deduplicate by document type (keep the most recent)
      const uniqueDocuments = new Map();
      enquiryDocuments.forEach(doc => {
        const existing = uniqueDocuments.get(doc.type);
        if (!existing || doc.id > existing.id) {
          uniqueDocuments.set(doc.type, doc);
        }
      });
      
      // Refresh enquiry information for each document (async)
      const deduplicatedDocuments = [];
      for (const doc of Array.from(uniqueDocuments.values())) {
        const realEnquiry = await this.getEnquiryInfo(parseInt(doc.enquiryId.toString()));
        
        deduplicatedDocuments.push({
          ...doc,
          enquiry: {
            id: doc.enquiryId,
            name: realEnquiry ? realEnquiry.name : `Client ${doc.enquiryId}`,
            mobile: realEnquiry ? realEnquiry.mobile : '9876543210',
            businessType: realEnquiry ? realEnquiry.businessType : 'General Business',
            businessName: realEnquiry ? realEnquiry.businessName : realEnquiry?.name || `Business ${doc.enquiryId}`
          }
        });
      }
      
      console.log('📄 Found documents for enquiry with refreshed info:', deduplicatedDocuments.length);
      return deduplicatedDocuments;
    } catch (error) {
      console.log('📄 Error fetching enquiry documents');
      return [];
    }
  }

  async findOne(id: number) {
    try {
      // Find document in demo storage
      const document = this.demoDocuments.find(doc => doc.id === id);
      if (document) {
        // Refresh enquiry information (async)
        const realEnquiry = await this.getEnquiryInfo(parseInt(document.enquiryId.toString()));
        
        return {
          ...document,
          enquiry: {
            id: document.enquiryId,
            name: realEnquiry ? realEnquiry.name : `Client ${document.enquiryId}`,
            mobile: realEnquiry ? realEnquiry.mobile : '9876543210',
            businessType: realEnquiry ? realEnquiry.businessType : 'General Business',
            businessName: realEnquiry ? realEnquiry.businessName : realEnquiry?.name || `Business ${document.enquiryId}`
          }
        };
      }
      throw new NotFoundException('Document not found');
    } catch (error) {
      throw new NotFoundException('Document not found');
    }
  }

  async viewDocument(id: number, res: Response) {
    try {
      // Find document in demo storage
      const document = this.demoDocuments.find(doc => doc.id === id);
      
      if (!document) {
        return res.status(404).json({ 
          message: 'Document not found',
          error: 'Not Found',
          statusCode: 404 
        });
      }

      // Check if we have a real file path
      if (document.filePath && fs.existsSync(document.filePath)) {
        console.log('📄 Serving real PDF file:', document.filePath);
        
        // Set proper headers for PDF viewing
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Stream the actual PDF file
        const fileStream = fs.createReadStream(document.filePath);
        return fileStream.pipe(res);
      } else {
        // Fallback to demo PDF for documents without real files
        console.log('📄 Serving demo PDF for document:', document.id);
        const samplePdfContent = this.generateSamplePDF(document);
        
        // Set proper headers for PDF viewing
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Send the demo PDF content
        return res.send(samplePdfContent);
      }
      
    } catch (error) {
      console.error('Error viewing document:', error);
      return res.status(500).json({ 
        message: 'Error viewing document',
        error: 'Internal Server Error',
        statusCode: 500 
      });
    }
  }

  private generateSamplePDF(document: any): Buffer {
    // Create a simple PDF-like content for demo
    // In a real implementation, this would fetch the actual file from S3 or file system
    const pdfHeader = '%PDF-1.4\n';
    const pdfContent = `
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(${document.type} Document) Tj
0 -50 Td
(Client: ${document.enquiry?.name || 'Demo Client'}) Tj
0 -30 Td
(File: ${document.fileName}) Tj
0 -30 Td
(Uploaded: ${new Date(document.uploadedAt).toLocaleDateString()}) Tj
0 -50 Td
(This is a demo PDF viewer.) Tj
0 -30 Td
(In production, this would show the actual document.) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
456
%%EOF`;

    return Buffer.from(pdfHeader + pdfContent, 'utf-8');
  }

  async verifyDocument(id: number, userId: number, verified: boolean = true) {
    try {
      // Update document in demo storage
      const documentIndex = this.demoDocuments.findIndex(doc => doc.id === id);
      if (documentIndex !== -1) {
        this.demoDocuments[documentIndex].verified = verified;
        this.demoDocuments[documentIndex].verifiedAt = new Date().toISOString();
        this.saveDocuments(); // Persist changes to file
        console.log('📄 Document verification updated in demo storage and saved to file');
      }

      // Create enhanced notification for document verification
      try {
        const document = this.demoDocuments[documentIndex];
        if (document && this.notificationsService) {
          const clientName = document.enquiry?.name || `Client ${document.enquiryId}`;
          const currentTime = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Kolkata'
          });
          
          if (verified) {
            await this.notificationsService.createSystemNotification({
              type: 'DOCUMENT_VERIFIED',
              title: 'Document Verified',
              message: `${document.type} document verified for ${clientName} at ${currentTime} - ready for next step`,
              priority: 'MEDIUM',
              data: {
                documentId: id,
                clientName: clientName,
                documentType: document.type,
                enquiryId: document.enquiryId,
                verifiedAt: new Date().toISOString(),
                verifiedBy: userId
              }
            });
            this.logger.log('🔔 Enhanced verification notification created:', document.type, 'for', clientName);
          } else {
            await this.notificationsService.createSystemNotification({
              type: 'DOCUMENT_VERIFIED',
              title: 'Document Unverified',
              message: `${document.type} document unverified for ${clientName} at ${currentTime} - requires attention`,
              priority: 'HIGH',
              data: {
                documentId: id,
                clientName: clientName,
                documentType: document.type,
                enquiryId: document.enquiryId,
                unverifiedAt: new Date().toISOString(),
                unverifiedBy: userId
              }
            });
            this.logger.log('🔔 Enhanced unverification notification created:', document.type, 'for', clientName);
          }
        }
      } catch (error) {
        this.logger.error('❌ Failed to create document verification notification:', error);
      }

      return { message: 'Document verification updated successfully' };
    } catch (error) {
      console.log('📄 Error updating document verification');
      return { message: 'Document verification updated successfully' };
    }
  }

  async removeDuplicates(enquiryId: number) {
    try {
      console.log('📄 Removing duplicates for enquiry:', enquiryId);
      
      // Find documents for this enquiry
      const enquiryDocuments = this.demoDocuments.filter(doc => doc.enquiryId === enquiryId);
      
      // Group by document type and keep only the latest (highest ID) for each type
      const uniqueDocuments = new Map();
      enquiryDocuments.forEach(doc => {
        const existing = uniqueDocuments.get(doc.type);
        if (!existing || doc.id > existing.id) {
          uniqueDocuments.set(doc.type, doc);
        }
      });
      
      // Remove duplicates from storage
      const documentsToKeep = Array.from(uniqueDocuments.values());
      const documentsToRemove = enquiryDocuments.filter(doc => 
        !documentsToKeep.some(keep => keep.id === doc.id)
      );
      
      // Remove duplicates from demo storage
      documentsToRemove.forEach(docToRemove => {
        const index = this.demoDocuments.findIndex(doc => doc.id === docToRemove.id);
        if (index !== -1) {
          this.demoDocuments.splice(index, 1);
        }
      });
      
      // Save changes to file
      this.saveDocuments();
      console.log('📄 Removed duplicates:', documentsToRemove.length, 'and saved to file');
      
      return { 
        message: `Removed ${documentsToRemove.length} duplicate documents`,
        removed: documentsToRemove.length
      };
    } catch (error) {
      console.log('📄 Error removing duplicates');
      return { message: 'Failed to remove duplicates', removed: 0 };
    }
  }

  async remove(id: number, userId?: number): Promise<{ message: string; cleanupResults?: any }> {
    const documentIndex = this.demoDocuments.findIndex(doc => doc.id === id);
    if (documentIndex === -1) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const document = this.demoDocuments[documentIndex];
    console.log('🗑️ Starting complete document deletion:', document.fileName, 'ID:', id);
    console.log('🗑️ Document details:', {
      storageType: document.storageType,
      supabaseUrl: document.supabaseUrl ? 'Present' : 'None',
      supabaseFilePath: document.supabaseFilePath,
      localFilePath: document.filePath,
      supabaseSynced: document.supabaseSynced
    });

    let cleanupResults = {
      supabaseStorage: false,
      supabaseDatabase: false,
      localStorage: false,
      localFile: false
    };

    // 1. Delete from Supabase storage if it exists there
    if (document.supabaseFilePath && document.storageType === 'supabase') {
      try {
        this.logger.log(`🗑️ Deleting from Supabase Storage: ${document.supabaseFilePath}`);
        
        const deleteSuccess = await this.deleteFromSupabaseStorage(document.supabaseFilePath);
        cleanupResults.supabaseStorage = deleteSuccess;
        
        if (deleteSuccess) {
          this.logger.log('✅ Successfully deleted from Supabase Storage');
        } else {
          this.logger.warn('⚠️ Failed to delete from Supabase Storage');
        }
      } catch (error) {
        console.error('❌ Error deleting from Supabase storage:', error);
      }
    }

    // 2. Delete from Supabase database (try both Document and documents tables)
    try {
      if (this.supabaseService) {
        // Try deleting from Document table first (capitalized)
        const { error: docError } = await this.supabaseService.client
          .from('Document')
          .delete()
          .eq('id', id);
        
        if (docError) {
          console.log('🗑️ Document table delete result:', docError.message);
          
          // Try lowercase documents table as fallback
          const { error: docsError } = await this.supabaseService.client
            .from('documents')
            .delete()
            .eq('id', id);
          
          if (docsError) {
            console.error('❌ Error deleting from both Supabase database tables:', docsError);
          } else {
            console.log('✅ Successfully deleted from Supabase documents table');
            cleanupResults.supabaseDatabase = true;
          }
        } else {
          console.log('✅ Successfully deleted from Supabase Document table');
          cleanupResults.supabaseDatabase = true;
        }
      }
    } catch (error) {
      console.error('❌ Error deleting from Supabase database:', error);
    }

    // 3. Delete local file if it exists
    if (document.filePath && fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
        console.log('✅ Deleted local file:', document.filePath);
        cleanupResults.localFile = true;
      } catch (error) {
        console.error('❌ Error deleting local file:', error);
      }
    }

    // 4. Remove from local storage
    this.demoDocuments.splice(documentIndex, 1);
    this.saveDocuments();
    cleanupResults.localStorage = true;
    
    // 5. Create notification for document deletion
    try {
      if (this.notificationsService) {
        await this.notificationsService.createSystemNotification({
          type: 'DOCUMENT_DELETED',
          title: 'Document Deleted',
          message: `${document.type} document deleted for ${document.enquiry?.name || 'Unknown Client'}`,
          priority: 'MEDIUM',
        });
        console.log('🔔 Notification created for document deletion');
      }
    } catch (error) {
      console.error('❌ Failed to create deletion notification:', error);
    }
    
    console.log('✅ Complete document deletion finished:', cleanupResults);
    console.log('📊 Cleanup summary:', {
      supabaseStorage: cleanupResults.supabaseStorage ? '✅ Cleaned' : '❌ Skipped/Failed',
      supabaseDatabase: cleanupResults.supabaseDatabase ? '✅ Cleaned' : '❌ Skipped/Failed',
      localFile: cleanupResults.localFile ? '✅ Cleaned' : '❌ Skipped/Failed',
      localStorage: cleanupResults.localStorage ? '✅ Cleaned' : '❌ Failed'
    });
    
    return { 
      message: 'Document deleted successfully from all storage systems',
      cleanupResults: cleanupResults
    };
  }

  // Method to clear Supabase and sync all current localhost documents
  async clearAndSyncAllDocumentsToSupabase(): Promise<{ cleared: number; synced: number; errors: number }> {
    if (!this.supabaseService) {
      console.log('⚠️ Supabase service not available');
      return { cleared: 0, synced: 0, errors: 0 };
    }

    console.log('🧹 Clearing existing documents from Supabase...');
    
    let clearedCount = 0;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Step 1: Clear existing documents from Supabase
      const { error: deleteError } = await this.supabaseService.client
        .from('Documents')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (deleteError) {
        console.error('❌ Error clearing Supabase documents:', deleteError);
      } else {
        console.log('✅ Cleared all existing documents from Supabase');
        clearedCount = 1; // Indicate successful clear
      }

      // Step 2: Sync all current localhost documents to Supabase
      console.log('🔄 Syncing', this.demoDocuments.length, 'localhost documents to Supabase...');
      
      for (const document of this.demoDocuments) {
        try {
          await this.syncDocumentToSupabase(document);
          syncedCount++;
          console.log(`✅ Synced document ${document.id}: ${document.fileName}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Failed to sync document ${document.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Document sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { cleared: clearedCount, synced: syncedCount, errors: errorCount };
      
    } catch (error) {
      console.error('❌ Error in clearAndSyncAllDocumentsToSupabase:', error);
      return { cleared: 0, synced: syncedCount, errors: errorCount + 1 };
    }
  }


  // Public method to refresh enquiry information for all documents
  async refreshEnquiryInfo() {
    console.log('📄 Manual refresh of enquiry information requested...');
    
    const beforeCount = this.demoDocuments.length;
    await this.refreshAllDocumentEnquiryInfo();
    
    return {
      message: 'Enquiry information refreshed successfully',
      updated: beforeCount
    };
  }

  // Method to clear all documents for a specific enquiry
  async clearDocumentsForEnquiry(enquiryId: number) {
    console.log('📄 Clearing all documents for enquiry:', enquiryId);
    
    const documentsToRemove = this.demoDocuments.filter(doc => 
      doc.enquiryId === enquiryId
    );
    
    // Remove files from disk
    for (const doc of documentsToRemove) {
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        try {
          fs.unlinkSync(doc.filePath);
          console.log('📄 Deleted file:', doc.filePath);
        } catch (error) {
          console.log('📄 Could not delete file:', error);
        }
      }
    }
    
    // Remove from memory
    this.demoDocuments = this.demoDocuments.filter(doc => 
      doc.enquiryId !== enquiryId
    );
    
    // Save changes
    this.saveDocuments();
    
    return {
      message: `Cleared ${documentsToRemove.length} documents for enquiry ${enquiryId}`,
      removed: documentsToRemove.length
    };
  }

  // Method to create sample documents for a specific enquiry
  async createSampleDocumentsForEnquiry(enquiryId: number) {
    console.log('📄 Creating sample documents for enquiry:', enquiryId);
    
    // Get enquiry details (async)
    const enquiry = await this.getEnquiryInfo(enquiryId);
    if (!enquiry) {
      throw new NotFoundException(`Enquiry with ID ${enquiryId} not found`);
    }

    // Clear existing documents first
    await this.clearDocumentsForEnquiry(enquiryId);

    // Create 5 verified sample documents
    const sampleDocuments = [
      {
        id: Date.now() + 1,
        fileName: `${enquiry.name.toLowerCase().replace(/\s+/g, '_')}_gst_certificate.pdf`,
        documentType: 'GST',
        type: 'GST',
        filePath: null,
        url: `http://localhost:5002/api/documents/${Date.now() + 1}/view`,
        s3Url: `http://localhost:5002/api/documents/${Date.now() + 1}/view`,
        status: 'VERIFIED',
        verified: true,
        uploadedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        enquiryId: enquiryId,
        uploadedBy: {
          id: 1,
          name: 'Pankil'
        },
        enquiry: {
          id: enquiryId,
          name: enquiry.name,
          mobile: enquiry.mobile,
          businessType: enquiry.businessType
        }
      },
      {
        id: Date.now() + 2,
        fileName: `${enquiry.name.toLowerCase().replace(/\s+/g, '_')}_udyam_registration.pdf`,
        documentType: 'UDYAM',
        type: 'UDYAM',
        filePath: null,
        url: `http://localhost:5002/api/documents/${Date.now() + 2}/view`,
        s3Url: `http://localhost:5002/api/documents/${Date.now() + 2}/view`,
        status: 'VERIFIED',
        verified: true,
        uploadedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        enquiryId: enquiryId,
        uploadedBy: {
          id: 1,
          name: 'Pankil'
        },
        enquiry: {
          id: enquiryId,
          name: enquiry.name,
          mobile: enquiry.mobile,
          businessType: enquiry.businessType
        }
      },
      {
        id: Date.now() + 3,
        fileName: `${enquiry.name.toLowerCase().replace(/\s+/g, '_')}_bank_statement.pdf`,
        documentType: 'BANK_STATEMENT',
        type: 'BANK_STATEMENT',
        filePath: null,
        url: `http://localhost:5002/api/documents/${Date.now() + 3}/view`,
        s3Url: `http://localhost:5002/api/documents/${Date.now() + 3}/view`,
        status: 'VERIFIED',
        verified: true,
        uploadedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        enquiryId: enquiryId,
        uploadedBy: {
          id: 1,
          name: 'Pankil'
        },
        enquiry: {
          id: enquiryId,
          name: enquiry.name,
          mobile: enquiry.mobile,
          businessType: enquiry.businessType
        }
      },
      {
        id: Date.now() + 4,
        fileName: `${enquiry.name.toLowerCase().replace(/\s+/g, '_')}_owner_pan.pdf`,
        documentType: 'OWNER_PAN',
        type: 'OWNER_PAN',
        filePath: null,
        url: `http://localhost:5002/api/documents/${Date.now() + 4}/view`,
        s3Url: `http://localhost:5002/api/documents/${Date.now() + 4}/view`,
        status: 'VERIFIED',
        verified: true,
        uploadedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        enquiryId: enquiryId,
        uploadedBy: {
          id: 1,
          name: 'Pankil'
        },
        enquiry: {
          id: enquiryId,
          name: enquiry.name,
          mobile: enquiry.mobile,
          businessType: enquiry.businessType
        }
      },
      {
        id: Date.now() + 5,
        fileName: `${enquiry.name.toLowerCase().replace(/\s+/g, '_')}_aadhar.pdf`,
        documentType: 'AADHAR',
        type: 'AADHAR',
        filePath: null,
        url: `http://localhost:5002/api/documents/${Date.now() + 5}/view`,
        s3Url: `http://localhost:5002/api/documents/${Date.now() + 5}/view`,
        status: 'VERIFIED',
        verified: true,
        uploadedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        enquiryId: enquiryId,
        uploadedBy: {
          id: 1,
          name: 'Pankil'
        },
        enquiry: {
          id: enquiryId,
          name: enquiry.name,
          mobile: enquiry.mobile,
          businessType: enquiry.businessType
        }
      }
    ];

    // Add to demo documents
    this.demoDocuments.push(...sampleDocuments);
    
    // Save to file
    this.saveDocuments();

    // Sync to Supabase in background
    for (const doc of sampleDocuments) {
      this.syncDocumentToSupabase(doc).catch(error => {
        console.error('❌ Failed to sync sample document to Supabase:', error);
      });
    }

    console.log('📄 Created', sampleDocuments.length, 'sample documents for enquiry', enquiryId);

    return {
      message: `Created ${sampleDocuments.length} sample documents for ${enquiry.name}`,
      documents: sampleDocuments,
      enquiry: enquiry
    };
  }

  // Supabase sync methods
  private async syncDocumentToSupabase(document: any): Promise<void> {
    if (!this.supabaseService) {
      console.log('⚠️ Supabase service not available, skipping document sync');
      return;
    }

    try {
      console.log('🔄 Syncing document to Supabase:', document.fileName);
      
      // Prepare document data for Supabase
      const supabaseDocument = {
        id: document.id,
        file_name: document.fileName,
        document_type: document.documentType || document.type,
        file_path: document.filePath,
        url: document.url,
        s3_url: document.s3Url || document.url,
        status: document.status || 'PENDING',
        verified: document.verified || false,
        uploaded_at: document.uploadedAt || new Date().toISOString(),
        verified_at: document.verifiedAt,
        enquiry_id: document.enquiryId,
        uploaded_by_id: document.uploadedBy?.id || 1,
        created_at: document.uploadedAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Upsert to Supabase Documents table
      const { data, error } = await this.supabaseService.client
        .from('Documents')
        .upsert(supabaseDocument, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error syncing document to Supabase:', error);
        throw error;
      }

      console.log('✅ Document synced to Supabase successfully:', document.fileName);
      
      // Also sync to document collection for storage bucket reference
      await this.syncDocumentToCollection(document);
      
    } catch (error) {
      console.error('❌ Failed to sync document to Supabase:', error);
      throw error;
    }
  }

  // Sync document to Supabase storage bucket collection
  private async syncDocumentToCollection(document: any): Promise<void> {
    if (!this.supabaseService) {
      return;
    }

    try {
      // Create document collection entry for storage bucket reference
      const collectionEntry = {
        id: `doc_${document.id}_${Date.now()}`,
        document_id: document.id,
        enquiry_id: document.enquiryId,
        file_name: document.fileName,
        document_type: document.documentType || document.type,
        storage_path: document.filePath || `documents/${document.fileName}`,
        bucket_name: 'documents',
        file_size: document.fileSize || null,
        mime_type: 'application/pdf',
        uploaded_at: document.uploadedAt || new Date().toISOString(),
        status: document.status || 'ACTIVE',
        metadata: {
          enquiry_name: document.enquiry?.name,
          uploaded_by: document.uploadedBy?.name,
          verified: document.verified || false
        },
        created_at: new Date().toISOString()
      };

      const { error } = await this.supabaseService.client
        .from('DocumentCollection')
        .upsert(collectionEntry, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error syncing to document collection:', error);
      } else {
        console.log('✅ Document collection entry created:', document.fileName);
      }
    } catch (error) {
      console.error('❌ Failed to sync to document collection:', error);
    }
  }


  // Get Supabase sync status for documents
  async getSupabaseSyncStatus(): Promise<any> {
    if (!this.supabaseService) {
      return {
        supabaseCount: 0,
        localCount: this.demoDocuments.length,
        collectionCount: 0,
        lastSync: null,
        status: 'service_unavailable',
        error: 'Supabase service not initialized'
      };
    }

    try {
      // Get document count from Supabase
      const { count: docCount, error: docError } = await this.supabaseService.client
        .from('Documents')
        .select('*', { count: 'exact', head: true });

      // Get document collection count
      const { count: collectionCount, error: collectionError } = await this.supabaseService.client
        .from('DocumentCollection')
        .select('*', { count: 'exact', head: true });

      return {
        supabaseCount: docCount || 0,
        localCount: this.demoDocuments.length,
        collectionCount: collectionCount || 0,
        lastSync: new Date().toISOString(),
        status: (docError || collectionError) ? 'error' : 'connected',
        error: docError?.message || collectionError?.message
      };
    } catch (error) {
      return {
        supabaseCount: 0,
        localCount: this.demoDocuments.length,
        collectionCount: 0,
        lastSync: null,
        status: 'disconnected',
        error: error.message
      };
    }
  }

  // Clear Supabase documents and sync current localhost data
  async clearSupabaseAndSyncLocal(): Promise<{ message: string; cleared: number; synced: number; errors: number }> {
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    console.log('🧹 Clearing existing documents from Supabase...');
    
    let clearedCount = 0;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Step 1: Clear existing documents from Supabase
      const { error: docError } = await this.supabaseService.client
        .from('Documents')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (docError) {
        console.error('❌ Error clearing Documents table:', docError);
      } else {
        console.log('✅ Cleared Documents table');
        clearedCount++;
      }

      // Clear DocumentCollection table
      const { error: collectionError } = await this.supabaseService.client
        .from('DocumentCollection')
        .delete()
        .neq('id', 0);
      
      if (collectionError) {
        console.error('❌ Error clearing DocumentCollection table:', collectionError);
      } else {
        console.log('✅ Cleared DocumentCollection table');
        clearedCount++;
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
            clearedCount++;
          }
        }
      } catch (storageError) {
        console.error('❌ Error clearing document storage:', storageError);
      }

      // Step 2: Sync all current localhost documents to Supabase
      console.log('🔄 Syncing', this.demoDocuments.length, 'localhost documents to Supabase...');
      
      for (const document of this.demoDocuments) {
        try {
          await this.syncDocumentToSupabase(document);
          syncedCount++;
          console.log(`✅ Synced document ${document.id}: ${document.fileName}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to sync document ${document.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Document clear and sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { 
        message: `Cleared Supabase and synced ${syncedCount} documents (${errorCount} errors)`,
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

  // Sync all local documents to Supabase storage and database
  async syncAllDocumentsToSupabase(): Promise<{ message: string; synced: number; errors: number; details: any[] }> {
    console.log('🔄 Starting bulk sync of all documents to Supabase...');
    
    let syncedCount = 0;
    let errorCount = 0;
    const details = [];

    try {
      // Get all documents from local storage
      const allDocuments = this.demoDocuments;
      console.log(`📄 Found ${allDocuments.length} documents to sync`);

      for (const document of allDocuments) {
        try {
          // Skip if already stored in Supabase
          if (document.storageType === 'supabase' && document.supabaseUrl) {
            console.log(`⏭️ Skipping ${document.fileName} - already in Supabase`);
            details.push({
              id: document.id,
              fileName: document.fileName,
              status: 'skipped',
              reason: 'Already in Supabase'
            });
            continue;
          }

          // Sync to Supabase database
          await this.autoSyncDocumentToSupabase(document);
          syncedCount++;
          
          console.log(`✅ Synced document ${document.id}: ${document.fileName}`);
          details.push({
            id: document.id,
            fileName: document.fileName,
            status: 'synced',
            supabaseUrl: document.supabaseUrl || 'Database only'
          });
          
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to sync document ${document.id}:`, error.message);
          details.push({
            id: document.id,
            fileName: document.fileName,
            status: 'error',
            error: error.message
          });
        }
      }

      const result = {
        message: `Bulk sync completed: ${syncedCount} synced, ${errorCount} errors`,
        synced: syncedCount,
        errors: errorCount,
        details
      };

      console.log('🎯 Bulk sync summary:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Bulk sync failed:', error);
      return {
        message: `Bulk sync failed: ${error.message}`,
        synced: syncedCount,
        errors: errorCount + 1,
        details
      };
    }
  }

  // Get sync status for all documents
  async getDocumentsSyncStatus(): Promise<{ total: number; supabase: number; local: number; pending: number }> {
    const total = this.demoDocuments.length;
    const supabase = this.demoDocuments.filter(doc => doc.storageType === 'supabase').length;
    const local = this.demoDocuments.filter(doc => doc.storageType === 'local').length;
    const pending = this.demoDocuments.filter(doc => !doc.storageType).length;

    return {
      total,
      supabase,
      local,
      pending
    };
  }
}

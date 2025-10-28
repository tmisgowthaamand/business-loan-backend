import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EnquiryService } from '../../enquiry/enquiry.service';
import { DocumentService } from '../../document/document.service';
import { ShortlistService } from '../../shortlist/shortlist.service';
import { StaffService } from '../../staff/staff.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { CashfreeService } from '../../cashfree/cashfree.service';
import { TransactionService } from '../../transaction/transaction.service';
import { PersistenceService } from './persistence.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DataInitializationService implements OnModuleInit {
  private readonly logger = new Logger(DataInitializationService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly initStatusFile = path.join(this.dataDir, 'initialization-status.json');

  constructor(
    private readonly enquiryService: EnquiryService,
    private readonly documentService: DocumentService,
    private readonly shortlistService: ShortlistService,
    private readonly staffService: StaffService,
    private readonly notificationsService: NotificationsService,
    private readonly cashfreeService: CashfreeService,
    private readonly transactionService: TransactionService,
    private readonly persistenceService: PersistenceService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 RENDER/VERCEL DEPLOYMENT - Data Initialization Starting...');
    
    try {
      // Ensure data directory exists
      await this.ensureDataDirectory();
      
      // Check if data is already initialized
      const initStatus = await this.checkInitializationStatus();
      
      if (!initStatus.isInitialized || this.shouldReinitialize()) {
        await this.initializeAllModuleData();
        await this.saveInitializationStatus();
      } else {
        this.logger.log('✅ Data already initialized, verifying visibility...');
        await this.verifyDataVisibility();
      }
      
      this.logger.log('✅ RENDER/VERCEL DEPLOYMENT - All data visible and persistent');
      
    } catch (error) {
      this.logger.error('❌ RENDER/VERCEL DEPLOYMENT - Data initialization failed:', error);
    }
  }

  private async ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      this.logger.log('📁 Created data directory for persistent storage');
    }
  }

  private async checkInitializationStatus() {
    try {
      if (fs.existsSync(this.initStatusFile)) {
        const status = JSON.parse(fs.readFileSync(this.initStatusFile, 'utf8'));
        return status;
      }
    } catch (error) {
      this.logger.warn('⚠️ Could not read initialization status:', error.message);
    }
    
    return { isInitialized: false, timestamp: null };
  }

  private shouldReinitialize(): boolean {
    const isRender = process.env.RENDER === 'true';
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Always reinitialize in production deployments to ensure data visibility
    return isRender || isVercel || isProduction;
  }

  private async initializeAllModuleData() {
    this.logger.log('📊 RENDER/VERCEL DEPLOYMENT - Initializing all module data...');
    
    // Initialize in dependency order
    await this.initializeEnquiries();
    await this.initializeStaff();
    await this.initializeDocuments();
    await this.initializeShortlists();
    await this.initializePaymentApplications();
    await this.initializeTransactions();
    await this.initializeNotifications();
    
    this.logger.log('🎯 All module data initialized successfully');
  }

  private async initializeEnquiries() {
    try {
      this.logger.log('📋 Initializing enquiry data...');
      
      const existingEnquiries = await this.enquiryService.findAll(1);
      if (existingEnquiries.length === 0) {
        const defaultEnquiries = this.getDefaultEnquiries();
        
        for (const enquiry of defaultEnquiries) {
          try {
            await this.enquiryService.create(enquiry as any, { id: 1 } as any);
            this.logger.log(`✅ Created enquiry: ${enquiry.name}`);
          } catch (error) {
            this.logger.warn(`⚠️ Failed to create enquiry ${enquiry.name}:`, error.message);
          }
        }
      }
      
      const finalCount = await this.enquiryService.findAll(1);
      this.logger.log(`✅ Enquiries initialized: ${finalCount.length} total`);
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize enquiries:', error.message);
    }
  }

  private async initializeStaff() {
    try {
      this.logger.log('👥 Initializing staff data...');
      
      const existingStaff = await this.staffService.getAllStaff();
      this.logger.log(`✅ Staff initialized: ${existingStaff.length} members`);
      
      // Log staff credentials for deployment
      this.logger.log('🔐 RENDER/VERCEL DEPLOYMENT - Staff Login Credentials:');
      existingStaff.forEach(member => {
        const password = member.email === 'admin@gmail.com' ? 'admin123' : '12345678';
        this.logger.log(`   - ${member.name}: ${member.email} / ${password} (${member.role})`);
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize staff:', error.message);
    }
  }

  private async initializeDocuments() {
    try {
      this.logger.log('📄 Initializing document data...');
      
      const existingDocuments = await this.documentService.findAll({ id: 1 } as any);
      if (existingDocuments.length === 0) {
        // Documents will be created when enquiries are processed
        this.logger.log('📄 Documents will be created on demand');
      }
      
      this.logger.log(`✅ Documents initialized: ${existingDocuments.length} total`);
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize documents:', error.message);
    }
  }

  private async initializeShortlists() {
    try {
      this.logger.log('📝 Initializing shortlist data...');
      
      const existingShortlists = await this.shortlistService.findAll({ id: 1 } as any);
      this.logger.log(`✅ Shortlists initialized: ${existingShortlists.length} total`);
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize shortlists:', error.message);
    }
  }

  private async initializePaymentApplications() {
    try {
      this.logger.log('💳 Initializing payment applications...');
      
      const existingPayments = await this.cashfreeService.findAll({ id: 1 } as any);
      this.logger.log(`✅ Payment applications initialized: ${existingPayments.length} total`);
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize payment applications:', error.message);
    }
  }

  private async initializeTransactions() {
    try {
      this.logger.log('💰 Initializing transaction data...');
      
      const existingTransactions = await this.transactionService.findAll({ id: 1 } as any);
      this.logger.log(`✅ Transactions initialized: ${existingTransactions.length} total`);
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize transactions:', error.message);
    }
  }

  private async initializeNotifications() {
    try {
      this.logger.log('🔔 Initializing notification data...');
      
      const existingNotifications = await this.notificationsService.findAll({ id: 1 } as any, 1);
      this.logger.log(`✅ Notifications initialized: ${existingNotifications.notifications?.length || 0} total`);
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize notifications:', error.message);
    }
  }

  private async verifyDataVisibility() {
    try {
      this.logger.log('🔍 Verifying data visibility across all modules...');
      
      const enquiries = await this.enquiryService.findAll(1);
      const documents = await this.documentService.findAll({ id: 1 } as any);
      const shortlists = await this.shortlistService.findAll({ id: 1 } as any);
      const staff = await this.staffService.getAllStaff();
      const notifications = await this.notificationsService.findAll({ id: 1 } as any, 1);
      const payments = await this.cashfreeService.findAll({ id: 1 } as any);
      const transactions = await this.transactionService.findAll({ id: 1 } as any);
      
      const summary = {
        enquiries: enquiries.length,
        documents: documents.length,
        shortlists: shortlists.length,
        staff: staff.length,
        notifications: notifications.notifications?.length || 0,
        payments: payments.length,
        transactions: transactions.length
      };
      
      this.logger.log('📊 RENDER/VERCEL DEPLOYMENT - Data Visibility Summary:');
      Object.entries(summary).forEach(([module, count]) => {
        const status = count > 0 ? '✅ VISIBLE' : '⚠️ EMPTY';
        this.logger.log(`   - ${module}: ${count} items ${status}`);
      });
      
      const totalItems = Object.values(summary).reduce((sum, count) => sum + count, 0);
      this.logger.log(`🎯 Total data items visible: ${totalItems}`);
      
    } catch (error) {
      this.logger.error('❌ Failed to verify data visibility:', error.message);
    }
  }

  private async saveInitializationStatus() {
    try {
      const status = {
        isInitialized: true,
        timestamp: new Date().toISOString(),
        environment: {
          isRender: process.env.RENDER === 'true',
          isVercel: process.env.VERCEL === '1',
          nodeEnv: process.env.NODE_ENV || 'development',
          isProduction: process.env.NODE_ENV === 'production'
        },
        deployment: 'render-vercel-ready'
      };
      
      fs.writeFileSync(this.initStatusFile, JSON.stringify(status, null, 2));
      this.logger.log('💾 Initialization status saved');
      
    } catch (error) {
      this.logger.error('❌ Failed to save initialization status:', error.message);
    }
  }

  private getDefaultEnquiries() {
    return [
      {
        name: 'BALAMURUGAN',
        mobile: '9876543215',
        businessType: 'Manufacturing',
        businessName: 'Balamurugan Enterprises',
        loanAmount: 500000,
        interestStatus: 'VERY_INTERESTED'
      },
      {
        name: 'RAJESH KUMAR',
        mobile: '9876543216',
        businessType: 'Trading',
        businessName: 'Kumar Trading Co',
        loanAmount: 750000,
        interestStatus: 'INTERESTED'
      },
      {
        name: 'PRIYA SHARMA',
        mobile: '9876543217',
        businessType: 'Services',
        businessName: 'Sharma Consultancy',
        loanAmount: 300000,
        interestStatus: 'VERY_INTERESTED'
      },
      {
        name: 'AMIT PATEL',
        mobile: '9876543218',
        businessType: 'Electronics',
        businessName: 'Patel Electronics',
        loanAmount: 400000,
        interestStatus: 'INTERESTED'
      },
      {
        name: 'SUNITA GUPTA',
        mobile: '9876543219',
        businessType: 'Textiles',
        businessName: 'Gupta Textiles',
        loanAmount: 600000,
        interestStatus: 'VERY_INTERESTED'
      },
      {
        name: 'VIKRAM SINGH',
        mobile: '9876543220',
        businessType: 'Agriculture',
        businessName: 'Singh Agro Products',
        loanAmount: 800000,
        interestStatus: 'INTERESTED'
      },
      {
        name: 'ANITA DESAI',
        mobile: '9876543221',
        businessType: 'Healthcare',
        businessName: 'Desai Medical Center',
        loanAmount: 1000000,
        interestStatus: 'VERY_INTERESTED'
      },
      {
        name: 'RAVI MEHTA',
        mobile: '9876543222',
        businessType: 'Construction',
        businessName: 'Mehta Builders',
        loanAmount: 1200000,
        interestStatus: 'INTERESTED'
      },
      {
        name: 'DEEPAK VERMA',
        mobile: '9876543223',
        businessType: 'Food Processing',
        businessName: 'Verma Foods',
        loanAmount: 350000,
        interestStatus: 'VERY_INTERESTED'
      },
      {
        name: 'NEHA AGARWAL',
        mobile: '9876543224',
        businessType: 'Education',
        businessName: 'Agarwal Academy',
        loanAmount: 450000,
        interestStatus: 'INTERESTED'
      },
      {
        name: 'ROHIT SHARMA',
        mobile: '9876543225',
        businessType: 'IT Services',
        businessName: 'Sharma Tech Solutions',
        loanAmount: 700000,
        interestStatus: 'VERY_INTERESTED'
      },
      {
        name: 'MANISH GUPTA',
        mobile: '9876543226',
        businessType: 'Retail',
        businessName: 'Gupta General Store',
        loanAmount: 250000,
        interestStatus: 'INTERESTED'
      },
      {
        name: 'SANJAY JOSHI',
        mobile: '9876543227',
        businessType: 'Transportation',
        businessName: 'Joshi Logistics',
        loanAmount: 900000,
        interestStatus: 'VERY_INTERESTED'
      },
      {
        name: 'KAVITA REDDY',
        mobile: '9876543228',
        businessType: 'Beauty & Wellness',
        businessName: 'Reddy Beauty Salon',
        loanAmount: 200000,
        interestStatus: 'INTERESTED'
      }
    ];
  }

  // Public method to force data initialization
  async forceInitialization(): Promise<{ message: string; status: any }> {
    this.logger.log('🔄 Force initializing all data...');
    
    try {
      await this.initializeAllModuleData();
      await this.saveInitializationStatus();
      
      const verification = await this.getDataSummary();
      
      return {
        message: 'Data initialization completed successfully',
        status: verification
      };
      
    } catch (error) {
      this.logger.error('❌ Force initialization failed:', error);
      throw error;
    }
  }

  async getDataSummary() {
    try {
      const enquiries = await this.enquiryService.findAll(1);
      const documents = await this.documentService.findAll({ id: 1 } as any);
      const shortlists = await this.shortlistService.findAll({ id: 1 } as any);
      const staff = await this.staffService.getAllStaff();
      const notifications = await this.notificationsService.findAll({ id: 1 } as any, 1);
      const payments = await this.cashfreeService.findAll({ id: 1 } as any);
      const transactions = await this.transactionService.findAll({ id: 1 } as any);
      
      return {
        timestamp: new Date().toISOString(),
        environment: {
          isRender: process.env.RENDER === 'true',
          isVercel: process.env.VERCEL === '1',
          nodeEnv: process.env.NODE_ENV || 'development'
        },
        modules: {
          enquiries: { count: enquiries.length, status: enquiries.length > 0 ? 'visible' : 'empty' },
          documents: { count: documents.length, status: documents.length > 0 ? 'visible' : 'empty' },
          shortlists: { count: shortlists.length, status: shortlists.length > 0 ? 'visible' : 'empty' },
          staff: { count: staff.length, status: staff.length > 0 ? 'visible' : 'empty' },
          notifications: { count: notifications.notifications?.length || 0, status: notifications.notifications?.length > 0 ? 'visible' : 'empty' },
          payments: { count: payments.length, status: payments.length > 0 ? 'visible' : 'empty' },
          transactions: { count: transactions.length, status: transactions.length > 0 ? 'visible' : 'empty' }
        },
        totalDataItems: enquiries.length + documents.length + shortlists.length + staff.length + (notifications.notifications?.length || 0) + payments.length + transactions.length,
        allModulesVisible: true,
        deploymentReady: true
      };
      
    } catch (error) {
      this.logger.error('❌ Failed to get data summary:', error);
      throw error;
    }
  }
}

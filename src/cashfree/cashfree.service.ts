import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateCashfreeApplicationDto } from './dto/create-cashfree-application.dto';
import { UpdateCashfreeApplicationDto } from './dto/update-cashfree-application.dto';
import { ShortlistService } from '../shortlist/shortlist.service';
import * as fs from 'fs';
import * as path from 'path';

export interface User {
  id: number;
  name?: string;
  email?: string;
}

export interface CashfreeApplication {
  id: number;
  shortlistId: number;
  loanAmount: number;
  tenure?: number;
  interestRate?: number;
  status: string;
  submittedBy?: {
    id: number;
    name: string;
    email: string;
  };
  shortlist?: {
    id: number;
    name: string;
    mobile: string;
    businessName: string;
    businessType: string;
    loanAmount: number;
    enquiry?: any;
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CashfreeService {
  private readonly logger = new Logger(CashfreeService.name);
  private demoApplications: CashfreeApplication[] = [];
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly paymentsFile = path.join(this.dataDir, 'payments.json');

  constructor(private readonly shortlistService: ShortlistService) {
    this.initializeService();
  }

  private async initializeService() {
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Load existing payments
    await this.loadPayments();

    // Start periodic refresh for Render deployment
    if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
      this.logger.log('🚀 [RENDER] Starting periodic refresh for payment gateway service');
      this.startPeriodicRefresh();
    }
  }

  private startPeriodicRefresh() {
    setInterval(async () => {
      await this.refreshPaymentData();
    }, 4 * 60 * 1000); // Every 4 minutes
  }

  private async refreshPaymentData() {
    try {
      this.logger.log('🔄 [RENDER] Refreshing payment gateway data...');
      
      // Ensure data is loaded if storage is empty
      if (this.demoApplications.length === 0) {
        await this.loadPayments();
      }

      this.logger.log(`💳 [RENDER] Payment gateway refresh complete - ${this.demoApplications.length} applications`);
    } catch (error) {
      this.logger.error('❌ [RENDER] Payment gateway refresh failed:', error);
    }
  }

  private async loadPayments() {
    try {
      if (fs.existsSync(this.paymentsFile)) {
        const data = fs.readFileSync(this.paymentsFile, 'utf8');
        this.demoApplications = JSON.parse(data);
        this.logger.log(`💳 Loaded ${this.demoApplications.length} payment applications from file`);
      } else {
        this.logger.log('💳 No existing payments file, creating sample data');
        await this.createSamplePayments();
      }
    } catch (error) {
      this.logger.error('❌ Error loading payments:', error);
      await this.createSamplePayments();
    }
  }

  private async savePayments() {
    try {
      fs.writeFileSync(this.paymentsFile, JSON.stringify(this.demoApplications, null, 2));
      this.logger.log(`💳 Saved ${this.demoApplications.length} payment applications to file`);
    } catch (error) {
      this.logger.error('❌ Error saving payments:', error);
    }
  }

  private async createSamplePayments() {
    const samplePayments: CashfreeApplication[] = [
      {
        id: Date.now() + 1,
        shortlistId: 1001,
        loanAmount: 500000,
        tenure: 24,
        interestRate: 12.5,
        status: 'PENDING',
        shortlist: {
          id: 1001,
          name: 'BALAMURUGAN',
          mobile: '9876543215',
          businessName: 'Balamurugan Enterprises',
          businessType: 'Manufacturing',
          loanAmount: 500000,
          enquiry: {
            id: 9570,
            name: 'BALAMURUGAN',
            mobile: '9876543215',
            businessType: 'Manufacturing',
            businessName: 'Balamurugan Enterprises'
          }
        },
        submittedBy: {
          id: 1,
          name: 'Pankil',
          email: 'govindamarketing9998@gmail.com'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: Date.now() + 2,
        shortlistId: 1002,
        loanAmount: 750000,
        tenure: 36,
        interestRate: 11.8,
        status: 'APPROVED',
        shortlist: {
          id: 1002,
          name: 'RAJESH KUMAR',
          mobile: '9876543216',
          businessName: 'Kumar Trading Co',
          businessType: 'Trading',
          loanAmount: 750000,
          enquiry: {
            id: 9571,
            name: 'RAJESH KUMAR',
            mobile: '9876543216',
            businessType: 'Trading',
            businessName: 'Kumar Trading Co'
          }
        },
        submittedBy: {
          id: 2,
          name: 'Venkat',
          email: 'gowthaamaneswar1998@gmail.com'
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString()
      },
      {
        id: Date.now() + 3,
        shortlistId: 1003,
        loanAmount: 1000000,
        tenure: 48,
        interestRate: 13.2,
        status: 'PROCESSING',
        shortlist: {
          id: 1003,
          name: 'PRIYA SHARMA',
          mobile: '9876543217',
          businessName: 'Sharma Textiles',
          businessType: 'Textiles',
          loanAmount: 1000000,
          enquiry: {
            id: 9572,
            name: 'PRIYA SHARMA',
            mobile: '9876543217',
            businessType: 'Textiles',
            businessName: 'Sharma Textiles'
          }
        },
        submittedBy: {
          id: 3,
          name: 'Dinesh',
          email: 'dinesh@gmail.com'
        },
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date().toISOString()
      }
    ];

    this.demoApplications = samplePayments;
    await this.savePayments();
    this.logger.log('💳 Created sample payment applications');
  }

  async createApplication(createCashfreeApplicationDto: CreateCashfreeApplicationDto): Promise<CashfreeApplication> {
    try {
      this.logger.log('💳 Creating payment gateway application:', createCashfreeApplicationDto);

      // Fetch shortlist data for client information
      let shortlistData = null;
      if (createCashfreeApplicationDto.shortlistId) {
        try {
          shortlistData = await this.shortlistService.findOne(createCashfreeApplicationDto.shortlistId);
          
          // Handle error responses from shortlist service
          if (shortlistData?.error) {
            this.logger.log('⚠️ Shortlist not found, using fallback data');
            shortlistData = null;
          }
        } catch (error) {
          this.logger.log('⚠️ Could not fetch shortlist data:', error);
          shortlistData = null;
        }
      }

      const newApplication: CashfreeApplication = {
        id: Date.now(),
        shortlistId: createCashfreeApplicationDto.shortlistId,
        loanAmount: createCashfreeApplicationDto.loanAmount,
        tenure: createCashfreeApplicationDto.tenure || 24,
        interestRate: createCashfreeApplicationDto.interestRate || 12.5,
        status: 'PENDING',
        submittedBy: {
          id: 1,
          name: 'System User',
          email: 'system@businessloan.com'
        },
        shortlist: shortlistData ? {
          id: shortlistData.id,
          name: shortlistData.name || shortlistData.enquiry?.name || 'Unknown Client',
          mobile: shortlistData.mobile || shortlistData.enquiry?.mobile || 'N/A',
          businessName: shortlistData.businessName || shortlistData.enquiry?.businessName || shortlistData.businessType || 'General Business',
          businessType: shortlistData.businessType || shortlistData.enquiry?.businessType || 'General Business',
          loanAmount: shortlistData.loanAmount || shortlistData.enquiry?.loanAmount || createCashfreeApplicationDto.loanAmount,
          enquiry: shortlistData.enquiry || {
            id: shortlistData.enquiryId || shortlistData.id || 1,
            name: shortlistData.name || shortlistData.enquiry?.name || 'Unknown Client',
            mobile: shortlistData.mobile || shortlistData.enquiry?.mobile || 'N/A',
            businessType: shortlistData.businessType || shortlistData.enquiry?.businessType || 'General Business',
            businessName: shortlistData.businessName || shortlistData.enquiry?.businessName || 'General Business'
          }
        } : {
          id: createCashfreeApplicationDto.shortlistId,
          name: 'Unknown Client',
          mobile: 'N/A',
          businessName: 'General Business',
          businessType: 'General Business',
          loanAmount: createCashfreeApplicationDto.loanAmount
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.demoApplications.push(newApplication);
      await this.savePayments();

      this.logger.log('✅ Payment gateway application created successfully:', newApplication.id);
      return newApplication;
    } catch (error) {
      this.logger.error('❌ Error creating payment application:', error);
      throw error;
    }
  }

  async findAll(user?: User): Promise<CashfreeApplication[]> {
    // Ensure data is loaded if storage is empty
    if (this.demoApplications.length === 0) {
      await this.loadPayments();
    }

    // Ensure all applications have required display fields
    const enhancedApplications = this.demoApplications.map(app => ({
      ...app,
      displayName: app.shortlist?.name || 'Unknown Client',
      clientInfo: `${app.shortlist?.name || 'Unknown'} - ${app.shortlist?.businessName || 'Business'}`,
      statusDisplay: app.status || 'PENDING',
      amountDisplay: app.loanAmount ? `₹${app.loanAmount.toLocaleString()}` : 'N/A'
    }));

    // Sort by creation date (newest first)
    return enhancedApplications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findOne(id: number): Promise<CashfreeApplication> {
    const application = this.demoApplications.find(app => app.id === id);
    
    if (!application) {
      throw new NotFoundException(`Payment application with ID ${id} not found`);
    }

    return application;
  }

  async update(id: number, updateCashfreeApplicationDto: UpdateCashfreeApplicationDto): Promise<CashfreeApplication> {
    const applicationIndex = this.demoApplications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      throw new NotFoundException(`Payment application with ID ${id} not found`);
    }

    this.demoApplications[applicationIndex] = {
      ...this.demoApplications[applicationIndex],
      ...updateCashfreeApplicationDto,
      updatedAt: new Date().toISOString()
    };

    await this.savePayments();
    return this.demoApplications[applicationIndex];
  }

  async updateStatus(id: number, status: string): Promise<CashfreeApplication> {
    const applicationIndex = this.demoApplications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      throw new NotFoundException(`Payment application with ID ${id} not found`);
    }

    this.demoApplications[applicationIndex].status = status;
    this.demoApplications[applicationIndex].updatedAt = new Date().toISOString();

    await this.savePayments();
    return this.demoApplications[applicationIndex];
  }

  async remove(id: number): Promise<{ message: string }> {
    const applicationIndex = this.demoApplications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      throw new NotFoundException(`Payment application with ID ${id} not found`);
    }

    this.demoApplications.splice(applicationIndex, 1);
    await this.savePayments();

    return { message: 'Payment application deleted successfully' };
  }
}

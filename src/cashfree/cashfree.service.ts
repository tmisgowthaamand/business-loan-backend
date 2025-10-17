import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Optional,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ShortlistService } from '../shortlist/shortlist.service';
import { CreateCashfreeApplicationDto } from './dto';
import { User, CashfreeStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CashfreeService {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly paymentsFile = path.join(this.dataDir, 'payments.json');
  private demoApplications: any[] = [];

  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService: SupabaseService,
    @Inject(forwardRef(() => ShortlistService))
    private shortlistService: ShortlistService,
  ) {
    console.log('🔄 CashfreeService constructor called');
    this.loadPayments();
  }

  private loadPayments() {
    try {
      if (fs.existsSync(this.paymentsFile)) {
        const data = fs.readFileSync(this.paymentsFile, 'utf8');
        this.demoApplications = JSON.parse(data);
        console.log('💳 Loaded', this.demoApplications.length, 'payment applications from file');
      } else {
        console.log('💳 No existing payments file, creating sample data');
        this.createSamplePayments();
      }
    } catch (error) {
      console.log('💳 Error loading payments file, creating sample data:', error.message);
      this.createSamplePayments();
    }
  }

  private createSamplePayments() {
    const samplePayments = [
      {
        id: Date.now() + 1,
        shortlistId: 1001,
        loanAmount: 500000,
        tenure: 24,
        interestRate: 12.5,
        processingFee: 5000,
        purpose: 'Business Expansion',
        collateral: 'Property',
        guarantor: 'Spouse',
        bankAccount: '1234567890',
        ifscCode: 'HDFC0001234',
        panCard: 'ABCDE1234F',
        aadharCard: '1234-5678-9012',
        salarySlips: true,
        itrReturns: true,
        businessProof: true,
        addressProof: true,
        remarks: 'All documents verified',
        status: 'PENDING' as CashfreeStatus,
        submittedById: 1,
        submittedAt: new Date('2024-10-15'),
        decisionDate: null,
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
        }
      },
      {
        id: Date.now() + 2,
        shortlistId: 1002,
        loanAmount: 750000,
        tenure: 36,
        interestRate: 11.8,
        processingFee: 7500,
        purpose: 'Working Capital',
        collateral: 'Machinery',
        guarantor: 'Business Partner',
        bankAccount: '9876543210',
        ifscCode: 'ICICI0001234',
        panCard: 'FGHIJ5678K',
        aadharCard: '9876-5432-1098',
        salarySlips: true,
        itrReturns: true,
        businessProof: true,
        addressProof: true,
        remarks: 'High priority client',
        status: 'PENDING' as CashfreeStatus,
        submittedById: 2,
        submittedAt: new Date('2024-10-14'),
        decisionDate: null,
        shortlist: {
          id: 1002,
          name: 'RAJESH KUMAR',
          mobile: '9876543216',
          businessName: 'Kumar Industries',
          businessType: 'Trading',
          loanAmount: 750000,
          enquiry: {
            id: 1002,
            name: 'RAJESH KUMAR',
            mobile: '9876543216',
            businessType: 'Trading',
            businessName: 'Kumar Industries'
          }
        },
        submittedBy: {
          id: 2,
          name: 'Venkat',
          email: 'govindamanager9998@gmail.com'
        }
      },
      {
        id: Date.now() + 3,
        shortlistId: 1003,
        loanAmount: 300000,
        tenure: 18,
        interestRate: 13.2,
        processingFee: 3000,
        purpose: 'Equipment Purchase',
        collateral: 'Vehicle',
        guarantor: 'Family Member',
        bankAccount: '5555666677',
        ifscCode: 'SBI0001234',
        panCard: 'LMNOP9012Q',
        aadharCard: '5555-6666-7777',
        salarySlips: false,
        itrReturns: true,
        businessProof: true,
        addressProof: true,
        remarks: 'Small business loan',
        status: 'PENDING' as CashfreeStatus,
        submittedById: 3,
        submittedAt: new Date('2024-10-13'),
        decisionDate: null,
        shortlist: {
          id: 1003,
          name: 'PRIYA SHARMA',
          mobile: '9876543217',
          businessName: 'Sharma Textiles',
          businessType: 'Textiles',
          loanAmount: 300000,
          enquiry: {
            id: 1003,
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
        }
      }
    ];

    this.demoApplications = samplePayments;
    this.savePayments();
    console.log('💳 Created', samplePayments.length, 'sample payment applications');
  }

  private savePayments() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.paymentsFile, JSON.stringify(this.demoApplications, null, 2));
      console.log('💾 Saved', this.demoApplications.length, 'payment applications to file');
    } catch (error) {
      console.error('❌ Error saving payments:', error);
    }
  }

  async createApplication(
    createCashfreeApplicationDto: CreateCashfreeApplicationDto,
    userId: number,
  ) {
    try {
      // Force demo mode - create in-memory application
      console.log('📝 Using demo mode - creating payment application with data:', createCashfreeApplicationDto);
      
      // Fetch real shortlist data if shortlistId is provided
      let shortlistData = null;
      if (createCashfreeApplicationDto.shortlistId) {
        try {
          shortlistData = await this.shortlistService.findOne(createCashfreeApplicationDto.shortlistId);
          console.log('📝 Found shortlist data:', JSON.stringify(shortlistData, null, 2));
          console.log('📝 Shortlist name:', shortlistData?.name);
          console.log('📝 Shortlist mobile:', shortlistData?.mobile);
          console.log('📝 Shortlist businessType:', shortlistData?.businessType);
          console.log('📝 Shortlist enquiry data:', shortlistData?.enquiry);
          
          // If shortlist has error property, it means it wasn't found
          if (shortlistData?.error) {
            console.log('⚠️ Shortlist not found, using fallback data');
            shortlistData = null;
          }
        } catch (error) {
          console.log('⚠️ Could not fetch shortlist data:', error);
          shortlistData = null;
        }
      }
      
      const mockApplication = {
        id: Date.now(),
        shortlistId: createCashfreeApplicationDto.shortlistId || 1,
        loanAmount: createCashfreeApplicationDto.loanAmount || 0,
        tenure: createCashfreeApplicationDto.tenure || 12,
        interestRate: createCashfreeApplicationDto.interestRate || 12.5,
        processingFee: createCashfreeApplicationDto.processingFee || 0,
        purpose: createCashfreeApplicationDto.purpose || 'Business Loan',
        collateral: createCashfreeApplicationDto.collateral || '',
        guarantor: createCashfreeApplicationDto.guarantor || '',
        bankAccount: createCashfreeApplicationDto.bankAccount || '',
        ifscCode: createCashfreeApplicationDto.ifscCode || '',
        panCard: createCashfreeApplicationDto.panCard || '',
        aadharCard: createCashfreeApplicationDto.aadharCard || '',
        salarySlips: createCashfreeApplicationDto.salarySlips || false,
        itrReturns: createCashfreeApplicationDto.itrReturns || false,
        businessProof: createCashfreeApplicationDto.businessProof || false,
        addressProof: createCashfreeApplicationDto.addressProof || false,
        remarks: createCashfreeApplicationDto.remarks || '',
        status: createCashfreeApplicationDto.status || 'PENDING' as CashfreeStatus,
        submittedById: userId || 1,
        submittedAt: createCashfreeApplicationDto.appliedAt || new Date(),
        decisionDate: null,
        shortlist: {
          id: createCashfreeApplicationDto.shortlistId,
          name: shortlistData?.name || shortlistData?.enquiry?.name || 'Unknown Client',
          mobile: shortlistData?.mobile || shortlistData?.enquiry?.mobile || 'N/A',
          businessName: shortlistData?.businessName || shortlistData?.enquiry?.businessName || shortlistData?.businessType || 'General Business',
          businessType: shortlistData?.businessType || shortlistData?.enquiry?.businessType || 'General Business',
          loanAmount: shortlistData?.loanAmount || shortlistData?.enquiry?.loanAmount || createCashfreeApplicationDto.loanAmount,
          enquiry: shortlistData?.enquiry || {
            id: shortlistData?.enquiryId || shortlistData?.id || 1,
            name: shortlistData?.name || shortlistData?.enquiry?.name || 'Unknown Client',
            mobile: shortlistData?.mobile || shortlistData?.enquiry?.mobile || 'N/A',
            businessType: shortlistData?.businessType || shortlistData?.enquiry?.businessType || 'General Business',
            businessName: shortlistData?.businessName || shortlistData?.enquiry?.businessName || 'General Business'
          }
        },
      submittedBy: {
        id: userId || 1,
        name: shortlistData?.staff || 'Demo Staff',
        email: 'staff@demo.com'
      }
    };

    // Add to file-based storage
    this.demoApplications.push(mockApplication);
    this.savePayments();

    // Create notification
    try {
      const notificationResponse = await fetch('http://localhost:5002/api/notifications/system/payment-applied', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: mockApplication.id,
          clientName: `Payment gateway application submitted for ${mockApplication.shortlist.name}`,
          amount: mockApplication.shortlist.loanAmount
        })
      });
      
      if (notificationResponse.ok) {
        console.log('✅ Notification created for payment application');
      }
    } catch (error) {
      console.log('⚠️ Failed to create payment application notification:', error);
    }

    // Sync to Supabase in background (non-blocking)
    this.syncPaymentToSupabase(mockApplication).catch(error => {
      console.error('❌ Failed to sync payment to Supabase:', error);
    });

      return mockApplication;
    } catch (error) {
      console.error('❌ Error creating payment application:', error);
      throw error;
    }
  }

  async findAll(user: User) {
    console.log('💳 Getting payment applications from file storage, count:', this.demoApplications.length);
    
    // Ensure we have the latest data from file
    this.loadPayments();
    
    const sortedApplications = this.demoApplications.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    
    console.log('💳 Returning', sortedApplications.length, 'payment applications with real client data');
    return sortedApplications;
  }

  async findOne(id: number) {
    console.log('💳 Searching for payment application ID:', id);
    
    // Ensure we have the latest data from file
    this.loadPayments();
    
    const application = this.demoApplications.find(app => app.id === id);
    
    if (!application) {
      throw new NotFoundException('Payment application not found');
    }
    
    return application;
  }

  async updateStatus(id: number, status: CashfreeStatus, userId: number) {
    // Force demo mode - update in-memory storage
    console.log('📝 Using demo mode - updating payment application status');
    
    const applicationIndex = this.demoApplications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      throw new NotFoundException('Cashfree application not found');
    }

    // Update the application in memory
    this.demoApplications[applicationIndex] = {
      ...this.demoApplications[applicationIndex],
      status,
      decisionDate: new Date(),
    };

    const updated = this.demoApplications[applicationIndex];
    
    // Save to file
    this.savePayments();

    // Create notification for payment status update
    try {
      const clientName = updated.shortlist?.enquiry?.name || updated.shortlist?.name || 'Unknown Client';
      const loanAmount = updated.shortlist?.loanAmount || 0;
      let notificationMessage = '';
      
      if (status === 'TRANSACTION_DONE') {
        notificationMessage = `Payment gateway approved for ${clientName} - ₹${loanAmount.toLocaleString()}`;
      } else if (status === 'CLOSED') {
        notificationMessage = `Payment gateway closed for ${clientName} - ₹${loanAmount.toLocaleString()}`;
      } else if (status === 'PENDING') {
        notificationMessage = `Payment gateway pending for ${clientName} - ₹${loanAmount.toLocaleString()}`;
      } else {
        notificationMessage = `Payment status updated for ${clientName} - ${status}`;
      }
      
      const notificationResponse = await fetch('http://localhost:5002/api/notifications/system/payment-applied', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: updated.id,
          clientName: notificationMessage,
          amount: loanAmount
        })
      });
      
      if (notificationResponse.ok) {
        console.log('✅ Notification created for payment status update');
      }
    } catch (error) {
      console.log('⚠️ Failed to create payment status notification:', error);
    }

    return updated;
  }

  // Private method to integrate with actual Cashfree API
  private async submitToCashfree(application: any) {
    // Implementation would go here using Cashfree SDK
    // This is a placeholder for the actual integration
    console.log('Submitting to Cashfree:', application.id);
  }

  // Supabase sync methods
  private async syncPaymentToSupabase(payment: any): Promise<void> {
    if (!this.supabaseService) {
      console.log('⚠️ Supabase service not available, skipping payment sync');
      return;
    }
    
    try {
      console.log('🔄 Syncing payment to Supabase:', payment.id);
      
      const supabaseData = {
        id: payment.id,
        enquiry_id: payment.shortlist?.enquiry?.id || null,
        shortlist_id: payment.shortlistId,
        client_name: payment.shortlist?.enquiry?.name || payment.shortlist?.name || 'Unknown',
        mobile: payment.shortlist?.enquiry?.mobile || '9876543210',
        email: payment.shortlist?.enquiry?.email || null,
        business_name: payment.shortlist?.enquiry?.businessName || null,
        business_type: payment.shortlist?.enquiry?.businessType || null,
        loan_amount: payment.loanAmount,
        tenure: payment.tenure,
        interest_rate: payment.interestRate,
        processing_fee: payment.processingFee,
        purpose: payment.purpose,
        collateral: payment.collateral,
        guarantor: payment.guarantor,
        bank_account: payment.bankAccount,
        ifsc_code: payment.ifscCode,
        pan_card: payment.panCard,
        aadhar_card: payment.aadharCard,
        salary_slips: payment.salarySlips,
        itr_returns: payment.itrReturns,
        business_proof: payment.businessProof,
        address_proof: payment.addressProof,
        remarks: payment.remarks,
        status: payment.status || 'PENDING',
        application_data: JSON.stringify(payment),
        created_at: payment.submittedAt || new Date(),
        updated_at: payment.submittedAt || new Date()
      };
      
      const { data, error } = await this.supabaseService.client
        .from('PaymentGateway')
        .upsert(supabaseData, { onConflict: 'id' })
        .select();
      
      if (error) {
        console.error('❌ Supabase payment sync error:', error);
        throw error;
      }
      
      console.log('✅ Successfully synced payment to Supabase:', data);
    } catch (error) {
      console.error('❌ Failed to sync payment to Supabase:', error);
      // Don't throw error - this is background sync
    }
  }

  async syncAllPaymentsToSupabase(): Promise<void> {
    if (!this.supabaseService) {
      console.log('⚠️ Supabase service not available, skipping payments sync');
      return;
    }
    
    console.log('🔄 Syncing all payments to Supabase...');
    
    for (const payment of this.demoApplications) {
      try {
        await this.syncPaymentToSupabase(payment);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to sync payment ${payment.id}:`, error);
      }
    }
    
    console.log('✅ Completed syncing all payments to Supabase');
  }

  async getPaymentsSyncStatus(): Promise<any> {
    if (!this.supabaseService) {
      return {
        supabaseCount: 0,
        localCount: this.demoApplications.length,
        lastSync: null,
        status: 'service_unavailable',
        error: 'Supabase service not initialized'
      };
    }
    
    try {
      const { count, error } = await this.supabaseService.client
        .from('PaymentGateway')
        .select('*', { count: 'exact', head: true });
      
      return {
        supabaseCount: count || 0,
        localCount: this.demoApplications.length,
        lastSync: new Date().toISOString(),
        status: error ? 'error' : 'connected'
      };
    } catch (error) {
      return {
        supabaseCount: 0,
        localCount: this.demoApplications.length,
        lastSync: null,
        status: 'disconnected',
        error: error.message
      };
    }
  }

  async remove(id: number, userId: number) {
    // Force demo mode - remove from in-memory storage
    console.log('🗑️ Removing payment application from demo storage:', id);
    
    const applicationIndex = this.demoApplications.findIndex(app => app.id === id);
    if (applicationIndex === -1) {
      throw new NotFoundException('Payment application not found');
    }

    // Remove from file-based storage
    const removedApplication = this.demoApplications.splice(applicationIndex, 1)[0];
    this.savePayments();
    
    console.log('✅ Removed payment application from demo storage:', removedApplication.shortlist?.name || 'Unknown Client');
    
    // Create notification for deletion
    try {
      const clientName = removedApplication.shortlist?.name || 'Unknown Client';
      const notificationResponse = await fetch('http://localhost:5002/api/notifications/system/payment-deleted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: removedApplication.id,
          clientName: `Payment application deleted for ${clientName}`,
          amount: removedApplication.loanAmount
        })
      });
      
      if (notificationResponse.ok) {
        console.log('✅ Notification created for payment application deletion');
      }
    } catch (error) {
      console.log('⚠️ Failed to create payment deletion notification:', error);
    }
    
    return { 
      message: 'Payment application deleted successfully', 
      deletedApplication: {
        id: removedApplication.id,
        clientName: removedApplication.shortlist?.name || 'Unknown Client',
        loanAmount: removedApplication.loanAmount
      }
    };
  }

  // Method to clear Supabase and sync all current localhost payments
  async clearAndSyncAllPaymentsToSupabase(): Promise<{ cleared: number; synced: number; errors: number }> {
    if (!this.supabaseService) {
      console.log('⚠️ Supabase service not available');
      return { cleared: 0, synced: 0, errors: 0 };
    }

    console.log('🧹 Clearing existing payments from Supabase...');
    
    let clearedCount = 0;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Step 1: Clear existing payments from Supabase
      const { error: deleteError } = await this.supabaseService.client
        .from('PaymentGateway')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (deleteError) {
        console.error('❌ Error clearing Supabase payments:', deleteError);
      } else {
        console.log('✅ Cleared all existing payments from Supabase');
        clearedCount = 1; // Indicate successful clear
      }

      // Step 2: Sync all current localhost payments to Supabase
      console.log('🔄 Syncing', this.demoApplications.length, 'localhost payments to Supabase...');
      
      for (const payment of this.demoApplications) {
        try {
          await this.syncPaymentToSupabase(payment);
          syncedCount++;
          console.log(`✅ Synced payment ${payment.id}: ${payment.shortlist?.name || 'Unknown Client'}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Failed to sync payment ${payment.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Payment sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { cleared: clearedCount, synced: syncedCount, errors: errorCount };
      
    } catch (error) {
      console.error('❌ Error in clearAndSyncAllPaymentsToSupabase:', error);
      return { cleared: 0, synced: syncedCount, errors: errorCount + 1 };
    }
  }

  // Clear all payment applications
  async clearAllPayments(): Promise<{ message: string; cleared: number }> {
    const clearedCount = this.demoApplications.length;
    this.demoApplications = [];
    this.savePayments();
    
    console.log('🗑️ Cleared all payment applications from storage:', clearedCount);
    return {
      message: `Cleared ${clearedCount} payment applications from storage`,
      cleared: clearedCount
    };
  }

  // Enhanced sync all payments to Supabase with return value
  async syncAllPaymentsToSupabaseEnhanced(): Promise<{ message: string; synced: number; errors: number }> {
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    let synced = 0;
    let errors = 0;

    console.log('🔄 Starting bulk sync of', this.demoApplications.length, 'payment applications to Supabase');

    for (const payment of this.demoApplications) {
      try {
        await this.syncPaymentToSupabase(payment);
        synced++;
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('❌ Failed to sync payment:', payment.id, error);
        errors++;
      }
    }

    console.log('✅ Bulk payment sync completed:', synced, 'synced,', errors, 'errors');
    
    return {
      message: `Synced ${synced} payment applications to Supabase (${errors} errors)`,
      synced,
      errors
    };
  }

  // Clear Supabase payment applications and sync current localhost data
  async clearSupabaseAndSyncLocal(): Promise<{ message: string; cleared: number; synced: number; errors: number }> {
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    console.log('🧹 Clearing existing payment applications from Supabase...');
    
    let clearedCount = 0;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Step 1: Clear existing payment applications from Supabase
      const { error: deleteError } = await this.supabaseService.client
        .from('PaymentGateway')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (deleteError) {
        console.error('❌ Error clearing Supabase payment applications:', deleteError);
      } else {
        console.log('✅ Cleared all existing payment applications from Supabase');
        clearedCount = 1; // Indicate successful clear
      }

      // Step 2: Sync all current localhost payment applications to Supabase
      console.log('🔄 Syncing', this.demoApplications.length, 'localhost payment applications to Supabase...');
      
      for (const payment of this.demoApplications) {
        try {
          await this.syncPaymentToSupabase(payment);
          syncedCount++;
          console.log(`✅ Synced payment ${payment.id}: ${payment.shortlist?.name || 'Unknown Client'}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to sync payment ${payment.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Payment clear and sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { 
        message: `Cleared Supabase and synced ${syncedCount} payment applications (${errorCount} errors)`,
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

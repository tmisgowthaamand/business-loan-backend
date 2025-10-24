import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UnifiedSupabaseSyncService {
  private readonly logger = new Logger(UnifiedSupabaseSyncService.name);
  private supabaseClient: any;

  constructor() {
    this.initializeSupabaseClient();
  }

  private initializeSupabaseClient() {
    try {
      // Use environment variables for deployment security
      const supabaseUrl = process.env.SUPABASE_URL || 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const { createClient } = require('@supabase/supabase-js');
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
      
      this.logger.log('🚀 [DEPLOYMENT] Unified Supabase client initialized for all modules');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Supabase client:', error);
    }
  }

  /**
   * Generic method to sync any data to any Supabase table
   */
  async syncToTable(tableName: string, data: any, options: {
    uniqueField?: string;
    skipDuplicateCheck?: boolean;
    upsert?: boolean;
  } = {}): Promise<{ success: boolean; data?: any; error?: any }> {
    // Only sync in actual production deployments
    const isProduction = process.env.NODE_ENV === 'production';
    const isRenderProduction = process.env.RENDER === 'true' && isProduction;
    const isVercelProduction = process.env.VERCEL === '1' && isProduction;
    
    // Skip sync in development or local environments
    if (!isProduction || (!isRenderProduction && !isVercelProduction)) {
      this.logger.log(`🔧 [DEV] Skipping Supabase sync for ${tableName} - not in production deployment`);
      this.logger.log(`🔧 Environment: NODE_ENV=${process.env.NODE_ENV}, RENDER=${process.env.RENDER}, VERCEL=${process.env.VERCEL}`);
      return { success: true, data: null };
    }
    
    try {
      this.logger.log(`🔄 [DEPLOYMENT] Auto-syncing to Supabase table: ${tableName}`);
      
      if (!this.supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Check for duplicates if uniqueField is provided
      if (options.uniqueField && !options.skipDuplicateCheck && data[options.uniqueField]) {
        const { data: existing, error: checkError } = await this.supabaseClient
          .from(tableName)
          .select('id')
          .eq(options.uniqueField, data[options.uniqueField])
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existing) {
          this.logger.warn(`⚠️ Duplicate found in ${tableName}, skipping sync:`, data[options.uniqueField]);
          return { success: false, error: 'Duplicate entry' };
        }
      }

      // Insert or upsert data
      let query = this.supabaseClient.from(tableName);
      
      if (options.upsert) {
        query = query.upsert(data);
      } else {
        query = query.insert(data);
      }

      const { data: result, error } = await query.select();

      if (error) {
        this.logger.error(`❌ [DEPLOYMENT] Auto-sync error for ${tableName}:`, error);
        return { success: false, error };
      }

      this.logger.log(`✅ [DEPLOYMENT] Successfully synced to ${tableName}:`, {
        id: result?.[0]?.id,
        tableName,
        environment: this.getEnvironment()
      });

      return { success: true, data: result?.[0] };
    } catch (error) {
      this.logger.error(`❌ [DEPLOYMENT] Failed to sync to ${tableName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync enquiry data to Supabase
   */
  async syncEnquiry(enquiry: any): Promise<void> {
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

    await this.syncToTable('Enquiry', supabaseData, { uniqueField: 'mobile' });
  }

  /**
   * Sync document data to Supabase
   */
  async syncDocument(document: any): Promise<void> {
    const supabaseData = {
      id: document.id,
      enquiryId: document.enquiryId,
      type: document.type,
      filename: document.filename,
      originalName: document.originalName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      verified: document.verified || false,
      verifiedBy: document.verifiedBy || null,
      verifiedAt: document.verifiedAt || null,
      uploadedBy: document.uploadedBy || 'System',
      status: document.status || 'PENDING',
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };

    await this.syncToTable('Documents', supabaseData, { uniqueField: 'id' });
  }

  /**
   * Sync shortlist data to Supabase
   */
  async syncShortlist(shortlist: any): Promise<void> {
    const supabaseData = {
      id: shortlist.id,
      enquiryId: shortlist.enquiryId,
      name: shortlist.name,
      mobile: shortlist.mobile,
      businessName: shortlist.businessName,
      businessType: shortlist.businessType,
      loanAmount: shortlist.loanAmount,
      interestStatus: shortlist.interestStatus || 'INTERESTED',
      staff: shortlist.staff || 'Auto-Assigned',
      createdAt: shortlist.createdAt,
      updatedAt: shortlist.updatedAt
    };

    await this.syncToTable('Shortlist', supabaseData, { uniqueField: 'mobile' });
  }

  /**
   * Sync staff data to Supabase
   */
  async syncStaff(staff: any): Promise<void> {
    const supabaseData = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      department: staff.department || null,
      position: staff.position || null,
      status: staff.status || 'ACTIVE',
      hasAccess: staff.hasAccess || false,
      verified: staff.verified || false,
      clientName: staff.clientName || null,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt
    };

    await this.syncToTable('Staff', supabaseData, { uniqueField: 'email' });
  }

  /**
   * Sync transaction data to Supabase
   */
  async syncTransaction(transaction: any): Promise<void> {
    const supabaseData = {
      id: transaction.id,
      name: transaction.name,
      date: transaction.date,
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      status: transaction.status || 'PENDING',
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    };

    await this.syncToTable('Transactions', supabaseData, { uniqueField: 'transactionId' });
  }

  /**
   * Sync payment gateway data to Supabase
   */
  async syncPaymentGateway(payment: any): Promise<void> {
    const supabaseData = {
      id: payment.id,
      shortlistId: payment.shortlistId,
      loanAmount: payment.loanAmount,
      status: payment.status || 'PENDING',
      clientName: payment.shortlist?.name || 'Unknown',
      clientMobile: payment.shortlist?.mobile || null,
      businessName: payment.shortlist?.businessName || null,
      submittedBy: payment.submittedBy?.name || 'System',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };

    await this.syncToTable('PaymentGateway', supabaseData, { uniqueField: 'id' });
  }

  /**
   * Get current deployment environment
   */
  private getEnvironment(): string {
    if (process.env.VERCEL === '1') return 'Vercel';
    if (process.env.RENDER === 'true') return 'Render';
    return 'Local';
  }

  /**
   * Batch sync multiple records to a table
   */
  async batchSync(tableName: string, records: any[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const record of records) {
      try {
        const result = await this.syncToTable(tableName, record, { skipDuplicateCheck: true });
        if (result.success) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        this.logger.error(`Failed to sync record to ${tableName}:`, error);
      }
    }

    this.logger.log(`📊 Batch sync completed for ${tableName}: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Test Supabase connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .from('Enquiry')
        .select('count')
        .limit(1);

      if (error) {
        this.logger.error('❌ Supabase connection test failed:', error);
        return false;
      }

      this.logger.log('✅ Supabase connection test successful');
      return true;
    } catch (error) {
      this.logger.error('❌ Supabase connection test error:', error);
      return false;
    }
  }

  /**
   * Auto-sync method that determines the correct sync based on data type
   */
  async autoSync(data: any, dataType: 'enquiry' | 'document' | 'shortlist' | 'staff' | 'transaction' | 'payment'): Promise<void> {
    try {
      this.logger.log(`🔄 [AUTO-SYNC] Starting auto-sync for ${dataType}:`, data.id || data.name);
      
      switch (dataType) {
        case 'enquiry':
          await this.syncEnquiry(data);
          break;
        case 'document':
          await this.syncDocument(data);
          break;
        case 'shortlist':
          await this.syncShortlist(data);
          break;
        case 'staff':
          await this.syncStaff(data);
          break;
        case 'transaction':
          await this.syncTransaction(data);
          break;
        case 'payment':
          await this.syncPaymentGateway(data);
          break;
        default:
          this.logger.warn(`⚠️ Unknown data type for auto-sync: ${dataType}`);
      }
      
      this.logger.log(`✅ [AUTO-SYNC] Completed auto-sync for ${dataType}:`, data.id || data.name);
    } catch (error) {
      this.logger.error(`❌ [AUTO-SYNC] Failed auto-sync for ${dataType}:`, error);
      // Don't throw error to prevent breaking the main flow
    }
  }

  /**
   * Bulk auto-sync for multiple records
   */
  async bulkAutoSync(records: any[], dataType: 'enquiry' | 'document' | 'shortlist' | 'staff' | 'transaction' | 'payment'): Promise<{ success: number; failed: number }> {
    this.logger.log(`🔄 [BULK-SYNC] Starting bulk auto-sync for ${records.length} ${dataType} records`);
    
    let success = 0;
    let failed = 0;

    for (const record of records) {
      try {
        await this.autoSync(record, dataType);
        success++;
      } catch (error) {
        failed++;
        this.logger.error(`❌ [BULK-SYNC] Failed to sync ${dataType} record:`, error);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.logger.log(`📊 [BULK-SYNC] Completed bulk auto-sync for ${dataType}: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Get sync status for all modules
   */
  async getSyncStatus(): Promise<any> {
    const isProduction = process.env.NODE_ENV === 'production';
    const isRenderProduction = process.env.RENDER === 'true' && isProduction;
    const isVercelProduction = process.env.VERCEL === '1' && isProduction;
    
    return {
      environment: this.getEnvironment(),
      isProduction,
      isRenderProduction,
      isVercelProduction,
      syncEnabled: isProduction && (isRenderProduction || isVercelProduction),
      supabaseConnected: !!this.supabaseClient,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Force sync all data from all modules (for deployment initialization)
   */
  async forceSyncAllModules(): Promise<any> {
    this.logger.log('🚀 [FORCE-SYNC] Starting force sync for all modules...');
    
    const results = {
      enquiries: { success: 0, failed: 0 },
      documents: { success: 0, failed: 0 },
      shortlists: { success: 0, failed: 0 },
      staff: { success: 0, failed: 0 },
      transactions: { success: 0, failed: 0 },
      payments: { success: 0, failed: 0 }
    };

    try {
      // Load and sync enquiries
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');

      // Sync enquiries
      try {
        const enquiriesFile = path.join(dataDir, 'enquiries.json');
        if (fs.existsSync(enquiriesFile)) {
          const enquiries = JSON.parse(fs.readFileSync(enquiriesFile, 'utf8'));
          results.enquiries = await this.bulkAutoSync(enquiries, 'enquiry');
        }
      } catch (error) {
        this.logger.error('❌ Failed to sync enquiries:', error);
      }

      // Sync documents
      try {
        const documentsFile = path.join(dataDir, 'documents.json');
        if (fs.existsSync(documentsFile)) {
          const documents = JSON.parse(fs.readFileSync(documentsFile, 'utf8'));
          results.documents = await this.bulkAutoSync(documents, 'document');
        }
      } catch (error) {
        this.logger.error('❌ Failed to sync documents:', error);
      }

      // Sync shortlists
      try {
        const shortlistsFile = path.join(dataDir, 'shortlists.json');
        if (fs.existsSync(shortlistsFile)) {
          const shortlists = JSON.parse(fs.readFileSync(shortlistsFile, 'utf8'));
          results.shortlists = await this.bulkAutoSync(shortlists, 'shortlist');
        }
      } catch (error) {
        this.logger.error('❌ Failed to sync shortlists:', error);
      }

      // Sync staff
      try {
        const staffFile = path.join(dataDir, 'staff.json');
        if (fs.existsSync(staffFile)) {
          const staff = JSON.parse(fs.readFileSync(staffFile, 'utf8'));
          results.staff = await this.bulkAutoSync(staff, 'staff');
        }
      } catch (error) {
        this.logger.error('❌ Failed to sync staff:', error);
      }

      // Sync payments
      try {
        const paymentsFile = path.join(dataDir, 'payments.json');
        if (fs.existsSync(paymentsFile)) {
          const payments = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
          results.payments = await this.bulkAutoSync(payments, 'payment');
        }
      } catch (error) {
        this.logger.error('❌ Failed to sync payments:', error);
      }

      this.logger.log('✅ [FORCE-SYNC] Completed force sync for all modules:', results);
      return results;
    } catch (error) {
      this.logger.error('❌ [FORCE-SYNC] Force sync failed:', error);
      throw error;
    }
  }
}

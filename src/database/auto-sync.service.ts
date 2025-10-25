import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AutoSyncService {
  private readonly logger = new Logger(AutoSyncService.name);
  private isEnabled = false;

  constructor(
    private configService: ConfigService,
    @Optional() private supabaseService?: SupabaseService
  ) {
    this.initializeAutoSync();
  }

  private initializeAutoSync() {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const isRender = this.configService.get('RENDER') === 'true';
    const isVercel = this.configService.get('VERCEL') === '1';
    
    // FORCE ENABLE auto-sync for Render/Vercel deployments regardless of NODE_ENV
    this.isEnabled = (isRender || isVercel || isProduction) && !!this.supabaseService;
    
    this.logger.log('🔄 AUTO-SYNC SERVICE INITIALIZED');
    this.logger.log(`   - NODE_ENV: ${this.configService.get('NODE_ENV') || 'undefined'}`);
    this.logger.log(`   - RENDER: ${isRender ? 'true' : 'false'}`);
    this.logger.log(`   - VERCEL: ${isVercel ? 'true' : 'false'}`);
    this.logger.log(`   - Production: ${isProduction ? 'true' : 'false'}`);
    this.logger.log(`   - Supabase Available: ${!!this.supabaseService}`);
    this.logger.log(`   - Auto-Sync Enabled: ${this.isEnabled ? '✅ YES' : '❌ NO'}`);
    
    if (this.isEnabled) {
      const platform = isRender ? 'RENDER' : isVercel ? 'VERCEL' : 'PRODUCTION';
      this.logger.log(`🚀 ${platform} DEPLOYMENT: Auto-sync to Supabase ACTIVE`);
    } else {
      this.logger.log('🏠 LOCAL/DEV: Auto-sync disabled (using local storage)');
      if (!this.supabaseService) {
        this.logger.log('❌ Supabase service not available');
      }
    }
  }

  // Enquiry Auto-Sync
  async syncEnquiry(enquiryData: any): Promise<boolean> {
    // Force sync for Render deployment even if auto-sync appears disabled
    const isRender = this.configService.get('RENDER') === 'true';
    const isVercel = this.configService.get('VERCEL') === '1';
    const shouldForceSync = isRender || isVercel;
    
    if (!this.supabaseService) {
      this.logger.log('❌ Enquiry sync failed: Supabase service not available');
      return false;
    }
    
    if (!this.isEnabled && !shouldForceSync) {
      this.logger.log('📝 Enquiry sync skipped (auto-sync disabled)');
      return false;
    }

    try {
      const platform = isRender ? 'RENDER' : isVercel ? 'VERCEL' : 'PRODUCTION';
      this.logger.log(`🔄 [${platform}] Force syncing enquiry: ${enquiryData.name}`);
      
      // Try both table names for compatibility
      let syncResult = null;
      
      // Try 'enquiries' table first (lowercase) - minimal columns only
      try {
        syncResult = await this.supabaseService.client
          .from('enquiries')
          .upsert({
            id: enquiryData.id,
            name: enquiryData.name,
            mobile: enquiryData.mobile,
            email: enquiryData.email,
            business_name: enquiryData.businessName,
            business_type: enquiryData.businessType,
            loan_amount: enquiryData.loanAmount,
            created_at: enquiryData.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (syncResult.error) {
          throw new Error(syncResult.error.message);
        }

        this.logger.log(`✅ [${platform}] Enquiry synced successfully: ${enquiryData.name}`);
        return true;
      } catch (tableError) {
        // Try 'Enquiry' table (capitalized) as fallback
        this.logger.log(`⚠️ [${platform}] Trying alternative table name...`);
        
        const fallbackResult = await this.supabaseService.client
          .from('Enquiry')
          .upsert({
            id: enquiryData.id,
            name: enquiryData.name,
            mobile: enquiryData.mobile,
            email: enquiryData.email,
            business_name: enquiryData.businessName,
            business_type: enquiryData.businessType,
            loan_amount: enquiryData.loanAmount,
            created_at: enquiryData.createdAt || new Date().toISOString(),
            // Remove updatedAt as it doesn't exist in Supabase schema
          }, {
            onConflict: 'id'
          });

        if (fallbackResult.error) {
          this.logger.error(`❌ [${platform}] Both table attempts failed:`, fallbackResult.error.message);
          return false;
        }

        this.logger.log(`✅ [${platform}] Enquiry synced to fallback table: ${enquiryData.name}`);
        return true;
      }
    } catch (error) {
      const platform = isRender ? 'RENDER' : isVercel ? 'VERCEL' : 'PRODUCTION';
      this.logger.error(`❌ [${platform}] Enquiry sync error:`, error);
      return false;
    }
  }

  // Document Auto-Sync with Storage
  async syncDocument(documentData: any, fileBuffer?: Buffer): Promise<boolean> {
    if (!this.isEnabled || !this.supabaseService) {
      this.logger.log('📄 Document sync skipped (auto-sync disabled)');
      return false;
    }

    try {
      this.logger.log(`🔄 Auto-syncing document: ${documentData.fileName} for ${documentData.clientName}`);
      
      let filePath = documentData.filePath;
      
      // Upload file to Supabase Storage if buffer provided
      if (fileBuffer) {
        const fileName = `${documentData.clientName}/${documentData.documentType}/${documentData.fileName}`;
        
        const { data: uploadData, error: uploadError } = await this.supabaseService.client.storage
          .from('documents')
          .upload(fileName, fileBuffer, {
            contentType: documentData.mimeType,
            upsert: true
          });

        if (uploadError) {
          this.logger.error('❌ File upload failed:', uploadError.message);
        } else {
          filePath = uploadData.path;
          this.logger.log(`📁 File uploaded to storage: ${fileName}`);
        }
      }

      // Sync document metadata to database
      const { data, error } = await this.supabaseService.client
        .from('Document')
        .upsert({
          id: documentData.id,
          enquiry_id: documentData.enquiryId,
          client_name: documentData.clientName,
          document_type: documentData.documentType,
          file_name: documentData.fileName,
          file_path: filePath,
          file_size: documentData.fileSize,
          mime_type: documentData.mimeType,
          verified: documentData.verified || false,
          verified_at: documentData.verifiedAt,
          verified_by: documentData.verifiedBy,
          upload_date: documentData.uploadDate || new Date().toISOString(),
          created_at: documentData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        this.logger.error('❌ Document sync failed:', error.message);
        return false;
      }

      this.logger.log(`✅ Document synced successfully: ${documentData.fileName}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Document sync error:', error);
      return false;
    }
  }

  // Shortlist Auto-Sync
  async syncShortlist(shortlistData: any): Promise<boolean> {
    if (!this.isEnabled || !this.supabaseService) {
      this.logger.log('📋 Shortlist sync skipped (auto-sync disabled)');
      return false;
    }

    try {
      this.logger.log(`🔄 Auto-syncing shortlist: ${shortlistData.name}`);
      
      const { data, error } = await this.supabaseService.client
        .from('Shortlist')
        .upsert({
          id: shortlistData.id,
          enquiry_id: shortlistData.enquiryId,
          name: shortlistData.name,
          mobile: shortlistData.mobile,
          business_name: shortlistData.businessName,
          business_type: shortlistData.businessType,
          business_nature: shortlistData.businessNature,
          business_constitution: shortlistData.businessConstitution,
          loan_amount: shortlistData.loanAmount,
          cap_amount: shortlistData.capAmount,
          district: shortlistData.district,
          gst_status: shortlistData.gstStatus,
          bank_account: shortlistData.bankAccount,
          statement_duration: shortlistData.statementDuration,
          staff: shortlistData.staff,
          interest_status: shortlistData.interestStatus || 'INTERESTED',
          priority: shortlistData.priority || 'MEDIUM',
          notes: shortlistData.notes,
          created_at: shortlistData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        this.logger.error('❌ Shortlist sync failed:', error.message);
        return false;
      }

      this.logger.log(`✅ Shortlist synced successfully: ${shortlistData.name}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Shortlist sync error:', error);
      return false;
    }
  }

  // Staff Auto-Sync
  async syncStaff(staffData: any): Promise<boolean> {
    if (!this.isEnabled || !this.supabaseService) {
      this.logger.log('👥 Staff sync skipped (auto-sync disabled)');
      return false;
    }

    try {
      this.logger.log(`🔄 Auto-syncing staff: ${staffData.name}`);
      
      const { data, error } = await this.supabaseService.client
        .from('Staff')
        .upsert({
          id: staffData.id,
          name: staffData.name,
          email: staffData.email,
          password_hash: staffData.password,
          role: staffData.role,
          department: staffData.department,
          position: staffData.position,
          status: staffData.status || 'ACTIVE',
          has_access: staffData.hasAccess !== false,
          verified: staffData.verified || false,
          client_name: staffData.clientName,
          access_token: staffData.accessToken,
          access_token_expiry: staffData.accessTokenExpiry,
          invite_token: staffData.inviteToken,
          token_expiry: staffData.tokenExpiry,
          created_by: staffData.createdBy || 'Admin',
          created_at: staffData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        this.logger.error('❌ Staff sync failed:', error.message);
        return false;
      }

      this.logger.log(`✅ Staff synced successfully: ${staffData.name}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Staff sync error:', error);
      return false;
    }
  }

  // CashfreeApplication Auto-Sync
  async syncCashfreeApplication(applicationData: any): Promise<boolean> {
    if (!this.isEnabled || !this.supabaseService) {
      this.logger.log('💳 Cashfree application sync skipped (auto-sync disabled)');
      return false;
    }

    try {
      this.logger.log(`🔄 Auto-syncing cashfree application: ${applicationData.name}`);
      
      const { data, error } = await this.supabaseService.client
        .from('CashfreeApplication')
        .upsert({
          id: applicationData.id,
          shortlist_id: applicationData.shortlistId,
          name: applicationData.name,
          mobile: applicationData.mobile,
          business_type: applicationData.businessType,
          loan_amount: applicationData.loanAmount,
          tenure: applicationData.tenure,
          interest_rate: applicationData.interestRate,
          monthly_income: applicationData.monthlyIncome,
          existing_loans: applicationData.existingLoans,
          collateral_type: applicationData.collateralType,
          collateral_value: applicationData.collateralValue,
          purpose: applicationData.purpose,
          status: applicationData.status || 'PENDING',
          application_data: applicationData.applicationData || applicationData,
          submitted_at: applicationData.submittedAt || new Date().toISOString(),
          created_at: applicationData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        this.logger.error('❌ Cashfree application sync failed:', error.message);
        return false;
      }

      this.logger.log(`✅ Cashfree application synced successfully: ${applicationData.name}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Cashfree application sync error:', error);
      return false;
    }
  }

  // Transaction Auto-Sync
  async syncTransaction(transactionData: any): Promise<boolean> {
    if (!this.isEnabled || !this.supabaseService) {
      this.logger.log('💰 Transaction sync skipped (auto-sync disabled)');
      return false;
    }

    try {
      this.logger.log(`🔄 Auto-syncing transaction: ${transactionData.transactionId}`);
      
      const { data, error } = await this.supabaseService.client
        .from('Transaction')
        .upsert({
          id: transactionData.id,
          name: transactionData.name,
          transaction_id: transactionData.transactionId,
          amount: transactionData.amount,
          status: transactionData.status || 'PENDING',
          date: transactionData.date,
          created_at: transactionData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        this.logger.error('❌ Transaction sync failed:', error.message);
        return false;
      }

      this.logger.log(`✅ Transaction synced successfully: ${transactionData.transactionId}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Transaction sync error:', error);
      return false;
    }
  }

  // Notification Auto-Sync
  async syncNotification(notificationData: any): Promise<boolean> {
    if (!this.isEnabled || !this.supabaseService) {
      return false; // Notifications are less critical, fail silently
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from('Notification')
        .upsert({
          id: notificationData.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority || 'MEDIUM',
          user_id: notificationData.userId || 1,
          read: notificationData.read || false,
          data: notificationData.data,
          created_at: notificationData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      return !error;
    } catch (error) {
      return false; // Fail silently for notifications
    }
  }

  // Bulk sync all data (for initial deployment)
  async syncAllData(allData: {
    enquiries?: any[];
    documents?: any[];
    shortlists?: any[];
    staff?: any[];
    cashfreeApplications?: any[];
    transactions?: any[];
  }): Promise<{ synced: number; errors: number }> {
    if (!this.isEnabled || !this.supabaseService) {
      this.logger.log('🔄 Bulk sync skipped (auto-sync disabled)');
      return { synced: 0, errors: 0 };
    }

    this.logger.log('🚀 BULK SYNC STARTING - Syncing all data to Supabase...');
    
    let synced = 0;
    let errors = 0;

    // Sync enquiries
    if (allData.enquiries) {
      for (const enquiry of allData.enquiries) {
        const success = await this.syncEnquiry(enquiry);
        if (success) synced++; else errors++;
      }
    }

    // Sync documents
    if (allData.documents) {
      for (const document of allData.documents) {
        const success = await this.syncDocument(document);
        if (success) synced++; else errors++;
      }
    }

    // Sync shortlists
    if (allData.shortlists) {
      for (const shortlist of allData.shortlists) {
        const success = await this.syncShortlist(shortlist);
        if (success) synced++; else errors++;
      }
    }

    // Sync staff
    if (allData.staff) {
      for (const staff of allData.staff) {
        const success = await this.syncStaff(staff);
        if (success) synced++; else errors++;
      }
    }

    // Sync cashfree applications
    if (allData.cashfreeApplications) {
      for (const application of allData.cashfreeApplications) {
        const success = await this.syncCashfreeApplication(application);
        if (success) synced++; else errors++;
      }
    }

    // Sync transactions
    if (allData.transactions) {
      for (const transaction of allData.transactions) {
        const success = await this.syncTransaction(transaction);
        if (success) synced++; else errors++;
      }
    }

    this.logger.log(`🎯 BULK SYNC COMPLETED: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }

  // Get sync status
  getSyncStatus() {
    return {
      enabled: this.isEnabled,
      supabaseAvailable: !!this.supabaseService,
      environment: {
        isProduction: this.configService.get('NODE_ENV') === 'production',
        isRender: this.configService.get('RENDER') === 'true'
      }
    };
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    if (!this.supabaseService) {
      return false;
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from('Enquiry')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }
}

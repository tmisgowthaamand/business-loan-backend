import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SupabaseService } from '../supabase/supabase.service';
import { EnquiryService } from '../enquiry/enquiry.service';
import { DocumentService } from '../document/document.service';
import { ShortlistService } from '../shortlist/shortlist.service';
import { CashfreeService } from '../cashfree/cashfree.service';
import { StaffService } from '../staff/staff.service';
import { TransactionService } from '../transaction/transaction.service';

async function syncAllDataToSupabase() {
  console.log('🔄 Syncing all data to Supabase...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get all services
    const supabaseService = app.get(SupabaseService);
    const enquiryService = app.get(EnquiryService);
    const documentService = app.get(DocumentService);
    const shortlistService = app.get(ShortlistService);
    const cashfreeService = app.get(CashfreeService);
    const staffService = app.get(StaffService);
    const transactionService = app.get(TransactionService);

    // Test Supabase connection
    console.log('🔗 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabaseService.getClient()
      .from('enquiries')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Sync Enquiries
    console.log('📊 Syncing enquiries to Supabase...');
    const enquiries = await enquiryService.findAll();
    let enquiriesSynced = 0;
    
    for (const enquiry of enquiries) {
      try {
        const { error } = await supabaseService.getClient()
          .from('enquiries')
          .upsert({
            id: enquiry.id,
            name: enquiry.name,
            mobile: enquiry.mobile,
            business_type: enquiry.businessType,
            business_name: enquiry.businessName,
            source: enquiry.source,
            interest_status: enquiry.interestStatus,
            loan_amount: enquiry.loanAmount,
            district: enquiry.district,
            pincode: enquiry.pincode,
            created_at: enquiry.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (!error) {
          enquiriesSynced++;
        } else {
          console.error(`❌ Error syncing enquiry ${enquiry.name}:`, error);
        }
      } catch (error) {
        console.error(`❌ Error syncing enquiry ${enquiry.name}:`, error);
      }
    }
    console.log(`✅ Synced ${enquiriesSynced}/${enquiries.length} enquiries`);

    // Sync Documents
    console.log('📄 Syncing documents to Supabase...');
    const documents = await documentService.findAll();
    let documentsSynced = 0;
    
    for (const document of documents) {
      try {
        const { error } = await supabaseService.getClient()
          .from('documents')
          .upsert({
            id: document.id,
            enquiry_id: document.enquiryId,
            type: document.type,
            file_name: document.fileName,
            file_path: document.filePath,
            file_size: document.fileSize,
            verified: document.verified,
            client_name: document.enquiry?.name || 'Unknown Client',
            uploaded_by: document.uploadedBy,
            created_at: document.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (!error) {
          documentsSynced++;
        } else {
          console.error(`❌ Error syncing document ${document.fileName}:`, error);
        }
      } catch (error) {
        console.error(`❌ Error syncing document ${document.fileName}:`, error);
      }
    }
    console.log(`✅ Synced ${documentsSynced}/${documents.length} documents`);

    // Sync Shortlists
    console.log('📝 Syncing shortlists to Supabase...');
    const shortlists = await shortlistService.findAll();
    let shortlistsSynced = 0;
    
    for (const shortlist of shortlists) {
      try {
        const { error } = await supabaseService.getClient()
          .from('shortlist')
          .upsert({
            id: shortlist.id,
            enquiry_id: shortlist.enquiryId,
            name: shortlist.name,
            mobile: shortlist.mobile,
            business_name: shortlist.businessName,
            business_type: shortlist.businessType,
            loan_amount: shortlist.loanAmount,
            district: shortlist.district,
            staff: shortlist.staff,
            priority: shortlist.priority || 'MEDIUM',
            status: shortlist.status || 'ACTIVE',
            notes: shortlist.notes,
            created_at: shortlist.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (!error) {
          shortlistsSynced++;
        } else {
          console.error(`❌ Error syncing shortlist ${shortlist.name}:`, error);
        }
      } catch (error) {
        console.error(`❌ Error syncing shortlist ${shortlist.name}:`, error);
      }
    }
    console.log(`✅ Synced ${shortlistsSynced}/${shortlists.length} shortlists`);

    // Sync Payment Gateway Applications
    console.log('💳 Syncing payment applications to Supabase...');
    const payments = await cashfreeService.findAll();
    let paymentsSynced = 0;
    
    for (const payment of payments) {
      try {
        const { error } = await supabaseService.getClient()
          .from('payment_gateways')
          .upsert({
            id: payment.id,
            shortlist_id: payment.shortlistId,
            loan_amount: payment.loanAmount,
            tenure: payment.tenure,
            interest_rate: payment.interestRate,
            processing_fee: payment.processingFee,
            purpose: payment.purpose,
            collateral: payment.collateral,
            guarantor: payment.guarantor,
            status: payment.status || 'PENDING',
            application_data: payment,
            created_at: payment.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (!error) {
          paymentsSynced++;
        } else {
          console.error(`❌ Error syncing payment application:`, error);
        }
      } catch (error) {
        console.error(`❌ Error syncing payment application:`, error);
      }
    }
    console.log(`✅ Synced ${paymentsSynced}/${payments.length} payment applications`);

    // Sync Staff
    console.log('👥 Syncing staff to Supabase...');
    const staff = await staffService.findAll();
    let staffSynced = 0;
    
    for (const member of staff.staff || []) {
      try {
        const { error } = await supabaseService.getClient()
          .from('staff')
          .upsert({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            department: member.department,
            phone: member.phone,
            is_active: member.isActive !== false,
            created_at: member.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (!error) {
          staffSynced++;
        } else {
          console.error(`❌ Error syncing staff ${member.name}:`, error);
        }
      } catch (error) {
        console.error(`❌ Error syncing staff ${member.name}:`, error);
      }
    }
    console.log(`✅ Synced ${staffSynced}/${staff.staff?.length || 0} staff members`);

    // Sync Transactions
    console.log('💰 Syncing transactions to Supabase...');
    const transactions = await transactionService.findAll();
    let transactionsSynced = 0;
    
    for (const transaction of transactions) {
      try {
        const { error } = await supabaseService.getClient()
          .from('transactions')
          .upsert({
            id: transaction.id,
            name: transaction.name,
            transaction_id: transaction.transactionId,
            amount: transaction.amount,
            status: transaction.status,
            date: transaction.date,
            created_at: transaction.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (!error) {
          transactionsSynced++;
        } else {
          console.error(`❌ Error syncing transaction ${transaction.transactionId}:`, error);
        }
      } catch (error) {
        console.error(`❌ Error syncing transaction ${transaction.transactionId}:`, error);
      }
    }
    console.log(`✅ Synced ${transactionsSynced}/${transactions.length} transactions`);

    console.log('🎉 Supabase sync completed successfully!');
    console.log('📊 Sync Summary:');
    console.log(`   - Enquiries: ${enquiriesSynced}/${enquiries.length}`);
    console.log(`   - Documents: ${documentsSynced}/${documents.length}`);
    console.log(`   - Shortlists: ${shortlistsSynced}/${shortlists.length}`);
    console.log(`   - Payment Applications: ${paymentsSynced}/${payments.length}`);
    console.log(`   - Staff Members: ${staffSynced}/${staff.staff?.length || 0}`);
    console.log(`   - Transactions: ${transactionsSynced}/${transactions.length}`);

  } catch (error) {
    console.error('❌ Error during Supabase sync:', error);
  } finally {
    await app.close();
  }
}

// Run the sync
if (require.main === module) {
  syncAllDataToSupabase()
    .then(() => {
      console.log('✅ Supabase sync script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Supabase sync script failed:', error);
      process.exit(1);
    });
}

export { syncAllDataToSupabase };

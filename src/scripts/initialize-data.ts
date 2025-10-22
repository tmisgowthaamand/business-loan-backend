import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EnquiryService } from '../enquiry/enquiry.service';
import { DocumentService } from '../document/document.service';
import { ShortlistService } from '../shortlist/shortlist.service';
import { CashfreeService } from '../cashfree/cashfree.service';
import { StaffService } from '../staff/staff.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TransactionService } from '../transaction/transaction.service';

async function initializeAllData() {
  console.log('🚀 Initializing all application data...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get all services
    const enquiryService = app.get(EnquiryService);
    const documentService = app.get(DocumentService);
    const shortlistService = app.get(ShortlistService);
    const cashfreeService = app.get(CashfreeService);
    const staffService = app.get(StaffService);
    const notificationsService = app.get(NotificationsService);
    const transactionService = app.get(TransactionService);

    console.log('📊 Creating sample enquiries...');
    
    // Create sample enquiries
    const sampleEnquiries = [
      {
        name: 'BALAMURUGAN',
        mobile: '9876543215',
        businessType: 'Manufacturing',
        businessName: 'Balamurugan Enterprises',
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        loanAmount: 500000,
        district: 'Chennai',
        pincode: '600001'
      },
      {
        name: 'RAJESH KUMAR',
        mobile: '9876543216',
        businessType: 'Trading',
        businessName: 'Kumar Trading Co',
        source: 'REFERRAL',
        interestStatus: 'FOLLOW_UP_REQUIRED',
        loanAmount: 750000,
        district: 'Mumbai',
        pincode: '400001'
      },
      {
        name: 'PRIYA SHARMA',
        mobile: '9876543217',
        businessType: 'Textiles',
        businessName: 'Sharma Textiles',
        source: 'DIRECT_VISIT',
        interestStatus: 'INTERESTED',
        loanAmount: 300000,
        district: 'Delhi',
        pincode: '110001'
      },
      {
        name: 'AMIT PATEL',
        mobile: '9876543218',
        businessType: 'Food Processing',
        businessName: 'Patel Foods',
        source: 'ONLINE_APPLICATION',
        interestStatus: 'INTERESTED',
        loanAmount: 1000000,
        district: 'Ahmedabad',
        pincode: '380001'
      },
      {
        name: 'SUNITA GUPTA',
        mobile: '9876543219',
        businessType: 'Retail',
        businessName: 'Gupta General Store',
        source: 'PHONE_INQUIRY',
        interestStatus: 'INTERESTED',
        loanAmount: 200000,
        district: 'Pune',
        pincode: '411001'
      }
    ];

    const createdEnquiries = [];
    for (const enquiry of sampleEnquiries) {
      try {
        const created = await enquiryService.create(enquiry, 1);
        createdEnquiries.push(created);
        console.log(`✅ Created enquiry: ${enquiry.name}`);
      } catch (error) {
        console.log(`⚠️ Enquiry ${enquiry.name} may already exist`);
      }
    }

    console.log('📄 Creating sample documents...');
    
    // Create sample documents for each enquiry
    const documentTypes = ['GST', 'UDYAM', 'BANK_STATEMENT', 'OWNER_PAN', 'AADHAR', 'WEBSITE_GATEWAY', 'IE_CODE'];
    
    for (let i = 0; i < createdEnquiries.length; i++) {
      const enquiry = createdEnquiries[i];
      const numDocs = Math.floor(Math.random() * 5) + 3; // 3-7 documents per enquiry
      
      for (let j = 0; j < numDocs; j++) {
        const docType = documentTypes[j % documentTypes.length];
        try {
          await documentService.create({
            enquiryId: enquiry.id,
            type: docType as any,
            fileName: `${enquiry.name}_${docType}.pdf`,
            filePath: `/uploads/documents/${Date.now()}-${enquiry.id}-${docType}.pdf`,
            fileSize: Math.floor(Math.random() * 1000000) + 100000,
            verified: Math.random() > 0.4, // 60% verified
            uploadedBy: 1
          }, 1);
          console.log(`✅ Created document: ${enquiry.name} - ${docType}`);
        } catch (error) {
          console.log(`⚠️ Document ${docType} for ${enquiry.name} may already exist`);
        }
      }
    }

    console.log('📝 Creating sample shortlists...');
    
    // Create shortlists for some enquiries
    const shortlistCandidates = createdEnquiries.slice(0, 3);
    for (const enquiry of shortlistCandidates) {
      try {
        await shortlistService.createFromEnquiry(enquiry.id, {
          priority: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
          notes: `Shortlisted client with ${enquiry.businessType} business`,
          staff: 'Pankil'
        }, 1);
        console.log(`✅ Created shortlist: ${enquiry.name}`);
      } catch (error) {
        console.log(`⚠️ Shortlist for ${enquiry.name} may already exist`);
      }
    }

    console.log('💳 Creating sample payment applications...');
    
    // Create payment applications for shortlisted clients
    const shortlists = await shortlistService.findAll();
    for (let i = 0; i < Math.min(shortlists.length, 2); i++) {
      const shortlist = shortlists[i];
      try {
        await cashfreeService.create({
          shortlistId: shortlist.id,
          loanAmount: shortlist.loanAmount || 500000,
          tenure: 12,
          interestRate: 12.5,
          processingFee: 5000,
          purpose: 'Business Expansion',
          collateral: 'Property',
          guarantor: 'Self'
        }, 1);
        console.log(`✅ Created payment application: ${shortlist.name}`);
      } catch (error) {
        console.log(`⚠️ Payment application for ${shortlist.name} may already exist`);
      }
    }

    console.log('👥 Creating sample staff...');
    
    // Create sample staff
    const sampleStaff = [
      {
        name: 'Pankil',
        email: 'govindamarketing9998@gmail.com',
        role: 'ADMIN',
        department: 'Management',
        phone: '9876543210'
      },
      {
        name: 'Venkat',
        email: 'venkat@businessloan.com',
        role: 'MANAGER',
        department: 'Sales',
        phone: '9876543211'
      },
      {
        name: 'Dinesh',
        email: 'dinesh@businessloan.com',
        role: 'EMPLOYEE',
        department: 'Operations',
        phone: '9876543212'
      },
      {
        name: 'Ravi Kumar',
        email: 'ravi@businessloan.com',
        role: 'EMPLOYEE',
        department: 'Documentation',
        phone: '9876543213'
      },
      {
        name: 'Anita Singh',
        email: 'anita@businessloan.com',
        role: 'EMPLOYEE',
        department: 'Verification',
        phone: '9876543214'
      }
    ];

    for (const staff of sampleStaff) {
      try {
        await staffService.create(staff, 1);
        console.log(`✅ Created staff: ${staff.name}`);
      } catch (error) {
        console.log(`⚠️ Staff ${staff.name} may already exist`);
      }
    }

    console.log('💰 Creating sample transactions...');
    
    // Create sample transactions
    const sampleTransactions = [
      {
        name: 'BALAMURUGAN Payment',
        date: new Date('2024-10-15'),
        transactionId: 'TXN202410001',
        amount: 500000,
        status: 'COMPLETED' as any
      },
      {
        name: 'RAJESH KUMAR Payment',
        date: new Date('2024-10-16'),
        transactionId: 'TXN202410002',
        amount: 750000,
        status: 'PENDING' as any
      },
      {
        name: 'PRIYA SHARMA Payment',
        date: new Date('2024-10-17'),
        transactionId: 'TXN202410003',
        amount: 300000,
        status: 'COMPLETED' as any
      }
    ];

    for (const transaction of sampleTransactions) {
      try {
        await transactionService.create(transaction, 1);
        console.log(`✅ Created transaction: ${transaction.name}`);
      } catch (error) {
        console.log(`⚠️ Transaction ${transaction.transactionId} may already exist`);
      }
    }

    console.log('🔔 Creating sample notifications...');
    
    // Create sample notifications
    const sampleNotifications = [
      {
        type: 'NEW_ENQUIRY' as any,
        title: 'New Enquiry Received',
        message: 'New enquiry from BALAMURUGAN for ₹5,00,000 business loan',
        priority: 'HIGH' as any,
        data: { enquiryId: createdEnquiries[0]?.id }
      },
      {
        type: 'DOCUMENT_UPLOADED' as any,
        title: 'Document Uploaded',
        message: 'GST Certificate uploaded by RAJESH KUMAR',
        priority: 'MEDIUM' as any,
        data: { enquiryId: createdEnquiries[1]?.id }
      },
      {
        type: 'SHORTLISTED' as any,
        title: 'Client Shortlisted',
        message: 'PRIYA SHARMA has been added to shortlist',
        priority: 'HIGH' as any,
        data: { enquiryId: createdEnquiries[2]?.id }
      },
      {
        type: 'PAYMENT_APPLIED' as any,
        title: 'Payment Application',
        message: 'AMIT PATEL applied for ₹10,00,000 loan',
        priority: 'HIGH' as any,
        data: { enquiryId: createdEnquiries[3]?.id }
      }
    ];

    for (const notification of sampleNotifications) {
      try {
        await notificationsService.createSystemNotification(notification);
        console.log(`✅ Created notification: ${notification.title}`);
      } catch (error) {
        console.log(`⚠️ Notification may already exist`);
      }
    }

    console.log('🎉 Data initialization completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Enquiries: ${createdEnquiries.length}`);
    console.log(`   - Documents: ${createdEnquiries.length * 4} (approx)`);
    console.log(`   - Shortlists: ${Math.min(createdEnquiries.length, 3)}`);
    console.log(`   - Payment Applications: 2`);
    console.log(`   - Staff Members: ${sampleStaff.length}`);
    console.log(`   - Transactions: ${sampleTransactions.length}`);
    console.log(`   - Notifications: ${sampleNotifications.length}`);

  } catch (error) {
    console.error('❌ Error during data initialization:', error);
  } finally {
    await app.close();
  }
}

// Run the initialization
if (require.main === module) {
  initializeAllData()
    .then(() => {
      console.log('✅ Data initialization script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Data initialization script failed:', error);
      process.exit(1);
    });
}

export { initializeAllData };

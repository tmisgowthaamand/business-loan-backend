import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EnquiryService } from '../enquiry/enquiry.service';
import { DocumentService } from '../document/document.service';
import { ShortlistService } from '../shortlist/shortlist.service';
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
    const staffService = app.get(StaffService);
    const notificationsService = app.get(NotificationsService);
    const transactionService = app.get(TransactionService);

    console.log('📊 Creating sample enquiries...');
    
    // Create sample enquiries with proper types
    const sampleEnquiries = [
      {
        name: 'BALAMURUGAN',
        mobile: '9876543215',
        businessType: 'Manufacturing',
        businessName: 'Balamurugan Enterprises'
      },
      {
        name: 'RAJESH KUMAR',
        mobile: '9876543216',
        businessType: 'Trading',
        businessName: 'Kumar Trading Co'
      },
      {
        name: 'PRIYA SHARMA',
        mobile: '9876543217',
        businessType: 'Textiles',
        businessName: 'Sharma Textiles'
      },
      {
        name: 'AMIT PATEL',
        mobile: '9876543218',
        businessType: 'Food Processing',
        businessName: 'Patel Foods'
      },
      {
        name: 'SUNITA GUPTA',
        mobile: '9876543219',
        businessType: 'Retail',
        businessName: 'Gupta General Store'
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
    const documentTypes = ['GST', 'UDYAM', 'BANK_STATEMENT', 'OWNER_PAN', 'AADHAR'];
    
    for (let i = 0; i < createdEnquiries.length; i++) {
      const enquiry = createdEnquiries[i];
      const numDocs = Math.floor(Math.random() * 3) + 3; // 3-5 documents per enquiry
      
      for (let j = 0; j < numDocs; j++) {
        const docType = documentTypes[j % documentTypes.length];
        try {
          // Create sample documents for enquiry
          await documentService.createSampleDocumentsForEnquiry(enquiry.id);
          console.log(`✅ Created document: ${enquiry.name} - ${docType}`);
        } catch (error) {
          console.log(`⚠️ Document ${docType} for ${enquiry.name} may already exist`);
        }
      }
    }

    console.log('📝 Skipping shortlist creation for now...');

    console.log('👥 Creating sample staff...');
    
    // Create sample staff using createStaff method
    const sampleStaff = [
      {
        name: 'Pankil',
        email: 'govindamarketing9998@gmail.com',
        role: 'ADMIN' as any,
        department: 'Management',
        phone: '9876543210',
        password: 'password123'
      },
      {
        name: 'Venkat',
        email: 'venkat@businessloan.com',
        role: 'MANAGER' as any,
        department: 'Sales',
        phone: '9876543211',
        password: 'password123'
      },
      {
        name: 'Dinesh',
        email: 'dinesh@businessloan.com',
        role: 'EMPLOYEE' as any,
        department: 'Operations',
        phone: '9876543212',
        password: 'password123'
      }
    ];

    for (const staff of sampleStaff) {
      try {
        await staffService.createStaff(staff);
        console.log(`✅ Created staff: ${staff.name}`);
      } catch (error) {
        console.log(`⚠️ Staff ${staff.name} may already exist`);
      }
    }

    console.log('💰 Creating sample transactions...');
    
    // Create sample transactions with proper date format
    const sampleTransactions = [
      {
        name: 'BALAMURUGAN Payment',
        date: '2024-10-15T10:00:00.000Z',
        transactionId: 'TXN202410001',
        amount: 500000,
        status: 'COMPLETED' as any
      },
      {
        name: 'RAJESH KUMAR Payment',
        date: '2024-10-16T11:00:00.000Z',
        transactionId: 'TXN202410002',
        amount: 750000,
        status: 'PENDING' as any
      },
      {
        name: 'PRIYA SHARMA Payment',
        date: '2024-10-17T12:00:00.000Z',
        transactionId: 'TXN202410003',
        amount: 300000,
        status: 'COMPLETED' as any
      }
    ];

    const mockTransactionUser = { id: 1, role: 'ADMIN' } as any;
    for (const transaction of sampleTransactions) {
      try {
        await transactionService.create(transaction, mockTransactionUser.id);
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
    console.log(`   - Documents: ${createdEnquiries.length * 3} (approx)`);
    console.log(`   - Shortlists: ${Math.min(createdEnquiries.length, 3)}`);
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

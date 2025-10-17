import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from './supabase.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('supabase')
export class SupabaseController {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly documentsFile = path.join(this.dataDir, 'documents.json');
  private readonly enquiriesFile = path.join(this.dataDir, 'enquiries.json');
  private readonly shortlistFile = path.join(this.dataDir, 'shortlists.json');
  private readonly paymentGatewayFile = path.join(this.dataDir, 'payment-gateway.json');
  private readonly uploadsDir = path.join(this.dataDir, 'uploads');

  constructor(private readonly supabaseService: SupabaseService) {
    console.log('🚀 SupabaseController constructor called - WITH DEPENDENCIES');
    console.log('📍 SupabaseController should register routes at /api/supabase/*');
    console.log('✅ SupabaseService injected successfully');
    
    // Ensure data directory exists
    this.ensureDataDirectory();
    
    // Load persisted data
    this.loadPersistedData();
    
    console.log('📋 Initial enquiries loaded:', this.enquiriesStorage.length, 'demo enquiries');
    console.log('📄 Initial documents loaded:', this.documentsStorage.length, 'documents');
  }

  private ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        console.log('📁 Created data directory:', this.dataDir);
      }
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
        console.log('📁 Created uploads directory:', this.uploadsDir);
      }
    } catch (error) {
      console.error('❌ Error creating data directory:', error);
    }
  }

  private loadPersistedData() {
    try {
      // Load documents
      if (fs.existsSync(this.documentsFile)) {
        const documentsData = fs.readFileSync(this.documentsFile, 'utf8');
        this.documentsStorage = JSON.parse(documentsData);
        console.log('📄 Loaded', this.documentsStorage.length, 'persisted documents');
      }

      // Load enquiries (but keep demo data if no persisted data)
      if (fs.existsSync(this.enquiriesFile)) {
        const enquiriesData = fs.readFileSync(this.enquiriesFile, 'utf8');
        const persistedEnquiries = JSON.parse(enquiriesData);
        if (persistedEnquiries.length > 0) {
          this.enquiriesStorage = persistedEnquiries;
          console.log('📋 Loaded', this.enquiriesStorage.length, 'persisted enquiries');
        }
      }

      // Load shortlists
      if (fs.existsSync(this.shortlistFile)) {
        const shortlistData = fs.readFileSync(this.shortlistFile, 'utf8');
        this.shortlistStorage = JSON.parse(shortlistData);
        console.log('📋 Loaded', this.shortlistStorage.length, 'persisted shortlists');
      }

      // Load payment gateway applications
      if (fs.existsSync(this.paymentGatewayFile)) {
        const paymentGatewayData = fs.readFileSync(this.paymentGatewayFile, 'utf8');
        this.paymentGatewayStorage = JSON.parse(paymentGatewayData);
        console.log('🏦 Loaded', this.paymentGatewayStorage.length, 'persisted payment gateway applications');
      }
    } catch (error) {
      console.error('❌ Error loading persisted data:', error);
    }
  }

  private saveDocuments() {
    try {
      fs.writeFileSync(this.documentsFile, JSON.stringify(this.documentsStorage, null, 2));
      console.log('💾 Saved', this.documentsStorage.length, 'documents to disk');
    } catch (error) {
      console.error('❌ Error saving documents:', error);
    }
  }

  private saveEnquiries() {
    try {
      fs.writeFileSync(this.enquiriesFile, JSON.stringify(this.enquiriesStorage, null, 2));
      console.log('💾 Saved', this.enquiriesStorage.length, 'enquiries to disk');
    } catch (error) {
      console.error('❌ Error saving enquiries:', error);
    }
  }

  private saveShortlists() {
    try {
      fs.writeFileSync(this.shortlistFile, JSON.stringify(this.shortlistStorage, null, 2));
      console.log('💾 Saved', this.shortlistStorage.length, 'shortlists to disk');
    } catch (error) {
      console.error('❌ Error saving shortlists:', error);
    }
  }

  private savePaymentGatewayApplications() {
    try {
      fs.writeFileSync(this.paymentGatewayFile, JSON.stringify(this.paymentGatewayStorage, null, 2));
      console.log('💾 Saved', this.paymentGatewayStorage.length, 'payment gateway applications to disk');
    } catch (error) {
      console.error('❌ Error saving payment gateway applications:', error);
    }
  }

  // In-memory storage for enquiries (for demo mode)
  private enquiriesStorage: any[] = [
    // Add some initial demo data so list is not empty on refresh
    {
      id: 1001,
      name: 'Appu Electronic Sales and Service',
      businessName: 'Appu Electronic Sales and Service',
      businessType: 'Electronics Sales and Service',
      ownerName: 'Bhuvaneshwari Kalidass',
      mobile: '9894289718',
      email: 'appu@electronics.com',
      gst: '33CSOPM8223T1ZK',
      gstNumber: '33CSOPM8223T1ZK',
      businessCategory: 'SME',
      loanAmount: 1000000,
      loanPurpose: 'Business Expansion',
      monthlyTurnover: 500000,
      businessAge: 5,
      address: 'Vellore, Tamil Nadu',
      comments: 'ELIGIBLE',
      interestStatus: 'INTERESTED',
      assignedStaff: 'Current User',
      staffId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      staff: {
        id: 1,
        name: 'Current User',
        email: 'admin@businessloan.com'
      }
    },
    {
      id: 1002,
      name: 'Tech Solutions Pvt Ltd',
      businessName: 'Tech Solutions Pvt Ltd',
      businessType: 'Technology Services',
      ownerName: 'Rajesh Kumar',
      mobile: '9876543210',
      email: 'rajesh@techsolutions.com',
      gst: '29ABCDE1234F1Z5',
      gstNumber: '29ABCDE1234F1Z5',
      businessCategory: 'SME',
      loanAmount: 750000,
      loanPurpose: 'Equipment Purchase',
      monthlyTurnover: 300000,
      businessAge: 3,
      address: 'Bangalore, Karnataka',
      comments: 'CHAT_CALL1_COMPLETED',
      interestStatus: 'FOLLOW_UP_REQUIRED',
      assignedStaff: 'Demo Employee',
      staffId: 2,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      staff: {
        id: 2,
        name: 'Demo Employee',
        email: 'employee@businessloan.com'
      }
    }
  ];

  // In-memory storage for documents (for demo mode)
  private documentsStorage: any[] = [];

  private updatedShortlistData: any = {
    id: 1,
    enquiryId: 1001,
    enquiryName: 'Appu Electronic Sales and Service',
    enquiryMobile: '9894289718',
    name: 'Bhuvaneshwari Kalidass',
    mobile: '9894289718',
    businessName: 'Appu Electronic Sales and Service',
    businessNature: 'Electronics Sales and Service',
    district: 'Vellore',
    loanAmount: 1000000,
    loanStatus: 'PENDING',
    interestStatus: 'INTERESTED',
    status: 'PENDING',
    createdAt: new Date(),
    enquiry: {
      id: 1001,
      name: 'Appu Electronic Sales and Service',
      mobile: '9894289718',
      businessType: 'Electronics Sales and Service',
      loanAmount: 1000000
    }
  };

  @Get('debug/shortlist')
  debugShortlist() {
    return {
      message: 'Debug shortlist data',
      hasUpdatedData: !!this.updatedShortlistData,
      updatedShortlistData: this.updatedShortlistData,
      loanAmountInUpdatedData: this.updatedShortlistData?.loanAmount,
      timestamp: new Date().toISOString()
    };
  }

  @Get('test')
  testEndpoint() {
    console.log('Test endpoint called - Supabase controller is working');
    return {
      message: 'Supabase controller is working',
      timestamp: new Date().toISOString(),
      status: 'OK',
      controller: 'SupabaseController',
      route: '/api/supabase/test'
    };
  }

  @Get('health')
  healthCheck() {
    console.log('Health check endpoint called');
    return {
      status: 'healthy',
      service: 'supabase-controller',
      timestamp: new Date().toISOString()
    };
  }

  @Get('ping')
  ping() {
    console.log('🏓 Ping endpoint called - SupabaseController is working!');
    return {
      message: 'pong',
      controller: 'SupabaseController',
      timestamp: new Date().toISOString(),
      status: 'working'
    };
  }

  @Delete('test/:id')
  testDelete(@Param('id') id: string) {
    console.log('🧪 DELETE test endpoint called for ID:', id);
    return {
      message: `DELETE test successful for ID: ${id}`,
      timestamp: new Date().toISOString(),
      method: 'DELETE',
      endpoint: '/api/supabase/test/:id'
    };
  }

  @Get('documents/debug')
  async debugDocuments() {
    try {
      const { data: allDocuments, error } = await this.supabaseService.client
        .from('Document')
        .select('id, enquiryId, type, uploadedAt, s3Url')
        .order('uploadedAt', { ascending: false });

      if (error) {
        throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
      }

      // Group by enquiry and type to show duplicates
      const grouped = {};
      allDocuments?.forEach(doc => {
        const key = `${doc.enquiryId}-${doc.type}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push({
          id: doc.id,
          uploadedAt: doc.uploadedAt,
          s3Url: doc.s3Url
        });
      });

      // Find duplicates
      const duplicates = {};
      Object.keys(grouped).forEach(key => {
        if (grouped[key].length > 1) {
          duplicates[key] = grouped[key];
        }
      });

      return {
        totalDocuments: allDocuments?.length || 0,
        allDocuments: allDocuments,
        groupedByEnquiryType: grouped,
        duplicates: duplicates,
        duplicateCount: Object.keys(duplicates).length
      };
    } catch (error) {
      return {
        error: error.message,
        totalDocuments: 0
      };
    }
  }

  @Get('test-connection')
  async testConnection() {
    try {
      // Test if we can connect to Supabase
      const { data, error } = await this.supabaseService.client
        .from('User')
        .select('id', { count: 'exact', head: true });
      
      const isConnected = !error;
      
      return {
        connected: isConnected,
        tablesExist: !error,
        userCount: data?.length || 0,
        project: this.supabaseService.getProjectInfo(),
        timestamp: new Date().toISOString(),
        error: error?.message || null
      };
    } catch (error) {
      return {
        connected: false,
        tablesExist: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('seed-demo-users')
  async seedDemoUsers() {
    try {
      console.log('🌱 Seeding demo users to Supabase...');
      
      const bcrypt = require('bcrypt');
      
      // Core demo users - these cannot be deleted
      const demoUsers = [
        { 
          email: 'admin@gmail.com', 
          password: 'admin123', 
          role: 'ADMIN', 
          name: 'Admin User' 
        },
        { 
          email: 'gowthaamankrishna1998@gmail.com', 
          password: '12345678', 
          role: 'ADMIN', 
          name: 'Perivi' 
        }
      ];

      const results = [];

      for (const user of demoUsers) {
        try {
          // Check if user already exists
          const { data: existingUsers } = await this.supabaseService.client
            .from('User')
            .select('id')
            .eq('email', user.email)
            .limit(1);

          if (existingUsers && existingUsers.length > 0) {
            console.log(`✅ User ${user.email} already exists, skipping...`);
            results.push({ email: user.email, status: 'already_exists' });
            continue;
          }

          // Hash password
          const passwordHash = await bcrypt.hash(user.password, 10);

          // Insert user
          const { data, error } = await this.supabaseService.client
            .from('User')
            .insert([
              {
                name: user.name,
                email: user.email,
                role: user.role,
                passwordHash: passwordHash,
                createdAt: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (error) {
            console.error(`❌ Error creating user ${user.email}:`, error);
            results.push({ email: user.email, status: 'error', error: error.message });
          } else {
            console.log(`✅ Created user: ${user.email} (${user.role}) with ID: ${data.id}`);
            results.push({ email: user.email, status: 'created', id: data.id });
          }
        } catch (error) {
          console.error(`❌ Error processing user ${user.email}:`, error);
          results.push({ email: user.email, status: 'error', error: error.message });
        }
      }

      console.log('🎉 Demo user seeding completed!');
      
      return {
        message: 'Demo user seeding completed',
        results: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw new BadRequestException(`Failed to seed demo users: ${error.message}`);
    }
  }

  @Post('update-perivi-role')
  async updatePeriviRole() {
    try {
      console.log('🔄 Updating Perivi role to ADMIN...');
      
      // Update Perivi's role in Supabase
      const { data, error } = await this.supabaseService.client
        .from('User')
        .update({ role: 'ADMIN' })
        .eq('email', 'gowthaamankrishna1998@gmail.com')
        .select();

      if (error) {
        console.error('❌ Error updating Perivi role:', error);
        throw new BadRequestException(`Failed to update Perivi role: ${error.message}`);
      }

      console.log('✅ Perivi role updated to ADMIN successfully');
      
      return {
        message: 'Perivi role updated to ADMIN successfully',
        updatedUser: data?.[0] || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Update Perivi role failed:', error);
      throw new BadRequestException(`Failed to update Perivi role: ${error.message}`);
    }
  }

  @Get('enquiries')
  async getEnquiries() {
    try {
      console.log('📋 Fetching enquiries from in-memory storage...');
      console.log('📋 Current enquiries count:', this.enquiriesStorage.length);
      
      // Return in-memory enquiries for demo mode
      const enquiries = this.enquiriesStorage.map(enquiry => ({
        ...enquiry,
        staff: enquiry.staff || {
          id: 1,
          name: enquiry.assignedStaff || 'Current User',
          email: 'admin@businessloan.com'
        }
      }));
      
      console.log('📋 Returning enquiries:', enquiries);
      return enquiries;
    } catch (error) {
      console.error('❌ Error fetching enquiries:', error);
      return [];
    }
  }

  @Get('enquiries/:id')
  async getEnquiry(@Param('id') id: string) {
    try {
      console.log('🔍 Fetching enquiry with ID:', id);
      console.log('🔍 Available enquiries:', this.enquiriesStorage.length);
      
      // Find enquiry in memory storage
      const enquiry = this.enquiriesStorage.find(enq => enq.id === parseInt(id));
      
      if (!enquiry) {
        console.log('❌ Enquiry not found in memory storage');
        throw new BadRequestException(`Enquiry with ID ${id} not found`);
      }
      
      console.log('✅ Found enquiry:', enquiry);
      return enquiry;
    } catch (error) {
      console.error('❌ Error fetching enquiry:', error);
      throw new BadRequestException(`Failed to fetch enquiry: ${error.message}`);
    }
  }

  @Post('enquiries')
  async createEnquiry(@Body() body: any) {
    try {
      console.log('📝 Creating new enquiry with data:', body);
      
      // Mock enquiry creation for demo mode
      const mockEnquiry = {
        id: Math.floor(Math.random() * 9000) + 2000, // Start from 2000 to avoid conflict with demo data
        name: body.name || body.businessName || 'Demo Business',
        businessName: body.businessName || body.businessType || 'Demo Business',
        ownerName: body.ownerName || body.name || 'Demo Owner',
        mobile: body.mobile || '9876543210',
        email: body.email || '',
        gst: body.gstNumber || body.gst || '',
        gstNumber: body.gstNumber || body.gst || '',
        businessType: body.businessType || 'General Business',
        businessCategory: body.businessCategory || 'SME',
        loanAmount: body.loanAmount || 500000,
        loanPurpose: body.loanPurpose || 'Business Expansion',
        monthlyTurnover: body.monthlyTurnover || 100000,
        businessAge: body.businessAge || 2,
        address: body.address || 'Demo Address',
        comments: body.comments || 'NO_RESPONSE',
        interestStatus: body.interestStatus || 'INTERESTED',
        assignedStaff: body.assignedStaff || 'Current User',
        staffId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        staff: {
          id: 1,
          name: body.assignedStaff || 'Current User',
          email: 'admin@businessloan.com'
        }
      };

      // Store the enquiry in memory
      this.enquiriesStorage.push(mockEnquiry);
      this.saveEnquiries(); // Save to file for persistence
      console.log('✅ Enquiry stored in memory and saved to file. Total enquiries:', this.enquiriesStorage.length);
      console.log('✅ Mock enquiry created:', mockEnquiry);

      // Create notification for new enquiry
      try {
        const notificationResponse = await fetch('http://localhost:5002/api/notifications/system/new-enquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enquiryId: mockEnquiry.id,
            clientName: mockEnquiry.name
          })
        });
        
        if (notificationResponse.ok) {
          console.log('✅ Notification created for new enquiry');
        }
      } catch (error) {
        console.log('⚠️ Failed to create notification:', error);
      }

      return {
        message: 'Enquiry created successfully',
        enquiry: mockEnquiry
      };
    } catch (error) {
      console.error('❌ Enquiry creation error:', error);
      throw new BadRequestException(`Failed to create enquiry: ${error.message}`);
    }
  }

  @Patch('enquiries/:id')
  async updateEnquiry(@Param('id') id: string, @Body() body: any) {
    try {
      console.log('📝 Updating enquiry with ID:', id);
      console.log('📝 Update data:', body);
      
      // Find enquiry in memory storage
      const enquiryIndex = this.enquiriesStorage.findIndex(enq => enq.id === parseInt(id));
      
      if (enquiryIndex === -1) {
        console.log('❌ Enquiry not found in memory storage');
        throw new BadRequestException(`Enquiry with ID ${id} not found`);
      }
      
      // Update the enquiry with new data
      const existingEnquiry = this.enquiriesStorage[enquiryIndex];
      const updatedEnquiry = {
        ...existingEnquiry,
        name: body.name !== undefined ? body.name : existingEnquiry.name,
        businessName: body.businessName !== undefined ? body.businessName : existingEnquiry.businessName,
        businessType: body.businessType !== undefined ? body.businessType : existingEnquiry.businessType,
        mobile: body.mobile !== undefined ? body.mobile : existingEnquiry.mobile,
        email: body.email !== undefined ? body.email : existingEnquiry.email,
        gst: body.gstNumber !== undefined ? body.gstNumber : existingEnquiry.gst,
        gstNumber: body.gstNumber !== undefined ? body.gstNumber : existingEnquiry.gstNumber,
        comments: body.comments !== undefined ? body.comments : existingEnquiry.comments,
        interestStatus: body.interestStatus !== undefined ? body.interestStatus : existingEnquiry.interestStatus,
        assignedStaff: body.assignedStaff !== undefined ? body.assignedStaff : existingEnquiry.assignedStaff,
        updatedAt: new Date().toISOString(),
        staff: {
          id: 1,
          name: body.assignedStaff !== undefined ? body.assignedStaff : existingEnquiry.assignedStaff || 'Current User',
          email: 'admin@businessloan.com'
        }
      };
      
      // Update in memory storage
      this.enquiriesStorage[enquiryIndex] = updatedEnquiry;
      this.saveEnquiries(); // Save to file for persistence
      
      console.log('✅ Enquiry updated in memory storage and saved to file:', updatedEnquiry);

      // Create notification for enquiry update
      try {
        let notificationMessage = `Enquiry updated for ${updatedEnquiry.name}`;
        
        // Specific notifications based on what was updated
        if (body.interestStatus && body.interestStatus !== existingEnquiry.interestStatus) {
          notificationMessage = `${updatedEnquiry.name} status changed to ${body.interestStatus.replace('_', ' ')}`;
        }
        if (body.assignedStaff && body.assignedStaff !== existingEnquiry.assignedStaff) {
          notificationMessage = `${updatedEnquiry.name} assigned to ${body.assignedStaff}`;
        }
        
        const notificationResponse = await fetch('http://localhost:5002/api/notifications/system/new-enquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enquiryId: updatedEnquiry.id,
            clientName: notificationMessage
          })
        });
        
        if (notificationResponse.ok) {
          console.log('✅ Notification created for enquiry update');
        }
      } catch (error) {
        console.log('⚠️ Failed to create update notification:', error);
      }
      
      return {
        message: 'Enquiry updated successfully',
        enquiry: updatedEnquiry
      };
    } catch (error) {
      console.error('❌ Error updating enquiry:', error);
      throw new BadRequestException(`Failed to update enquiry: ${error.message}`);
    }
  }

  @Delete('enquiries/:id')
  async deleteEnquiry(@Param('id') id: string) {
    try {
      console.log('🗑️ Deleting enquiry with ID:', id);
      console.log('🗑️ Current enquiries count:', this.enquiriesStorage.length);
      
      // Find enquiry in memory storage
      const enquiryIndex = this.enquiriesStorage.findIndex(enq => enq.id === parseInt(id));
      
      if (enquiryIndex === -1) {
        console.log('❌ Enquiry not found in memory storage');
        throw new BadRequestException(`Enquiry with ID ${id} not found`);
      }
      
      // Get the enquiry before deleting
      const deletedEnquiry = this.enquiriesStorage[enquiryIndex];
      
      // Remove from memory storage
      this.enquiriesStorage.splice(enquiryIndex, 1);
      
      console.log('✅ Enquiry deleted from memory storage');
      console.log('✅ Remaining enquiries count:', this.enquiriesStorage.length);
      
      return {
        message: 'Enquiry deleted successfully',
        enquiry: deletedEnquiry
      };
    } catch (error) {
      console.error('❌ Error deleting enquiry:', error);
      throw new BadRequestException(`Failed to delete enquiry: ${error.message}`);
    }
  }

  @Get('documents/:id/view')
  async viewDocument(@Param('id') id: string) {
    try {
      console.log('👁️ Viewing document with ID:', id);
      
      // Find document in memory storage
      const document = this.documentsStorage.find(doc => doc.id === parseInt(id));
      
      if (!document) {
        console.log('❌ Document not found in memory storage');
        throw new BadRequestException('Document not found');
      }
      
      console.log('✅ Found document:', document.fileName);
      
      // For demo mode, return a mock PDF URL or generate a sample PDF content
      return {
        url: `https://demo-pdf-viewer.com/sample.pdf?file=${encodeURIComponent(document.fileName)}`,
        type: document.type,
        filename: document.fileName,
        mockContent: `This is a demo PDF viewer for: ${document.fileName}\n\nDocument Type: ${document.type}\nUploaded: ${document.uploadedAt}\nClient: ${document.enquiry.name}`
      };
    } catch (error) {
      console.error('❌ Error viewing document:', error);
      throw new BadRequestException(`Failed to view document: ${error.message}`);
    }
  }

  @Get('documents/:id/proxy')
  async proxyDocument(@Param('id') id: string, @Res() res: any) {
    try {
      console.log('🔗 Proxying document with ID:', id);
      
      // Find document in memory storage
      const document = this.documentsStorage.find(doc => doc.id === parseInt(id));
      
      if (!document) {
        console.log('❌ Document not found in memory storage');
        return res.status(404).json({ error: 'Document not found' });
      }
      
      console.log('✅ Found document for proxy:', document.fileName);
      
      // Check if we have the actual file saved
      if (document.filePath && fs.existsSync(document.filePath)) {
        console.log('📄 Serving actual uploaded file:', document.filePath);
        
        // Set proper headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        // Stream the actual file
        const fileStream = fs.createReadStream(document.filePath);
        fileStream.pipe(res);
        return;
      }
      
      // Fallback: if no actual file exists, return error message
      console.log('❌ Actual file not found, file path:', document.filePath);
      return res.status(404).json({ 
        error: 'Document file not found on server',
        message: 'The uploaded document file is missing from the server storage.',
        documentId: document.id,
        fileName: document.fileName
      });
      
    } catch (error) {
      console.error('❌ Proxy document error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  @Get('documents')
  async getDocuments() {
    try {
      console.log('📄 Fetching documents from memory storage...');
      console.log('📄 Total documents:', this.documentsStorage.length);
      
      // Return documents sorted by upload date (newest first)
      const documents = this.documentsStorage
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      console.log('📄 Returning documents:', documents.length);
      return documents;
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      return [];
    }
  }

  @Get('documents/enquiry/:enquiryId')
  async getDocumentsByEnquiry(@Param('enquiryId') enquiryId: string) {
    try {
      console.log('📄 Fetching documents for enquiry ID:', enquiryId);
      
      // Find documents for specific enquiry
      const documents = this.documentsStorage
        .filter(doc => doc.enquiryId === parseInt(enquiryId))
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      // Find the enquiry details
      const enquiry = this.enquiriesStorage.find(enq => enq.id === parseInt(enquiryId));
      
      if (!enquiry) {
        throw new BadRequestException('Enquiry not found');
      }
      
      console.log('📄 Found', documents.length, 'documents for enquiry:', enquiry.name);
      
      return {
        enquiry: {
          id: enquiry.id,
          name: enquiry.name,
          mobile: enquiry.mobile,
          businessType: enquiry.businessType,
          gstNumber: enquiry.gstNumber
        },
        documents: documents,
        totalDocuments: documents.length,
        requiredDocuments: ['GST_CERTIFICATE', 'UDYAM_REGISTRATION', 'BANK_STATEMENT', 'OWNER_PAN_CARD', 'AADHAR_CARD'],
        completionPercentage: Math.round((documents.length / 5) * 100)
      };
    } catch (error) {
      console.error('❌ Error fetching documents for enquiry:', error);
      throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
    }
  }

  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    try {
      console.log('📄 Document upload request:', { enquiryId: body.enquiryId, type: body.type, fileName: file?.originalname });
      
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF files are allowed');
      }

      // Check if document type already exists for this enquiry in memory storage
      const existingDocIndex = this.documentsStorage.findIndex(doc => 
        doc.enquiryId === parseInt(body.enquiryId) && doc.type === body.type
      );

      let replacedDocument = null;
      if (existingDocIndex !== -1) {
        // Replace existing document instead of throwing error
        replacedDocument = this.documentsStorage[existingDocIndex];
        console.log('📄 Replacing existing document:', replacedDocument.fileName, 'with new upload');
        // Remove the existing document
        this.documentsStorage.splice(existingDocIndex, 1);
      }

      // Find the enquiry to get client details
      const enquiry = this.enquiriesStorage.find(enq => enq.id === parseInt(body.enquiryId));
      if (!enquiry) {
        throw new BadRequestException('Enquiry not found');
      }

      // Save the actual file to disk
      const timestamp = Date.now();
      const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const documentId = Math.floor(Math.random() * 9000) + 3000; // Start from 3000 for documents
      const savedFileName = `${documentId}_${timestamp}_${cleanFileName}`;
      const filePath = path.join(this.uploadsDir, savedFileName);
      
      // Write the file to disk
      fs.writeFileSync(filePath, file.buffer);
      console.log('📄 File saved to:', filePath);

      const document = {
        id: documentId,
        enquiryId: parseInt(body.enquiryId),
        type: body.type,
        s3Url: `/api/supabase/documents/${documentId}/proxy`, // Local proxy URL
        verified: false,
        uploadedById: 1,
        uploadedAt: new Date().toISOString(),
        fileName: file.originalname,
        fileSize: file.size,
        savedFileName: savedFileName,
        filePath: filePath,
        enquiry: {
          id: enquiry.id,
          name: enquiry.name,
          mobile: enquiry.mobile
        },
        uploadedBy: {
          id: 1,
          name: 'Current User',
          email: 'admin@businessloan.com'
        }
      };

      // Store document in memory
      this.documentsStorage.push(document);
      console.log('✅ Document stored in memory. Total documents:', this.documentsStorage.length);

      // Save to disk for persistence
      this.saveDocuments();

      const message = replacedDocument 
        ? `Document replaced successfully (was: ${replacedDocument.fileName})`
        : 'Document uploaded successfully';

      return {
        message: message,
        document: document,
        status: 'success',
        replaced: !!replacedDocument,
        replacedDocument: replacedDocument
      };

    } catch (error) {
      console.error('❌ Document upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload document');
    }
  }

  @Patch('documents/:id/verify')
  async verifyDocument(@Param('id') id: string) {
    try {
      console.log('✅ Verifying document with ID:', id);
      
      // Find document in memory storage
      const documentIndex = this.documentsStorage.findIndex(doc => doc.id === parseInt(id));
      
      if (documentIndex === -1) {
        console.log('❌ Document not found in memory storage');
        throw new BadRequestException(`Document with ID ${id} not found`);
      }
      
      // Update verification status
      this.documentsStorage[documentIndex].verified = true;
      this.documentsStorage[documentIndex].verifiedAt = new Date().toISOString();
      this.documentsStorage[documentIndex].verifiedBy = {
        id: 1,
        name: 'Current User',
        email: 'admin@businessloan.com'
      };
      
      const verifiedDocument = this.documentsStorage[documentIndex];
      
      // Save to disk for persistence
      this.saveDocuments();
      
      console.log('✅ Document verified successfully:', verifiedDocument.fileName);
      
      return {
        message: 'Document verified successfully',
        document: verifiedDocument
      };
    } catch (error) {
      console.error('❌ Error verifying document:', error);
      throw new BadRequestException(`Failed to verify document: ${error.message}`);
    }
  }

  @Delete('documents/:id')
  async deleteDocument(@Param('id') id: string) {
    try {
      console.log('🗑️ Deleting document with ID:', id);
      console.log('🗑️ Current documents count:', this.documentsStorage.length);
      
      // Find document in memory storage
      const documentIndex = this.documentsStorage.findIndex(doc => doc.id === parseInt(id));
      
      if (documentIndex === -1) {
        console.log('❌ Document not found in memory storage');
        throw new BadRequestException(`Document with ID ${id} not found`);
      }
      
      // Get the document before deleting
      const deletedDocument = this.documentsStorage[documentIndex];
      
      // Remove from memory storage
      this.documentsStorage.splice(documentIndex, 1);
      
      // Delete the actual file if it exists
      if (deletedDocument.filePath && fs.existsSync(deletedDocument.filePath)) {
        try {
          fs.unlinkSync(deletedDocument.filePath);
          console.log('🗑️ Deleted file from disk:', deletedDocument.filePath);
        } catch (fileError) {
          console.error('❌ Error deleting file:', fileError);
        }
      }
      
      // Save to disk for persistence
      this.saveDocuments();
      
      console.log('✅ Document deleted from memory storage');
      console.log('✅ Remaining documents count:', this.documentsStorage.length);
      console.log('✅ Deleted document:', deletedDocument.fileName, 'for client:', deletedDocument.enquiry.name);
      
      return {
        message: 'Document deleted successfully',
        document: deletedDocument
      };
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw new BadRequestException(`Failed to delete document: ${error.message}`);
    }
  }

  // In-memory storage for shortlists (for demo mode)
  private shortlistStorage: any[] = [];
  
  // In-memory storage for payment gateway applications
  private paymentGatewayStorage: any[] = [];

  @Post('shortlist')
  async createShortlist(@Body() body: any) {
    try {
      console.log('Shortlist request body:', JSON.stringify(body, null, 2));

      // Validate required fields
      if (!body.enquiryId || !body.name || !body.mobile) {
        throw new BadRequestException('Missing required fields: enquiryId, name, or mobile');
      }

      // Check if enquiry is already shortlisted in memory storage
      const existing = this.shortlistStorage.find(item => item.enquiryId === body.enquiryId);
      
      if (existing) {
        console.log('Enquiry already shortlisted:', existing);
        return {
          message: 'Enquiry is already shortlisted',
          shortlist: existing
        };
      }

      // Find the enquiry details
      const enquiry = this.enquiriesStorage.find(enq => enq.id === body.enquiryId);
      if (!enquiry) {
        throw new BadRequestException('Enquiry not found');
      }

      // Create new shortlist entry
      const newShortlist = {
        id: Math.floor(Math.random() * 9000) + 2000, // Start from 2000 for shortlists
        enquiryId: body.enquiryId,
        name: body.name,
        mobile: body.mobile,
        businessName: body.businessName || enquiry.businessName,
        businessNature: body.businessNature || enquiry.businessType,
        loanAmount: body.loanAmount || enquiry.loanAmount,
        comments: body.comments || 'Shortlisted from document management',
        staffId: 1,
        status: 'PENDING',
        interestStatus: 'INTERESTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enquiry: {
          id: enquiry.id,
          name: enquiry.name,
          mobile: enquiry.mobile,
          businessType: enquiry.businessType,
          loanAmount: enquiry.loanAmount
        }
      };

      // Store in memory
      this.shortlistStorage.push(newShortlist);
      
      // Save to disk for persistence
      this.saveShortlists();
      
      // Mark the enquiry as shortlisted
      const enquiryIndex = this.enquiriesStorage.findIndex(enq => enq.id === body.enquiryId);
      if (enquiryIndex !== -1) {
        this.enquiriesStorage[enquiryIndex].shortlist = {
          id: newShortlist.id,
          createdAt: newShortlist.createdAt
        };
        this.saveEnquiries();
      }

      console.log('✅ Shortlist created successfully:', newShortlist);
      console.log('📋 Total shortlists:', this.shortlistStorage.length);

      return {
        message: 'Client shortlisted successfully',
        shortlist: newShortlist
      };
    } catch (error) {
      console.error('❌ Shortlist creation failed:', error);
      throw new BadRequestException(`Failed to create shortlist: ${error.message}`);
    }
  }

  @Get('shortlist')
  async getShortlist() {
    try {
      console.log('📋 Fetching shortlists from memory storage...');
      console.log('📋 Total shortlists:', this.shortlistStorage.length);
      
      // Debug: Log all shortlist IDs and names
      this.shortlistStorage.forEach((shortlist, index) => {
        console.log(`📋 Shortlist ${index + 1}: ID=${shortlist.id}, Name=${shortlist.name}, EnquiryId=${shortlist.enquiryId}`);
      });
      
      // Return shortlists sorted by creation date (newest first)
      const shortlists = this.shortlistStorage
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('📋 Returning shortlists:', shortlists.length);
      return shortlists;
    } catch (error) {
      console.error('❌ Error fetching shortlists:', error);
      return [];
    }
  }

  @Get('shortlist/:id')
  async getShortlistById(@Param('id') id: string) {
    try {
      console.log('📋 Fetching shortlist by ID:', id);
      
      // Find shortlist in memory storage
      const shortlist = this.shortlistStorage.find(item => item.id === parseInt(id));
      
      if (!shortlist) {
        console.log('❌ Shortlist not found in memory storage');
        throw new BadRequestException(`Shortlist with ID ${id} not found`);
      }
      
      console.log('✅ Found shortlist:', shortlist.name);
      return shortlist;
    } catch (error) {
      console.error('❌ Error fetching shortlist by ID:', error);
      throw new BadRequestException(`Failed to fetch shortlist: ${error.message}`);
    }
  }

  @Patch('shortlist/:id')
  async updateShortlist(@Param('id') id: string, @Body() body: any) {
    try {
      console.log('🔄 Updating shortlist ID:', id);
      console.log('📝 Update data:', JSON.stringify(body, null, 2));
      
      // Find shortlist in memory storage
      const shortlistIndex = this.shortlistStorage.findIndex(item => item.id === parseInt(id));
      
      if (shortlistIndex === -1) {
        console.log('❌ Shortlist not found in memory storage');
        throw new BadRequestException(`Shortlist with ID ${id} not found`);
      }
      
      // Get current shortlist
      const currentShortlist = this.shortlistStorage[shortlistIndex];
      
      // Update the shortlist with new data
      const updatedShortlist = {
        ...currentShortlist,
        ...body,
        id: parseInt(id), // Ensure ID stays the same
        updatedAt: new Date().toISOString()
      };
      
      // Update in memory storage
      this.shortlistStorage[shortlistIndex] = updatedShortlist;
      
      // Save to disk for persistence
      this.saveShortlists();
      
      console.log('✅ Shortlist updated successfully:', updatedShortlist.name);
      console.log('📊 Key updates:');
      console.log('  - Interest Status:', updatedShortlist.interestStatus);
      console.log('  - Loan Amount:', updatedShortlist.loanAmount);
      console.log('  - Status:', updatedShortlist.status);
      
      return {
        message: 'Shortlist updated successfully',
        shortlist: updatedShortlist
      };
    } catch (error) {
      console.error('❌ Error updating shortlist:', error);
      throw new BadRequestException(`Failed to update shortlist: ${error.message}`);
    }
  }

  @Delete('shortlist/:id')
  async deleteShortlist(@Param('id') id: string) {
    try {
      console.log('🗑️ Deleting shortlist with ID:', id);
      
      // Find shortlist in memory storage
      const shortlistIndex = this.shortlistStorage.findIndex(item => item.id === parseInt(id));
      
      if (shortlistIndex === -1) {
        console.log('❌ Shortlist not found in memory storage');
        throw new BadRequestException(`Shortlist with ID ${id} not found`);
      }
      
      // Get the shortlist before deleting
      const deletedShortlist = this.shortlistStorage[shortlistIndex];
      
      // Remove from memory storage
      this.shortlistStorage.splice(shortlistIndex, 1);
      
      // Save to disk for persistence
      this.saveShortlists();
      
      // Also remove shortlist reference from enquiry if it exists
      const enquiry = this.enquiriesStorage.find(enq => enq.id === deletedShortlist.enquiryId);
      if (enquiry && enquiry.shortlist) {
        delete enquiry.shortlist;
        this.saveEnquiries();
      }
      
      console.log('✅ Shortlist deleted successfully:', deletedShortlist.name);
      console.log('📋 Remaining shortlists:', this.shortlistStorage.length);
      
      return {
        message: 'Shortlist deleted successfully',
        shortlist: deletedShortlist
      };
    } catch (error) {
      console.error('❌ Error deleting shortlist:', error);
      throw new BadRequestException(`Failed to delete shortlist: ${error.message}`);
    }
  }

  @Post('reset-shortlist')
  resetShortlistData() {
    console.log('🔄 Resetting shortlist data...');
    console.log('📋 Before reset - Total shortlists:', this.shortlistStorage.length);
    
    // Clear all shortlists
    this.shortlistStorage = [];
    
    // Save empty array to disk
    this.saveShortlists();
    
    console.log('✅ Shortlist data reset completed');
    return {
      message: 'Shortlist data reset successfully',
      timestamp: new Date(),
      totalShortlists: this.shortlistStorage.length
    };
  }

  @Post('force-update-shortlist')
  forceUpdateShortlist() {
    try {
      console.log('=== FORCE UPDATE SHORTLIST ENDPOINT CALLED ===');
      console.log('Request received at:', new Date().toISOString());
      
      // Force set the updated data with correct loan amount
      this.updatedShortlistData = {
        id: 1,
        enquiryId: 1001,
        enquiryName: 'Appu Electronic Sales and Service',
        enquiryMobile: '9894289718',
        name: 'Bhuvaneshwari Kalidass',
        mobile: '9894289718',
        businessName: 'Appu Electronic Sales and Service',
        businessNature: 'Electronics Sales and Service',
        district: 'Vellore',
        loanAmount: 1000000, // ₹10,00,000
        loanStatus: 'PENDING',
        interestStatus: 'INTERESTED',
        status: 'PENDING',
        lastUpdated: new Date(),
        updatedAt: new Date(),
        createdAt: new Date(),
        enquiry: {
          id: 1001,
          name: 'Appu Electronic Sales and Service',
          mobile: '9894289718',
          businessType: 'Electronics Sales and Service',
          loanAmount: 1000000
        }
      };

      console.log('Updated shortlist data set:', this.updatedShortlistData);

      return {
        message: 'Shortlist data force updated successfully',
        updatedData: this.updatedShortlistData,
        loanAmount: this.updatedShortlistData.loanAmount,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error in force update shortlist:', error);
      throw new BadRequestException(`Failed to force update shortlist: ${error.message}`);
    }
  }

  @Post('shortlist/:id/payment-gateway-applied')
  markPaymentGatewayApplied(@Param('id') id: string, @Body() applicationData: any) {
    try {
      console.log('Marking shortlist as having payment gateway application:', id);
      
      // Find and update the shortlist in memory storage
      const shortlistIndex = this.shortlistStorage.findIndex(item => item.id === parseInt(id));
      if (shortlistIndex !== -1) {
        this.shortlistStorage[shortlistIndex].cashfreeApplication = applicationData;
        this.shortlistStorage[shortlistIndex].hasPaymentGatewayApplication = true;
        this.saveShortlists();
      }

      return {
        message: 'Shortlist marked as having payment gateway application',
        id: parseInt(id),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error marking payment gateway application:', error);
      throw new BadRequestException(`Failed to update shortlist: ${error.message}`);
    }
  }

  @Post('payment-gateway/apply')
  async createPaymentGatewayApplication(@Body() body: any) {
    try {
      console.log('🏦 Creating payment gateway application:', JSON.stringify(body, null, 2));

      // Find the shortlist
      const shortlist = this.shortlistStorage.find(item => item.id === body.shortlistId);
      if (!shortlist) {
        throw new BadRequestException('Shortlist not found');
      }

      // Create new payment gateway application
      const newApplication = {
        id: Math.floor(Math.random() * 9000) + 5000, // Start from 5000 for payment gateway apps
        shortlistId: body.shortlistId,
        loanAmount: body.loanAmount,
        tenure: body.tenure,
        interestRate: body.interestRate,
        processingFee: body.processingFee,
        purpose: body.purpose,
        status: body.status || 'PENDING',
        appliedAt: body.appliedAt || new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        shortlist: {
          id: shortlist.id,
          name: shortlist.name,
          mobile: shortlist.mobile,
          businessName: shortlist.businessName,
          businessNature: shortlist.businessNature,
          loanAmount: shortlist.loanAmount,
          district: shortlist.district || 'N/A'
        },
        ...body
      };

      // Store in memory
      this.paymentGatewayStorage.push(newApplication);
      
      // Save to disk for persistence
      this.savePaymentGatewayApplications();
      
      console.log('✅ Payment gateway application created:', newApplication.id);
      console.log('📋 Total payment gateway applications:', this.paymentGatewayStorage.length);

      return {
        message: 'Payment gateway application created successfully',
        application: newApplication
      };
    } catch (error) {
      console.error('❌ Error creating payment gateway application:', error);
      throw new BadRequestException(`Failed to create payment gateway application: ${error.message}`);
    }
  }

  @Get('payment-gateway')
  async getPaymentGatewayApplications() {
    try {
      console.log('🏦 Fetching payment gateway applications from memory storage...');
      console.log('📋 Total applications:', this.paymentGatewayStorage.length);
      
      // Debug: Log all application IDs and names
      this.paymentGatewayStorage.forEach((app, index) => {
        console.log(`🏦 Application ${index + 1}: ID=${app.id}, ShortlistId=${app.shortlistId}, Status=${app.status}`);
      });
      
      // Return applications sorted by submission date (newest first)
      const applications = this.paymentGatewayStorage
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      
      console.log('📋 Returning applications:', applications.length);
      return applications;
    } catch (error) {
      console.error('❌ Error fetching payment gateway applications:', error);
      return [];
    }
  }

  @Patch('payment-gateway/:id/status')
  async updatePaymentGatewayStatus(@Param('id') id: string, @Body() body: any) {
    try {
      console.log('🔄 Updating payment gateway application status:', id, body.status);
      
      // Find application in memory storage
      const appIndex = this.paymentGatewayStorage.findIndex(app => app.id === parseInt(id));
      
      if (appIndex === -1) {
        throw new BadRequestException(`Payment gateway application with ID ${id} not found`);
      }
      
      // Update status
      this.paymentGatewayStorage[appIndex].status = body.status;
      this.paymentGatewayStorage[appIndex].updatedAt = new Date().toISOString();
      
      // Save to disk for persistence
      this.savePaymentGatewayApplications();
      
      console.log('✅ Payment gateway application status updated:', body.status);
      
      return {
        message: 'Payment gateway application status updated successfully',
        application: this.paymentGatewayStorage[appIndex]
      };
    } catch (error) {
      console.error('❌ Error updating payment gateway application status:', error);
      throw new BadRequestException(`Failed to update status: ${error.message}`);
    }
  }

  @Get('stats')
  async getStats() {
    try {
      // Get counts from different tables
      const [enquiriesResult, documentsResult, shortlistResult] = await Promise.all([
        this.supabaseService.client.from('Enquiry').select('id', { count: 'exact', head: true }),
        this.supabaseService.client.from('Document').select('id', { count: 'exact', head: true }),
        this.supabaseService.client.from('Shortlist').select('id', { count: 'exact', head: true }),
      ]);

      return {
        enquiries: enquiriesResult.count || 0,
        documents: documentsResult.count || 0,
        shortlist: shortlistResult.count || 0,
        timestamp: new Date().toISOString(),
        status: 'success'
      };
    } catch (error) {
      return {
        enquiries: 0,
        documents: 0,
        shortlist: 0,
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message
      };
    }
  }

  @Post('documents/force-remove-duplicates')
  async forceRemoveDuplicates() {
    try {
      // Get all documents for enquiry 7 (the one with duplicates in the image)
      const { data: enquiry7Docs, error } = await this.supabaseService.client
        .from('Document')
        .select('id, enquiryId, type, uploadedAt')
        .eq('enquiryId', 7)
        .order('uploadedAt', { ascending: false });

      if (error) {
        throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
      }

      if (!enquiry7Docs || enquiry7Docs.length === 0) {
        return {
          message: 'No documents found for enquiry 7',
          removed: 0
        };
      }

      // Group by document type and keep only the most recent
      const typeGroups = new Map<string, any[]>();
      enquiry7Docs.forEach(doc => {
        if (!typeGroups.has(doc.type)) {
          typeGroups.set(doc.type, []);
        }
        typeGroups.get(doc.type)!.push(doc);
      });

      const idsToDelete: number[] = [];
      
      // For each type, keep the first (most recent) and delete the rest
      typeGroups.forEach((docs, type) => {
        if (docs.length > 1) {
          // Skip the first (most recent), delete the rest
          for (let i = 1; i < docs.length; i++) {
            idsToDelete.push(docs[i].id);
          }
        }
      });

      if (idsToDelete.length === 0) {
        return {
          message: 'No duplicates found for enquiry 7',
          removed: 0
        };
      }

      // Delete the duplicate documents
      const deletePromises = idsToDelete.map(id => 
        this.supabaseService.client
          .from('Document')
          .delete()
          .eq('id', id)
      );

      await Promise.all(deletePromises);

      return {
        message: `Successfully removed ${idsToDelete.length} duplicate documents for enquiry 7`,
        removed: idsToDelete.length,
        deletedIds: idsToDelete
      };
    } catch (error) {
      return {
        message: 'Failed to remove duplicates',
        error: error.message,
        removed: 0
      };
    }
  }

  @Post('documents/remove-duplicates/:enquiryId')
  async removeDuplicatesForEnquiry(@Param('enquiryId') enquiryId: string) {
    try {
      // Get all documents for this specific enquiry
      const { data: enquiryDocuments, error } = await this.supabaseService.client
        .from('Document')
        .select('id, enquiryId, type, uploadedAt, s3Url')
        .eq('enquiryId', parseInt(enquiryId))
        .order('uploadedAt', { ascending: false });

      if (error) {
        throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
      }

      if (!enquiryDocuments || enquiryDocuments.length === 0) {
        return {
          message: `No documents found for enquiry ${enquiryId}`,
          removed: 0
        };
      }

      // Group documents by type for this enquiry
      const groupedByType = new Map<string, any[]>();
      
      enquiryDocuments.forEach(doc => {
        if (!groupedByType.has(doc.type)) {
          groupedByType.set(doc.type, []);
        }
        groupedByType.get(doc.type)!.push(doc);
      });

      // Find duplicates (keep the most recent, remove others)
      const documentsToDelete: number[] = [];
      
      groupedByType.forEach((docs, type) => {
        if (docs.length > 1) {
          // Keep the first one (most recent due to DESC order), delete the rest
          const duplicates = docs.slice(1);
          duplicates.forEach(doc => {
            documentsToDelete.push(doc.id);
          });
        }
      });

      if (documentsToDelete.length === 0) {
        return {
          message: `No duplicate documents found for enquiry ${enquiryId}`,
          removed: 0
        };
      }

      // Delete duplicate documents from database
      const deletePromises = documentsToDelete.map(docId => 
        this.supabaseService.client
          .from('Document')
          .delete()
          .eq('id', docId)
      );

      await Promise.all(deletePromises);

      return {
        message: `Successfully removed ${documentsToDelete.length} duplicate documents for enquiry ${enquiryId}`,
        removed: documentsToDelete.length,
        duplicateIds: documentsToDelete
      };
    } catch (error) {
      return {
        message: 'Failed to remove duplicates',
        error: error.message,
        removed: 0
      };
    }
  }

  @Post('documents/remove-duplicates')
  async removeDuplicateDocuments() {
    try {
      // Get all documents grouped by enquiryId and type
      const { data: allDocuments, error } = await this.supabaseService.client
        .from('Document')
        .select('id, enquiryId, type, uploadedAt, s3Url')
        .order('uploadedAt', { ascending: false });

      if (error) {
        throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
      }

      if (!allDocuments || allDocuments.length === 0) {
        return {
          message: 'No documents found',
          removed: 0
        };
      }

      // Group documents by enquiryId and type
      const groupedDocs = new Map<string, any[]>();
      
      allDocuments.forEach(doc => {
        const key = `${doc.enquiryId}-${doc.type}`;
        if (!groupedDocs.has(key)) {
          groupedDocs.set(key, []);
        }
        groupedDocs.get(key)!.push(doc);
      });

      // Find duplicates (keep the most recent, remove others)
      const documentsToDelete: number[] = [];
      
      groupedDocs.forEach((docs, key) => {
        if (docs.length > 1) {
          // Keep the first one (most recent due to DESC order), delete the rest
          const duplicates = docs.slice(1);
          duplicates.forEach(doc => {
            documentsToDelete.push(doc.id);
          });
        }
      });

      if (documentsToDelete.length === 0) {
        return {
          message: 'No duplicate documents found',
          removed: 0
        };
      }

      // Delete duplicate documents from database
      const deletePromises = documentsToDelete.map(docId => 
        this.supabaseService.client
          .from('Document')
          .delete()
          .eq('id', docId)
      );

      await Promise.all(deletePromises);

      // Create audit log
      await this.supabaseService.client
        .from('AuditLog')
        .insert({
          userId: 1, // Mock user ID
          action: 'REMOVE_DUPLICATE_DOCUMENTS',
          targetTable: 'Document',
          targetId: 0, // Multiple documents
        });

      return {
        message: `Successfully removed ${documentsToDelete.length} duplicate documents`,
        removed: documentsToDelete.length,
        duplicateIds: documentsToDelete
      };
    } catch (error) {
      return {
        message: 'Failed to remove duplicates',
        error: error.message,
        removed: 0
      };
    }
  }

  @Get('documents/check-duplicates')
  async checkDuplicates() {
    try {
      const { data: allDocuments, error } = await this.supabaseService.client
        .from('Document')
        .select('id, enquiryId, type, uploadedAt')
        .order('enquiryId', { ascending: true });

      if (error) {
        throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
      }

      // Group by enquiryId and type to find duplicates
      const duplicateReport = new Map<string, any[]>();
      const groupedDocs = new Map<string, any[]>();
      
      allDocuments?.forEach(doc => {
        const key = `${doc.enquiryId}-${doc.type}`;
        if (!groupedDocs.has(key)) {
          groupedDocs.set(key, []);
        }
        groupedDocs.get(key)!.push(doc);
      });

      // Find actual duplicates
      groupedDocs.forEach((docs, key) => {
        if (docs.length > 1) {
          duplicateReport.set(key, docs);
        }
      });

      return {
        totalDocuments: allDocuments?.length || 0,
        duplicateGroups: duplicateReport.size,
        duplicates: Object.fromEntries(duplicateReport),
        hasDuplicates: duplicateReport.size > 0
      };
    } catch (error) {
      return {
        error: error.message,
        hasDuplicates: false
      };
    }
  }

  @Post('documents/cleanup')
  async cleanupDocuments() {
    try {
      // Get all documents with problematic URLs
      const { data: documents, error } = await this.supabaseService.client
        .from('Document')
        .select('id, s3Url, type, enquiryId')
        .like('s3Url', '%/api/mock/%');

      if (error) {
        throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
      }

      if (!documents || documents.length === 0) {
        return {
          message: 'No documents need cleanup',
          cleaned: 0
        };
      }

      // Delete documents with mock URLs
      const deletePromises = documents.map(doc => 
        this.supabaseService.client
          .from('Document')
          .delete()
          .eq('id', doc.id)
      );

      await Promise.all(deletePromises);

      return {
        message: `Cleaned up ${documents.length} documents with invalid URLs`,
        cleaned: documents.length,
        documentIds: documents.map(d => d.id)
      };
    } catch (error) {
      return {
        message: 'Cleanup failed',
        error: error.message
      };
    }
  }

  @Get('documents/with-client-names')
  async getDocumentsWithClientNames() {
    try {
      // Get all documents with their enquiry information to show client names
      const { data: documents, error } = await this.supabaseService.client
        .from('Document')
        .select(`
          id,
          enquiryId,
          type,
          s3Url,
          verified,
          uploadedAt,
          enquiry:Enquiry(id, name, businessName, mobile)
        `)
        .order('uploadedAt', { ascending: false });

      if (error) {
        throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
      }

      // Transform the data to include client names
      const documentsWithClientNames = documents?.map(doc => {
        const enquiry = Array.isArray(doc.enquiry) ? doc.enquiry[0] : doc.enquiry;
        const clientName = enquiry?.name || enquiry?.businessName || `Enquiry ${doc.enquiryId}`;
        
        return {
          ...doc,
          clientName,
          enquiry: {
            id: enquiry?.id || doc.enquiryId,
            name: enquiry?.name || clientName,
            mobile: enquiry?.mobile || 'N/A'
          }
        };
      });

      return documentsWithClientNames || [];
    } catch (error) {
      throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
    }
  }

  @Post('documents/add-client-names')
  async addClientNamesToDocuments() {
    try {
      // Get all documents with their enquiry information
      const { data: documents, error: fetchError } = await this.supabaseService.client
        .from('Document')
        .select(`
          id,
          enquiryId,
          enquiry:Enquiry(id, name, businessName)
        `);

      if (fetchError) {
        throw new BadRequestException(`Failed to fetch documents: ${fetchError.message}`);
      }

      if (!documents || documents.length === 0) {
        return {
          message: 'No documents found to update',
          updated: 0
        };
      }

      return {
        message: 'Please run the SQL script in Supabase dashboard first',
        sqlScript: `
-- Add clientName column to Document table
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "clientName" VARCHAR(255);

-- Update existing documents with client names
UPDATE "Document" 
SET "clientName" = COALESCE(
  (SELECT COALESCE("name", "businessName", 'Enquiry ' || "Document"."enquiryId") 
   FROM "Enquiry" 
   WHERE "Enquiry".id = "Document"."enquiryId"),
  'Unknown Client'
)
WHERE "clientName" IS NULL OR "clientName" = '';
        `,
        documentsFound: documents.length
      };
    } catch (error) {
      return {
        message: 'Failed to check documents',
        error: error.message,
        updated: 0
      };
    }
  }

  @Get('setup-status')
  async getSetupStatus() {
    try {
      // Check if all required tables exist
      const tableChecks = await Promise.all([
        this.supabaseService.client.from('User').select('id', { count: 'exact', head: true }),
        this.supabaseService.client.from('Enquiry').select('id', { count: 'exact', head: true }),
        this.supabaseService.client.from('Document').select('id', { count: 'exact', head: true }),
        this.supabaseService.client.from('Shortlist').select('id', { count: 'exact', head: true }),
      ]);

      const tablesExist = tableChecks.every(result => !result.error);
      
      // Check storage bucket
      const { data: buckets, error: bucketError } = await this.supabaseService.client.storage.listBuckets();
      const documentsBucketExists = buckets?.some(bucket => bucket.name === 'documents') || false;

      return {
        tablesCreated: tablesExist,
        documentsBucketExists,
        setupComplete: tablesExist && documentsBucketExists,
        tableErrors: tableChecks.map(result => result.error?.message).filter(Boolean),
        bucketError: bucketError?.message || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        tablesCreated: false,
        documentsBucketExists: false,
        setupComplete: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

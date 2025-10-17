import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, UploadedFile, Delete, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

// Mock controller for demo purposes

@Controller('mock')
export class MockController {
  private enquiries: any[] = [];
  private documents: any[] = [];
  private documentsInitialized: boolean = false;
  private uploadedFiles: Map<string, Buffer> = new Map();
  private shortlists: any[] = [];
  private shortlistsInitialized: boolean = false;
  private paymentGatewayApplications: any[] = [];

  @Get('enquiries')
  getEnquiries() {
    // Add realistic test enquiries if none exist
    if (this.enquiries.length === 0) {
      this.enquiries.push(
        {
          id: 1001,
          name: 'Appu Electronic Sales and Service',
          ownerName: 'Bhuvaneshwari Kalidass',
          mobile: '9894289718',
          email: 'appu@appuelectronics.com',
          businessType: 'Electronics Sales and Service',
          district: 'Vellore',
          loanAmount: 1000000,
          comments: 'ELIGIBLE',
          interestStatus: 'INTERESTED',
          staff: { name: 'Current User', id: 1 },
          createdAt: new Date()
        },
        {
          id: 1003,
          name: 'Mumbai Food Distributors',
          ownerName: 'Arjun Singh',
          mobile: '9234567890',
          email: 'arjun@mumbaifood.com',
          businessType: 'Food Trading',
          comments: 'ELIGIBLE',
          interestStatus: 'INTERESTED',
          staff: { name: 'Current User', id: 1 },
          createdAt: new Date()
        },
        {
          id: 1004,
          name: 'Green Energy Solutions',
          ownerName: 'Kavita Joshi',
          mobile: '9345678901',
          email: 'kavita@greenenergy.com',
          businessType: 'Renewable Energy',
          comments: 'ELIGIBLE',
          interestStatus: 'INTERESTED',
          staff: { name: 'Current User', id: 1 },
          createdAt: new Date()
        },
        {
          id: 1005,
          name: 'Coastal Logistics Pvt Ltd',
          ownerName: 'Deepak Nair',
          mobile: '9456789012',
          email: 'deepak@coastallogistics.com',
          businessType: 'Transportation',
          comments: 'ELIGIBLE',
          interestStatus: 'INTERESTED',
          staff: { name: 'Current User', id: 1 },
          createdAt: new Date()
        },
        {
          id: 1006,
          name: 'Sathiskumar Aluminium Works',
          ownerName: 'Sathiskumar',
          mobile: '9629293598',
          email: 'sathiskumar58209@gmail.com',
          businessType: 'ALUMINIUM WORKS',
          comments: 'ELIGIBLE',
          interestStatus: 'INTERESTED',
          staff: { name: 'Current User', id: 1 },
          createdAt: new Date()
        }
      );
    }
    return this.enquiries;
  }

  @Get('documents')
  getDocuments() {
    // Add sample documents only if they haven't been initialized yet
    if (!this.documentsInitialized) {
      // Ensure enquiries are loaded first
      this.getEnquiries();
      this.documentsInitialized = true;
      
      this.documents.push(
        {
          id: 512,
          type: 'GST',
          s3Url: 'GST.pdf',
          verified: false,
          uploadedAt: new Date(),
          enquiry: {
            id: 1006,
            name: 'Sathiskumar Aluminium Works',
            mobile: '9629293598'
          },
          uploadedBy: { name: 'Current User' }
        },
        {
          id: 513,
          type: 'UDYAM',
          s3Url: 'UDYAM.pdf',
          verified: true,
          uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          enquiry: {
            id: 1001,
            name: 'Rajesh Enterprises',
            mobile: '9876543210'
          },
          uploadedBy: { name: 'Current User' }
        },
        {
          id: 514,
          type: 'BANK_STATEMENT',
          s3Url: 'BANK_STATEMENT.pdf',
          verified: true,
          uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          enquiry: {
            id: 1002,
            name: 'TechSoft Solutions',
            mobile: '9123456789'
          },
          uploadedBy: { name: 'Current User' }
        },
        {
          id: 515,
          type: 'OWNER_PAN',
          s3Url: 'OWNER_PAN.pdf',
          verified: false,
          uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          enquiry: {
            id: 1003,
            name: 'Mumbai Food Distributors',
            mobile: '9234567890'
          },
          uploadedBy: { name: 'Current User' }
        },
        {
          id: 516,
          type: 'AADHAR',
          s3Url: 'AADHAR.pdf',
          verified: true,
          uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          enquiry: {
            id: 1004,
            name: 'Green Energy Solutions',
            mobile: '9345678901'
          },
          uploadedBy: { name: 'Current User' }
        },
        {
          id: 517,
          type: 'WEBSITE_GATEWAY',
          s3Url: 'WEBSITE_GATEWAY.pdf',
          verified: false,
          uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          enquiry: {
            id: 1005,
            name: 'Coastal Logistics Pvt Ltd',
            mobile: '9456789012'
          },
          uploadedBy: { name: 'Current User' }
        }
      );
    }
    return this.documents;
  }

  @Get('documents/status/:enquiryId')
  getDocumentStatus(@Param('enquiryId') enquiryId: string) {
    // Ensure enquiries and documents are loaded
    this.getEnquiries();
    this.getDocuments();
    
    const enquiry = this.enquiries.find(e => e.id == parseInt(enquiryId));
    if (!enquiry) {
      return { error: 'Enquiry not found' };
    }

    // Get uploaded documents for this enquiry
    const uploadedDocs = this.documents.filter(d => d.enquiry.id == parseInt(enquiryId));
    const uploadedTypes = uploadedDocs.map(d => d.type);

    // Define document requirements
    const documentTypes = [
      { type: 'GST', label: 'GST Certificate', required: true },
      { type: 'UDYAM', label: 'Udyam Registration', required: true },
      { type: 'BANK_STATEMENT', label: 'Bank Statement', required: true },
      { type: 'OWNER_PAN', label: 'Owner PAN Card', required: true },
      { type: 'AADHAR', label: 'Aadhar Card', required: true },
      { type: 'WEBSITE_GATEWAY', label: 'Website & Gateway', required: false },
      { type: 'IE_CODE', label: 'IE Code', required: false }
    ];

    // Calculate status for each document type
    const documentStatus = documentTypes.map(docType => ({
      type: docType.type,
      label: docType.label,
      required: docType.required,
      uploaded: uploadedTypes.includes(docType.type),
      status: uploadedTypes.includes(docType.type) ? 'uploaded' : (docType.required ? 'missing' : 'optional')
    }));

    // Calculate completion percentage
    const requiredDocs = documentTypes.filter(d => d.required);
    const uploadedRequired = requiredDocs.filter(d => uploadedTypes.includes(d.type));
    const completionPercentage = Math.round((uploadedRequired.length / requiredDocs.length) * 100);

    return {
      enquiry: {
        id: enquiry.id,
        name: enquiry.name,
        ownerName: enquiry.ownerName,
        mobile: enquiry.mobile
      },
      documentStatus,
      completionPercentage,
      totalRequired: requiredDocs.length,
      uploadedRequired: uploadedRequired.length,
      totalOptional: documentTypes.filter(d => !d.required).length,
      uploadedOptional: documentTypes.filter(d => !d.required && uploadedTypes.includes(d.type)).length
    };
  }

  @Get('enquiries/:id')
  getEnquiry(@Param('id') id: string) {
    this.getEnquiries();
    const enquiry = this.enquiries.find(e => e.id == parseInt(id));
    if (!enquiry) {
      return { error: 'Enquiry not found' };
    }
    return enquiry;
  }

  @Post('enquiries')
  createEnquiry(@Body() body: any) {
    const newEnquiry = {
      id: Math.floor(Math.random() * 1000) + 100,
      name: body.name || body.businessName,
      ownerName: body.ownerName,
      mobile: body.mobile,
      email: body.email,
      businessType: body.businessType,
      businessCategory: body.businessCategory,
      loanAmount: body.loanAmount,
      loanPurpose: body.loanPurpose,
      monthlyTurnover: body.monthlyTurnover,
      businessAge: body.businessAge,
      comments: body.comments,
      interestStatus: body.interestStatus || 'INTERESTED',
      staff: { name: 'Current User', id: 1 },
      createdAt: new Date(),
      address: body.address,
      gstNumber: body.gstNumber
    };
    
    this.enquiries.push(newEnquiry);
    
    return {
      message: 'Enquiry created successfully',
      enquiry: newEnquiry
    };
  }

  @Patch('enquiries/:id')
  updateEnquiry(@Param('id') id: string, @Body() body: any) {
    this.getEnquiries();
    const enquiryIndex = this.enquiries.findIndex(e => e.id == parseInt(id));
    
    if (enquiryIndex === -1) {
      return { error: 'Enquiry not found' };
    }

    // Update the enquiry
    const updatedEnquiry = {
      ...this.enquiries[enquiryIndex],
      ...body,
      id: parseInt(id), // Keep the original ID
      updatedAt: new Date()
    };

    this.enquiries[enquiryIndex] = updatedEnquiry;

    return {
      message: 'Enquiry updated successfully',
      enquiry: updatedEnquiry
    };
  }

  @Delete('enquiries/:id')
  deleteEnquiry(@Param('id') id: string) {
    this.getEnquiries();
    const enquiryIndex = this.enquiries.findIndex(e => e.id == parseInt(id));
    
    if (enquiryIndex === -1) {
      return { error: 'Enquiry not found' };
    }

    const deletedEnquiry = this.enquiries[enquiryIndex];
    
    // Also delete all documents associated with this enquiry
    this.documents = this.documents.filter(d => d.enquiry.id != parseInt(id));
    
    // Remove the enquiry
    this.enquiries.splice(enquiryIndex, 1);

    return {
      message: 'Enquiry and associated documents deleted successfully',
      enquiry: deletedEnquiry
    };
  }

  @Get('shortlist')
  getShortlist() {
    // Ensure enquiries are loaded
    this.getEnquiries();
    
    // Add sample shortlist data if none exists
    if (!this.shortlistsInitialized) {
      this.shortlistsInitialized = true;
      this.shortlists.push(
        {
          id: 1,
          enquiryId: 1001,
          enquiryName: 'Appu Electronic Sales and Service',
          enquiryMobile: '9894289718',
          name: 'Bhuvaneshwari Kalidass',
          mobile: '9894289718',
          businessName: 'Appu Electronic Sales and Service',
          businessNature: 'Electronics Sales and Service',
          district: 'Vellore',
          propPvt: 'Proprietorship',
          hasGst: 'yes',
          gst: '33APPUE1234F1Z5',
          hasBusinessPan: 'yes',
          businessPan: 'APPUE1234F',
          hasIec: 'no',
          iec: '',
          hasNewCurrentAccount: 'yes',
          newCurrentAccount: true,
          hasWebsite: 'yes',
          website: 'https://appuelectronics.com',
          hasGateway: 'yes',
          gateway: 'Paytm',
          transaction: 'Monthly 30L+',
          bankStatementDuration: '12 months',
          loanAmount: 1000000,
          loanStatus: 'PENDING',
          interestStatus: 'INTERESTED',
          cap: 75000,
          bankAccount: 'SBI Bank - 12345678901',
          comments: 'Established electronics business with good customer base',
          staff: 'Current User',
          gstStatus: 'Active',
          date: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          createdAt: new Date()
        }
      );
    }
    
    // Return shortlists with enquiry details and payment gateway status
    return this.shortlists.map(shortlist => {
      // Check if this shortlist has a payment gateway application
      const paymentGatewayApp = this.paymentGatewayApplications.find(app => app.shortlistId === shortlist.id);
      
      return {
        ...shortlist,
        cashfreeApplication: paymentGatewayApp || shortlist.cashfreeApplication,
        hasPaymentGatewayApplication: !!paymentGatewayApp || shortlist.hasPaymentGatewayApplication,
        enquiry: this.enquiries.find(e => e.id === shortlist.enquiryId) || {
          id: shortlist.enquiryId,
          name: shortlist.enquiryName || 'Unknown',
          mobile: shortlist.enquiryMobile || 'N/A',
          businessType: shortlist.businessType || 'N/A',
          loanAmount: shortlist.loanAmount || 0
        }
      };
    });
  }

  @Post('documents/upload-supabase')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentToSupabase(@UploadedFile() file: any, @Body() body: any) {
    console.log('Supabase upload request received:', { 
      hasFile: !!file, 
      fileName: file?.originalname, 
      fileSize: file?.size,
      body: body 
    });
    
    // Ensure enquiries and documents are loaded
    this.getEnquiries();
    this.getDocuments();
    
    // Find the enquiry to get client details
    const enquiry = this.enquiries.find(e => e.id == parseInt(body.enquiryId));
    
    // Check if document type already exists for this enquiry
    const existingDocument = this.documents.find(d => 
      d.enquiry.id == parseInt(body.enquiryId) && d.type === body.type
    );
    
    if (existingDocument) {
      return {
        error: 'Document type already uploaded for this client',
        message: `${body.type} document already exists for this client`
      };
    }
    
    // Generate a unique filename for the uploaded file
    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = file?.originalname || `${body.type}_${fileId}.pdf`;
    
    // Store the file buffer if it exists
    if (file && file.buffer) {
      this.uploadedFiles.set(fileName, file.buffer);
      console.log('File stored successfully:', { 
        fileName, 
        bufferSize: file.buffer.length,
        totalStoredFiles: this.uploadedFiles.size 
      });
    }
    
    const newDocument = {
      id: Math.floor(Math.random() * 1000) + 100,
      type: body.type || body.documentType,
      s3Url: fileName,
      verified: false,
      uploadedAt: new Date(),
      isUploaded: !!file,
      savedToSupabase: true, // Flag to indicate this was saved to Supabase
      enquiry: enquiry ? {
        id: enquiry.id,
        name: enquiry.name,
        mobile: enquiry.mobile,
        ownerName: enquiry.ownerName
      } : {
        id: body.enquiryId,
        name: 'Unknown Client',
        mobile: 'N/A'
      },
      uploadedBy: { name: 'Current User' }
    };
    
    // Store the document
    this.documents.push(newDocument);
    
    // Simulate saving to Supabase database
    console.log('Document would be saved to Supabase:', {
      enquiryId: body.enquiryId,
      type: body.type,
      fileName: fileName,
      uploadedById: 1
    });
    
    return {
      message: 'Document uploaded and saved to Supabase successfully',
      document: newDocument,
      supabaseStatus: 'simulated_success'
    };
  }

  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(@UploadedFile() file: any, @Body() body: any) {
    console.log('Upload request received:', { 
      hasFile: !!file, 
      fileName: file?.originalname, 
      fileSize: file?.size,
      body: body 
    });
    
    // Ensure enquiries and documents are loaded
    this.getEnquiries();
    this.getDocuments();
    
    // Find the enquiry to get client details
    const enquiry = this.enquiries.find(e => e.id == parseInt(body.enquiryId));
    
    // Check if document type already exists for this enquiry
    const existingDocument = this.documents.find(d => 
      d.enquiry.id == parseInt(body.enquiryId) && d.type === body.type
    );
    
    if (existingDocument) {
      return {
        error: 'Document type already uploaded for this client',
        message: `${body.type} document already exists for this client`
      };
    }
    
    // Generate a unique filename for the uploaded file
    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = file?.originalname || `${body.type}_${fileId}.pdf`;
    
    // Store the file buffer if it exists
    if (file && file.buffer) {
      this.uploadedFiles.set(fileName, file.buffer);
      console.log('File stored successfully:', { 
        fileName, 
        bufferSize: file.buffer.length,
        totalStoredFiles: this.uploadedFiles.size 
      });
    } else {
      console.log('No file buffer to store:', { hasFile: !!file, hasBuffer: !!(file?.buffer) });
    }
    
    const newDocument = {
      id: Math.floor(Math.random() * 1000) + 100,
      type: body.type || body.documentType,
      s3Url: fileName,
      verified: false,
      uploadedAt: new Date(),
      isUploaded: !!file, // Flag to indicate if this is an actual uploaded file
      enquiry: enquiry ? {
        id: enquiry.id,
        name: enquiry.name,
        mobile: enquiry.mobile,
        ownerName: enquiry.ownerName
      } : {
        id: body.enquiryId,
        name: 'Unknown Client',
        mobile: 'N/A'
      },
      uploadedBy: { name: 'Current User' }
    };
    
    // Store the document
    this.documents.push(newDocument);
    
    return {
      message: 'Document uploaded successfully',
      document: newDocument
    };
  }

  @Patch('documents/:id/verify')
  verifyDocument(@Param('id') id: string) {
    // Find and update the document
    const document = this.documents.find(d => d.id == parseInt(id));
    if (document) {
      document.verified = true;
      document.verifiedBy = { name: 'Current User' };
      document.verifiedAt = new Date();
    }

    return {
      message: 'Document verified successfully',
      document: document || {
        id: parseInt(id),
        verified: true,
        verifiedBy: 'Current User',
        verifiedAt: new Date()
      }
    };
  }

  @Delete('documents/:id')
  deleteDocument(@Param('id') id: string) {
    const documentIndex = this.documents.findIndex(d => d.id == parseInt(id));
    
    if (documentIndex === -1) {
      return { error: 'Document not found' };
    }

    const deletedDocument = this.documents[documentIndex];
    this.documents.splice(documentIndex, 1);

    return {
      message: 'Document deleted successfully',
      document: deletedDocument
    };
  }


  @Get('test/supabase-status')
  getSupabaseStatus() {
    return {
      message: 'Supabase integration ready',
      timestamp: new Date().toISOString(),
      endpoints: {
        uploadSupabase: '/api/mock/documents/upload-supabase',
        uploadRegular: '/api/mock/documents/upload'
      },
      features: {
        fileStorage: 'Supabase Storage',
        database: 'Supabase PostgreSQL',
        realTimeSync: 'Available'
      },
      documentsWithSupabase: this.documents.filter(d => (d as any).savedToSupabase).length,
      totalDocuments: this.documents.length
    };
  }

  @Get('debug/documents-info')
  getDocumentsDebugInfo() {
    return {
      documentsCount: this.documents.length,
      documentsInitialized: this.documentsInitialized,
      documentIds: this.documents.map(d => d.id),
      uploadedFilesCount: this.uploadedFiles.size,
      uploadedFileNames: Array.from(this.uploadedFiles.keys()),
      documents: this.documents.map(d => ({
        id: d.id,
        type: d.type,
        s3Url: d.s3Url,
        isUploaded: d.isUploaded,
        enquiry: d.enquiry.name
      }))
    };
  }

  @Get('documents/file/:filename')
  getDocumentFile(@Param('filename') filename: string, @Res() res: any) {
    console.log('File request received:', { 
      filename, 
      availableFiles: Array.from(this.uploadedFiles.keys()),
      totalFiles: this.uploadedFiles.size 
    });
    
    // Check if we have the uploaded file in memory
    const fileBuffer = this.uploadedFiles.get(filename);
    
    if (fileBuffer) {
      // Serve the actual uploaded PDF file
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': fileBuffer.length,
      });
      res.send(fileBuffer);
    } else {
      // Check if this is a sample document
      const uploadedDoc = this.documents.find(d => d.s3Url === filename);
      
      if (uploadedDoc && !uploadedDoc.isUploaded) {
        // For sample documents, redirect to a sample PDF
        res.redirect('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
      } else {
        // File not found
        res.status(404).json({
          error: 'File not found',
          filename: filename
        });
      }
    }
  }

  @Post('shortlist')
  createShortlist(@Body() body: any) {
    console.log('Shortlist request received:', body);
    
    // Check if already shortlisted
    const existingShortlist = this.shortlists.find(s => s.enquiryId === body.enquiryId);
    if (existingShortlist) {
      return {
        message: 'Client already in shortlist',
        shortlist: existingShortlist
      };
    }
    
    // Create new shortlist entry
    const newShortlist = {
      id: Math.floor(Math.random() * 1000) + 100,
      enquiryId: body.enquiryId,
      enquiryName: body.enquiryName,
      enquiryMobile: body.enquiryMobile,
      businessType: body.businessType,
      loanAmount: body.loanAmount,
      status: body.status || 'PENDING',
      remarks: body.remarks || 'Added from document management',
      shortlistedAt: new Date(),
      createdAt: new Date()
    };
    
    // Store in shortlists array
    this.shortlists.push(newShortlist);
    
    console.log('Shortlist created:', newShortlist);
    console.log('Total shortlists:', this.shortlists.length);
    
    return {
      message: 'Added to shortlist successfully',
      shortlist: newShortlist
    };
  }

  @Get('shortlist/:id')
  getShortlistById(@Param('id') id: string) {
    try {
      // Ensure shortlists are loaded first
      this.getShortlist();
      
      const shortlist = this.shortlists.find(s => s.id === parseInt(id));
      if (!shortlist) {
        return {
          error: 'Shortlist not found',
          message: `No shortlist found with ID ${id}`,
          id: parseInt(id)
        };
      }
      
      // Add enquiry details
      const enquiry = this.enquiries.find(e => e.id === shortlist.enquiryId);
      return {
        ...shortlist,
        enquiry: enquiry || {
          id: shortlist.enquiryId,
          name: shortlist.enquiryName || 'Unknown',
          mobile: shortlist.enquiryMobile || 'N/A'
        }
      };
    } catch (error) {
      return {
        error: 'Failed to fetch shortlist',
        message: error.message,
        id: parseInt(id)
      };
    }
  }

  @Patch('shortlist/:id')
  updateShortlist(@Param('id') id: string, @Body() body: any) {
    try {
      const shortlistIndex = this.shortlists.findIndex(s => s.id === parseInt(id));
      if (shortlistIndex === -1) {
        return {
          error: 'Shortlist not found',
          message: `No shortlist found with ID ${id}`,
          id: parseInt(id)
        };
      }
      
      // Update shortlist
      this.shortlists[shortlistIndex] = {
        ...this.shortlists[shortlistIndex],
        ...body,
        updatedAt: new Date()
      };
      
      return {
        message: 'Shortlist updated successfully',
        shortlist: this.shortlists[shortlistIndex]
      };
    } catch (error) {
      return {
        error: 'Failed to update shortlist',
        message: error.message,
        id: parseInt(id)
      };
    }
  }

  @Post('cashfree/apply')
  createPaymentGatewayApplication(@Body() body: any) {
    console.log('Payment gateway application request received:', body);
    
    // Get shortlist details
    const shortlist = this.shortlists.find(s => s.id === body.shortlistId);
    const enquiry = shortlist ? this.enquiries.find(e => e.id === shortlist.enquiryId) : null;
    
    // Create new payment gateway application
    const newApplication = {
      id: Math.floor(Math.random() * 1000) + 100,
      shortlistId: body.shortlistId,
      loanAmount: body.loanAmount,
      tenure: body.tenure,
      interestRate: body.interestRate,
      processingFee: body.processingFee,
      purpose: body.purpose,
      collateral: body.collateral,
      bankAccount: body.bankAccount,
      ifscCode: body.ifscCode,
      salarySlips: body.salarySlips,
      itrReturns: body.itrReturns,
      businessProof: body.businessProof,
      addressProof: body.addressProof,
      remarks: body.remarks,
      status: body.status || 'PENDING',
      submittedAt: new Date(),
      appliedAt: new Date(),
      createdAt: new Date(),
      shortlist: shortlist ? {
        id: shortlist.id,
        name: enquiry?.name || shortlist.enquiryName || 'Unknown',
        mobile: enquiry?.mobile || shortlist.enquiryMobile || 'N/A',
        businessName: enquiry?.businessType || shortlist.businessType || 'N/A',
        loanAmount: shortlist.loanAmount || body.loanAmount
      } : null,
      submittedBy: { name: 'Dinesh', id: 1 }
    };
    
    // Store the application
    this.paymentGatewayApplications.push(newApplication);
    
    // Mark the shortlist as having a payment gateway application
    if (shortlist) {
      shortlist.cashfreeApplication = newApplication;
      shortlist.hasPaymentGatewayApplication = true;
    }
    
    console.log('Payment gateway application created and stored:', newApplication);
    console.log('Total payment gateway applications:', this.paymentGatewayApplications.length);
    
    return {
      message: 'Payment gateway application submitted successfully',
      application: newApplication
    };
  }

  @Get('cashfree')
  getPaymentGatewayApplications() {
    // Ensure shortlists are loaded first to get updated data
    this.getShortlist();
    
    console.log('Current shortlists data:', this.shortlists);
    
    // Update existing applications with current shortlist data
    this.paymentGatewayApplications.forEach(app => {
      const currentShortlist = this.shortlists.find(s => s.id === app.shortlistId);
      console.log(`Updating app ${app.id} with shortlist ${app.shortlistId}:`, currentShortlist);
      
      if (currentShortlist && app.shortlist) {
        // Update the loan amount with current shortlist data
        app.shortlist.loanAmount = currentShortlist.loanAmount;
        app.shortlist.name = currentShortlist.name;
        app.shortlist.mobile = currentShortlist.mobile;
        app.shortlist.businessName = currentShortlist.businessName;
        app.shortlist.district = currentShortlist.district;
        
        console.log(`Updated app ${app.id} shortlist data:`, app.shortlist);
      }
    });
    
    // Add some sample data if no applications exist
    if (this.paymentGatewayApplications.length === 0) {
      this.paymentGatewayApplications.push(
        {
          id: 1,
          shortlistId: 1,
          loanAmount: 300000,
          tenure: 12,
          interestRate: 12.5,
          status: 'PENDING',
          submittedAt: new Date('2024-01-15'),
          appliedAt: new Date('2024-01-15'),
          shortlist: {
            id: 1,
            name: 'Appu Electronic Sales and Service',
            mobile: '9876543210',
            businessName: 'Electronics Sales and Service',
            loanAmount: 300000
          },
          submittedBy: { name: 'Dinesh', id: 1 }
        }
      );
    }
    
    return this.paymentGatewayApplications;
  }

  @Post('reset-shortlist')
  resetShortlist() {
    this.shortlists = [];
    this.shortlistsInitialized = false;
    return {
      message: 'Shortlist data reset successfully',
      timestamp: new Date()
    };
  }

  @Patch('cashfree/:id/status')
  updatePaymentGatewayStatus(@Param('id') id: string, @Body() body: any) {
    try {
      const applicationIndex = this.paymentGatewayApplications.findIndex(app => app.id === parseInt(id));
      
      if (applicationIndex === -1) {
        return {
          error: 'Payment gateway application not found',
          message: `No application found with ID ${id}`,
          id: parseInt(id)
        };
      }
      
      // Update application status
      this.paymentGatewayApplications[applicationIndex] = {
        ...this.paymentGatewayApplications[applicationIndex],
        status: body.status,
        decisionDate: new Date(),
        updatedAt: new Date()
      };
      
      return {
        message: 'Application status updated successfully',
        application: this.paymentGatewayApplications[applicationIndex]
      };
    } catch (error) {
      return {
        error: 'Failed to update application status',
        message: error.message,
        id: parseInt(id)
      };
    }
  }

  @Delete('shortlist/:id')
  deleteShortlist(@Param('id') id: string) {
    try {
      const shortlistIndex = this.shortlists.findIndex(s => s.id === parseInt(id));
      
      if (shortlistIndex === -1) {
        return {
          error: 'Shortlist not found',
          message: `No shortlist found with ID ${id}`,
          id: parseInt(id)
        };
      }

      const deletedShortlist = this.shortlists[shortlistIndex];
      this.shortlists.splice(shortlistIndex, 1);

      console.log(`Deleted shortlist ${id}:`, deletedShortlist.name);

      return {
        message: 'Shortlist deleted successfully',
        id: parseInt(id),
        deletedShortlist: deletedShortlist
      };
    } catch (error) {
      return {
        error: 'Failed to delete shortlist',
        message: error.message,
        id: parseInt(id)
      };
    }
  }

  @Delete('cashfree/:id')
  deleteCashfreeApplication(@Param('id') id: string) {
    try {
      const applicationIndex = this.paymentGatewayApplications.findIndex(app => app.id === parseInt(id));
      
      if (applicationIndex === -1) {
        return {
          error: 'Payment application not found',
          message: `No payment application found with ID ${id}`,
          id: parseInt(id)
        };
      }

      const deletedApplication = this.paymentGatewayApplications[applicationIndex];
      this.paymentGatewayApplications.splice(applicationIndex, 1);

      console.log(`🗑️ Deleted payment application ${id}:`, deletedApplication.shortlist?.name || 'Unknown Client');

      return {
        message: 'Payment application deleted successfully',
        id: parseInt(id),
        deletedApplication: {
          id: deletedApplication.id,
          clientName: deletedApplication.shortlist?.name || 'Unknown Client',
          loanAmount: deletedApplication.loanAmount
        }
      };
    } catch (error) {
      return {
        error: 'Failed to delete payment application',
        message: error.message,
        id: parseInt(id)
      };
    }
  }
}

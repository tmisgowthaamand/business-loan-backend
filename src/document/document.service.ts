import { Injectable, Logger, Optional } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { EnquiryService } from '../enquiry/enquiry.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly documentsFile = path.join(this.dataDir, 'documents.json');
  private documentsStorage: any[] = [];

  constructor(
    @Optional() private readonly notificationsService?: NotificationsService,
    @Optional() private readonly enquiryService?: EnquiryService,
  ) {
    this.initializeDocuments();
  }

  private async initializeDocuments() {
    this.logger.log('🔧 Initializing document service...');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Load existing documents from file
    await this.loadDocuments();

    // If no documents exist, create sample data
    if (this.documentsStorage.length === 0) {
      await this.createSampleDocuments();
    }

    this.logger.log(`✅ Document service initialized with ${this.documentsStorage.length} documents`);
  }

  private async loadDocuments() {
    try {
      if (fs.existsSync(this.documentsFile)) {
        const fileData = fs.readFileSync(this.documentsFile, 'utf8');
        this.documentsStorage = JSON.parse(fileData);
        this.logger.log(`📂 Loaded ${this.documentsStorage.length} documents from file`);
      }
    } catch (error) {
      this.logger.error('❌ Error loading documents from file:', error);
      this.documentsStorage = [];
    }
  }

  private async saveDocuments() {
    try {
      fs.writeFileSync(this.documentsFile, JSON.stringify(this.documentsStorage, null, 2));
      this.logger.log(`💾 Saved ${this.documentsStorage.length} documents to file`);
    } catch (error) {
      this.logger.error('❌ Error saving documents to file:', error);
    }
  }

  private async createSampleDocuments() {
    const sampleDocuments = [
      {
        id: 1,
        enquiryId: 1,
        type: 'GST',
        fileName: 'gst-certificate-balamurugan.pdf',
        filePath: '/uploads/documents/1729073400000-1-GST.pdf',
        verified: true,
        verifiedAt: new Date('2024-10-16T11:00:00.000Z').toISOString(),
        createdAt: new Date('2024-10-16T10:45:00.000Z').toISOString(),
        enquiry: { id: 1, name: 'BALAMURUGAN', mobile: '9876543215', businessType: 'Manufacturing' }
      },
      {
        id: 2,
        enquiryId: 1,
        type: 'UDYAM',
        fileName: 'udyam-certificate-balamurugan.pdf',
        filePath: '/uploads/documents/1729073460000-1-UDYAM.pdf',
        verified: true,
        verifiedAt: new Date('2024-10-16T11:05:00.000Z').toISOString(),
        createdAt: new Date('2024-10-16T10:50:00.000Z').toISOString(),
        enquiry: { id: 1, name: 'BALAMURUGAN', mobile: '9876543215', businessType: 'Manufacturing' }
      },
      {
        id: 3,
        enquiryId: 2,
        type: 'BANK_STATEMENT',
        fileName: 'bank-statement-vignesh.pdf',
        filePath: '/uploads/documents/1729073800000-2-BANK_STATEMENT.pdf',
        verified: false,
        createdAt: new Date('2024-10-15T14:25:00.000Z').toISOString(),
        enquiry: { id: 2, name: 'VIGNESH S', mobile: '9876543220', businessType: 'Trading' }
      }
    ];

    this.documentsStorage = sampleDocuments;
    await this.saveDocuments();
    this.logger.log(`✅ Created ${sampleDocuments.length} sample documents`);
  }

  async findAll() {
    return this.documentsStorage.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async create(createDocumentDto: any) {
    const newDocument = {
      id: Date.now(),
      ...createDocumentDto,
      verified: false,
      createdAt: new Date().toISOString(),
    };
    
    this.documentsStorage.push(newDocument);
    await this.saveDocuments();

    // Create notification for document upload
    if (this.notificationsService) {
      try {
        await this.notificationsService.createSystemNotification({
          type: 'DOCUMENT_UPLOADED',
          title: 'New Document Uploaded',
          message: `${createDocumentDto.type} uploaded by ${createDocumentDto.enquiry?.name || 'Client'} - requires verification`,
          priority: 'MEDIUM',
          data: {
            documentId: newDocument.id,
            enquiryId: createDocumentDto.enquiryId,
            clientName: createDocumentDto.enquiry?.name,
            documentType: createDocumentDto.type,
            fileName: createDocumentDto.fileName,
            uploadDate: newDocument.createdAt
          }
        });
      } catch (error) {
        this.logger.error('Failed to create document upload notification:', error);
      }
    }

    this.logger.log(`📄 Document uploaded: ${newDocument.fileName} for enquiry ${createDocumentDto.enquiryId}`);
    return newDocument;
  }

  async findOne(id: number) {
    return this.documentsStorage.find(doc => doc.id === id);
  }

  async verify(id: number, verified: boolean = true, verifiedBy?: string) {
    const document = this.documentsStorage.find(doc => doc.id === id);
    if (!document) {
      return null;
    }

    document.verified = verified;
    if (verified) {
      document.verifiedAt = new Date().toISOString();
      document.verifiedBy = verifiedBy || 'System';
    } else {
      delete document.verifiedAt;
      delete document.verifiedBy;
    }

    await this.saveDocuments();

    // Create notification for document verification
    if (this.notificationsService) {
      try {
        const notificationType = verified ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED';
        const title = verified ? 'Document Verified' : 'Document Rejected';
        const message = verified 
          ? `${document.type} verified for ${document.enquiry?.name || 'Client'} - ready for next step`
          : `${document.type} rejected for ${document.enquiry?.name || 'Client'} - requires resubmission`;

        await this.notificationsService.createSystemNotification({
          type: notificationType,
          title,
          message,
          priority: verified ? 'HIGH' : 'MEDIUM',
          data: {
            documentId: document.id,
            enquiryId: document.enquiryId,
            clientName: document.enquiry?.name,
            documentType: document.type,
            fileName: document.fileName,
            verified: verified,
            verifiedBy: verifiedBy || 'System',
            verifiedAt: document.verifiedAt
          }
        });
      } catch (error) {
        this.logger.error('Failed to create document verification notification:', error);
      }
    }

    this.logger.log(`📄 Document ${verified ? 'verified' : 'rejected'}: ${document.fileName}`);
    return document;
  }

  async remove(id: number) {
    const index = this.documentsStorage.findIndex(doc => doc.id === id);
    if (index !== -1) {
      const removed = this.documentsStorage.splice(index, 1);
      await this.saveDocuments();
      return removed[0];
    }
    return null;
  }

  // Get documents by enquiry ID
  async findByEnquiry(enquiryId: number) {
    return this.documentsStorage.filter(doc => doc.enquiryId === enquiryId);
  }

  // Get document verification status for an enquiry
  async getVerificationStatus(enquiryId: number) {
    const documents = await this.findByEnquiry(enquiryId);
    const total = documents.length;
    const verified = documents.filter(doc => doc.verified).length;
    const pending = total - verified;

    return {
      total,
      verified,
      pending,
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
      allVerified: total > 0 && verified === total
    };
  }
}

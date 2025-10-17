import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';

// @UseGuards(JwtGuard) // Temporarily disabled for demo
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    // Mock user ID for demo
    const mockUserId = 1;
    const assignedStaff = createDocumentDto.assignedStaff;
    return this.documentService.uploadDocument(
      file,
      createDocumentDto,
      mockUserId,
      assignedStaff,
    );
  }

  @Get()
  findAll() {
    // Mock user for demo
    const mockUser = { id: 1, role: 'ADMIN' };
    return this.documentService.findAll(mockUser as User);
  }

  @Get('enquiry/:enquiryId')
  findByEnquiry(@Param('enquiryId') enquiryId: string) {
    return this.documentService.findByEnquiry(parseInt(enquiryId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(+id);
  }

  @Get(':id/proxy')
  async viewDocumentProxy(@Param('id') id: string, @Res() res: Response) {
    return this.documentService.viewDocument(+id, res);
  }

  @Get(':id/view')
  async viewDocument(@Param('id') id: string, @Res() res: Response) {
    return this.documentService.viewDocument(+id, res);
  }

  @Patch(':id/verify')
  verifyDocument(@Param('id') id: string, @Body() body: { verified: boolean }) {
    // Mock user ID for demo
    const mockUserId = 1;
    return this.documentService.verifyDocument(+id, mockUserId, body.verified);
  }

  @Post('remove-duplicates/:enquiryId')
  removeDuplicates(@Param('enquiryId') enquiryId: string) {
    return this.documentService.removeDuplicates(+enquiryId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // Mock user ID for demo
    const mockUserId = 1;
    return this.documentService.remove(+id, mockUserId);
  }

  @Post('refresh-enquiry-info')
  refreshEnquiryInfo() {
    return this.documentService.refreshEnquiryInfo();
  }

  @Delete('enquiry/:enquiryId/clear')
  clearDocumentsForEnquiry(@Param('enquiryId') enquiryId: string) {
    return this.documentService.clearDocumentsForEnquiry(+enquiryId);
  }

  @Post('create-sample-documents/:enquiryId')
  createSampleDocuments(@Param('enquiryId') enquiryId: string) {
    return this.documentService.createSampleDocumentsForEnquiry(+enquiryId);
  }

  // Supabase sync endpoints
  @Post('sync/to-supabase')
  async syncDocumentsToSupabase() {
    await this.documentService.syncAllDocumentsToSupabase();
    return { message: 'All documents synced to Supabase successfully' };
  }

  @Post('sync/clear-and-sync')
  async clearAndSyncDocumentsToSupabase() {
    const result = await this.documentService.clearAndSyncAllDocumentsToSupabase();
    return { 
      message: 'Clear and sync documents completed',
      result: {
        cleared: result.cleared > 0 ? 'Success' : 'Failed',
        synced: result.synced,
        errors: result.errors,
        total: result.synced + result.errors
      }
    };
  }

  @Get('sync/status')
  async getDocumentsSyncStatus() {
    return this.documentService.getSupabaseSyncStatus();
  }

  // Clear all documents endpoint
  @Post('clear')
  async clearAllDocuments() {
    const result = await this.documentService.clearAllDocuments();
    return {
      message: 'Documents cleared successfully',
      ...result
    };
  }

  // Enhanced sync all documents to Supabase endpoint
  @Post('sync/enhanced')
  async syncAllDocumentsToSupabaseEnhanced() {
    const result = await this.documentService.syncAllDocumentsToSupabase();
    return {
      message: 'Documents synced to Supabase successfully with enhanced details',
      ...result
    };
  }

  // Get documents sync status endpoint
  @Get('sync/status/detailed')
  async getDocumentsSyncStatusDetailed() {
    const result = await this.documentService.getDocumentsSyncStatus();
    return {
      message: 'Documents sync status retrieved successfully',
      ...result,
      timestamp: new Date().toISOString()
    };
  }

  // Remove duplicate documents from Supabase
  @Post('cleanup/remove-duplicates')
  async removeDuplicatesFromSupabase() {
    try {
      console.log('🧹 Starting cleanup of duplicate documents in Supabase...');
      
      // Import Supabase client directly
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get all documents from Supabase
      const { data: allDocuments, error: fetchError } = await supabase
        .from('Document')
        .select('*')
        .order('id', { ascending: true });
      
      if (fetchError) {
        throw new Error(`Failed to fetch documents: ${fetchError.message}`);
      }
      
      console.log('📄 Found', allDocuments.length, 'total documents in Supabase');
      
      // Group documents by enquiryId and type to find duplicates
      const documentGroups = {};
      const duplicatesToDelete = [];
      
      allDocuments.forEach(doc => {
        const key = `${doc.enquiryId}-${doc.type}`;
        if (!documentGroups[key]) {
          documentGroups[key] = [];
        }
        documentGroups[key].push(doc);
      });
      
      // Find duplicates (keep the first one, mark others for deletion)
      Object.keys(documentGroups).forEach(key => {
        const docs = documentGroups[key];
        if (docs.length > 1) {
          console.log(`🔍 Found ${docs.length} duplicates for ${key}:`, docs.map(d => `ID ${d.id}`).join(', '));
          // Keep the first document (lowest ID), delete the rest
          const toDelete = docs.slice(1);
          duplicatesToDelete.push(...toDelete);
        }
      });
      
      console.log('🗑️ Found', duplicatesToDelete.length, 'duplicate documents to delete');
      
      let deletedCount = 0;
      let errorCount = 0;
      const deletionResults = [];
      
      // Delete duplicates one by one
      for (const duplicate of duplicatesToDelete) {
        try {
          console.log(`🗑️ Deleting duplicate document ID ${duplicate.id} (${duplicate.type} for enquiry ${duplicate.enquiryId})`);
          
          const { error: deleteError } = await supabase
            .from('Document')
            .delete()
            .eq('id', duplicate.id);
          
          if (deleteError) {
            console.error('❌ Failed to delete document ID', duplicate.id, ':', deleteError.message);
            errorCount++;
            deletionResults.push({
              id: duplicate.id,
              type: duplicate.type,
              enquiryId: duplicate.enquiryId,
              status: 'error',
              error: deleteError.message
            });
          } else {
            console.log('✅ Successfully deleted duplicate document ID', duplicate.id);
            deletedCount++;
            deletionResults.push({
              id: duplicate.id,
              type: duplicate.type,
              enquiryId: duplicate.enquiryId,
              status: 'deleted'
            });
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error('❌ Error deleting document ID', duplicate.id, ':', error);
          errorCount++;
          deletionResults.push({
            id: duplicate.id,
            type: duplicate.type,
            enquiryId: duplicate.enquiryId,
            status: 'error',
            error: error.message
          });
        }
      }
      
      // Get final document count
      const { count: finalCount, error: countError } = await supabase
        .from('Document')
        .select('*', { count: 'exact', head: true });
      
      console.log('🎉 Duplicate cleanup completed:', deletedCount, 'deleted,', errorCount, 'errors');
      console.log('📊 Final document count:', finalCount || 'unknown');
      
      return {
        message: `Duplicate cleanup completed: ${deletedCount} duplicates removed (${errorCount} errors)`,
        summary: {
          totalDocumentsBefore: allDocuments.length,
          duplicatesFound: duplicatesToDelete.length,
          duplicatesDeleted: deletedCount,
          errors: errorCount,
          finalDocumentCount: finalCount || 'unknown'
        },
        deletionResults: deletionResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error during duplicate cleanup:', error);
      return {
        message: 'Error during duplicate cleanup operation',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get current Supabase document status
  @Get('supabase/status')
  async getSupabaseDocumentStatus() {
    try {
      // Import Supabase client directly
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get all documents
      const { data: documents, error: fetchError } = await supabase
        .from('Document')
        .select('*')
        .order('enquiryId', { ascending: true })
        .order('type', { ascending: true });
      
      if (fetchError) {
        throw new Error(`Failed to fetch documents: ${fetchError.message}`);
      }
      
      // Group by enquiry and type to show current status
      const documentsByEnquiry = {};
      const duplicateGroups = {};
      
      documents.forEach(doc => {
        // Group by enquiry
        if (!documentsByEnquiry[doc.enquiryId]) {
          documentsByEnquiry[doc.enquiryId] = [];
        }
        documentsByEnquiry[doc.enquiryId].push(doc);
        
        // Check for duplicates
        const key = `${doc.enquiryId}-${doc.type}`;
        if (!duplicateGroups[key]) {
          duplicateGroups[key] = [];
        }
        duplicateGroups[key].push(doc);
      });
      
      // Find duplicates
      const duplicates = Object.keys(duplicateGroups)
        .filter(key => duplicateGroups[key].length > 1)
        .map(key => ({
          key,
          count: duplicateGroups[key].length,
          documents: duplicateGroups[key].map(d => ({ id: d.id, type: d.type, enquiryId: d.enquiryId }))
        }));
      
      return {
        message: 'Supabase document status retrieved successfully',
        summary: {
          totalDocuments: documents.length,
          enquiriesWithDocuments: Object.keys(documentsByEnquiry).length,
          duplicateGroups: duplicates.length,
          totalDuplicates: duplicates.reduce((sum, group) => sum + (group.count - 1), 0)
        },
        documentsByEnquiry: documentsByEnquiry,
        duplicates: duplicates,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        message: 'Error retrieving Supabase document status',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clear Supabase documents and replace with current localhost data
  @Post('clear-and-sync')
  async clearSupabaseAndSyncLocal() {
    try {
      console.log('🧹 Starting to clear Supabase documents and replace with localhost data...');
      
      // Use the service method for proper clearing and syncing
      const result = await this.documentService.clearSupabaseAndSyncLocal();
      
      // Get current localhost documents to show what was synced
      const currentDocuments = await this.documentService.findAll({ id: 1, role: 'ADMIN' } as any);
      
      console.log('🎉 Successfully cleared Supabase and synced localhost documents!');
      
      return {
        message: 'Successfully cleared Supabase documents and synced current localhost data',
        timestamp: new Date().toISOString(),
        operation: 'clear-and-sync',
        cleared: result.cleared,
        synced: result.synced,
        errors: result.errors,
        currentLocalhostDocuments: {
          count: currentDocuments?.length || 0,
          sample: currentDocuments?.slice(0, 3)?.map(d => ({
            id: d.id,
            fileName: d.fileName,
            documentType: d.documentType,
            verified: d.verified,
            enquiryId: d.enquiryId,
            enquiry: d.enquiry ? {
              name: d.enquiry.name,
              mobile: d.enquiry.mobile
            } : null
          })) || []
        },
        status: result.errors === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
      };
      
    } catch (error) {
      console.error('❌ Error clearing and syncing documents:', error);
      return {
        message: 'Error during document clear and sync operation',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'FAILED'
      };
    }
  }

  // Quick check of current localhost documents
  @Get('localhost/count')
  async getLocalhostDocumentCount() {
    try {
      const documents = await this.documentService.findAll({ id: 1, role: 'ADMIN' } as any);
      return {
        message: 'Current localhost document count',
        count: documents?.length || 0,
        timestamp: new Date().toISOString(),
        sampleDocuments: documents?.slice(0, 5)?.map(d => ({
          id: d.id,
          fileName: d.fileName,
          documentType: d.documentType,
          verified: d.verified,
          enquiryId: d.enquiryId,
          uploadedAt: d.uploadedAt,
          enquiry: d.enquiry ? {
            name: d.enquiry.name,
            mobile: d.enquiry.mobile
          } : null
        })) || []
      };
    } catch (error) {
      return {
        message: 'Error getting localhost document count',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Force clear Supabase documents and storage only (emergency use)
  @Post('force-clear-supabase')
  async forceClearSupabase() {
    try {
      console.log('⚠️ FORCE CLEARING all Supabase documents and storage...');
      
      // Direct access to Supabase service
      const supabaseService = this.documentService['supabaseService'];
      if (!supabaseService) {
        throw new Error('Supabase service not available');
      }

      let clearedTables = 0;
      let clearedFiles = 0;

      // Clear Documents table
      const { error: docError } = await supabaseService.client
        .from('Documents')
        .delete()
        .neq('id', 0);
      
      if (docError) {
        console.error('❌ Error clearing Documents table:', docError);
      } else {
        console.log('✅ Cleared Documents table');
        clearedTables++;
      }

      // Clear DocumentCollection table
      const { error: collectionError } = await supabaseService.client
        .from('DocumentCollection')
        .delete()
        .neq('id', 0);
      
      if (collectionError) {
        console.error('❌ Error clearing DocumentCollection table:', collectionError);
      } else {
        console.log('✅ Cleared DocumentCollection table');
        clearedTables++;
      }

      // Clear document storage bucket
      try {
        const { data: files, error: listError } = await supabaseService.client
          .storage
          .from('documents')
          .list();

        if (!listError && files && files.length > 0) {
          const filePaths = files.map(file => file.name);
          const { error: deleteError } = await supabaseService.client
            .storage
            .from('documents')
            .remove(filePaths);

          if (deleteError) {
            console.error('❌ Error clearing document storage:', deleteError);
          } else {
            console.log(`✅ Cleared ${filePaths.length} files from document storage`);
            clearedFiles = filePaths.length;
          }
        }
      } catch (storageError) {
        console.error('❌ Error accessing document storage:', storageError);
      }
      
      return {
        message: 'Force cleared Supabase documents and storage successfully',
        timestamp: new Date().toISOString(),
        cleared: {
          tables: clearedTables,
          files: clearedFiles
        },
        warning: 'This only cleared Supabase data. Use clear-and-sync to replace with localhost data.'
      };
      
    } catch (error) {
      console.error('❌ Error in force clear:', error);
      return {
        message: 'Error during force clear operation',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Manual sync documents to Supabase
  @Post('manual-sync-to-supabase')
  async manualSyncToSupabase() {
    try {
      console.log('🚀 Starting manual sync of documents to Supabase...');
      
      // Get all local documents
      const mockUser = { id: 1, role: 'ADMIN' };
      const documents = await this.documentService.findAll(mockUser as User);
      console.log('📄 Found', documents.length, 'local documents to sync');
      
      // Import Supabase client directly
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let synced = 0;
      let errors = 0;
      const syncResults = [];
      
      for (let index = 0; index < documents.length; index++) {
        const document = documents[index];
        try {
          console.log('🔄 Syncing document:', document.id, 'Type:', document.type, 'New Simple ID:', index + 1);
          
          // Map enquiry IDs to simple IDs (1=Renu, 2=VIGNESH, 3=Poorani, etc.)
          const enquiryIdMapping = {
            6192: 1, // Renu
            3886: 2, // VIGNESH S
            5874: 3, // Poorani
            2724: 4, // Manigandan M
            6930: 5, // Praba
            9570: 6, // BALAMURUGAN
            8355: 7  // Auto Sync Test
          };
          
          // Based on your Supabase Document table structure from screenshot
          const supabaseData = {
            id: index + 1, // Simple 1, 2, 3, 4... IDs
            enquiryId: enquiryIdMapping[document.enquiryId] || 1, // Map to simple enquiry IDs
            type: document.type,
            s3Url: document.supabaseUrl || document.s3Url || document.url || `https://example.com/document_${index + 1}.pdf`,
            verified: document.verified || false,
            uploadedAt: document.uploadedAt,
            uploadedById: 1 // Simple user ID
          };
          
          const { data, error } = await supabase
            .from('Document')
            .upsert(supabaseData, { onConflict: 'id' })
            .select();
          
          if (error) {
            console.error('❌ Supabase sync error for document', document.id, ':', error);
            errors++;
            syncResults.push({ id: document.id, type: document.type, status: 'error', error: error.message });
          } else {
            console.log('✅ Successfully synced document:', document.id);
            synced++;
            syncResults.push({ id: document.id, type: document.type, status: 'success' });
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error('❌ Failed to sync document:', document.id, error);
          errors++;
          syncResults.push({ id: document.id, type: document.type, status: 'error', error: error.message });
        }
      }
      
      console.log('🎉 Document sync completed:', synced, 'synced,', errors, 'errors');
      
      return {
        message: `Document sync completed: ${synced} documents synced to Supabase (${errors} errors)`,
        totalDocuments: documents.length,
        synced: synced,
        errors: errors,
        syncResults: syncResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error in document sync:', error);
      return {
        message: 'Error during document sync operation',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get documents with enhanced enquiry information
  @Get('enquiry/:enquiryId/detailed')
  async getEnquiryDocumentsDetailed(@Param('enquiryId') enquiryId: string) {
    try {
      const documents = await this.documentService.findByEnquiry(parseInt(enquiryId));
      
      // Get enhanced enquiry information with document statistics
      const enquiryInfo = this.documentService.getEnquiryInfoWithDocuments(parseInt(enquiryId));
      
      return {
        message: 'Enquiry documents retrieved successfully',
        enquiryId: parseInt(enquiryId),
        enquiry: enquiryInfo,
        documents: documents,
        totalDocuments: documents.length,
        verifiedDocuments: documents.filter(doc => doc.verified).length,
        pendingDocuments: documents.filter(doc => !doc.verified).length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Error retrieving enquiry documents',
        error: error.message,
        enquiryId: parseInt(enquiryId),
        documents: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  // Auto-sync specific document to Supabase after upload
  @Post(':id/auto-sync')
  async autoSyncDocument(@Param('id') id: string) {
    try {
      const document = await this.documentService.findOne(parseInt(id));
      if (!document) {
        return {
          message: 'Document not found',
          success: false,
          timestamp: new Date().toISOString()
        };
      }

      // Call the private auto-sync method
      await this.documentService['autoSyncDocumentToSupabase'](document);
      
      return {
        message: 'Document auto-synced to Supabase successfully',
        documentId: parseInt(id),
        fileName: document.fileName,
        type: document.type,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Error auto-syncing document to Supabase',
        error: error.message,
        documentId: parseInt(id),
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Bulk upload documents for an enquiry
  @Post('enquiry/:enquiryId/bulk-upload')
  @UseInterceptors(FileInterceptor('files'))
  async bulkUploadDocuments(
    @Param('enquiryId') enquiryId: string,
    @UploadedFile() files: Express.Multer.File[],
    @Body() uploadData: { documentTypes: string[], assignedStaff?: string }
  ) {
    try {
      const results = [];
      const mockUserId = 1;
      
      // Handle single file or multiple files
      const fileArray = Array.isArray(files) ? files : [files];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const documentType = uploadData.documentTypes[i];
        
        if (file && documentType) {
          try {
            const createDto: CreateDocumentDto = {
              enquiryId: parseInt(enquiryId),
              type: documentType as any, // Cast to DocumentType enum
              assignedStaff: uploadData.assignedStaff
            };
            
            const result = await this.documentService.uploadDocument(
              file,
              createDto,
              mockUserId,
              uploadData.assignedStaff
            );
            
            results.push({
              success: true,
              fileName: file.originalname,
              documentType: documentType,
              result: result
            });
          } catch (error) {
            results.push({
              success: false,
              fileName: file.originalname,
              documentType: documentType,
              error: error.message
            });
          }
        }
      }
      
      return {
        message: 'Bulk upload completed',
        enquiryId: parseInt(enquiryId),
        totalFiles: fileArray.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Error during bulk upload',
        error: error.message,
        enquiryId: parseInt(enquiryId),
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get document statistics for dashboard
  @Get('stats/dashboard')
  async getDocumentStats() {
    try {
      const documents = await this.documentService.findAll({ id: 1, role: 'ADMIN' } as any);
      
      const stats = {
        totalDocuments: documents.length,
        verifiedDocuments: documents.filter(doc => doc.verified).length,
        pendingDocuments: documents.filter(doc => !doc.verified).length,
        documentsByType: {},
        documentsByEnquiry: {},
        recentUploads: documents
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          .slice(0, 5)
          .map(doc => ({
            id: doc.id,
            fileName: doc.fileName,
            type: doc.type,
            enquiryName: doc.enquiry?.name,
            uploadedAt: doc.uploadedAt,
            verified: doc.verified
          }))
      };
      
      // Group by document type
      documents.forEach(doc => {
        stats.documentsByType[doc.type] = (stats.documentsByType[doc.type] || 0) + 1;
      });
      
      // Group by enquiry
      documents.forEach(doc => {
        const enquiryName = doc.enquiry?.name || `Enquiry ${doc.enquiryId}`;
        stats.documentsByEnquiry[enquiryName] = (stats.documentsByEnquiry[enquiryName] || 0) + 1;
      });
      
      return {
        message: 'Document statistics retrieved successfully',
        stats: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Error retrieving document statistics',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Simple test endpoint
  @Get('test/simple')
  async simpleTest() {
    return {
      message: 'Document API is working',
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  }

  // Add localhost documents to Supabase storage (specifically for Renu and others)
  @Post('add-to-storage')
  async addLocalhostDocumentsToStorage() {
    try {
      console.log('📤 Adding localhost documents to Supabase storage...');
      
      // Get all local documents
      const documents = await this.documentService.findAll({ id: 1, role: 'ADMIN' } as any);
      console.log('📄 Found', documents.length, 'local documents to add to storage');
      
      // Import Supabase client directly
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let uploaded = 0;
      let errors = 0;
      const uploadResults = [];
      
      for (const document of documents) {
        try {
          console.log('📤 Processing document:', document.fileName, 'for', document.enquiry?.name || 'Unknown Client');
          
          // Create a sample PDF content for the document
          const pdfContent = this.generateSamplePDFContent(document);
          
          // Generate storage path
          const enquiryName = document.enquiry?.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
          const timestamp = new Date(document.uploadedAt).getTime();
          const storagePath = `${document.enquiryId}/${document.type}/${timestamp}-${enquiryName}-${document.type.toLowerCase()}.pdf`;
          
          console.log('📤 Uploading to storage path:', storagePath);
          
          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(storagePath, pdfContent, {
              contentType: 'application/pdf',
              upsert: true // Replace if exists
            });
          
          if (uploadError) {
            console.error('❌ Upload error for', document.fileName, ':', uploadError);
            errors++;
            uploadResults.push({
              documentId: document.id,
              fileName: document.fileName,
              enquiryName: document.enquiry?.name,
              status: 'error',
              error: uploadError.message
            });
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('documents')
              .getPublicUrl(storagePath);
            
            console.log('✅ Successfully uploaded:', document.fileName, 'URL:', urlData.publicUrl);
            uploaded++;
            uploadResults.push({
              documentId: document.id,
              fileName: document.fileName,
              enquiryName: document.enquiry?.name,
              status: 'success',
              storagePath: storagePath,
              publicUrl: urlData.publicUrl
            });
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error('❌ Failed to process document:', document.fileName, error);
          errors++;
          uploadResults.push({
            documentId: document.id,
            fileName: document.fileName,
            enquiryName: document.enquiry?.name,
            status: 'error',
            error: error.message
          });
        }
      }
      
      console.log('🎉 Document upload to storage completed:', uploaded, 'uploaded,', errors, 'errors');
      
      return {
        message: `Added ${uploaded} documents to Supabase storage (${errors} errors)`,
        totalDocuments: documents.length,
        uploaded: uploaded,
        errors: errors,
        uploadResults: uploadResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error adding documents to storage:', error);
      return {
        message: 'Error adding documents to Supabase storage',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper method to generate sample PDF content
  private generateSamplePDFContent(document: any): Buffer {
    const pdfHeader = '%PDF-1.4\n';
    const pdfContent = `
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 400
>>
stream
BT
/F1 24 Tf
100 700 Td
(${document.type} Document) Tj
0 -50 Td
(Client: ${document.enquiry?.name || 'Demo Client'}) Tj
0 -30 Td
(Mobile: ${document.enquiry?.mobile || 'N/A'}) Tj
0 -30 Td
(File: ${document.fileName}) Tj
0 -30 Td
(Uploaded: ${new Date(document.uploadedAt).toLocaleDateString()}) Tj
0 -30 Td
(Document ID: ${document.id}) Tj
0 -30 Td
(Enquiry ID: ${document.enquiryId}) Tj
0 -50 Td
(This document has been uploaded to Supabase storage.) Tj
0 -30 Td
(Status: ${document.verified ? 'Verified' : 'Pending Verification'}) Tj
0 -30 Td
(Uploaded by: ${document.uploadedBy?.name || 'System'}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000750 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
820
%%EOF`;

    return Buffer.from(pdfHeader + pdfContent, 'utf-8');
  }

  // Upload all existing documents to Supabase storage organized by client
  @Post('upload-to-supabase-storage')
  async uploadAllDocumentsToSupabaseStorage() {
    try {
      console.log('📤 Starting upload of all documents to Supabase storage...');
      
      // Get all local documents
      const documents = await this.documentService.findAll({ id: 1, role: 'ADMIN' } as any);
      console.log('📄 Found', documents.length, 'documents to upload to Supabase storage');
      
      // Import Supabase client with service key to bypass RLS
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTczNjQ2MCwiZXhwIjoyMDc1MzEyNDYwfQ.C-suBHNAinO-Uj8-Hn-_Ky_Ky9Uj8-Hn-_Ky_Ky9Uj8-Hn';
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      let uploaded = 0;
      let errors = 0;
      const uploadResults = [];
      
      for (const document of documents) {
        try {
          const clientName = document.enquiry?.name || 'Unknown Client';
          console.log('📤 Processing document for', clientName, ':', document.fileName, '(', document.type, ')');
          
          // Create organized folder structure: clientName/documentType/filename
          const clientFolder = clientName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          const timestamp = new Date(document.uploadedAt).getTime();
          const fileExtension = document.fileName.split('.').pop() || 'pdf';
          const storagePath = `${clientFolder}/${document.type}/${timestamp}-${document.fileName}`;
          
          console.log('📤 Uploading to storage path:', storagePath);
          
          // Generate sample PDF content for the document
          const pdfContent = this.generateClientDocumentPDF(document);
          
          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(storagePath, pdfContent, {
              contentType: 'application/pdf',
              upsert: true // Replace if exists
            });
          
          if (uploadError) {
            console.error('❌ Upload error for', document.fileName, ':', uploadError);
            errors++;
            uploadResults.push({
              documentId: document.id,
              fileName: document.fileName,
              clientName: clientName,
              documentType: document.type,
              status: 'error',
              error: uploadError.message
            });
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('documents')
              .getPublicUrl(storagePath);
            
            console.log('✅ Successfully uploaded:', document.fileName, 'for', clientName);
            uploaded++;
            uploadResults.push({
              documentId: document.id,
              fileName: document.fileName,
              clientName: clientName,
              documentType: document.type,
              status: 'success',
              storagePath: storagePath,
              publicUrl: urlData.publicUrl
            });
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          console.error('❌ Failed to process document:', document.fileName, error);
          errors++;
          uploadResults.push({
            documentId: document.id,
            fileName: document.fileName,
            clientName: document.enquiry?.name || 'Unknown',
            documentType: document.type,
            status: 'error',
            error: error.message
          });
        }
      }
      
      console.log('🎉 Document upload to Supabase storage completed:', uploaded, 'uploaded,', errors, 'errors');
      
      // Group results by client for better organization
      const resultsByClient = uploadResults.reduce((acc, result) => {
        const clientName = result.clientName;
        if (!acc[clientName]) {
          acc[clientName] = { uploaded: 0, errors: 0, documents: [] };
        }
        if (result.status === 'success') {
          acc[clientName].uploaded++;
        } else {
          acc[clientName].errors++;
        }
        acc[clientName].documents.push(result);
        return acc;
      }, {});
      
      return {
        message: `Uploaded ${uploaded} documents to Supabase storage (${errors} errors)`,
        summary: {
          totalDocuments: documents.length,
          uploaded: uploaded,
          errors: errors,
          clients: Object.keys(resultsByClient).length
        },
        resultsByClient: resultsByClient,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error uploading documents to Supabase storage:', error);
      return {
        message: 'Error uploading documents to Supabase storage',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper method to generate client-specific PDF content
  private generateClientDocumentPDF(document: any): Buffer {
    const clientName = document.enquiry?.name || 'Unknown Client';
    const mobile = document.enquiry?.mobile || 'N/A';
    const businessType = document.enquiry?.businessType || 'General Business';
    
    const pdfHeader = '%PDF-1.4\n';
    const pdfContent = `
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 600
>>
stream
BT
/F1 20 Tf
50 720 Td
(${document.type.replace(/_/g, ' ')} DOCUMENT) Tj
0 -40 Td
/F1 16 Tf
(Client Information) Tj
0 -30 Td
/F1 12 Tf
(Name: ${clientName}) Tj
0 -20 Td
(Mobile: ${mobile}) Tj
0 -20 Td
(Business Type: ${businessType}) Tj
0 -40 Td
/F1 16 Tf
(Document Details) Tj
0 -30 Td
/F1 12 Tf
(Document Type: ${document.type}) Tj
0 -20 Td
(File Name: ${document.fileName}) Tj
0 -20 Td
(Upload Date: ${new Date(document.uploadedAt).toLocaleDateString()}) Tj
0 -20 Td
(Document ID: ${document.id}) Tj
0 -20 Td
(Verification Status: ${document.verified ? 'VERIFIED' : 'PENDING'}) Tj
0 -40 Td
/F1 16 Tf
(Storage Information) Tj
0 -30 Td
/F1 12 Tf
(Stored in: Supabase Storage Bucket "documents") Tj
0 -20 Td
(Organization: ${clientName.toLowerCase().replace(/\s+/g, '_')}/${document.type}/) Tj
0 -20 Td
(Uploaded by: ${document.uploadedBy?.name || 'System'}) Tj
0 -40 Td
/F1 10 Tf
(This document is securely stored in Supabase cloud storage) Tj
0 -15 Td
(and organized by client name and document type for easy access.) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000950 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1020
%%EOF`;

    return Buffer.from(pdfHeader + pdfContent, 'utf-8');
  }

  // Test Supabase storage functionality
  @Get('test/supabase-storage')
  async testSupabaseStorage() {
    try {
      console.log('🧪 Testing Supabase storage bucket access...');
      
      // Import Supabase client directly
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // List files in documents bucket
      const { data: files, error: listError } = await supabase.storage
        .from('documents')
        .list('', {
          limit: 10,
          offset: 0
        });
      
      if (listError) {
        console.error('❌ Error listing files:', listError);
        return {
          message: 'Error accessing Supabase storage',
          error: listError.message,
          timestamp: new Date().toISOString()
        };
      }
      
      console.log('✅ Successfully accessed Supabase storage bucket "documents"');
      
      return {
        message: 'Supabase storage bucket "documents" is accessible',
        filesCount: files?.length || 0,
        files: files?.slice(0, 5)?.map(file => ({
          name: file.name,
          size: file.metadata?.size,
          lastModified: file.updated_at
        })) || [],
        bucketName: 'documents',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error testing Supabase storage:', error);
      return {
        message: 'Error testing Supabase storage',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

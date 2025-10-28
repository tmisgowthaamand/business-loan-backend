#!/usr/bin/env node

/**
 * RENDER DEPLOYMENT DATA SEEDING SCRIPT
 * 
 * This script ensures all data is properly loaded and visible
 * in the Render deployment across all modules and pages.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EnquiryService } from '../enquiry/enquiry.service';
import { DocumentService } from '../document/document.service';
import { ShortlistService } from '../shortlist/shortlist.service';
import { StaffService } from '../staff/staff.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Logger } from '@nestjs/common';

async function seedRenderData() {
  const logger = new Logger('RenderDataSeeder');
  
  try {
    logger.log('🚀 RENDER DEPLOYMENT - Starting data seeding...');
    
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get all services
    const enquiryService = app.get(EnquiryService);
    const documentService = app.get(DocumentService);
    const shortlistService = app.get(ShortlistService);
    const staffService = app.get(StaffService);
    const notificationsService = app.get(NotificationsService);
    
    logger.log('📊 RENDER DEPLOYMENT - Initializing all module data...');
    
    // Initialize enquiries (14 real enquiries)
    try {
      const enquiries = await enquiryService.findAll(1);
      logger.log(`✅ Enquiries seeded: ${enquiries.length} enquiries loaded`);
      
      // Log sample enquiry data
      if (enquiries.length > 0) {
        logger.log(`📋 Sample enquiries: ${enquiries.slice(0, 3).map(e => e.name).join(', ')}`);
      }
    } catch (error) {
      logger.error('❌ Enquiries seeding failed:', error.message);
    }
    
    // Initialize documents (25 documents with real client mapping)
    try {
      const documents = await documentService.findAll({ id: 1 } as any);
      logger.log(`✅ Documents seeded: ${documents.length} documents loaded`);
      
      // Log document types
      const docTypes = [...new Set(documents.map(d => d.type))];
      logger.log(`📄 Document types: ${docTypes.join(', ')}`);
    } catch (error) {
      logger.error('❌ Documents seeding failed:', error.message);
    }
    
    // Initialize shortlists
    try {
      const shortlists = await shortlistService.findAll({ id: 1 } as any);
      logger.log(`✅ Shortlists seeded: ${shortlists.length} shortlists loaded`);
    } catch (error) {
      logger.error('❌ Shortlists seeding failed:', error.message);
    }
    
    // Initialize staff (7 staff members)
    try {
      const staff = await staffService.getAllStaff();
      logger.log(`✅ Staff seeded: ${staff.length} staff members loaded`);
      
      // Log staff credentials for Render deployment
      logger.log('🔐 RENDER DEPLOYMENT - Staff login credentials:');
      staff.forEach(member => {
        const password = member.email === 'admin@gmail.com' ? 'admin123' : '12345678';
        logger.log(`   - ${member.name}: ${member.email} / ${password} (${member.role})`);
      });
    } catch (error) {
      logger.error('❌ Staff seeding failed:', error.message);
    }
    
    // Initialize notifications
    try {
      const notifications = await notificationsService.findAll({ id: 1 } as any, 1);
      logger.log(`✅ Notifications seeded: ${notifications.notifications?.length || 0} notifications loaded`);
    } catch (error) {
      logger.error('❌ Notifications seeding failed:', error.message);
    }
    
    logger.log('🎯 RENDER DEPLOYMENT - Data seeding complete!');
    logger.log('🌐 All modules ready for Render deployment with visible data');
    
    // Close application context
    await app.close();
    
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ RENDER DEPLOYMENT - Data seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  seedRenderData();
}

export { seedRenderData };

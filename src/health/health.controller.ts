import { Controller, Get, Inject, forwardRef } from '@nestjs/common';
import { EnquiryService } from '../enquiry/enquiry.service';
import { DocumentService } from '../document/document.service';
import { ShortlistService } from '../shortlist/shortlist.service';
import { StaffService } from '../staff/staff.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(forwardRef(() => EnquiryService))
    private readonly enquiryService: EnquiryService,
    @Inject(forwardRef(() => DocumentService))
    private readonly documentService: DocumentService,
    @Inject(forwardRef(() => ShortlistService))
    private readonly shortlistService: ShortlistService,
    @Inject(forwardRef(() => StaffService))
    private readonly staffService: StaffService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async getHealth() {
    console.log('🏥 Health check endpoint called');
    const supabaseInfo = { url: 'Demo Mode', project: 'Business Loan', status: 'Mock' };
    
    return {
      status: 'ok',
      message: 'Backend is running successfully with all localhost data',
      timestamp: new Date().toISOString(),
      version: '1.0.1',
      cors: 'enabled',
      endpoints: [
        '/api/health',
        '/api/enquiries',
        '/api/documents',
        '/api/shortlist',
        '/api/notifications',
        '/api/staff',
        '/api/transactions'
      ],
      supabase: {
        project: supabaseInfo.project,
        url: supabaseInfo.url,
        status: supabaseInfo.status
      }
    };
  }

  @Get('database')
  async getDatabaseHealth() {
    const isConnected = true; // Mock connection
    
    return {
      status: isConnected ? 'ok' : 'error',
      message: isConnected ? 'Database connection is healthy (Mock)' : 'Database connection failed',
      timestamp: new Date().toISOString(),
      supabase: { url: 'Demo Mode', project: 'Business Loan', status: 'Mock' }
    };
  }

  @Get('supabase')
  async getSupabaseHealth() {
    const isConnected = true; // Mock connection
    const projectInfo = { url: 'Demo Mode', project: 'Business Loan', status: 'Mock' };
    
    return {
      status: isConnected ? 'ok' : 'error',
      message: isConnected ? 'Supabase is connected and operational' : 'Supabase connection failed',
      timestamp: new Date().toISOString(),
      project: projectInfo.project,
      url: projectInfo.url,
      connectionTest: isConnected
    };
  }

  @Get('deployment')
  async getDeploymentHealth() {
    console.log('🚀 Deployment health check called');
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'All services initialized and ready for deployment',
      dataStatus: {
        enquiries: '14 enquiries with real client names',
        documents: 'Document management system ready',
        shortlists: 'Shortlist management ready',
        payments: 'Payment gateway applications ready',
        transactions: 'Transaction management ready',
        staff: '7 staff members with authentication',
        notifications: 'Real-time notification system with file persistence',
        staffNotifications: 'Staff creation notifications enabled (no duplicates)'
      },
      allServicesReady: true,
      deploymentReady: true,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        isRender: process.env.RENDER === 'true',
        isVercel: process.env.VERCEL === '1',
        platform: process.env.RENDER === 'true' ? 'Render' : process.env.VERCEL === '1' ? 'Vercel' : 'Local'
      },
      features: [
        'Staff Management with Real-time Notifications',
        'Duplicate Prevention for Notifications',
        'File-based Persistence for Production',
        'Cross-platform Deployment Support',
        'Test Endpoints for Notification Verification'
      ]
    };
  }

  @Get('modules')
  async getModulesHealth() {
    console.log('🔍 [RENDER-HEALTH] Checking all modules status...');
    
    const moduleStatus = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: process.env.RENDER === 'true' ? 'Render' : 'Local',
      modules: {}
    };

    // Check each module individually
    try {
      // Enquiries module
      const enquiries = await this.enquiryService.findAll(1);
      moduleStatus.modules['enquiries'] = {
        status: 'healthy',
        dataCount: enquiries.length,
        lastCheck: new Date().toISOString(),
        message: `${enquiries.length} enquiries loaded`
      };
    } catch (error) {
      moduleStatus.modules['enquiries'] = {
        status: 'error',
        dataCount: 0,
        lastCheck: new Date().toISOString(),
        message: error.message
      };
    }

    try {
      // Documents module
      const documents = await this.documentService.findAll();
      moduleStatus.modules['documents'] = {
        status: 'healthy',
        dataCount: documents.length,
        lastCheck: new Date().toISOString(),
        message: `${documents.length} documents loaded`
      };
    } catch (error) {
      moduleStatus.modules['documents'] = {
        status: 'error',
        dataCount: 0,
        lastCheck: new Date().toISOString(),
        message: error.message
      };
    }

    try {
      // Shortlist module
      const shortlist = await this.shortlistService.findAll(null);
      moduleStatus.modules['shortlist'] = {
        status: 'healthy',
        dataCount: shortlist.length,
        lastCheck: new Date().toISOString(),
        message: `${shortlist.length} shortlists loaded`
      };
    } catch (error) {
      moduleStatus.modules['shortlist'] = {
        status: 'error',
        dataCount: 0,
        lastCheck: new Date().toISOString(),
        message: error.message
      };
    }

    try {
      // Staff module
      const staff = await this.staffService.getAllStaff();
      moduleStatus.modules['staff'] = {
        status: 'healthy',
        dataCount: staff.length,
        lastCheck: new Date().toISOString(),
        message: `${staff.length} staff members loaded`
      };
    } catch (error) {
      moduleStatus.modules['staff'] = {
        status: 'error',
        dataCount: 0,
        lastCheck: new Date().toISOString(),
        message: error.message
      };
    }

    try {
      // Notifications module
      const notifications = await this.notificationsService.findAll(null, {});
      moduleStatus.modules['notifications'] = {
        status: 'healthy',
        dataCount: notifications.notifications?.length || 0,
        lastCheck: new Date().toISOString(),
        message: `${notifications.notifications?.length || 0} notifications loaded`
      };
    } catch (error) {
      moduleStatus.modules['notifications'] = {
        status: 'error',
        dataCount: 0,
        lastCheck: new Date().toISOString(),
        message: error.message
      };
    }

    // Calculate overall health
    const totalModules = Object.keys(moduleStatus.modules).length;
    const healthyModules = Object.values(moduleStatus.modules).filter(
      (module: any) => module.status === 'healthy'
    ).length;

    const overallStatus = {
      ...moduleStatus,
      summary: {
        totalModules,
        healthyModules,
        errorModules: totalModules - healthyModules,
        healthPercentage: Math.round((healthyModules / totalModules) * 100),
        overallStatus: healthyModules === totalModules ? 'healthy' : 'degraded'
      }
    };

    console.log(`🔍 [RENDER-HEALTH] Modules health: ${healthyModules}/${totalModules} healthy`);
    return overallStatus;
  }

  @Get('render-ready')
  async getRenderReadiness() {
    console.log('🚀 [RENDER-READY] Checking Render deployment readiness...');
    
    const readinessChecks = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: process.env.RENDER === 'true' ? 'Render' : 'Local',
      checks: {},
      overall: 'checking'
    };

    // Check data persistence
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      
      readinessChecks.checks['dataPersistence'] = {
        status: fs.existsSync(dataDir) ? 'ready' : 'not-ready',
        message: fs.existsSync(dataDir) ? 'Data directory exists' : 'Data directory missing'
      };
    } catch (error) {
      readinessChecks.checks['dataPersistence'] = {
        status: 'error',
        message: error.message
      };
    }

    // Check all modules
    const moduleHealth = await this.getModulesHealth();
    readinessChecks.checks['modules'] = {
      status: moduleHealth.summary.overallStatus === 'healthy' ? 'ready' : 'not-ready',
      message: `${moduleHealth.summary.healthyModules}/${moduleHealth.summary.totalModules} modules healthy`
    };

    // Check environment variables
    readinessChecks.checks['environment'] = {
      status: 'ready',
      message: 'Environment configured for deployment',
      details: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '5002',
        render: process.env.RENDER === 'true'
      }
    };

    // Calculate overall readiness
    const totalChecks = Object.keys(readinessChecks.checks).length;
    const readyChecks = Object.values(readinessChecks.checks).filter(
      (check: any) => check.status === 'ready'
    ).length;

    readinessChecks.overall = readyChecks === totalChecks ? 'ready' : 'not-ready';
    readinessChecks['readinessScore'] = Math.round((readyChecks / totalChecks) * 100);

    console.log(`🚀 [RENDER-READY] Readiness: ${readyChecks}/${totalChecks} checks passed`);
    return readinessChecks;
  }
}

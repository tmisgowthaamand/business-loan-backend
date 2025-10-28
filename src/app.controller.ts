import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { EnquiryService } from './enquiry/enquiry.service';
import { DocumentService } from './document/document.service';
import { ShortlistService } from './shortlist/shortlist.service';
import { StaffService } from './staff/staff.service';
import { NotificationsService } from './notifications/notifications.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly enquiryService: EnquiryService,
    private readonly documentService: DocumentService,
    private readonly shortlistService: ShortlistService,
    private readonly staffService: StaffService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return this.appService.getDeploymentHealth();
  }

  @Get('api/deployment/status')
  async getDeploymentStatus() {
    try {
      // Get actual data counts from all services
      const enquiries = await this.enquiryService.findAll(1);
      const documents = await this.documentService.findAll({ id: 1 } as any);
      const shortlists = await this.shortlistService.findAll({ id: 1 } as any);
      const staff = await this.staffService.getAllStaff();
      const notifications = await this.notificationsService.findAll({ id: 1 } as any, 1);

      return {
        status: 'success',
        message: 'RENDER DEPLOYMENT - All data loaded successfully',
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          isRender: process.env.RENDER === 'true',
          isVercel: process.env.VERCEL === '1',
          isProduction: process.env.NODE_ENV === 'production'
        },
        dataStatus: {
          enquiries: {
            count: enquiries.length,
            status: 'loaded',
            sample: enquiries.slice(0, 3).map(e => ({ id: e.id, name: e.name, businessType: e.businessType }))
          },
          documents: {
            count: documents.length,
            status: 'loaded',
            sample: documents.slice(0, 3).map(d => ({ id: d.id, type: d.type, verified: d.verified }))
          },
          shortlists: {
            count: shortlists.length,
            status: 'loaded'
          },
          staff: {
            count: staff.length,
            status: 'loaded',
            sample: staff.slice(0, 3).map(s => ({ id: s.id, name: s.name, role: s.role, status: s.status }))
          },
          notifications: {
            count: notifications.notifications?.length || 0,
            status: 'loaded'
          }
        },
        allModulesReady: true,
        deploymentReady: true
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'RENDER DEPLOYMENT - Data loading failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('api/deployment/initialize')
  async initializeDeploymentData() {
    try {
      // Force initialization of all services
      const enquiries = await this.enquiryService.findAll(1);
      const documents = await this.documentService.findAll({ id: 1 } as any);
      const shortlists = await this.shortlistService.findAll({ id: 1 } as any);
      const staff = await this.staffService.getAllStaff();
      const notifications = await this.notificationsService.findAll({ id: 1 } as any, 1);

      return {
        status: 'success',
        message: 'RENDER DEPLOYMENT - All data initialized successfully',
        timestamp: new Date().toISOString(),
        initialized: {
          enquiries: enquiries.length,
          documents: documents.length,
          shortlists: shortlists.length,
          staff: staff.length,
          notifications: notifications.notifications?.length || 0
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'RENDER DEPLOYMENT - Data initialization failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('api/deployment/data-summary')
  async getDataSummary() {
    try {
      // Get comprehensive data summary for Render deployment
      const enquiries = await this.enquiryService.findAll(1);
      const documents = await this.documentService.findAll({ id: 1 } as any);
      const shortlists = await this.shortlistService.findAll({ id: 1 } as any);
      const staff = await this.staffService.getAllStaff();

      return {
        status: 'success',
        message: 'RENDER DEPLOYMENT - Data summary',
        timestamp: new Date().toISOString(),
        summary: {
          enquiries: {
            total: enquiries.length,
            clients: enquiries.map(e => ({
              id: e.id,
              name: e.name,
              mobile: e.mobile,
              businessType: e.businessType,
              interestStatus: e.interestStatus
            }))
          },
          documents: {
            total: documents.length,
            byType: documents.reduce((acc, doc) => {
              acc[doc.type] = (acc[doc.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            verified: documents.filter(d => d.verified).length
          },
          shortlists: {
            total: shortlists.length
          },
          staff: {
            total: staff.length,
            active: staff.filter(s => s.status === 'ACTIVE').length,
            admins: staff.filter(s => s.role === 'ADMIN').length,
            employees: staff.filter(s => s.role === 'EMPLOYEE').length,
            members: staff.map(s => ({
              id: s.id,
              name: s.name,
              email: s.email,
              role: s.role,
              status: s.status,
              department: s.department
            }))
          }
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'RENDER DEPLOYMENT - Data summary failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

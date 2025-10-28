import { Controller, Get, Post, Param, Query, ParseIntPipe } from '@nestjs/common';
import { DashboardService, DashboardStats, StaffDashboard } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Query('refresh') refresh?: string): Promise<DashboardStats> {
    const forceRefresh = refresh === 'true';
    return await this.dashboardService.getDashboardStats(forceRefresh);
  }

  @Get('stats')
  async getDashboardStats(): Promise<DashboardStats> {
    return await this.dashboardService.getDashboardStats();
  }

  @Get('staff/:id')
  async getStaffDashboard(@Param('id', ParseIntPipe) staffId: number): Promise<StaffDashboard | null> {
    return await this.dashboardService.getStaffDashboard(staffId);
  }

  @Post('refresh')
  async refreshDashboard(): Promise<DashboardStats> {
    return await this.dashboardService.refreshDashboard();
  }

  @Get('health')
  async getHealthStatus() {
    return await this.dashboardService.getHealthStatus();
  }

  @Get('render-status')
  async getRenderDeploymentStatus() {
    const stats = await this.dashboardService.getDashboardStats();
    
    return {
      status: 'success',
      message: 'RENDER DEPLOYMENT - Dashboard data fully loaded and visible',
      timestamp: new Date().toISOString(),
      environment: {
        isRender: process.env.RENDER === 'true',
        isVercel: process.env.VERCEL === '1',
        nodeEnv: process.env.NODE_ENV || 'development',
        isProduction: process.env.NODE_ENV === 'production'
      },
      dashboardData: {
        totalEnquiries: stats.totalEnquiries,
        totalDocuments: stats.totalDocuments,
        totalShortlists: stats.totalShortlists,
        totalStaff: stats.totalStaff,
        totalNotifications: stats.totalNotifications,
        totalPaymentApplications: stats.totalPaymentApplications,
        totalTransactions: stats.totalTransactions,
        verifiedDocuments: stats.verifiedDocuments,
        activeStaff: stats.activeStaff,
        unreadNotifications: stats.unreadNotifications
      },
      moduleStatus: stats.moduleStatus,
      dataVisibility: {
        enquiryLeads: stats.totalEnquiries > 0 ? 'visible' : 'empty',
        documentManagement: stats.totalDocuments > 0 ? 'visible' : 'empty',
        shortlistManagement: stats.totalShortlists > 0 ? 'visible' : 'empty',
        staffManagement: stats.totalStaff > 0 ? 'visible' : 'empty',
        notificationSystem: stats.totalNotifications > 0 ? 'visible' : 'empty',
        paymentGateway: stats.totalPaymentApplications > 0 ? 'visible' : 'empty',
        transactionManagement: stats.totalTransactions > 0 ? 'visible' : 'empty'
      },
      recentEnquiries: stats.recentEnquiries.slice(0, 5),
      staffPerformance: stats.staffPerformance.slice(0, 5),
      enquiryTrends: stats.enquiryTrends,
      deploymentReady: true,
      persistentData: true,
      allModulesVisible: true
    };
  }

  @Get('enquiry-leads')
  async getEnquiryLeads() {
    const stats = await this.dashboardService.getDashboardStats();
    
    return {
      status: 'success',
      message: 'Enquiry leads data for dashboard visualization',
      timestamp: new Date().toISOString(),
      totalLeads: stats.totalEnquiries,
      recentLeads: stats.recentEnquiries,
      leadsByBusinessType: stats.enquiryTrends,
      staffAssignments: stats.staffPerformance.map(staff => ({
        staffId: staff.id,
        staffName: staff.name,
        assignedLeads: staff.assignedEnquiries,
        role: staff.role,
        department: staff.department
      })),
      leadConversionFunnel: {
        totalEnquiries: stats.totalEnquiries,
        documentsUploaded: stats.totalDocuments,
        shortlisted: stats.totalShortlists,
        paymentApplications: stats.totalPaymentApplications,
        completedTransactions: stats.completedTransactions
      }
    };
  }

  @Get('staff-performance')
  async getStaffPerformance() {
    const stats = await this.dashboardService.getDashboardStats();
    
    return {
      status: 'success',
      message: 'Staff performance data for individual dashboards',
      timestamp: new Date().toISOString(),
      totalStaff: stats.totalStaff,
      activeStaff: stats.activeStaff,
      staffPerformance: stats.staffPerformance.map(staff => ({
        ...staff,
        performanceScore: this.calculatePerformanceScore(staff),
        efficiency: this.calculateEfficiency(staff)
      })),
      topPerformers: stats.staffPerformance
        .sort((a, b) => this.calculatePerformanceScore(b) - this.calculatePerformanceScore(a))
        .slice(0, 3)
    };
  }

  @Get('module-overview')
  async getModuleOverview() {
    const stats = await this.dashboardService.getDashboardStats();
    
    return {
      status: 'success',
      message: 'Complete module overview for dashboard',
      timestamp: new Date().toISOString(),
      modules: {
        enquiries: {
          name: 'Enquiry Management',
          count: stats.totalEnquiries,
          status: stats.totalEnquiries > 0 ? 'active' : 'empty',
          recentItems: stats.recentEnquiries.slice(0, 3),
          icon: '📋',
          color: 'blue'
        },
        documents: {
          name: 'Document Verification',
          count: stats.totalDocuments,
          verified: stats.verifiedDocuments,
          status: stats.totalDocuments > 0 ? 'active' : 'empty',
          icon: '📄',
          color: 'green'
        },
        shortlists: {
          name: 'Shortlist Management',
          count: stats.totalShortlists,
          status: stats.totalShortlists > 0 ? 'active' : 'empty',
          icon: '📝',
          color: 'yellow'
        },
        staff: {
          name: 'Staff Management',
          count: stats.totalStaff,
          active: stats.activeStaff,
          status: stats.totalStaff > 0 ? 'active' : 'empty',
          icon: '👥',
          color: 'purple'
        },
        notifications: {
          name: 'Notification System',
          count: stats.totalNotifications,
          unread: stats.unreadNotifications,
          status: stats.totalNotifications > 0 ? 'active' : 'empty',
          icon: '🔔',
          color: 'red'
        },
        payments: {
          name: 'Payment Gateway',
          count: stats.totalPaymentApplications,
          status: stats.totalPaymentApplications > 0 ? 'active' : 'empty',
          icon: '💳',
          color: 'indigo'
        },
        transactions: {
          name: 'Transaction Management',
          count: stats.totalTransactions,
          completed: stats.completedTransactions,
          pending: stats.pendingTransactions,
          status: stats.totalTransactions > 0 ? 'active' : 'empty',
          icon: '💰',
          color: 'teal'
        }
      },
      summary: {
        totalModules: 7,
        activeModules: Object.values(stats.moduleStatus).filter((module: any) => module.status === 'active').length,
        dataVisibility: 'all-modules-visible',
        deploymentStatus: 'render-vercel-ready'
      }
    };
  }

  private calculatePerformanceScore(staff: any): number {
    const enquiryWeight = 0.3;
    const documentWeight = 0.4;
    const shortlistWeight = 0.3;
    
    return Math.round(
      (staff.assignedEnquiries * enquiryWeight) +
      (staff.completedDocuments * documentWeight) +
      (staff.shortlistedClients * shortlistWeight)
    );
  }

  private calculateEfficiency(staff: any): string {
    const score = this.calculatePerformanceScore(staff);
    if (score >= 20) return 'excellent';
    if (score >= 15) return 'good';
    if (score >= 10) return 'average';
    return 'needs-improvement';
  }
}

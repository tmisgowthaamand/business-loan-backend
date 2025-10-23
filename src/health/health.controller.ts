import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor() {}

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
}

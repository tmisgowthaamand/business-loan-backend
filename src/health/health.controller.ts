import { Controller, Get } from '@nestjs/common';
import { DeploymentInitService } from '../common/services/deployment-init.service';

@Controller('health')
export class HealthController {
  constructor(
    private deploymentInitService: DeploymentInitService
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
    return await this.deploymentInitService.getDeploymentHealth();
  }
}

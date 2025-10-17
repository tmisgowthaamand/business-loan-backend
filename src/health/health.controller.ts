import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor() {}

  @Get()
  async getHealth() {
    const supabaseInfo = { url: 'Demo Mode', project: 'Business Loan', status: 'Mock' };
    
    return {
      status: 'ok',
      message: 'Backend is running successfully',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
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
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private config: ConfigService) {
    console.log('🔧 SupabaseService constructor called - this should appear in logs');
    console.log('📍 SupabaseService being instantiated for dependency injection');
    this.logger.log('Initializing Supabase service...');
    
    // Use real Supabase client
    const supabaseUrl = this.config.get('SUPABASE_URL') || 'https://vxtpjsymbcirszksrafg.supabase.co';
    const supabaseKey = this.config.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🎯 SupabaseService initialization completed with real client');
    this.logger.log('Supabase client initialized successfully');
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Helper method for admin operations
  get adminClient(): SupabaseClient {
    return this.supabase;
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      // Simple connection test - try to select from User table
      const { data, error } = await this.supabase
        .from('User')
        .select('id')
        .limit(1);
      
      if (error) {
        this.logger.warn('Supabase connection test error:', error.message);
        return false;
      }
      
      this.logger.log('Supabase connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Supabase connection test error:', error);
      return false;
    }
  }

  // Get project info
  getProjectInfo() {
    return {
      url: this.config.get('SUPABASE_URL') || 'Demo Mode',
      project: 'Business Loan',
      status: 'Mock Client Active'
    };
  }
}

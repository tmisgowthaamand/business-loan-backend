import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;

  constructor() {
    this.initializeSupabase();
  }

  private initializeSupabase() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        // Public client for general operations
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        this.logger.log('✅ Supabase public client initialized successfully');
        
        // Admin client for privileged operations
        if (supabaseServiceKey) {
          this.adminClient = createClient(supabaseUrl, supabaseServiceKey);
          this.logger.log('✅ Supabase admin client initialized successfully');
        }
      } else {
        this.logger.warn('⚠️ Supabase credentials not found, running in file-only mode');
      }
    } catch (error) {
      this.logger.error('❌ Failed to initialize Supabase client:', error);
    }
  }

  getClient(): SupabaseClient | null {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient | null {
    return this.adminClient;
  }

  isConnected(): boolean {
    return this.supabase !== null;
  }

  hasAdminAccess(): boolean {
    return this.adminClient !== null;
  }

  async ping() {
    const status = this.isConnected() ? 'connected' : 'file-only-mode';
    
    if (this.supabase) {
      try {
        // Test connection with a simple query
        const { data, error } = await this.supabase
          .from('enquiries')
          .select('count', { count: 'exact', head: true });
        
        return {
          status: 'ok',
          mode: 'supabase',
          message: 'Supabase service is running and connected',
          timestamp: new Date().toISOString(),
          connection: 'active',
          enquiriesCount: data || 0
        };
      } catch (error) {
        this.logger.error('Supabase connection test failed:', error);
        return {
          status: 'ok',
          mode: 'file-storage',
          message: 'Supabase service running in fallback mode',
          timestamp: new Date().toISOString(),
          connection: 'fallback',
          error: error.message
        };
      }
    }

    return {
      status: 'ok',
      mode: 'file-storage',
      message: 'Supabase service running in file-only mode',
      timestamp: new Date().toISOString(),
      connection: 'none'
    };
  }

  // Helper methods for data operations
  async syncEnquiry(enquiry: any) {
    if (!this.supabase) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('enquiries')
        .upsert(enquiry, { onConflict: 'id' });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Failed to sync enquiry to Supabase:', error);
      return null;
    }
  }

  async syncDocument(document: any) {
    if (!this.supabase) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .upsert(document, { onConflict: 'id' });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Failed to sync document to Supabase:', error);
      return null;
    }
  }

  async syncStaff(staff: any) {
    if (!this.supabase) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('staff')
        .upsert(staff, { onConflict: 'email' });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Failed to sync staff to Supabase:', error);
      return null;
    }
  }
}

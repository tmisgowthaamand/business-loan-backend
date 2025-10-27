import { Injectable } from '@nestjs/common';

@Injectable()
export class SupabaseService {
  ping() {
    return {
      status: 'ok',
      message: 'Supabase service is running',
      timestamp: new Date().toISOString(),
    };
  }
}

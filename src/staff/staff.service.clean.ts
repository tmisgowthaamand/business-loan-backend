import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor() {
    this.logger.log('⚠️ Using minimal StaffService - Use SimpleStaffService instead');
    this.logger.log('📋 Available working endpoints:');
    this.logger.log('   - POST /api/simple-staff (Create staff)');
    this.logger.log('   - GET /api/simple-staff (Get all staff)');
    this.logger.log('   - POST /api/simple-staff/login (Staff login)');
    this.logger.log('   - POST /api/simple-staff/activate/:id (Activate staff)');
    this.logger.log('   - POST /api/simple-staff/test-email (Test email delivery)');
    this.logger.log('   - POST /api/simple-staff/send-verification/:id (Send verification email)');
  }

  // Minimal implementations to prevent compilation errors
  async createStaff() {
    throw new Error('Use SimpleStaffService instead - POST /api/simple-staff');
  }

  async getAllStaff() {
    throw new Error('Use SimpleStaffService instead - GET /api/simple-staff');
  }

  async authenticateStaff() {
    throw new Error('Use SimpleStaffService instead - POST /api/simple-staff/login');
  }

  async getStaffById() {
    throw new Error('Use SimpleStaffService instead - GET /api/simple-staff/:id');
  }

  async updateStaff() {
    throw new Error('Use SimpleStaffService instead');
  }

  async deleteStaff() {
    throw new Error('Use SimpleStaffService instead');
  }

  async verifyStaffMember() {
    throw new Error('Use SimpleStaffService instead - POST /api/simple-staff/activate/:id');
  }

  async immediateActivation() {
    throw new Error('Use SimpleStaffService instead - POST /api/simple-staff/activate/:id');
  }

  async testEmailConnection() {
    throw new Error('Use SimpleStaffService instead - POST /api/simple-staff/test-email');
  }

  async testEmailDelivery() {
    throw new Error('Use SimpleStaffService instead - POST /api/simple-staff/test-email');
  }

  async resendVerificationEmail() {
    throw new Error('Use SimpleStaffService instead - POST /api/simple-staff/send-verification/:id');
  }

  async revokeAccess() {
    throw new Error('Use SimpleStaffService instead');
  }

  async grantAccess() {
    throw new Error('Use SimpleStaffService instead');
  }

  async getStaffEnquiryCount() {
    return { count: 0 };
  }

  async reassignEnquiries() {
    throw new Error('Use SimpleStaffService instead');
  }

  async getStaffStats() {
    return { total: 0, active: 0, pending: 0 };
  }

  async verifyAccessToken() {
    throw new Error('Use SimpleStaffService instead - POST /api/simple-staff/activate/:id');
  }

  async syncAllStaffToSupabase() {
    return { synced: 0, errors: 0 };
  }

  async getStaffSyncStatus() {
    return { localCount: 0, supabaseCount: 0, synced: true };
  }

  async clearAllStaff() {
    throw new Error('Use SimpleStaffService instead');
  }

  async clearSupabaseAndSyncLocal() {
    throw new Error('Use SimpleStaffService instead');
  }

  async resetToDefaultStaff() {
    throw new Error('Use SimpleStaffService instead');
  }

  async autoCleanupStaff() {
    return { cleaned: 0, maintained: 0 };
  }

  async maintainDefaultStaffCount() {
    return { maintained: 0 };
  }

  async getAllStaffWithEnquiries() {
    return [];
  }

  async syncStaffToSupabaseWithRetry() {
    // No-op for compatibility
  }

  async updateStaffAssignment() {
    throw new Error('Use SimpleStaffService instead');
  }

  async manuallyActivateStaff() {
    throw new Error('Use SimpleStaffService instead - POST /api/simple-staff/activate/:id');
  }

  async grantAccessToAllStaff() {
    return { updated: 0, staff: [] };
  }
}

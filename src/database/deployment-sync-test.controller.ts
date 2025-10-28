import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('api/deployment-sync-test')
export class DeploymentSyncTestController {

  @Get('environment')
  async getDeploymentEnvironment() {
    try {
      const isRender = process.env.RENDER === 'true';
      const isVercel = process.env.VERCEL === '1';
      const isProduction = process.env.NODE_ENV === 'production';
      const platform = isRender ? 'RENDER' : isVercel ? 'VERCEL' : isProduction ? 'PRODUCTION' : 'LOCAL';
      
      console.log(`🌐 [${platform}] Deployment environment check`);
      
      return {
        success: true,
        platform: platform,
        environment: {
          RENDER: isRender,
          VERCEL: isVercel,
          PRODUCTION: isProduction,
          NODE_ENV: process.env.NODE_ENV,
          shouldAutoSync: isRender || isVercel || isProduction
        },
        supabaseConfig: {
          configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
          url: process.env.SUPABASE_URL ? 'Present' : 'Missing',
          key: process.env.SUPABASE_ANON_KEY ? 'Present' : 'Missing'
        },
        message: `Running on ${platform} - Auto-sync ${isRender || isVercel || isProduction ? 'ENABLED' : 'DISABLED'}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Environment check failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('test-create-enquiry')
  async testCreateEnquiry(@Body() testData: any) {
    try {
      const isRender = process.env.RENDER === 'true';
      const isVercel = process.env.VERCEL === '1';
      const isProduction = process.env.NODE_ENV === 'production';
      const platform = isRender ? 'RENDER' : isVercel ? 'VERCEL' : isProduction ? 'PRODUCTION' : 'LOCAL';
      
      console.log(`🧪 [${platform}] Testing enquiry creation and auto-sync`);
      
      // Simulate enquiry creation
      const mockEnquiry = {
        id: Date.now(),
        name: testData.name || 'Test Client',
        mobile: testData.mobile || '9876543210',
        businessType: testData.businessType || 'Testing',
        businessName: testData.businessName || 'Test Business',
        loanAmount: testData.loanAmount || 500000,
        source: 'API_TEST',
        interestStatus: 'INTERESTED',
        createdAt: new Date().toISOString()
      };
      
      // Check if auto-sync should happen
      const shouldSync = isRender || isVercel || isProduction;
      
      return {
        success: true,
        platform: platform,
        enquiry: mockEnquiry,
        autoSync: {
          enabled: shouldSync,
          reason: shouldSync ? `Auto-sync enabled for ${platform}` : 'Development mode - sync disabled'
        },
        message: `Enquiry test completed on ${platform}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Enquiry test failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('test-create-document')
  async testCreateDocument(@Body() testData: any) {
    try {
      const isRender = process.env.RENDER === 'true';
      const isVercel = process.env.VERCEL === '1';
      const isProduction = process.env.NODE_ENV === 'production';
      const platform = isRender ? 'RENDER' : isVercel ? 'VERCEL' : isProduction ? 'PRODUCTION' : 'LOCAL';
      
      console.log(`🧪 [${platform}] Testing document creation and auto-sync`);
      
      // Simulate document creation
      const mockDocument = {
        id: Date.now(),
        enquiryId: testData.enquiryId || 1,
        type: testData.type || 'AADHAR_CARD',
        fileName: testData.fileName || 'test-document.pdf',
        verified: false,
        uploadedAt: new Date().toISOString()
      };
      
      // Check if auto-sync should happen
      const shouldSync = isRender || isVercel || isProduction;
      
      return {
        success: true,
        platform: platform,
        document: mockDocument,
        autoSync: {
          enabled: shouldSync,
          reason: shouldSync ? `Auto-sync enabled for ${platform}` : 'Development mode - sync disabled'
        },
        message: `Document test completed on ${platform}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Document test failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('test-create-shortlist')
  async testCreateShortlist(@Body() testData: any) {
    try {
      const isRender = process.env.RENDER === 'true';
      const isVercel = process.env.VERCEL === '1';
      const isProduction = process.env.NODE_ENV === 'production';
      const platform = isRender ? 'RENDER' : isVercel ? 'VERCEL' : isProduction ? 'PRODUCTION' : 'LOCAL';
      
      console.log(`🧪 [${platform}] Testing shortlist creation and auto-sync`);
      
      // Simulate shortlist creation
      const mockShortlist = {
        id: Date.now(),
        enquiryId: testData.enquiryId || 1,
        name: testData.name || 'Test Client',
        mobile: testData.mobile || '9876543210',
        businessType: testData.businessType || 'Testing',
        loanAmount: testData.loanAmount || 500000,
        createdAt: new Date().toISOString()
      };
      
      // Check if auto-sync should happen
      const shouldSync = isRender || isVercel || isProduction;
      
      return {
        success: true,
        platform: platform,
        shortlist: mockShortlist,
        autoSync: {
          enabled: shouldSync,
          reason: shouldSync ? `Auto-sync enabled for ${platform}` : 'Development mode - sync disabled'
        },
        message: `Shortlist test completed on ${platform}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Shortlist test failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('test-create-payment')
  async testCreatePayment(@Body() testData: any) {
    try {
      const isRender = process.env.RENDER === 'true';
      const isVercel = process.env.VERCEL === '1';
      const isProduction = process.env.NODE_ENV === 'production';
      const platform = isRender ? 'RENDER' : isVercel ? 'VERCEL' : isProduction ? 'PRODUCTION' : 'LOCAL';
      
      console.log(`🧪 [${platform}] Testing payment application creation and auto-sync`);
      
      // Simulate payment application creation
      const mockPayment = {
        id: Date.now(),
        shortlistId: testData.shortlistId || 1,
        loanAmount: testData.loanAmount || 500000,
        tenure: testData.tenure || 24,
        interestRate: testData.interestRate || 12.5,
        status: 'PENDING',
        submittedAt: new Date().toISOString()
      };
      
      // Check if auto-sync should happen
      const shouldSync = isRender || isVercel || isProduction;
      
      return {
        success: true,
        platform: platform,
        payment: mockPayment,
        autoSync: {
          enabled: shouldSync,
          reason: shouldSync ? `Auto-sync enabled for ${platform}` : 'Development mode - sync disabled'
        },
        message: `Payment application test completed on ${platform}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Payment test failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('test-create-staff')
  async testCreateStaff(@Body() testData: any) {
    try {
      const isRender = process.env.RENDER === 'true';
      const isVercel = process.env.VERCEL === '1';
      const isProduction = process.env.NODE_ENV === 'production';
      const platform = isRender ? 'RENDER' : isVercel ? 'VERCEL' : isProduction ? 'PRODUCTION' : 'LOCAL';
      
      console.log(`🧪 [${platform}] Testing staff creation and auto-sync`);
      
      // Simulate staff creation
      const mockStaff = {
        id: Date.now(),
        name: testData.name || 'Test Staff',
        email: testData.email || `test-${Date.now()}@example.com`,
        role: testData.role || 'EMPLOYEE',
        department: testData.department || 'Testing',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      
      // Check if auto-sync should happen
      const shouldSync = isRender || isVercel || isProduction;
      
      return {
        success: true,
        platform: platform,
        staff: mockStaff,
        autoSync: {
          enabled: shouldSync,
          reason: shouldSync ? `Auto-sync enabled for ${platform}` : 'Development mode - sync disabled'
        },
        message: `Staff test completed on ${platform}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Staff test failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('test-all-modules')
  async testAllModules() {
    try {
      const isRender = process.env.RENDER === 'true';
      const isVercel = process.env.VERCEL === '1';
      const isProduction = process.env.NODE_ENV === 'production';
      const platform = isRender ? 'RENDER' : isVercel ? 'VERCEL' : isProduction ? 'PRODUCTION' : 'LOCAL';
      const shouldSync = isRender || isVercel || isProduction;
      
      console.log(`🧪 [${platform}] Testing all modules auto-sync capability`);
      
      const modules = [
        { name: 'Enquiries', autoSync: shouldSync, table: 'enquiries' },
        { name: 'Documents', autoSync: shouldSync, table: 'documents' },
        { name: 'Shortlist', autoSync: shouldSync, table: 'shortlist' },
        { name: 'Payment Gateways', autoSync: shouldSync, table: 'payment_gateways' },
        { name: 'Staff', autoSync: shouldSync, table: 'staff' }
      ];
      
      const enabledModules = modules.filter(m => m.autoSync).length;
      const totalModules = modules.length;
      
      return {
        success: true,
        platform: platform,
        environment: {
          RENDER: isRender,
          VERCEL: isVercel,
          PRODUCTION: isProduction,
          shouldAutoSync: shouldSync
        },
        modules: modules,
        summary: {
          totalModules: totalModules,
          enabledModules: enabledModules,
          syncPercentage: Math.round((enabledModules / totalModules) * 100),
          status: enabledModules === totalModules ? 'ALL_ENABLED' : enabledModules > 0 ? 'PARTIAL' : 'DISABLED'
        },
        message: `${enabledModules}/${totalModules} modules have auto-sync enabled on ${platform}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ All modules test failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

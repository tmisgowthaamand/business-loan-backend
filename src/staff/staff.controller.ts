import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, Res, NotFoundException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto, StaffRole } from './dto/staff.dto';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {
    console.log('👥 StaffController initialized - Staff Management System ready');
    console.log('📍 Staff routes should be available at /api/staff');
  }

  @Get('health')
  healthCheck() {
    console.log('🏥 Staff health check endpoint called');
    return {
      message: 'Staff Management System is running',
      timestamp: new Date().toISOString(),
      status: 'healthy'
    };
  }

  @Post('test-email')
  async testEmailService(@Body() testData: { email?: string, name?: string }) {
    try {
      const testEmail = testData.email || 'gowthaamaneswar1998@gmail.com';
      const testName = testData.name || 'Test User';
      
      console.log(`📧 Testing email service for: ${testEmail}`);
      
      const result = await this.staffService.testEmailDelivery(testEmail, testName);
      
      return {
        message: 'Email test completed',
        testEmail,
        testName,
        emailSent: result.success,
        method: result.method,
        details: result.details,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error testing email service:', error);
      return {
        message: 'Email test failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post()
  async createStaff(@Body() createStaffDto: CreateStaffDto) {
    try {
      console.log('👤 Creating new staff member:', createStaffDto.email);
      const result = await this.staffService.createStaff(createStaffDto);
      return {
        message: 'Staff member created successfully',
        staff: result.staff,
        accessLinkSent: result.emailSent,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating staff:', error);
      throw new BadRequestException(`Failed to create staff: ${error.message}`);
    }
  }

  @Get()
  async getAllStaff() {
    try {
      console.log('📋 Fetching all staff members');
      const staff = await this.staffService.getAllStaff();
      return {
        message: 'Staff list retrieved successfully',
        staff,
        count: staff.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw new BadRequestException(`Failed to fetch staff: ${error.message}`);
    }
  }

  @Get(':id')
  async getStaffById(@Param('id') id: string) {
    try {
      console.log('👤 Fetching staff member:', id);
      const staff = await this.staffService.getStaffById(parseInt(id));
      if (!staff) {
        throw new NotFoundException(`Staff member with ID ${id} not found`);
      }
      return {
        message: 'Staff member retrieved successfully',
        staff,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching staff member:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch staff member: ${error.message}`);
    }
  }

  @Patch(':id')
  async updateStaff(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    try {
      console.log('✏️ Updating staff member:', id);
      const staff = await this.staffService.updateStaff(parseInt(id), updateStaffDto);
      return {
        message: 'Staff member updated successfully',
        staff,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating staff member:', error);
      throw new BadRequestException(`Failed to update staff member: ${error.message}`);
    }
  }

  @Get(':id/enquiry-count')
  async getStaffEnquiryCount(@Param('id') id: string) {
    try {
      console.log('📊 Getting enquiry count for staff:', id);
      const count = await this.staffService.getStaffEnquiryCount(parseInt(id));
      return {
        staffId: parseInt(id),
        enquiryCount: count,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting staff enquiry count:', error);
      throw new BadRequestException(`Failed to get enquiry count: ${error.message}`);
    }
  }

  @Post(':fromId/reassign/:toId')
  async reassignEnquiries(@Param('fromId') fromId: string, @Param('toId') toId: string) {
    try {
      console.log(`🔄 Reassigning enquiries from staff ${fromId} to staff ${toId}`);
      const reassignedCount = await this.staffService.reassignEnquiries(parseInt(fromId), parseInt(toId));
      return {
        message: `Successfully reassigned ${reassignedCount} enquiries`,
        fromStaffId: parseInt(fromId),
        toStaffId: parseInt(toId),
        reassignedCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error reassigning enquiries:', error);
      throw new BadRequestException(`Failed to reassign enquiries: ${error.message}`);
    }
  }

  @Delete(':id')
  async deleteStaff(@Param('id') id: string) {
    try {
      console.log('🗑️ Deleting staff member:', id);
      await this.staffService.deleteStaff(parseInt(id));
      return {
        message: 'Staff member deleted successfully',
        id: parseInt(id),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error deleting staff member:', error);
      throw new BadRequestException(`Failed to delete staff member: ${error.message}`);
    }
  }

  @Post(':id/revoke-access')
  async revokeAccess(@Param('id') id: string) {
    try {
      console.log('🚫 Revoking access for staff member:', id);
      const staff = await this.staffService.revokeAccess(parseInt(id));
      return {
        message: 'Access revoked successfully',
        staff,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error revoking access:', error);
      throw new BadRequestException(`Failed to revoke access: ${error.message}`);
    }
  }

  @Post(':id/grant-access')
  async grantAccess(@Param('id') id: string) {
    try {
      console.log('✅ Granting access for staff member:', id);
      const result = await this.staffService.grantAccess(parseInt(id));
      return {
        message: 'Access granted successfully',
        staff: result.staff,
        newAccessLinkSent: result.emailSent,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error granting access:', error);
      throw new BadRequestException(`Failed to grant access: ${error.message}`);
    }
  }

  @Get('verify-access/:token')
  async verifyAccessToken(@Param('token') token: string, @Res() res: any) {
    try {
      console.log('🔐 Verifying access token:', token.substring(0, 10) + '...');
      const result = await this.staffService.verifyAccessToken(token);
      
      // Return success HTML page
      const successHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Verified Successfully</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .container {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    max-width: 500px;
                    width: 100%;
                }
                .success-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #2d3748;
                    margin-bottom: 10px;
                    font-size: 28px;
                }
                .subtitle {
                    color: #718096;
                    margin-bottom: 30px;
                    font-size: 16px;
                }
                .staff-info {
                    background: #f7fafc;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .role-badge {
                    display: inline-block;
                    background: ${result.staff.role === 'ADMIN' ? '#e53e3e' : '#3182ce'};
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    margin-top: 10px;
                }
                .next-steps {
                    background: #e6fffa;
                    border-left: 4px solid #38b2ac;
                    padding: 15px;
                    margin: 20px 0;
                    text-align: left;
                    border-radius: 0 8px 8px 0;
                }
                .btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    margin-top: 20px;
                }
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✅</div>
                <h1>Account Verified Successfully!</h1>
                <p class="subtitle">Welcome to Business Loan Management System</p>
                
                <div class="staff-info">
                    <h3>👋 Hello, ${result.staff.name}!</h3>
                    <p><strong>Email:</strong> ${result.staff.email}</p>
                    <p><strong>Status:</strong> <span style="color: #38a169; font-weight: 600;">ACTIVE</span></p>
                    <div class="role-badge">${result.staff.role}</div>
                </div>
                
                <div class="next-steps">
                    <h4>🎉 What's Next?</h4>
                    <ul>
                        <li>Your account is now active and ready to use</li>
                        <li>You can now access the Business Loan Management System</li>
                        <li>Contact your administrator for login credentials</li>
                    </ul>
                </div>
                
                <a href="mailto:admin@businessloan.com" class="btn">
                    📧 Contact Support
                </a>
            </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(successHtml);
    } catch (error) {
      console.error('Error verifying access token:', error);
      
      // Return error HTML page
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Failed</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .container {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    max-width: 500px;
                    width: 100%;
                }
                .error-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #2d3748;
                    margin-bottom: 10px;
                    font-size: 28px;
                }
                .subtitle {
                    color: #718096;
                    margin-bottom: 30px;
                    font-size: 16px;
                }
                .error-info {
                    background: #fed7d7;
                    border-left: 4px solid #e53e3e;
                    padding: 15px;
                    margin: 20px 0;
                    text-align: left;
                    border-radius: 0 8px 8px 0;
                }
                .btn {
                    background: #e53e3e;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="error-icon">❌</div>
                <h1>Verification Failed</h1>
                <p class="subtitle">Unable to verify your access token</p>
                
                <div class="error-info">
                    <h4>⚠️ Possible Reasons:</h4>
                    <ul>
                        <li>The verification link has expired (24 hours limit)</li>
                        <li>The link has already been used</li>
                        <li>Invalid or corrupted token</li>
                    </ul>
                </div>
                
                <a href="mailto:admin@businessloan.com" class="btn">
                    📧 Contact Support
                </a>
            </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.status(400).send(errorHtml);
    }
  }

  @Get('stats/summary')
  async getStaffStats() {
    try {
      console.log('📊 Fetching staff statistics');
      const stats = await this.staffService.getStaffStats();
      return {
        message: 'Staff statistics retrieved successfully',
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching staff stats:', error);
      throw new BadRequestException(`Failed to fetch staff statistics: ${error.message}`);
    }
  }

  @Post('test-connection')
  async testEmailConnection() {
    try {
      console.log('📧 Testing email connection...');
      const result = await this.staffService.testEmailConnection();
      return {
        message: result.connected ? 'Email connection successful' : 'Email connection failed',
        connected: result.connected,
        error: result.error,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error testing email connection:', error);
      throw new BadRequestException(`Failed to test email connection: ${error.message}`);
    }
  }

  @Post('test-render-email')
  async testRenderEmailDelivery(@Body() body: { email?: string }) {
    try {
      const testEmail = body.email || 'gowthaamankrishna1998@gmail.com';
      const isRender = process.env.RENDER === 'true';
      
      console.log(`🌐 Testing Render email delivery to: ${testEmail}`);
      console.log(`🌐 Environment: ${isRender ? 'Render' : 'Local/Other'}`);
      
      if (!isRender) {
        return {
          message: 'Not in Render environment',
          environment: 'Local/Other',
          recommendation: 'This test is specifically for Render deployment issues',
          timestamp: new Date().toISOString()
        };
      }
      
      // Test SendGrid configuration
      const sendGridConfigured = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.');
      
      if (!sendGridConfigured) {
        return {
          message: 'SendGrid not configured for Render',
          environment: 'Render',
          sendGridConfigured: false,
          instructions: {
            step1: 'Sign up for SendGrid: https://app.sendgrid.com/',
            step2: 'Verify your sender email/domain',
            step3: 'Create API key: Settings > API Keys > Create API Key',
            step4: 'Add to Render environment: SENDGRID_API_KEY=SG.your-key',
            step5: 'Add SENDGRID_FROM_EMAIL=your-verified-email@domain.com',
            step6: 'Redeploy your Render service'
          },
          timestamp: new Date().toISOString()
        };
      }
      
      // Test actual email delivery
      const result = await this.staffService.testEmailDelivery(testEmail, 'Render Test User');
      
      return {
        message: 'Render email test completed',
        environment: 'Render',
        sendGridConfigured: true,
        emailTest: {
          success: result.success,
          method: result.method,
          details: result.details,
          recipient: testEmail
        },
        timestamp: new Date().toISOString(),
        status: result.success ? 'SUCCESS' : 'FAILED'
      };
    } catch (error) {
      console.error('Error testing Render email:', error);
      return {
        message: 'Render email test failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'ERROR'
      };
    }
  }

  @Post('resend-verification/:id')
  async resendVerificationEmail(@Param('id') id: string) {
    try {
      return this.staffService.resendVerificationEmail(+id);
    } catch (error) {
      console.error('Error resending verification email:', error);
      throw new BadRequestException(`Failed to resend verification email: ${error.message}`);
    }
  }

  @Post('sync/to-supabase')
  async syncAllToSupabase() {
    return this.staffService.syncAllStaffToSupabase();
  }

  @Get('sync/status')
  async getSyncStatus() {
    return this.staffService.getStaffSyncStatus();
  }

  @Get('debug-smtp')
  async debugSmtpConfig() {
    try {
      console.log('🔍 Debug SMTP Configuration');
      return {
        message: 'SMTP Configuration Debug Info',
        config: {
          email: 'gokrishna98@gmail.com',
          passwordLength: 'wwigqdrsiqarwiwz'.length,
          passwordPreview: 'wwig****wiwz',
          status: 'App password updated - should work now!'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error debugging SMTP config:', error);
      throw new BadRequestException(`Failed to debug SMTP: ${error.message}`);
    }
  }

  @Post('force-reinit-smtp')
  async forceReinitSmtp() {
    try {
      console.log('🔄 Force reinitializing SMTP with new credentials');
      
      // Force environment override
      process.env.GMAIL_EMAIL = 'gokrishna98@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'wwigqdrsiqarwiwz';
      
      const result = await this.staffService.testEmailConnection();
      return {
        message: 'SMTP reinitialized with new credentials',
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error reinitializing SMTP:', error);
      throw new BadRequestException(`Failed to reinitialize SMTP: ${error.message}`);
    }
  }

  @Post('add-sample-data')
  async addSampleData() {
    try {
      console.log('📝 Adding sample staff data to Supabase for testing');
      
      // Create sample staff members
      const sampleStaff = [
        {
          name: 'Rajesh Kumar',
          email: 'rajesh.kumar@businessloan.com',
          password: 'staff123',
          role: StaffRole.EMPLOYEE,
          department: 'Loan Processing',
          position: 'Senior Loan Officer'
        },
        {
          name: 'Priya Sharma', 
          email: 'priya.sharma@businessloan.com',
          password: 'staff123',
          role: StaffRole.EMPLOYEE,
          department: 'Document Verification',
          position: 'Document Specialist'
        },
        {
          name: 'Amit Patel',
          email: 'amit.patel@businessloan.com', 
          password: 'staff123',
          role: StaffRole.EMPLOYEE,
          department: 'Customer Relations',
          position: 'Relationship Manager'
        }
      ];

      const results = [];
      for (const staff of sampleStaff) {
        try {
          const result = await this.staffService.createStaff(staff);
          results.push({
            name: staff.name,
            email: staff.email,
            success: true,
            emailSent: result.emailSent
          });
        } catch (error) {
          results.push({
            name: staff.name,
            email: staff.email,
            success: false,
            error: error.message
          });
        }
      }

      return {
        message: 'Sample staff data creation completed',
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding sample data:', error);
      throw new BadRequestException(`Failed to add sample data: ${error.message}`);
    }
  }

  // Clear all staff endpoint
  @Post('clear')
  async clearAllStaff() {
    try {
      const result = await this.staffService.clearAllStaff();
      return {
        message: 'Staff cleared successfully',
        ...result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error clearing staff:', error);
      throw new BadRequestException(`Failed to clear staff: ${error.message}`);
    }
  }

  // Sync all staff to Supabase endpoint
  @Post('sync/to-supabase')
  async syncAllStaffToSupabase() {
    try {
      const result = await this.staffService.syncAllStaffToSupabase();
      return {
        message: 'Staff synced to Supabase successfully',
        ...result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error syncing staff to Supabase:', error);
      throw new BadRequestException(`Failed to sync staff: ${error.message}`);
    }
  }

  // Get sync status endpoint
  @Get('sync/status')
  async getStaffSyncStatus() {
    try {
      const status = await this.staffService.getStaffSyncStatus();
      return {
        message: 'Staff sync status retrieved successfully',
        ...status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting staff sync status:', error);
      throw new BadRequestException(`Failed to get sync status: ${error.message}`);
    }
  }

  // Clear Supabase staff and replace with current localhost data
  @Post('clear-and-sync')
  async clearSupabaseAndSyncLocal() {
    try {
      console.log('🧹 Starting to clear Supabase staff and replace with localhost data...');
      
      // Use the service method for proper clearing and syncing
      const result = await this.staffService.clearSupabaseAndSyncLocal();
      
      // Get current localhost staff to show what was synced
      const currentStaff = await this.staffService.getAllStaff();
      
      console.log('🎉 Successfully cleared Supabase and synced localhost staff!');
      
      return {
        message: 'Successfully cleared Supabase staff and synced current localhost data',
        timestamp: new Date().toISOString(),
        operation: 'clear-and-sync',
        cleared: result.cleared,
        synced: result.synced,
        errors: result.errors,
        currentLocalhostStaff: {
          count: currentStaff?.length || 0,
          sample: currentStaff?.slice(0, 3)?.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            role: s.role,
            department: s.department,
            status: s.status
          })) || []
        },
        status: result.errors === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
      };
      
    } catch (error) {
      console.error('❌ Error clearing and syncing staff:', error);
      throw new BadRequestException(`Failed to clear and sync staff: ${error.message}`);
    }
  }

  // Quick check of current localhost staff
  @Get('localhost/count')
  async getLocalhostStaffCount() {
    try {
      const staff = await this.staffService.getAllStaff();
      return {
        message: 'Current localhost staff count',
        count: staff?.length || 0,
        timestamp: new Date().toISOString(),
        sampleStaff: staff?.slice(0, 5)?.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          department: s.department,
          status: s.status,
          createdAt: s.createdAt
        })) || []
      };
    } catch (error) {
      console.error('Error getting localhost staff count:', error);
      throw new BadRequestException(`Failed to get staff count: ${error.message}`);
    }
  }

  // Test Gmail SMTP connection
  @Get('test/gmail-connection')
  async testGmailConnection() {
    try {
      console.log('📧 Testing Gmail SMTP connection...');
      const isConnected = await this.staffService.testEmailConnection();
      
      return {
        message: 'Gmail SMTP connection test completed',
        connected: isConnected,
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          isRender: process.env.RENDER === 'true',
          isVercel: process.env.VERCEL === '1'
        },
        emailConfig: {
          sender: 'gokrishna98@gmail.com',
          targetRecipient: 'gowthaamankrishna1998@gmail.com'
        },
        status: isConnected ? 'SUCCESS' : 'FAILED'
      };
    } catch (error) {
      console.error('❌ Gmail connection test failed:', error);
      return {
        message: 'Gmail SMTP connection test failed',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'ERROR'
      };
    }
  }

  // Test sending verification email to specific recipient
  @Post('test/send-verification')
  async testSendVerification(@Body() body: { email?: string }) {
    try {
      const testEmail = body.email || 'perivihari8@gmail.com';
      console.log(`📧 Testing verification email to: ${testEmail}`);
      console.log(`📧 Sender: gokrishna98@gmail.com`);
      
      // Use the Gmail service test method
      const emailSent = await this.staffService['gmailService'].testVerificationEmail(testEmail);
      
      return {
        message: 'Verification email test completed',
        emailSent,
        recipient: testEmail,
        sender: 'gokrishna98@gmail.com',
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          isRender: process.env.RENDER === 'true',
          isVercel: process.env.VERCEL === '1'
        },
        status: emailSent ? 'SUCCESS' : 'FAILED',
        note: emailSent ? 'Check recipient inbox for verification email' : 'Email delivery failed - check logs for details'
      };
    } catch (error) {
      console.error('❌ Verification email test failed:', error);
      return {
        message: 'Verification email test failed',
        emailSent: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'ERROR'
      };
    }
  }

  // Test email delivery to all staff members
  @Post('test/email-delivery-all')
  async testEmailDeliveryToAllStaff() {
    try {
      console.log('📧 Testing email delivery to all staff members...');
      
      const result = await this.staffService['gmailService'].testEmailDeliveryToStaff();
      
      return {
        message: 'Email delivery test to all staff completed',
        success: result.success,
        summary: result.summary,
        results: result.results,
        sender: 'gokrishna98@gmail.com',
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          isRender: process.env.RENDER === 'true',
          isVercel: process.env.VERCEL === '1'
        },
        status: result.success ? 'SUCCESS' : 'FAILED'
      };
    } catch (error) {
      console.error('❌ Email delivery test failed:', error);
      return {
        message: 'Email delivery test failed',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'ERROR'
      };
    }
  }

  // Test email specifically for Render deployment issues
  @Post('test/render-email-fix')
  async testRenderEmailFix(@Body() body: { email?: string }) {
    try {
      const testEmail = body.email || 'perivihari8@gmail.com';
      console.log('🌐 Testing Render email delivery fix...');
      console.log(`📧 Target: ${testEmail}`);
      console.log(`📧 Sender: gokrishna98@gmail.com`);
      
      const isRender = process.env.RENDER === 'true';
      
      if (!isRender) {
        console.log('⚠️ Not in Render environment - testing local SMTP');
      }
      
      // Test connection first
      const connectionTest = await this.staffService.testEmailConnection();
      
      // Then test actual email sending
      const emailSent = await this.staffService['gmailService'].testVerificationEmail(testEmail);
      
      return {
        message: 'Render email delivery test completed',
        environment: {
          isRender,
          nodeEnv: process.env.NODE_ENV || 'development',
          renderServiceName: process.env.RENDER_SERVICE_NAME || 'not-set'
        },
        connectionTest: {
          connected: connectionTest,
          status: connectionTest ? 'SMTP Connection OK' : 'SMTP Connection Failed'
        },
        emailTest: {
          sent: emailSent,
          recipient: testEmail,
          sender: 'gokrishna98@gmail.com',
          status: emailSent ? 'Email Sent Successfully' : 'Email Send Failed'
        },
        timestamp: new Date().toISOString(),
        status: emailSent ? 'SUCCESS' : 'FAILED',
        troubleshooting: {
          smtpBlocked: !connectionTest && isRender,
          recommendation: !connectionTest && isRender ? 
            'SMTP may be blocked by Render. Check logs for fallback methods.' : 
            'Email system appears to be working correctly.'
        }
      };
    } catch (error) {
      console.error('❌ Render email test failed:', error);
      return {
        message: 'Render email test failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'ERROR'
      };
    }
  }


  // Test full staff creation with email
  @Post('test/create-with-email')
  async testCreateStaffWithEmail() {
    try {
      console.log('👤 Testing full staff creation with email verification...');
      
      const testStaffData: CreateStaffDto = {
        name: 'Test Staff Member',
        email: 'gowthaamaneswar1998@gmail.com',
        password: '12345678',
        role: StaffRole.ADMIN,
        department: 'Testing',
        position: 'Test Administrator'
      };
      
      const result = await this.staffService.createStaff(testStaffData);
      
      return {
        message: 'Test staff creation completed',
        success: true,
        staff: {
          id: result.staff.id,
          name: result.staff.name,
          email: result.staff.email,
          role: result.staff.role,
          department: result.staff.department
        },
        emailSent: result.emailSent,
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          isRender: process.env.RENDER === 'true',
          isVercel: process.env.VERCEL === '1'
        },
        status: 'SUCCESS'
      };
    } catch (error) {
      console.error('❌ Test staff creation failed:', error);
      return {
        message: 'Test staff creation failed',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'ERROR'
      };
    }
  }

  // Reset to exactly 7 default staff members
  @Post('reset-to-default')
  async resetToDefaultStaff() {
    try {
      console.log('🔄 Resetting staff to exactly 7 default members...');
      const result = await this.staffService.resetToDefaultStaff();
      
      return {
        message: result.message,
        staffCount: result.staffCount,
        resetStaff: result.resetStaff,
        timestamp: new Date().toISOString(),
        operation: 'reset-to-default-7',
        status: 'SUCCESS'
      };
    } catch (error) {
      console.error('❌ Reset to default staff failed:', error);
      throw new BadRequestException(`Failed to reset staff: ${error.message}`);
    }
  }

  // Auto-cleanup staff to maintain 7 members
  @Post('auto-cleanup')
  async autoCleanupStaff() {
    try {
      console.log('🧹 Running automatic staff cleanup...');
      const result = await this.staffService.autoCleanupStaff();
      
      return {
        message: 'Automatic staff cleanup completed',
        cleaned: result.cleaned,
        maintained: result.maintained,
        timestamp: new Date().toISOString(),
        operation: 'auto-cleanup',
        status: 'SUCCESS'
      };
    } catch (error) {
      console.error('❌ Auto-cleanup failed:', error);
      throw new BadRequestException(`Failed to cleanup staff: ${error.message}`);
    }
  }

  // Maintain default staff count (manual trigger)
  @Post('maintain-default-count')
  async maintainDefaultStaffCount() {
    try {
      console.log('🔧 Manually triggering staff count maintenance...');
      await this.staffService.maintainDefaultStaffCount();
      
      const currentStaff = await this.staffService.getAllStaff();
      
      return {
        message: 'Staff count maintenance completed',
        currentStaffCount: currentStaff.length,
        defaultStaffMaintained: currentStaff.filter(s => [
          'gowthaamankrishna1998@gmail.com',
          'gowthaamaneswar1998@gmail.com', 
          'newacttmis@gmail.com',
          'dinesh@gmail.com',
          'tmsnunciya59@gmail.com',
          'admin@businessloan.com',
          'admin@gmail.com'
        ].includes(s.email)).length,
        timestamp: new Date().toISOString(),
        operation: 'maintain-default-count',
        status: 'SUCCESS'
      };
    } catch (error) {
      console.error('❌ Maintain default count failed:', error);
      throw new BadRequestException(`Failed to maintain staff count: ${error.message}`);
    }
  }

  // Get staff count status
  @Get('count-status')
  async getStaffCountStatus() {
    try {
      const allStaff = await this.staffService.getAllStaff();
      const defaultStaffEmails = [
        'gowthaamankrishna1998@gmail.com',
        'gowthaamaneswar1998@gmail.com', 
        'newacttmis@gmail.com',
        'dinesh@gmail.com',
        'tmsnunciya59@gmail.com',
        'admin@businessloan.com',
        'admin@gmail.com'
      ];
      
      const defaultStaff = allStaff.filter(s => defaultStaffEmails.includes(s.email));
      const nonDefaultStaff = allStaff.filter(s => !defaultStaffEmails.includes(s.email));
      
      return {
        message: 'Staff count status retrieved',
        totalStaff: allStaff.length,
        defaultStaff: defaultStaff.length,
        nonDefaultStaff: nonDefaultStaff.length,
        isOptimal: allStaff.length === 7 && defaultStaff.length === 7,
        needsCleanup: allStaff.length > 7,
        needsReset: defaultStaff.length < 7,
        nonDefaultStaffList: nonDefaultStaff.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          createdAt: s.createdAt
        })),
        timestamp: new Date().toISOString(),
        status: 'SUCCESS'
      };
    } catch (error) {
      console.error('❌ Get staff count status failed:', error);
      throw new BadRequestException(`Failed to get staff status: ${error.message}`);
    }
  }
}

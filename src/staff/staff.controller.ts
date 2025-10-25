import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, Res, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto, StaffRole } from './dto/staff.dto';

@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly configService: ConfigService
  ) {
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

  @Post('test/quick-gmail-test')
  async quickGmailTest(@Body() body: { email?: string }) {
    const testEmail = body.email || 'perivihari8@gmail.com';
    const isRender = process.env.RENDER === 'true';
    
    console.log('🚀 RENDER EMAIL TEST - SMART ROUTING');
    console.log(`📧 Testing email delivery to: ${testEmail}`);
    console.log(`🌐 Environment: ${isRender ? 'Render (SMTP often blocked)' : 'Local'}`);
    
    // Check SendGrid first (recommended for Render)
    const sendGridApiKey = process.env.SENDGRID_API_KEY || this.configService.get('SENDGRID_API_KEY');
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL || this.configService.get('SENDGRID_FROM_EMAIL');
    
    // Check Gmail credentials
    const gmailEmail = process.env.GMAIL_EMAIL || this.configService.get('GMAIL_EMAIL');
    const gmailPassword = process.env.GMAIL_APP_PASSWORD || this.configService.get('GMAIL_APP_PASSWORD');
    
    console.log(`📧 SendGrid API Key: ${sendGridApiKey ? 'SET (length: ' + sendGridApiKey.length + ')' : 'NOT SET'}`);
    console.log(`📧 SendGrid From Email: ${sendGridFromEmail || 'NOT SET'}`);
    console.log(`📧 Gmail Email: ${gmailEmail || 'NOT SET'}`);
    console.log(`🔐 Gmail Password: ${gmailPassword ? 'SET (length: ' + gmailPassword.length + ')' : 'NOT SET'}`);
    
    // For Render, prioritize SendGrid
    if (isRender && sendGridApiKey && sendGridFromEmail) {
      console.log('🌐 RENDER: Using SendGrid (SMTP is often blocked)');
      return this.testSendGridEmail(testEmail, sendGridApiKey, sendGridFromEmail);
    }
    
    // For local or if SendGrid not available, try Gmail
    if (!gmailEmail || !gmailPassword) {
      return {
        success: false,
        message: 'Email credentials not configured',
        details: {
          platform: isRender ? 'Render' : 'Local',
          sendGridConfigured: !!(sendGridApiKey && sendGridFromEmail),
          gmailConfigured: !!(gmailEmail && gmailPassword),
          recommendation: isRender ? 
            'Use SendGrid for Render deployment (SMTP often blocked)' : 
            'Configure Gmail or SendGrid credentials',
          instructions: isRender ? [
            '🌐 RENDER SETUP (Recommended):',
            '1. Sign up at https://app.sendgrid.com',
            '2. Verify sender identity: Settings > Sender Authentication',
            '3. Create API key: Settings > API Keys',
            '4. Set SENDGRID_API_KEY=SG.your-key in Render',
            '5. Set SENDGRID_FROM_EMAIL=your-verified@email.com',
            '6. Redeploy your Render service'
          ] : [
            'Set GMAIL_EMAIL environment variable',
            'Set GMAIL_APP_PASSWORD environment variable',
            'Make sure to use Gmail App Password (not regular password)'
          ]
        }
      };
    }

    try {
      // Create a simple nodemailer transporter
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailEmail,
          pass: gmailPassword,
        },
        // Render-specific optimizations
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        pool: false,
        maxConnections: 1,
      });

      console.log('📧 Transporter created, attempting to send email...');

      const mailOptions = {
        from: {
          name: 'Render Gmail Test',
          address: gmailEmail
        },
        to: testEmail,
        subject: '🧪 Render Gmail Test - Success!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">✅ Gmail Working on Render!</h2>
            <p>Congratulations! Your Gmail SMTP configuration is working correctly on Render.</p>
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin: 0; color: #059669;">Test Details:</h3>
              <ul style="margin: 10px 0;">
                <li><strong>Platform:</strong> Render</li>
                <li><strong>Service:</strong> Gmail SMTP</li>
                <li><strong>From:</strong> ${gmailEmail}</li>
                <li><strong>Time:</strong> ${new Date().toISOString()}</li>
                <li><strong>Status:</strong> SUCCESS</li>
              </ul>
            </div>
            <p>Your email system is now ready for production use!</p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              This test email was sent from your Business Loan Management System on Render.
            </p>
          </div>
        `
      };

      // Send with timeout
      const sendPromise = transporter.sendMail(mailOptions);
      const result = await Promise.race([
        sendPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email timeout (10s)')), 10000)
        )
      ]);

      console.log('✅ Email sent successfully!');
      console.log(`📧 Message ID: ${(result as any).messageId}`);

      return {
        success: true,
        message: 'Gmail test email sent successfully!',
        details: {
          recipient: testEmail,
          sender: gmailEmail,
          messageId: (result as any).messageId,
          timestamp: new Date().toISOString(),
          platform: 'Render',
          status: 'Email delivered successfully'
        }
      };

    } catch (error) {
      console.error('❌ Gmail test failed:', error.message);
      
      let errorMessage = error.message;
      let troubleshooting = [];

      if (error.code === 'EAUTH') {
        errorMessage = 'Gmail authentication failed';
        troubleshooting = [
          'Check if Gmail email is correct',
          'Verify Gmail App Password is correct (not regular password)',
          'Make sure 2-factor authentication is enabled on Gmail',
          'Generate a new App Password from Gmail settings'
        ];
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection failed - Render may be blocking SMTP';
        troubleshooting = [
          'Render may be blocking SMTP connections',
          'Consider using SendGrid instead of Gmail SMTP',
          'Check if Gmail SMTP is temporarily unavailable'
        ];
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Email sending timed out';
        troubleshooting = [
          'Network timeout occurred',
          'Render may have connection restrictions',
          'Try SendGrid for better Render compatibility'
        ];
      }

      return {
        success: false,
        message: `Gmail test failed: ${errorMessage}`,
        details: {
          error: error.message,
          code: error.code,
          troubleshooting: troubleshooting,
          timestamp: new Date().toISOString(),
          platform: 'Render'
        }
      };
    }
  }

  private async testSendGridEmail(testEmail: string, apiKey: string, fromEmail: string) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(apiKey);

      const msg = {
        to: testEmail,
        from: {
          email: fromEmail,
          name: 'Business Loan System - Render Test'
        },
        subject: '🚀 Render SendGrid Test - Success!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">✅ SendGrid Working on Render!</h2>
            <p>Congratulations! Your SendGrid email configuration is working correctly on Render.</p>
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin: 0; color: #059669;">Test Details:</h3>
              <ul style="margin: 10px 0;">
                <li><strong>Platform:</strong> Render</li>
                <li><strong>Service:</strong> SendGrid API</li>
                <li><strong>From:</strong> ${fromEmail}</li>
                <li><strong>Time:</strong> ${new Date().toISOString()}</li>
                <li><strong>Status:</strong> SUCCESS</li>
              </ul>
            </div>
            <p><strong>🎉 Your email system is now ready for production use!</strong></p>
            <p>SendGrid is the recommended email service for Render deployments because SMTP connections are often blocked.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              This test email was sent from your Business Loan Management System on Render using SendGrid.
            </p>
          </div>
        `
      };

      console.log('📧 Sending via SendGrid...');
      const result = await sgMail.send(msg);
      console.log('✅ SendGrid email sent successfully!');
      console.log(`📧 Response status: ${result[0]?.statusCode || 'Unknown'}`);

      return {
        success: true,
        message: 'SendGrid test email sent successfully!',
        details: {
          recipient: testEmail,
          sender: fromEmail,
          service: 'SendGrid API',
          statusCode: result[0]?.statusCode,
          messageId: result[0]?.headers?.['x-message-id'],
          timestamp: new Date().toISOString(),
          platform: 'Render',
          status: 'Email delivered via SendGrid'
        }
      };
    } catch (error) {
      console.error('❌ SendGrid test failed:', error.message);
      
      let errorMessage = error.message;
      let troubleshooting = [];

      if (error.response?.body?.errors) {
        const errors = error.response.body.errors;
        console.error('📧 SendGrid API errors:', JSON.stringify(errors, null, 2));
        
        const senderError = errors.find(err => 
          err.message?.includes('verified Sender Identity') || 
          err.field === 'from'
        );
        
        if (senderError) {
          errorMessage = 'Sender identity not verified';
          troubleshooting = [
            '🔧 SENDGRID SENDER VERIFICATION REQUIRED:',
            '1. Go to https://app.sendgrid.com/settings/sender_auth',
            '2. Click "Verify a Single Sender"',
            '3. Add your email address and verify it',
            '4. Update SENDGRID_FROM_EMAIL to the verified email',
            '5. Redeploy your Render service'
          ];
        }
      }

      if (error.code === 401 || error.code === 403) {
        errorMessage = 'SendGrid API key invalid or unauthorized';
        troubleshooting = [
          'Check if SENDGRID_API_KEY is correct',
          'Verify API key has Full Access permissions',
          'Generate a new API key if needed'
        ];
      }

      return {
        success: false,
        message: `SendGrid test failed: ${errorMessage}`,
        details: {
          error: error.message,
          code: error.code,
          troubleshooting: troubleshooting,
          timestamp: new Date().toISOString(),
          platform: 'Render',
          recommendation: 'Fix SendGrid configuration and try again'
        }
      };
    }
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
      // Pass admin@gmail.com as the current user since only this user can manage staff
      const result = await this.staffService.createStaff(createStaffDto, 'admin@gmail.com');
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
      // Pass admin@gmail.com as the current user since only this user can manage staff
      await this.staffService.deleteStaff(parseInt(id), 'admin@gmail.com');
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

  @Post('test/poorani-email')
  async testPooraniEmail() {
    try {
      console.log('🧪 [RENDER] Testing Poorani email delivery...');
      
      // Find Poorani in staff list (ID 8 based on staff service)
      const pooraniId = 8; // Poorani's ID from staff service
      const pooraniStaff = await this.staffService.getStaffById(pooraniId);
      
      if (!pooraniStaff) {
        return {
          success: false,
          message: 'Poorani not found in staff list',
          email: 'gowthaamaneswar98@gmail.com',
          expectedId: pooraniId,
          timestamp: new Date().toISOString()
        };
      }

      console.log('📧 [RENDER] Found Poorani, attempting email delivery...');
      
      // Test email delivery
      const result = await this.staffService.resendVerificationEmail(pooraniStaff.id);
      
      return {
        success: result.emailSent,
        message: result.emailSent ? 'Email sent successfully to Poorani' : 'Email delivery failed - check logs for details',
        staff: {
          id: result.staff.id,
          name: result.staff.name,
          email: result.staff.email,
          status: result.staff.status,
          role: result.staff.role
        },
        emailSent: result.emailSent,
        timestamp: new Date().toISOString(),
        renderEnvironment: {
          isRender: process.env.RENDER === 'true',
          nodeEnv: process.env.NODE_ENV,
          sendGridConfigured: !!process.env.SENDGRID_API_KEY,
          fromEmailConfigured: !!process.env.SENDGRID_FROM_EMAIL
        }
      };
    } catch (error) {
      console.error('❌ [RENDER] Poorani email test failed:', error);
      return {
        success: false,
        message: 'Poorani email test failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        renderEnvironment: {
          isRender: process.env.RENDER === 'true',
          nodeEnv: process.env.NODE_ENV,
          sendGridConfigured: !!process.env.SENDGRID_API_KEY,
          fromEmailConfigured: !!process.env.SENDGRID_FROM_EMAIL
        }
      };
    }
  }

  @Get('test/render-config')
  async testRenderConfig() {
    try {
      console.log('🔍 [RENDER] Checking environment configuration...');
      return {
        message: 'Render Environment Configuration Check',
        environment: {
          isRender: process.env.RENDER === 'true',
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT,
        },
        sendGrid: {
          apiKeyConfigured: !!process.env.SENDGRID_API_KEY,
          apiKeyPreview: process.env.SENDGRID_API_KEY ? `${process.env.SENDGRID_API_KEY.substring(0, 8)}...` : 'Not set',
          fromEmailConfigured: !!process.env.SENDGRID_FROM_EMAIL,
          fromEmail: process.env.SENDGRID_FROM_EMAIL || 'Not set'
        },
        gmail: {
          emailConfigured: !!process.env.GMAIL_EMAIL,
          email: process.env.GMAIL_EMAIL || 'Not set',
          passwordConfigured: !!process.env.GMAIL_APP_PASSWORD,
          passwordPreview: process.env.GMAIL_APP_PASSWORD ? `${process.env.GMAIL_APP_PASSWORD.substring(0, 4)}****` : 'Not set'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking Render config:', error);
      throw new BadRequestException(`Failed to check config: ${error.message}`);
    }
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
  @Post('test/deployment-login')
  async testDeploymentLogin(@Body() body: { email?: string, password?: string }) {
    try {
      const testEmail = body.email || 'gowthaamankrishna1998@gmail.com';
      const testPassword = body.password || '12345678';
      
      console.log('🚀 Testing deployment login for:', testEmail);
      console.log('🌍 Environment check:', {
        nodeEnv: process.env.NODE_ENV || 'development',
        isVercel: process.env.VERCEL === '1',
        isRender: process.env.RENDER === 'true',
        hasJwtSecret: !!process.env.JWT_SECRET
      });
      
      // Test staff authentication directly
      const authResult = await this.staffService.authenticateStaff(testEmail, testPassword);
      
      if (!authResult) {
        return {
          message: 'Deployment login test failed',
          success: false,
          error: 'Invalid credentials or staff not found',
          testCredentials: {
            email: testEmail,
            passwordLength: testPassword.length
          },
          availableStaff: await this.getAvailableStaffEmails(),
          timestamp: new Date().toISOString(),
          status: 'FAILED'
        };
      }
      
      return {
        message: 'Deployment login test successful',
        success: true,
        staff: {
          id: authResult.staff.id,
          name: authResult.staff.name,
          email: authResult.staff.email,
          role: authResult.staff.role,
          department: authResult.staff.department,
          hasAccess: authResult.staff.hasAccess,
          verified: authResult.staff.verified
        },
        authToken: {
          provided: !!authResult.authToken,
          length: authResult.authToken?.length || 0
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          isVercel: process.env.VERCEL === '1',
          isRender: process.env.RENDER === 'true',
          deployment: process.env.VERCEL === '1' ? 'Vercel' : 
                     process.env.RENDER === 'true' ? 'Render' : 'Local'
        },
        timestamp: new Date().toISOString(),
        status: 'SUCCESS'
      };
    } catch (error) {
      console.error('❌ Deployment login test failed:', error);
      return {
        message: 'Deployment login test error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'ERROR'
      };
    }
  }

  private async getAvailableStaffEmails() {
    try {
      const allStaff = await this.staffService.getAllStaff();
      return allStaff.map(staff => ({
        email: staff.email,
        name: staff.name,
        role: staff.role,
        hasAccess: staff.hasAccess,
        verified: staff.verified
      }));
    } catch (error) {
      return [];
    }
  }

  @Post('test/sendgrid-only')
  async testSendGridOnly(@Body() body: { email?: string }) {
    const testEmail = body.email || 'perivihari8@gmail.com';
    
    console.log('📧 TESTING SENDGRID FOR RENDER...');
    console.log(`📧 Test email: ${testEmail}`);
    
    const sendGridApiKey = process.env.SENDGRID_API_KEY || this.configService.get('SENDGRID_API_KEY');
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL || this.configService.get('SENDGRID_FROM_EMAIL');
    
    if (!sendGridApiKey || !sendGridFromEmail) {
      return {
        success: false,
        message: 'SendGrid not configured',
        details: {
          apiKey: !!sendGridApiKey,
          fromEmail: sendGridFromEmail || 'NOT SET',
          instructions: [
            '🔧 SENDGRID SETUP FOR RENDER:',
            '1. Sign up at https://app.sendgrid.com (free tier available)',
            '2. Go to Settings > Sender Authentication',
            '3. Click "Verify a Single Sender"',
            '4. Add and verify your email address',
            '5. Go to Settings > API Keys > Create API Key',
            '6. Set environment variables in Render:',
            '   - SENDGRID_API_KEY=SG.your-api-key',
            '   - SENDGRID_FROM_EMAIL=your-verified@email.com',
            '7. Redeploy your Render service'
          ]
        }
      };
    }
    
    return this.testSendGridEmail(testEmail, sendGridApiKey, sendGridFromEmail);
  }

  @Post('test/render-email-comprehensive')
  async testRenderEmailComprehensive(@Body() body: { email?: string }) {
    try {
      const testEmail = body.email || 'perivihari8@gmail.com';
      console.log('🧪 RENDER COMPREHENSIVE EMAIL TEST STARTING...');
      console.log(`📧 Test email: ${testEmail}`);
      
      // Import the test service
      const { RenderEmailTestService } = await import('./render-email-test.service');
      const testService = new RenderEmailTestService(this.configService);
      
      // Run comprehensive test
      const testResults = await testService.runComprehensiveTest(testEmail);
      
      // Get service status
      const serviceStatus = testService.getEmailServiceStatus();
      
      return {
        message: 'Render comprehensive email test completed',
        testEmail: testEmail,
        results: testResults,
        serviceStatus: serviceStatus,
        timestamp: new Date().toISOString(),
        overallStatus: testResults.sendGrid.success || testResults.gmailSMTP.success ? 'SUCCESS' : 'FAILED'
      };
    } catch (error) {
      console.error('❌ Comprehensive email test failed:', error);
      return {
        message: 'Comprehensive email test failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'ERROR'
      };
    }
  }

  @Post('test/render-sendgrid-only')
  async testRenderSendGridOnly(@Body() body: { email?: string }) {
    try {
      const testEmail = body.email || 'perivihari8@gmail.com';
      console.log('📧 RENDER SENDGRID TEST...');
      console.log(`📧 Test email: ${testEmail}`);
      
      // Import the test service
      const { RenderEmailTestService } = await import('./render-email-test.service');
      const testService = new RenderEmailTestService(this.configService);
      
      // Test SendGrid only
      const sendGridResult = await testService.testSendGridEmail(testEmail);
      
      return {
        message: 'SendGrid test completed',
        testEmail: testEmail,
        sendGrid: sendGridResult,
        timestamp: new Date().toISOString(),
        status: sendGridResult.success ? 'SUCCESS' : 'FAILED'
      };
    } catch (error) {
      console.error('❌ SendGrid test failed:', error);
      return {
        message: 'SendGrid test failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'ERROR'
      };
    }
  }

  @Post('test/render-gmail-only')
  async testRenderGmailOnly(@Body() body: { email?: string }) {
    try {
      const testEmail = body.email || 'perivihari8@gmail.com';
      console.log('📧 RENDER GMAIL SMTP TEST...');
      console.log(`📧 Test email: ${testEmail}`);
      
      // Import the test service
      const { RenderEmailTestService } = await import('./render-email-test.service');
      const testService = new RenderEmailTestService(this.configService);
      
      // Test Gmail SMTP only
      const gmailResult = await testService.testGmailSMTP(testEmail);
      
      return {
        message: 'Gmail SMTP test completed',
        testEmail: testEmail,
        gmailSMTP: gmailResult,
        timestamp: new Date().toISOString(),
        status: gmailResult.success ? 'SUCCESS' : 'FAILED'
      };
    } catch (error) {
      console.error('❌ Gmail SMTP test failed:', error);
      return {
        message: 'Gmail SMTP test failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'ERROR'
      };
    }
  }

  @Get('test/email-config-status')
  async getEmailConfigStatus() {
    try {
      console.log('🔍 RENDER EMAIL CONFIG STATUS CHECK...');
      
      // Import the test service
      const { RenderEmailTestService } = await import('./render-email-test.service');
      const testService = new RenderEmailTestService(this.configService);
      
      // Get service status
      const serviceStatus = testService.getEmailServiceStatus();
      
      return {
        message: 'Email configuration status retrieved',
        config: serviceStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Email config status check failed:', error);
      return {
        message: 'Email config status check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

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

  // Get all staff with their assigned enquiries for management table
  @Get('management/with-enquiries')
  async getAllStaffWithEnquiries() {
    try {
      console.log('📋 Getting all staff with assigned enquiries for management table...');
      return await this.staffService.getAllStaffWithEnquiries();
    } catch (error) {
      console.error('❌ Get staff with enquiries failed:', error);
      throw new BadRequestException(`Failed to get staff with enquiries: ${error.message}`);
    }
  }

  // Get real-time staff dashboard data for automatic updates
  @Get('dashboard/live-data')
  async getLiveStaffDashboardData() {
    try {
      console.log('📊 Getting live staff dashboard data for automatic updates...');
      
      const staffWithEnquiries = await this.staffService.getAllStaffWithEnquiries();
      
      // Add summary statistics
      const totalStaff = staffWithEnquiries.length;
      const totalAssignedEnquiries = staffWithEnquiries.reduce((sum, staff) => sum + staff.assignedEnquiries, 0);
      const staffWithAssignments = staffWithEnquiries.filter(staff => staff.assignedEnquiries > 0).length;
      const availableStaff = staffWithEnquiries.filter(staff => staff.assignedEnquiries === 0).length;
      
      return {
        timestamp: new Date().toISOString(),
        summary: {
          totalStaff,
          totalAssignedEnquiries,
          staffWithAssignments,
          availableStaff
        },
        staffData: staffWithEnquiries.map(staff => ({
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          department: staff.department,
          status: staff.status,
          assignedEnquiries: staff.assignedEnquiries,
          clientNamesDisplay: staff.clientNamesDisplay,
          lastUpdated: staff.updatedAt || staff.createdAt
        }))
      };
    } catch (error) {
      console.error('❌ Get live staff dashboard data failed:', error);
      throw new BadRequestException(`Failed to get live dashboard data: ${error.message}`);
    }
  }

  // Get staff assignment changes for polling (frontend can call this every few seconds)
  @Get('dashboard/changes/:timestamp')
  async getStaffAssignmentChanges(@Param('timestamp') lastUpdate: string) {
    try {
      console.log('🔄 Checking for staff assignment changes since:', lastUpdate);
      
      const lastUpdateTime = new Date(lastUpdate);
      const currentData = await this.staffService.getAllStaffWithEnquiries();
      
      // Filter staff that have been updated since the last check
      const changedStaff = currentData.filter(staff => {
        const staffUpdateTime = new Date(staff.updatedAt || staff.createdAt);
        return staffUpdateTime > lastUpdateTime;
      });
      
      return {
        timestamp: new Date().toISOString(),
        hasChanges: changedStaff.length > 0,
        changedStaff: changedStaff.map(staff => ({
          id: staff.id,
          name: staff.name,
          assignedEnquiries: staff.assignedEnquiries,
          clientNamesDisplay: staff.clientNamesDisplay,
          lastUpdated: staff.updatedAt || staff.createdAt
        })),
        summary: {
          totalChanges: changedStaff.length,
          lastCheckTime: lastUpdate
        }
      };
    } catch (error) {
      console.error('❌ Get staff assignment changes failed:', error);
      throw new BadRequestException(`Failed to get assignment changes: ${error.message}`);
    }
  }

  // Test staff sync to Supabase for Render deployment
  @Post('test-supabase-sync/:id')
  async testStaffSupabaseSync(@Param('id') staffId: string) {
    try {
      console.log(`🚀 [RENDER] Testing Supabase sync for staff ID: ${staffId}`);
      
      const staffData = await this.staffService.getStaffById(parseInt(staffId));
      if (!staffData) {
        throw new BadRequestException(`Staff member with ID ${staffId} not found`);
      }
      
      // Get the full staff entity for sync (including password)
      const allStaff = await this.staffService.getAllStaff();
      const fullStaff = allStaff.find(s => s.id === parseInt(staffId));
      
      if (!fullStaff) {
        throw new BadRequestException(`Full staff data not found for ID ${staffId}`);
      }
      
      // Force sync to Supabase using internal method
      await this.staffService.syncStaffToSupabaseWithRetry(fullStaff as any, 3);
      
      console.log(`✅ [RENDER] Staff sync test completed for: ${staffData.email}`);
      
      return {
        success: true,
        message: `Staff ${staffData.name} synced to Supabase successfully`,
        staff: {
          id: staffData.id,
          name: staffData.name,
          email: staffData.email,
          role: staffData.role,
          hasAccess: staffData.hasAccess,
          verified: staffData.verified
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [RENDER] Staff sync test failed:`, error);
      throw new BadRequestException(`Staff sync test failed: ${error.message}`);
    }
  }

  // Manually activate staff member (if email verification fails)
  @Post('manual-activate/:id')
  async manuallyActivateStaff(@Param('id') staffId: string) {
    try {
      console.log(`🚀 [RENDER] Manually activating staff ID: ${staffId}`);
      
      const staffData = await this.staffService.getStaffById(parseInt(staffId));
      if (!staffData) {
        throw new BadRequestException(`Staff member with ID ${staffId} not found`);
      }
      
      // Get the full staff entity for activation
      const allStaff = await this.staffService.getAllStaff();
      const fullStaff = allStaff.find(s => s.id === parseInt(staffId));
      
      if (!fullStaff) {
        throw new BadRequestException(`Full staff data not found for ID ${staffId}`);
      }
      
      // Manually activate the staff member
      await this.staffService.manuallyActivateStaff(parseInt(staffId));
      
      console.log(`✅ [RENDER] Staff manually activated: ${staffData.email}`);
      
      return {
        success: true,
        message: `Staff ${staffData.name} activated successfully`,
        staff: {
          id: staffData.id,
          name: staffData.name,
          email: staffData.email,
          role: staffData.role,
          status: 'ACTIVE',
          hasAccess: true,
          verified: true
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [RENDER] Manual activation failed:`, error);
      throw new BadRequestException(`Manual activation failed: ${error.message}`);
    }
  }

  // Send verification email to staff member for activation
  @Post('send-verification/:id')
  async sendVerificationEmail(@Param('id') staffId: string) {
    try {
      console.log(`📧 [RENDER] Sending verification email for staff ID: ${staffId}`);
      
      const result = await this.staffService.resendVerificationEmail(parseInt(staffId));
      
      console.log(`✅ [RENDER] Verification email sent to: ${result.staff.email}`);
      
      return {
        success: true,
        message: `Verification email sent to ${result.staff.name}`,
        staff: {
          id: result.staff.id,
          name: result.staff.name,
          email: result.staff.email,
          role: result.staff.role,
          status: result.staff.status
        },
        emailSent: result.emailSent,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ [RENDER] Failed to send verification email:`, error);
      throw new BadRequestException(`Failed to send verification email: ${error.message}`);
    }
  }

  // Grant access to all staff for Render deployment
  @Post('grant-access-all')
  async grantAccessToAllStaff() {
    try {
      console.log('🚀 [RENDER] Granting access to all staff for immediate login...');
      
      const result = await this.staffService.grantAccessToAllStaff();
      
      console.log(`✅ [RENDER] Access granted to ${result.updated} staff members`);
      
      return {
        success: true,
        message: `Access granted to ${result.updated} staff members`,
        updated: result.updated,
        staff: result.staff,
        timestamp: new Date().toISOString(),
        platform: process.env.RENDER === 'true' ? 'Render' : 'Local'
      };
    } catch (error) {
      console.error('❌ [RENDER] Failed to grant access to all staff:', error);
      throw new BadRequestException(`Failed to grant access: ${error.message}`);
    }
  }

}

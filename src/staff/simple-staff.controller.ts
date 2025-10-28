import { Controller, Post, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { SimpleStaffService } from './simple-staff.service';
import { CreateStaffDto } from './dto/staff.dto';
import { ProfessionalEmailService } from './professional-email.service';
import { ConfigService } from '@nestjs/config';

@Controller('simple-staff')
export class SimpleStaffController {
  private professionalEmailService: ProfessionalEmailService;

  constructor(
    private simpleStaffService: SimpleStaffService,
    private configService: ConfigService
  ) {
    this.professionalEmailService = new ProfessionalEmailService(configService);
  }

  @Post()
  async createStaff(@Body() createStaffDto: CreateStaffDto) {
    try {
      console.log('🔄 Creating staff:', createStaffDto.name);
      const result = await this.simpleStaffService.createStaff(createStaffDto);
      
      return {
        message: 'Staff created successfully',
        staff: result.staff,
        emailSent: result.emailSent,
        verificationRequired: result.verificationRequired,
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
      const staff = await this.simpleStaffService.getAllStaff();
      return {
        message: 'Staff retrieved successfully',
        staff,
        count: staff.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting staff:', error);
      throw new BadRequestException(`Failed to get staff: ${error.message}`);
    }
  }

  @Get(':id')
  async getStaffById(@Param('id') id: string) {
    try {
      const staff = await this.simpleStaffService.getStaffById(+id);
      if (!staff) {
        throw new BadRequestException('Staff member not found');
      }
      
      return {
        message: 'Staff retrieved successfully',
        staff,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting staff by ID:', error);
      throw new BadRequestException(`Failed to get staff: ${error.message}`);
    }
  }

  @Post('activate/:id')
  async activateStaff(@Param('id') id: string) {
    try {
      console.log('🚀 Activating staff member:', id);
      const result = await this.simpleStaffService.activateStaff(+id);
      
      return {
        message: 'Staff activated successfully',
        staff: result.staff,
        activated: result.activated,
        canLogin: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error activating staff:', error);
      throw new BadRequestException(`Failed to activate staff: ${error.message}`);
    }
  }

  @Post('login')
  async loginStaff(@Body() loginDto: { email: string; password: string }) {
    try {
      console.log('🔐 Staff login attempt:', loginDto.email);
      const result = await this.simpleStaffService.authenticateStaff(loginDto.email, loginDto.password);
      
      if (!result) {
        throw new BadRequestException('Invalid credentials or staff not activated');
      }
      
      return {
        message: 'Login successful',
        access_token: result.authToken,
        user: {
          id: result.staff.id,
          email: result.staff.email,
          name: result.staff.name,
          role: result.staff.role
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error during staff login:', error);
      throw new BadRequestException(`Login failed: ${error.message}`);
    }
  }

  @Post('send-verification/:id')
  async sendVerificationEmail(@Param('id') id: string) {
    try {
      console.log('📧 Sending verification email for staff:', id);
      const emailSent = await this.simpleStaffService.sendVerificationEmail(+id);
      
      return {
        message: emailSent ? 'Verification email sent successfully' : 'Failed to send verification email',
        emailSent,
        instructions: emailSent ? 
          'Check your inbox (not spam folder) for the verification email' :
          'Email service not configured. Check Gmail credentials.',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new BadRequestException(`Failed to send verification email: ${error.message}`);
    }
  }

  @Post('test-email')
  async testEmailDelivery(@Body() body: { email: string; name?: string }) {
    try {
      console.log('📧 Testing email delivery to:', body.email);
      
      const result = await this.professionalEmailService.testEmailDelivery(
        body.email,
        body.name || 'Test User'
      );
      
      return {
        message: 'Email delivery test completed',
        result,
        timestamp: new Date().toISOString(),
        instructions: result.success ? 
          'Check your inbox (not spam folder) for the test email' :
          'Email failed - check Gmail credentials: GMAIL_EMAIL and GMAIL_APP_PASSWORD'
      };
    } catch (error) {
      console.error('Error testing email delivery:', error);
      throw new BadRequestException(`Email test failed: ${error.message}`);
    }
  }

  @Get('email/setup-instructions')
  async getSetupInstructions() {
    return {
      title: 'Gmail Email Setup Instructions for Render Deployment',
      steps: [
        {
          step: 1,
          title: 'Enable 2-Factor Authentication',
          description: 'Go to your Google Account settings and enable 2FA',
          url: 'https://myaccount.google.com/security'
        },
        {
          step: 2,
          title: 'Generate App Password',
          description: 'Go to Security > App Passwords > Generate password for Mail',
          note: 'You need 2FA enabled first'
        },
        {
          step: 3,
          title: 'Set Environment Variables in Render',
          description: 'Add these in your Render dashboard environment variables',
          variables: {
            GMAIL_EMAIL: 'your-business-email@gmail.com',
            GMAIL_APP_PASSWORD: 'your-16-character-app-password',
            RENDER: 'true',
            NODE_ENV: 'production'
          }
        },
        {
          step: 4,
          title: 'Test Email Delivery',
          description: 'Use POST /api/simple-staff/test-email to verify setup',
          example: {
            email: 'test@gmail.com',
            name: 'Test User'
          }
        }
      ],
      renderDeployment: {
        title: 'Render Deployment Steps',
        instructions: [
          '1. Push code to GitHub repository',
          '2. Connect repository to Render',
          '3. Set environment variables in Render dashboard',
          '4. Deploy and test email functionality',
          '5. Staff can receive verification emails in inbox'
        ]
      },
      troubleshooting: [
        'Make sure to use App Password, not regular Gmail password',
        'App Password should be 16 characters without spaces',
        'Check that 2FA is enabled on your Gmail account',
        'Verify environment variables are set correctly in Render',
        'Test with a real Gmail address first'
      ]
    };
  }

  @Post('reset-to-default')
  async resetToDefaultStaff() {
    try {
      const result = await this.simpleStaffService.resetToDefaultStaff();
      
      return {
        message: 'Staff reset to 7 default members successfully',
        staff: result.staff,
        count: result.count,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new BadRequestException(`Failed to reset staff: ${error.message}`);
    }
  }
}

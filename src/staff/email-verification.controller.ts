import { Controller, Post, Body, BadRequestException, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfessionalEmailService } from './professional-email.service';
import { StaffRole } from './dto/staff.dto';

@Controller('staff/email')
export class EmailVerificationController {
  private professionalEmailService: ProfessionalEmailService;

  constructor(private configService: ConfigService) {
    this.professionalEmailService = new ProfessionalEmailService(configService);
  }

  @Post('send-verification')
  async sendVerificationEmail(@Body() body: {
    email: string;
    name: string;
    role: StaffRole;
    staffId: number;
  }) {
    try {
      console.log('📧 Sending verification email to:', body.email);

      // Generate verification link
      const backendUrl = this.configService.get('BACKEND_URL') || 
                        `https://${process.env.RENDER_SERVICE_NAME || 'business-loan-backend'}.onrender.com`;
      const verificationToken = `staff-${body.staffId}-${Date.now()}`;
      const verificationLink = `${backendUrl}/api/staff/verify-access/${verificationToken}`;

      // Send professional email
      const emailSent = await this.professionalEmailService.sendStaffVerificationEmail(
        body.email,
        body.name,
        verificationLink,
        body.role,
        body.staffId
      );

      if (emailSent) {
        return {
          success: true,
          message: 'Verification email sent successfully',
          email: body.email,
          verificationLink: verificationLink,
          instructions: 'Check your inbox (not spam folder) for the verification email',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          message: 'Failed to send verification email',
          error: 'Email service not configured or Gmail credentials missing',
          instructions: 'Set GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new BadRequestException(`Email sending failed: ${error.message}`);
    }
  }

  @Post('test-delivery')
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

  @Get('setup-instructions')
  async getSetupInstructions() {
    return {
      title: 'Gmail Email Setup Instructions',
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
          title: 'Set Environment Variables',
          description: 'Set these in your Render dashboard or .env file',
          variables: {
            GMAIL_EMAIL: 'your-business-email@gmail.com',
            GMAIL_APP_PASSWORD: 'your-16-character-app-password'
          }
        },
        {
          step: 4,
          title: 'Test Email Delivery',
          description: 'Use POST /api/staff/email/test-delivery to verify setup',
          example: {
            email: 'test@gmail.com',
            name: 'Test User'
          }
        }
      ],
      troubleshooting: [
        'Make sure to use App Password, not regular Gmail password',
        'App Password should be 16 characters without spaces',
        'Check that 2FA is enabled on your Gmail account',
        'Verify environment variables are set correctly in Render'
      ]
    };
  }
}

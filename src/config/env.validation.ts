import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EnvironmentValidationService {
  private readonly logger = new Logger(EnvironmentValidationService.name);

  validateCriticalEnvironmentVariables(): void {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      this.logger.error(`Missing critical environment variables: ${missingVars.join(', ')}`);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      this.logger.warn('JWT_SECRET is shorter than recommended 32 characters');
    }

    this.logger.log('✅ All critical environment variables validated');
  }

  validateOptionalVariables(): void {
    const optionalVars = {
      'GMAIL_EMAIL': 'Email service may not work',
      'GMAIL_APP_PASSWORD': 'Email service may not work',
      'SENDGRID_API_KEY': 'SendGrid email service may not work',
      'ALLOWED_ORIGINS': 'CORS will use default origins',
    };

    Object.entries(optionalVars).forEach(([varName, warning]) => {
      if (!process.env[varName]) {
        this.logger.warn(`Optional variable ${varName} not set: ${warning}`);
      }
    });
  }
}

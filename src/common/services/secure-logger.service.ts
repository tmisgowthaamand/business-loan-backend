import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SecureLoggerService {
  private readonly logger = new Logger(SecureLoggerService.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  // Sensitive data patterns to filter out
  private readonly sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /auth/i,
    /credential/i,
    /email.*@/i,
    /phone.*\d{10}/i,
  ];

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Check for sensitive patterns
      for (const pattern of this.sensitivePatterns) {
        if (pattern.test(data)) {
          return '[REDACTED]';
        }
      }
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {};
      for (const [key, value] of Object.entries(data)) {
        // Check if key contains sensitive information
        const isSensitiveKey = this.sensitivePatterns.some(pattern => pattern.test(key));
        sanitized[key] = isSensitiveKey ? '[REDACTED]' : this.sanitizeData(value);
      }
      return sanitized;
    }

    return data;
  }

  secureLog(message: string, data?: any): void {
    if (this.isProduction) {
      // In production, only log essential information
      this.logger.log(message);
    } else {
      // In development, log sanitized data
      const sanitizedData = data ? this.sanitizeData(data) : undefined;
      this.logger.log(message, sanitizedData);
    }
  }

  secureError(message: string, error?: any): void {
    if (this.isProduction) {
      // In production, log error message without stack trace
      this.logger.error(message);
    } else {
      // In development, log full error details
      this.logger.error(message, error);
    }
  }

  secureWarn(message: string, data?: any): void {
    if (this.isProduction) {
      this.logger.warn(message);
    } else {
      const sanitizedData = data ? this.sanitizeData(data) : undefined;
      this.logger.warn(message, sanitizedData);
    }
  }
}

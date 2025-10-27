/**
 * Production-safe logging utility
 * Prevents sensitive data from being logged in production
 */
export class SecureLogger {
  private static isProduction = process.env.NODE_ENV === 'production';

  static log(message: string, data?: any) {
    if (!this.isProduction) {
      console.log(message, data);
    }
  }

  static error(message: string, error?: any) {
    if (this.isProduction) {
      // In production, log only the message without sensitive data
      console.error(message);
    } else {
      console.error(message, error);
    }
  }

  static warn(message: string, data?: any) {
    if (!this.isProduction) {
      console.warn(message, data);
    }
  }

  static debug(message: string, data?: any) {
    if (!this.isProduction) {
      console.debug(message, data);
    }
  }

  /**
   * Safe logging for authentication events
   * Logs only non-sensitive information in production
   */
  static authLog(message: string, email?: string, additionalData?: any) {
    if (this.isProduction) {
      console.log(`AUTH: ${message} for user: ${email ? email.substring(0, 3) + '***' : 'unknown'}`);
    } else {
      console.log(`AUTH: ${message}`, { email, ...additionalData });
    }
  }

  /**
   * Safe logging for API requests
   * Removes sensitive headers and data in production
   */
  static apiLog(method: string, url: string, statusCode?: number) {
    if (this.isProduction) {
      console.log(`API: ${method} ${url} - ${statusCode || 'pending'}`);
    } else {
      console.log(`API: ${method} ${url} - ${statusCode || 'pending'}`);
    }
  }
}

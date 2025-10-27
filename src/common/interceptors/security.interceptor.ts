import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Add security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Remove sensitive headers
    response.removeHeader('X-Powered-By');
    response.removeHeader('Server');

    return next.handle().pipe(
      map((data) => {
        // Remove sensitive data from responses in production
        if (process.env.NODE_ENV === 'production' && data) {
          return this.sanitizeResponse(data);
        }
        return data;
      }),
    );
  }

  private sanitizeResponse(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    // Remove sensitive fields from responses
    const sensitiveFields = ['password', 'passwordHash', 'accessToken', 'refreshToken', 'secret'];
    const sanitized = { ...data };

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeResponse(sanitized[key]);
      }
    });

    return sanitized;
  }
}

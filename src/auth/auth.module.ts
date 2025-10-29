import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { DemoAuthController } from './demo-auth.controller';
import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';
import { JwtStrategy } from './strategy';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    PassportModule,
    forwardRef(() => SupabaseModule),
    forwardRef(() => StaffModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const jwtSecret = config.get('JWT_SECRET') || 'demo-secret-key-change-in-production-use-strong-random-key-at-least-32-characters-long';
        
        return {
          secret: jwtSecret,
          signOptions: { 
            expiresIn: '8h', // Reduced from 1 day for better security
            issuer: 'business-loan-backend',
            audience: 'business-loan-frontend',
            algorithm: 'HS256'
          },
          verifyOptions: {
            issuer: 'business-loan-backend',
            audience: 'business-loan-frontend',
            algorithms: ['HS256']
          }
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [DemoAuthController], // Using demo controller for testing
  providers: [AuthService, SupabaseAuthService, JwtStrategy, PrismaService],
  exports: [AuthService, JwtStrategy], // Export services that other modules might need
})
export class AuthModule {}

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

@Module({
  imports: [
    PassportModule,
    forwardRef(() => SupabaseModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'demo-secret-key',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DemoAuthController], // Using demo controller for testing
  providers: [AuthService, SupabaseAuthService, JwtStrategy, PrismaService],
  exports: [AuthService, JwtStrategy], // Export services that other modules might need
})
export class AuthModule {}

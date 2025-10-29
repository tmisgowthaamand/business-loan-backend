import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StaffService } from '../staff/staff.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as nodemailer from 'nodemailer';
import { SignupDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private staffService: StaffService,
  ) {}

  async signup(dto: SignupDto) {
    const hash = await bcrypt.hash(dto.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash: hash,
          role: dto.role as any,
        },
      });

      return this.signToken(user.id, user.email, user.role);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('Email already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    console.log('🔐 RENDER DEPLOYMENT - Auth service login called with:', dto.email);
    console.log('🌍 Environment:', {
      nodeEnv: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1',
      isRender: process.env.RENDER === 'true'
    });
    
    try {
      // Use staff service to authenticate
      console.log('🔍 Attempting staff authentication for:', dto.email);
      const authResult = await this.staffService.authenticateStaff(dto.email, dto.password);
      
      if (!authResult) {
        console.log('❌ Invalid credentials for:', dto.email);
        console.log('🔍 Available staff emails:', await this.getAvailableStaffEmails());
        throw new ForbiddenException('Invalid credentials. Please check your email and password.');
      }

      console.log('✅ Staff authenticated successfully:', authResult.staff.name, '- Ready for Render deployment');
      
      // Return the auth token and user data in the expected format
      const response = {
        access_token: authResult.authToken,
        user: {
          id: authResult.staff.id,
          name: authResult.staff.name,
          email: authResult.staff.email,
          role: authResult.staff.role,
          department: authResult.staff.department,
          status: authResult.staff.status
        }
      };
      
      console.log('🚀 RENDER DEPLOYMENT - Login successful:', {
        user: response.user.name,
        role: response.user.role,
        department: response.user.department,
        hasToken: !!response.access_token,
        tokenLength: response.access_token?.length || 0
      });
      
      return response;
    } catch (error) {
      console.error('❌ RENDER DEPLOYMENT - Login error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        email: dto.email
      });
      
      // Enhanced error handling for deployments
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new ForbiddenException('Authentication failed. Please try again.');
    }
  }

  private async getAvailableStaffEmails(): Promise<string[]> {
    try {
      const allStaff = await this.staffService.getAllStaff();
      return allStaff.map(staff => staff.email);
    } catch (error) {
      console.log('Could not get staff emails:', error);
      return [];
    }
  }

  async sendInvite(email: string) {
    const token = this.jwt.sign({ email }, { expiresIn: '1h' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get('GMAIL_USER'),
        pass: this.config.get('GMAIL_APP_PASSWORD'),
      },
    });

    await transporter.sendMail({
      from: this.config.get('GMAIL_USER'),
      to: email,
      subject: 'Invitation to Business Loan System',
      text: `Click to access: http://localhost:3000/auth/verify/${token}`,
    });

    await this.prisma.user.upsert({
      where: { email },
      update: {
        inviteToken: token,
        tokenExpiry: new Date(Date.now() + 3600000),
      },
      create: {
        name: 'Invited User',
        email,
        role: 'EMPLOYEE',
        inviteToken: token,
        tokenExpiry: new Date(Date.now() + 3600000),
      },
    });

    return { message: 'Invite sent' };
  }

  async verifyInvite(token: string) {
    try {
      const payload = this.jwt.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (
        !user ||
        user.inviteToken !== token ||
        user.tokenExpiry < new Date()
      ) {
        throw new Error();
      }

      await this.prisma.user.update({
        where: { email: payload.email },
        data: { inviteToken: null, tokenExpiry: null },
      });

      return this.signToken(user.id, user.email, user.role);
    } catch {
      throw new ForbiddenException('Invalid or expired token');
    }
  }

  async signToken(
    userId: number,
    email: string,
    role: string,
  ): Promise<{ access_token: string; user: any }> {
    const payload = { sub: userId, email, role };
    const token = await this.jwt.signAsync(payload);

    return {
      access_token: token,
      user: { id: userId, email, role },
    };
  }
}

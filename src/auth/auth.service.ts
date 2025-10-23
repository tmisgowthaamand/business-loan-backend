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
    const hash = await bcrypt.hash(dto.password, 10);

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
    console.log('🔐 Auth service login called with:', dto.email);
    
    try {
      // Use staff service to authenticate
      const authResult = await this.staffService.authenticateStaff(dto.email, dto.password);
      
      if (!authResult) {
        console.log('❌ Invalid credentials for:', dto.email);
        throw new ForbiddenException('Invalid credentials. Please check your email and password.');
      }

      console.log('✅ Staff authenticated:', authResult.staff.name);
      
      // Return the auth token and user data in the expected format
      return {
        access_token: authResult.authToken,
        user: {
          id: authResult.staff.id,
          name: authResult.staff.name,
          email: authResult.staff.email,
          role: authResult.staff.role
        }
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw new ForbiddenException('Invalid credentials. Please check your email and password.');
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

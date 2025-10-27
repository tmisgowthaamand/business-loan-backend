import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { StaffService } from '../staff/staff.service';
import { SupabaseService } from '../supabase/supabase.service';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    department?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly staffService: StaffService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    this.logger.log(`🔐 Login attempt for email: ${email}`);

    try {
      // First try to authenticate with staff service
      const staff = await this.staffService.authenticateStaff(email, password);
      
      if (staff) {
        this.logger.log(`✅ Staff authentication successful for: ${email}`);
        
        const payload = {
          sub: staff.id,
          email: staff.email,
          name: staff.name,
          role: staff.role,
          department: staff.department,
        };

        const access_token = this.jwtService.sign(payload);

        return {
          access_token,
          user: {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: staff.role,
            department: staff.department,
          },
        };
      }

      // If staff authentication fails, try Supabase
      if (this.supabaseService.isConnected()) {
        this.logger.log(`🔍 Trying Supabase authentication for: ${email}`);
        
        const supabase = this.supabaseService.getClient();
        const { data: users, error } = await supabase
          .from('staff')
          .select('*')
          .eq('email', email)
          .limit(1);

        if (!error && users && users.length > 0) {
          const user = users[0];
          
          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password_hash);
          
          if (isPasswordValid && user.has_access && user.status === 'ACTIVE') {
            this.logger.log(`✅ Supabase authentication successful for: ${email}`);
            
            const payload = {
              sub: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              department: user.department,
            };

            const access_token = this.jwtService.sign(payload);

            return {
              access_token,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
              },
            };
          }
        }
      }

      this.logger.warn(`❌ Authentication failed for: ${email}`);
      throw new UnauthorizedException('Invalid credentials');

    } catch (error) {
      this.logger.error(`❌ Login error for ${email}:`, error.message);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async validateUser(payload: any) {
    this.logger.log(`🔍 Validating JWT payload for user: ${payload.email}`);
    
    try {
      // Try to get user from staff service first
      const staff = await this.staffService.findByEmail(payload.email);
      
      if (staff && staff.hasAccess && staff.status === 'ACTIVE') {
        return {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          role: staff.role,
          department: staff.department,
        };
      }

      // If not found in staff service, try Supabase
      if (this.supabaseService.isConnected()) {
        const supabase = this.supabaseService.getClient();
        const { data: users, error } = await supabase
          .from('staff')
          .select('*')
          .eq('email', payload.email)
          .eq('has_access', true)
          .eq('status', 'ACTIVE')
          .limit(1);

        if (!error && users && users.length > 0) {
          const user = users[0];
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
          };
        }
      }

      this.logger.warn(`❌ User validation failed for: ${payload.email}`);
      return null;

    } catch (error) {
      this.logger.error(`❌ User validation error:`, error.message);
      return null;
    }
  }

  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.validateUser(payload);
      
      if (user) {
        return { valid: true, user };
      }
      
      return { valid: false, user: null };
    } catch (error) {
      this.logger.error('❌ Token verification failed:', error.message);
      return { valid: false, user: null };
    }
  }
}

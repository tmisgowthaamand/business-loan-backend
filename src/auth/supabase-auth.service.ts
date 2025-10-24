import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  passwordHash?: string;
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE';
  department?: string;
  position?: string;
}

@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      this.logger.log(`🔐 SupabaseAuthService: Login attempt for ${email}`);
      
      // Only admin@gmail.com has access to the system
      const demoUsers = [
        { email: 'admin@gmail.com', password: 'admin123', role: 'ADMIN', name: 'System Administrator', id: 1 }
      ];

      this.logger.log(`🔍 Checking demo users for ${email}`);
      this.logger.log(`🔍 Password provided: ${password ? '[PROVIDED]' : '[MISSING]'}`);
      this.logger.log(`🔍 Available demo emails: ${demoUsers.map(u => u.email).join(', ')}`);
      
      const demoUser = demoUsers.find(u => u.email === email && u.password === password);
      
      if (demoUser) {
        this.logger.log(`✅ Demo login successful for ${email} with role ${demoUser.role}`);
        return {
          access_token: 'demo-jwt-token-' + Date.now(),
          user: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role
          }
        };
      }
      
      // Check if email exists but password is wrong
      const emailExists = demoUsers.find(u => u.email === email);
      if (emailExists) {
        this.logger.log(`❌ Email ${email} exists in demo users but password mismatch`);
        throw new UnauthorizedException('Invalid credentials');
      } else {
        this.logger.log(`❌ Email ${email} not found in demo users, trying Supabase...`);
      }

      // Try Supabase users
      const { data: users, error } = await this.supabaseService.client
        .from('User')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (error) {
        this.logger.error('Supabase query error:', error);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!users || users.length === 0) {
        this.logger.warn(`No Supabase user found for email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = users[0];

      // Check password if hash exists
      if (user.passwordHash) {
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid credentials');
        }
      } else {
        // For users without password hash, check if it matches the plain password (for demo)
        if (password !== 'defaultPassword') {
          throw new UnauthorizedException('Invalid credentials');
        }
      }

      this.logger.log(`Supabase login successful for ${email}`);
      return {
        access_token: 'supabase-jwt-token-' + Date.now(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Login error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const { name, email, password, role } = createUserDto;

      // Check if user already exists
      const { data: existingUsers } = await this.supabaseService.client
        .from('User')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user
      const { data, error } = await this.supabaseService.client
        .from('User')
        .insert([
          {
            name,
            email,
            role,
            passwordHash,
            createdAt: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating user:', error);
        throw new Error('Failed to create user');
      }

      this.logger.log(`User created successfully: ${email}`);
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt
      };

    } catch (error) {
      this.logger.error('Create user error:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('User')
        .select('id, name, email, role, createdAt')
        .order('createdAt', { ascending: false });

      if (error) {
        this.logger.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
      }

      return data || [];
    } catch (error) {
      this.logger.error('Get all users error:', error);
      throw error;
    }
  }

  async getUserById(id: number) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('User')
        .select('id, name, email, role, createdAt')
        .eq('id', id)
        .single();

      if (error) {
        this.logger.error('Error fetching user:', error);
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error('Get user by id error:', error);
      return null;
    }
  }

  async deleteUser(id: number) {
    try {
      const { error } = await this.supabaseService.client
        .from('User')
        .delete()
        .eq('id', id);

      if (error) {
        this.logger.error('Error deleting user:', error);
        throw new Error('Failed to delete user');
      }

      this.logger.log(`User deleted successfully: ${id}`);
      return true;
    } catch (error) {
      this.logger.error('Delete user error:', error);
      throw error;
    }
  }

  async updateUserAccess(id: number, hasAccess: boolean) {
    try {
      // For now, we'll just log this action since we don't have a hasAccess field in the User table
      // In a real implementation, you might want to add this field to the schema
      this.logger.log(`User access ${hasAccess ? 'granted' : 'revoked'} for user ${id}`);
      return true;
    } catch (error) {
      this.logger.error('Update user access error:', error);
      throw error;
    }
  }
}

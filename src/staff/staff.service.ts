import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../supabase/supabase.service';

export interface StaffEntity {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  department?: string;
  phone?: string;
  status: string;
  hasAccess: boolean;
  verified: boolean;
  clientName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStaffDto {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  phone?: string;
  clientName?: string;
}

export interface UpdateStaffDto {
  name?: string;
  role?: string;
  department?: string;
  phone?: string;
  status?: string;
  hasAccess?: boolean;
  verified?: boolean;
  clientName?: string;
}

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);
  private staff: StaffEntity[] = [];

  constructor(private readonly supabaseService: SupabaseService) {
    this.initializeDefaultStaff();
  }

  private async initializeDefaultStaff() {
    this.logger.log('🔧 Initializing default staff members...');
    
    const defaultStaff: StaffEntity[] = [
      {
        id: 1,
        name: 'Perivi',
        email: 'gowthaamankrishna1998@gmail.com',
        role: 'ADMIN',
        department: 'Management',
        phone: '9876543210',
        status: 'ACTIVE',
        hasAccess: true,
        verified: true,
        clientName: 'Rajesh Kumar, Priya Sharma, Amit Patel',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Venkat',
        email: 'gowthaamaneswar1998@gmail.com',
        role: 'EMPLOYEE',
        department: 'Operations',
        phone: '9876543211',
        status: 'ACTIVE',
        hasAccess: true,
        verified: true,
        clientName: 'Sunita Gupta, Vikram Singh',
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Harish',
        email: 'newacttmis@gmail.com',
        role: 'ADMIN',
        department: 'Client Management',
        phone: '9876543212',
        status: 'ACTIVE',
        hasAccess: true,
        verified: true,
        clientName: 'Anita Desai, Ravi Mehta, Sanjay Joshi',
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        name: 'Dinesh',
        email: 'dinesh@gmail.com',
        role: 'EMPLOYEE',
        department: 'Processing',
        phone: '9876543213',
        status: 'ACTIVE',
        hasAccess: true,
        verified: true,
        clientName: 'Available for Assignment - Ready for New Clients',
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        name: 'Nunciya',
        email: 'tmsnunciya59@gmail.com',
        role: 'ADMIN',
        department: 'Administration',
        phone: '9876543214',
        status: 'ACTIVE',
        hasAccess: true,
        verified: true,
        clientName: 'Deepak Verma',
        createdAt: new Date().toISOString(),
      },
      {
        id: 6,
        name: 'Admin User',
        email: 'admin@businessloan.com',
        role: 'ADMIN',
        department: 'Administration',
        phone: '9876543215',
        status: 'ACTIVE',
        hasAccess: true,
        verified: true,
        clientName: 'Neha Agarwal, Rohit Sharma',
        createdAt: new Date().toISOString(),
      },
      {
        id: 7,
        name: 'Admin User',
        email: 'admin@gmail.com',
        role: 'ADMIN',
        department: 'Administration',
        phone: '9876543216',
        status: 'ACTIVE',
        hasAccess: true,
        verified: true,
        clientName: 'Manish Gupta',
        createdAt: new Date().toISOString(),
      },
    ];

    this.staff = defaultStaff;
    this.logger.log(`✅ Initialized ${defaultStaff.length} default staff members`);
  }

  async findAll(): Promise<{ staff: Omit<StaffEntity, 'password'>[] }> {
    try {
      // Try to get from Supabase first
      if (this.supabaseService.isConnected()) {
        const supabase = this.supabaseService.getClient();
        const { data: supabaseStaff, error } = await supabase
          .from('staff')
          .select('*');

        if (!error && supabaseStaff) {
          this.logger.log(`📊 Retrieved ${supabaseStaff.length} staff from Supabase`);
          return {
            staff: supabaseStaff.map(staff => ({
              ...staff,
              hasAccess: staff.has_access,
              clientName: staff.client_name,
              createdAt: staff.created_at,
              updatedAt: staff.updated_at,
            }))
          };
        }
      }

      // Fallback to local staff
      const staffWithoutPassword = this.staff.map(({ password, ...staff }) => staff);
      return { staff: staffWithoutPassword };
    } catch (error) {
      this.logger.error('❌ Error fetching staff:', error);
      const staffWithoutPassword = this.staff.map(({ password, ...staff }) => staff);
      return { staff: staffWithoutPassword };
    }
  }

  async create(createStaffDto: CreateStaffDto): Promise<StaffEntity> {
    try {
      const hashedPassword = await bcrypt.hash(createStaffDto.password, 10);
      
      const newStaff: StaffEntity = {
        id: Date.now(),
        ...createStaffDto,
        password: hashedPassword,
        status: 'PENDING',
        hasAccess: false,
        verified: false,
        createdAt: new Date().toISOString(),
      };

      // Try to save to Supabase first
      if (this.supabaseService.hasAdminAccess()) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
          .from('staff')
          .insert({
            name: newStaff.name,
            email: newStaff.email,
            password_hash: hashedPassword,
            role: newStaff.role,
            department: newStaff.department,
            phone: newStaff.phone,
            status: newStaff.status,
            has_access: newStaff.hasAccess,
            verified: newStaff.verified,
            client_name: newStaff.clientName,
          })
          .select()
          .single();

        if (!error && data) {
          this.logger.log(`✅ Staff created in Supabase: ${newStaff.email}`);
          return {
            ...data,
            hasAccess: data.has_access,
            clientName: data.client_name,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      }

      // Fallback to local storage
      this.staff.push(newStaff);
      this.logger.log(`✅ Staff created locally: ${newStaff.email}`);
      return newStaff;
    } catch (error) {
      this.logger.error('❌ Error creating staff:', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<StaffEntity | null> {
    try {
      // Try Supabase first
      if (this.supabaseService.isConnected()) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return {
            ...data,
            hasAccess: data.has_access,
            clientName: data.client_name,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      }

      // Fallback to local
      return this.staff.find(member => member.id === id) || null;
    } catch (error) {
      this.logger.error('❌ Error finding staff:', error);
      return this.staff.find(member => member.id === id) || null;
    }
  }

  async findByEmail(email: string): Promise<StaffEntity | null> {
    try {
      // Try Supabase first
      if (this.supabaseService.isConnected()) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('email', email)
          .single();

        if (!error && data) {
          return {
            ...data,
            password: data.password_hash,
            hasAccess: data.has_access,
            clientName: data.client_name,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      }

      // Fallback to local
      return this.staff.find(member => member.email === email) || null;
    } catch (error) {
      this.logger.error('❌ Error finding staff by email:', error);
      return this.staff.find(member => member.email === email) || null;
    }
  }

  async authenticateStaff(email: string, password: string): Promise<StaffEntity | null> {
    try {
      this.logger.log(`🔐 Authenticating staff: ${email}`);
      
      const staff = await this.findByEmail(email);
      if (!staff) {
        this.logger.warn(`❌ Staff not found: ${email}`);
        return null;
      }

      if (!staff.hasAccess || staff.status !== 'ACTIVE') {
        this.logger.warn(`❌ Staff access denied: ${email}`);
        return null;
      }

      // For default staff, use default password
      const passwordToCheck = staff.password || await bcrypt.hash('12345678', 10);
      const isPasswordValid = await bcrypt.compare(password, passwordToCheck);

      if (isPasswordValid) {
        this.logger.log(`✅ Staff authentication successful: ${email}`);
        return staff;
      }

      this.logger.warn(`❌ Invalid password for: ${email}`);
      return null;
    } catch (error) {
      this.logger.error('❌ Staff authentication error:', error);
      return null;
    }
  }

  async update(id: number, updateStaffDto: UpdateStaffDto): Promise<StaffEntity | null> {
    try {
      // Try Supabase first
      if (this.supabaseService.hasAdminAccess()) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
          .from('staff')
          .update({
            name: updateStaffDto.name,
            role: updateStaffDto.role,
            department: updateStaffDto.department,
            phone: updateStaffDto.phone,
            status: updateStaffDto.status,
            has_access: updateStaffDto.hasAccess,
            verified: updateStaffDto.verified,
            client_name: updateStaffDto.clientName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return {
            ...data,
            hasAccess: data.has_access,
            clientName: data.client_name,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      }

      // Fallback to local
      const index = this.staff.findIndex(member => member.id === id);
      if (index !== -1) {
        this.staff[index] = { 
          ...this.staff[index], 
          ...updateStaffDto,
          updatedAt: new Date().toISOString(),
        };
        return this.staff[index];
      }
      return null;
    } catch (error) {
      this.logger.error('❌ Error updating staff:', error);
      return null;
    }
  }

  async remove(id: number): Promise<StaffEntity | null> {
    try {
      // Try Supabase first
      if (this.supabaseService.hasAdminAccess()) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
          .from('staff')
          .delete()
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return {
            ...data,
            hasAccess: data.has_access,
            clientName: data.client_name,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      }

      // Fallback to local
      const index = this.staff.findIndex(member => member.id === id);
      if (index !== -1) {
        const removed = this.staff.splice(index, 1);
        return removed[0];
      }
      return null;
    } catch (error) {
      this.logger.error('❌ Error removing staff:', error);
      return null;
    }
  }
}

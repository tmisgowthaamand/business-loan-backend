import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfessionalEmailService } from './professional-email.service';
import { CreateStaffDto, StaffRole, StaffStatus } from './dto/staff.dto';
import * as fs from 'fs';
import * as path from 'path';

export interface SimpleStaff {
  id: number;
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  status: StaffStatus;
  hasAccess: boolean;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SimpleStaffService {
  private readonly logger = new Logger(SimpleStaffService.name);
  private staff: SimpleStaff[] = [];
  private nextId = 1;
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly staffFile = path.join(this.dataDir, 'simple-staff.json');
  private professionalEmailService: ProfessionalEmailService;

  constructor(private configService: ConfigService) {
    this.professionalEmailService = new ProfessionalEmailService(configService);
    this.initializeStaff();
  }

  private initializeStaff() {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Load existing staff or create default
    this.loadStaffFromFile();
    
    if (this.staff.length === 0) {
      this.createDefaultStaff();
    }

    this.logger.log(`✅ Simple staff service initialized with ${this.staff.length} staff members`);
  }

  private createDefaultStaff() {
    const defaultStaff: SimpleStaff[] = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: 'admin123',
        role: StaffRole.ADMIN,
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Perivi',
        email: 'gowthaamankrishna1998@gmail.com',
        password: '12345678',
        role: StaffRole.ADMIN,
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.staff = defaultStaff;
    this.nextId = 3;
    this.saveStaffToFile();
    this.logger.log('✅ Default staff created');
  }

  private loadStaffFromFile() {
    try {
      if (fs.existsSync(this.staffFile)) {
        const data = fs.readFileSync(this.staffFile, 'utf8');
        const parsed = JSON.parse(data);
        this.staff = parsed.staff || [];
        this.nextId = parsed.nextId || 1;
        this.logger.log(`📖 Loaded ${this.staff.length} staff from file`);
      }
    } catch (error) {
      this.logger.warn('⚠️ Could not load staff from file:', error.message);
      this.staff = [];
      this.nextId = 1;
    }
  }

  private saveStaffToFile() {
    try {
      const data = {
        staff: this.staff,
        nextId: this.nextId,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.staffFile, JSON.stringify(data, null, 2));
      this.logger.log('💾 Staff data saved to file');
    } catch (error) {
      this.logger.error('❌ Could not save staff to file:', error.message);
    }
  }

  async createStaff(createStaffDto: CreateStaffDto): Promise<{
    staff: Omit<SimpleStaff, 'password'>;
    emailSent: boolean;
    verificationRequired: boolean;
  }> {
    try {
      // Check if email already exists
      const existingStaff = this.staff.find(s => s.email === createStaffDto.email);
      if (existingStaff) {
        throw new Error('Staff member with this email already exists');
      }

      // Create new staff
      const newStaff: SimpleStaff = {
        id: this.nextId++,
        name: createStaffDto.name,
        email: createStaffDto.email,
        password: createStaffDto.password,
        role: createStaffDto.role,
        status: StaffStatus.PENDING,
        hasAccess: false,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.staff.push(newStaff);
      this.saveStaffToFile();

      // Check deployment environment
      const isRender = process.env.RENDER === 'true';
      const isVercel = process.env.VERCEL === '1';
      const isProduction = process.env.NODE_ENV === 'production';

      let emailSent = false;
      let verificationRequired = true;

      // For production deployments, try to send email
      if (isRender || isVercel || isProduction) {
        this.logger.log(`🚀 [PRODUCTION] Attempting to send verification email to: ${createStaffDto.email}`);
        
        try {
          const backendUrl = this.configService.get('BACKEND_URL') || 
                            `https://${process.env.RENDER_SERVICE_NAME || 'business-loan-backend'}.onrender.com`;
          const verificationToken = `staff-${newStaff.id}-${Date.now()}`;
          const verificationLink = `${backendUrl}/api/staff/verify-access/${verificationToken}`;

          emailSent = await this.professionalEmailService.sendStaffVerificationEmail(
            createStaffDto.email,
            createStaffDto.name,
            verificationLink,
            createStaffDto.role,
            newStaff.id
          );

          if (emailSent) {
            this.logger.log(`✅ [PRODUCTION] Verification email sent successfully to: ${createStaffDto.email}`);
          } else {
            this.logger.warn(`⚠️ [PRODUCTION] Email failed for: ${createStaffDto.email} - manual activation available`);
          }
        } catch (emailError) {
          this.logger.warn(`⚠️ [PRODUCTION] Email error for ${createStaffDto.email}: ${emailError.message}`);
          emailSent = false;
        }
      } else {
        // For local development, skip email
        this.logger.log(`🏠 [LOCAL] Skipping email for development: ${createStaffDto.email}`);
        emailSent = false;
        verificationRequired = false;
      }

      const { password, ...staffWithoutPassword } = newStaff;
      
      this.logger.log(`✅ Staff created: ${createStaffDto.name} (ID: ${newStaff.id})`);
      
      return {
        staff: staffWithoutPassword,
        emailSent,
        verificationRequired
      };
    } catch (error) {
      this.logger.error('❌ Error creating staff:', error);
      throw error;
    }
  }

  async getAllStaff(): Promise<Omit<SimpleStaff, 'password'>[]> {
    return this.staff.map(({ password, ...staff }) => staff);
  }

  async getStaffById(id: number): Promise<Omit<SimpleStaff, 'password'> | null> {
    const staff = this.staff.find(s => s.id === id);
    if (!staff) return null;
    
    const { password, ...staffWithoutPassword } = staff;
    return staffWithoutPassword;
  }

  async activateStaff(staffId: number): Promise<{ staff: Omit<SimpleStaff, 'password'>; activated: boolean }> {
    try {
      const staff = this.staff.find(s => s.id === staffId);
      if (!staff) {
        throw new Error('Staff member not found');
      }

      // Activate the staff
      staff.status = StaffStatus.ACTIVE;
      staff.hasAccess = true;
      staff.verified = true;
      staff.updatedAt = new Date();

      this.saveStaffToFile();

      const { password, ...staffWithoutPassword } = staff;
      
      this.logger.log(`✅ Staff activated: ${staff.name} (ID: ${staffId})`);
      
      return { staff: staffWithoutPassword, activated: true };
    } catch (error) {
      this.logger.error(`❌ Error activating staff ${staffId}:`, error);
      throw error;
    }
  }

  async authenticateStaff(email: string, password: string): Promise<{
    staff: Omit<SimpleStaff, 'password'>;
    authToken: string;
  } | null> {
    try {
      const staff = this.staff.find(s => s.email === email);
      if (!staff) {
        this.logger.warn(`❌ Staff not found: ${email}`);
        return null;
      }

      // Check password
      if (staff.password !== password) {
        this.logger.warn(`❌ Invalid password for: ${email}`);
        return null;
      }

      // Check if staff is active or verified
      if (staff.status !== StaffStatus.ACTIVE && !staff.verified) {
        this.logger.warn(`❌ Staff not activated: ${email}`);
        return null;
      }

      // Update last login
      staff.updatedAt = new Date();
      this.saveStaffToFile();

      const { password: _, ...staffWithoutPassword } = staff;
      const authToken = `staff-jwt-${staff.id}-${Date.now()}`;

      this.logger.log(`✅ Staff authenticated: ${email}`);
      
      return {
        staff: staffWithoutPassword,
        authToken
      };
    } catch (error) {
      this.logger.error(`❌ Authentication error for ${email}:`, error);
      return null;
    }
  }

  async sendVerificationEmail(staffId: number): Promise<boolean> {
    try {
      const staff = this.staff.find(s => s.id === staffId);
      if (!staff) {
        throw new Error('Staff member not found');
      }

      const backendUrl = this.configService.get('BACKEND_URL') || 
                        `https://${process.env.RENDER_SERVICE_NAME || 'business-loan-backend'}.onrender.com`;
      const verificationToken = `staff-${staff.id}-${Date.now()}`;
      const verificationLink = `${backendUrl}/api/staff/verify-access/${verificationToken}`;

      const emailSent = await this.professionalEmailService.sendStaffVerificationEmail(
        staff.email,
        staff.name,
        verificationLink,
        staff.role,
        staff.id
      );

      if (emailSent) {
        this.logger.log(`✅ Verification email sent to: ${staff.email}`);
      } else {
        this.logger.warn(`⚠️ Failed to send verification email to: ${staff.email}`);
      }

      return emailSent;
    } catch (error) {
      this.logger.error(`❌ Error sending verification email for staff ${staffId}:`, error);
      return false;
    }
  }
}

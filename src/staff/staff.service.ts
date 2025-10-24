import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { CreateStaffDto, UpdateStaffDto, StaffEntity, StaffRole, StaffStatus, AccessTokenResult, StaffStats } from './dto/staff.dto';
import { GmailService } from './gmail.service';
import { WebhookEmailService } from './webhook-email.service';
import { SupabaseService } from '../supabase/supabase.service';
import { IdGeneratorService } from '../common/services/id-generator.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UnifiedSupabaseSyncService } from '../common/services/unified-supabase-sync.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);
  private staff: StaffEntity[] = [];
  private nextId = 1;
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly staffFile = path.join(this.dataDir, 'staff.json');

  constructor(
    private gmailService: GmailService,
    private webhookEmailService: WebhookEmailService,
    private supabaseService: SupabaseService,
    private idGeneratorService: IdGeneratorService,
    @Inject(forwardRef(() => NotificationsService)) private notificationsService: NotificationsService,
    private unifiedSupabaseSync: UnifiedSupabaseSyncService,
  ) {
    // Initialize synchronously to avoid async issues
    this.initializeDefaultStaff();
  }

  private initializeDefaultStaff() {
    this.logger.log('🗄️ Staff service initialized - Loading all staff members');
    
    // Initialize with all staff members for production use
    this.staff = [
      {
        id: 1,
        name: 'Perivi',
        email: 'gowthaamankrishna1998@gmail.com',
        password: '12345678',
        role: StaffRole.ADMIN,
        department: 'Management',
        position: 'Administrator',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        verified: true,
        clientName: 'Business Loan Management',
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date('2024-10-01T09:00:00.000Z'),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 2,
        name: 'Venkat',
        email: 'gowthaamaneswar1998@gmail.com',
        password: '12345678',
        role: StaffRole.EMPLOYEE,
        department: 'Operations',
        position: 'Employee',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        verified: true,
        clientName: 'Business Loan Operations',
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date('2024-10-01T10:00:00.000Z'),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 3,
        name: 'Harish',
        email: 'newacttmis@gmail.com',
        password: '12345678',
        role: StaffRole.ADMIN,
        department: 'Client Management',
        position: 'Administrator',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        verified: true,
        clientName: 'Client Relations',
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date('2024-10-01T11:00:00.000Z'),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 4,
        name: 'Pankil',
        email: 'govindamarketing9998@gmail.com',
        password: '12345678',
        role: StaffRole.ADMIN,
        department: 'Marketing',
        position: 'Administrator',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        verified: true,
        clientName: 'Marketing Operations',
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date('2024-10-01T12:00:00.000Z'),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 5,
        name: 'Dinesh',
        email: 'dinesh@gmail.com',
        password: '12345678',
        role: StaffRole.EMPLOYEE,
        department: 'Operations',
        position: 'Employee',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        verified: true,
        clientName: 'Operations Support',
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date('2024-10-01T13:00:00.000Z'),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 6,
        name: 'Nanciya',
        email: 'Anmunanciya@gmail.com',
        password: '12345678',
        role: StaffRole.ADMIN,
        department: 'Administration',
        position: 'Administrator',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        verified: true,
        clientName: 'Administrative Support',
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date('2024-10-01T14:00:00.000Z'),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
    ];

    this.nextId = 7; // Next available ID
    
    this.logger.log(`✅ Initialized with ${this.staff.length} staff members:`);
    this.staff.forEach(staff => {
      this.logger.log(`   - ${staff.name} (${staff.email}) - ${staff.role} - ${staff.department}`);
    });
    
    this.logger.log('🔐 LOGIN CREDENTIALS (Password: 12345678 for all):');
    this.staff.forEach(staff => {
      this.logger.log(`   - ${staff.name}: ${staff.email} / 12345678 (${staff.role})`);
    });
    
    // Save to file
    this.saveStaffToFile();
  }

  private generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Check if user has staff management permissions (all admin users)
  private checkStaffManagementPermission(userEmail?: string): void {
    // Allow all admin users to manage staff
    if (!userEmail) {
      this.logger.warn(`❌ Unauthorized staff management attempt by: unknown user`);
      throw new Error(`Access denied. Please login to access staff management.`);
    }
    
    this.logger.log(`✅ Staff management access granted to: ${userEmail}`);
  }

  private ensureDataDirectory(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        this.logger.log(`📁 Created data directory: ${this.dataDir}`);
      }
    } catch (error) {
      this.logger.error('Error creating data directory:', error);
    }
  }

  private saveStaffToFile(): void {
    try {
      this.ensureDataDirectory();
      const staffData = {
        staff: this.staff,
        nextId: this.nextId,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.staffFile, JSON.stringify(staffData, null, 2));
      this.logger.log(`💾 Staff data saved to file (${this.staff.length} members)`);
    } catch (error) {
      this.logger.error('Error saving staff to file:', error);
    }
  }

  private loadStaffFromFile(): void {
    try {
      if (fs.existsSync(this.staffFile)) {
        const fileContent = fs.readFileSync(this.staffFile, 'utf8');
        const staffData = JSON.parse(fileContent);
        
        if (staffData.staff && Array.isArray(staffData.staff)) {
          this.staff = staffData.staff.map(staff => ({
            ...staff,
            createdAt: new Date(staff.createdAt),
            updatedAt: new Date(staff.updatedAt),
            lastLogin: staff.lastLogin ? new Date(staff.lastLogin) : undefined,
            accessTokenExpiry: staff.accessTokenExpiry ? new Date(staff.accessTokenExpiry) : undefined
          }));
          this.nextId = staffData.nextId || this.staff.length + 1;
          this.logger.log(`📂 Loaded ${this.staff.length} staff members from file`);
          
          // Log loaded staff for verification
          this.staff.forEach(staff => {
            this.logger.log(`   - ${staff.name} (${staff.email}) - ${staff.status}`);
          });
        }
      } else {
        this.logger.log('📂 No existing staff file found, starting fresh');
      }
    } catch (error) {
      this.logger.error('Error loading staff from file:', error);
      this.staff = [];
      this.nextId = 1;
    }
  }

  private async initializeDefaultAdmin() {
    this.logger.log('🗄️ Staff service initialized - initializing with default staff members');
    
    // Initialize with staff members from screenshot
    const defaultStaff: StaffEntity[] = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: await bcrypt.hash('admin123', 10),
        role: StaffRole.ADMIN,
        department: 'Administration',
        position: 'System Administrator',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 2,
        name: 'Pankil',
        email: 'govindamarketing9998@gmail.com',
        password: await bcrypt.hash('pankil123', 10),
        role: StaffRole.ADMIN,
        department: 'Administration',
        position: 'Administrator',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 10,
        name: 'Admin User',
        email: 'admin@businessloan.com',
        password: await bcrypt.hash('admin123', 10),
        role: StaffRole.ADMIN,
        department: 'Administration',
        position: 'Business Administrator',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 11,
        name: 'Venkat',
        email: 'gowthaamaneswar1998@gmail.com',
        password: await bcrypt.hash('venkat123', 10),
        role: StaffRole.EMPLOYEE,
        department: 'Operations',
        position: 'Manager',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 12,
        name: 'Dinesh',
        email: 'dinesh@gmail.com',
        password: await bcrypt.hash('dinesh123', 10),
        role: StaffRole.EMPLOYEE,
        department: 'Operations',
        position: 'Employee',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 13,
        name: 'Harish',
        email: 'newacttmis@gmail.com',
        password: await bcrypt.hash('harish123', 10),
        role: StaffRole.ADMIN,
        department: 'Client Management',
        position: 'Client Manager',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
      {
        id: 14,
        name: 'Nanciya',
        email: 'tmsnunciya59@gmail.com',
        password: await bcrypt.hash('nanciya123', 10),
        role: StaffRole.ADMIN,
        department: 'Administration',
        position: 'Administrator',
        status: StaffStatus.ACTIVE,
        hasAccess: true,
        accessToken: this.generateAccessToken(),
        accessTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
    ];

    this.staff = defaultStaff;
    this.nextId = 15; // Next available ID
    
    this.logger.log(`✅ Initialized with ${this.staff.length} default staff members:`);
    this.staff.forEach(staff => {
      this.logger.log(`   - ${staff.name} (${staff.email}) - ${staff.role}`);
    });
    
    // Save to file
    this.saveStaffToFile();
  }


  async createStaff(createStaffDto: CreateStaffDto, currentUserEmail?: string): Promise<{ staff: Omit<StaffEntity, 'password'>; emailSent: boolean }> {
    try {
      // Check staff management permissions - only admin@gmail.com can create staff
      this.checkStaffManagementPermission(currentUserEmail);
      
      this.logger.log(`👤 Creating new staff member: ${createStaffDto.email} (${createStaffDto.role})`);
      
      // Remove automatic cleanup since we only allow admin@gmail.com to manage staff
      // await this.maintainDefaultStaffCount();
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createStaffDto.email)) {
        throw new Error('Invalid email format. Please provide a valid email address (e.g., user@example.com)');
      }

      // Check if email already exists in Supabase
      const { data: existingUser, error: selectError } = await this.supabaseService.client
        .from('User')
        .select('email')
        .eq('email', createStaffDto.email)
        .limit(1);

      if (!selectError && existingUser && existingUser.length > 0) {
        throw new Error('Email already exists in database. Please use a different email address.');
      }

      // Also check in-memory storage
      const existingStaff = this.staff.find(s => s.email === createStaffDto.email);
      if (existingStaff) {
        throw new Error('Email already exists in system. Please use a different email address.');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createStaffDto.password, 10);

      // Generate access token
      const accessToken = this.generateAccessToken();
      const accessTokenExpiry = new Date();
      accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 24); // 24 hours expiry

      // Try to insert into Supabase first
      this.logger.log(`💾 Attempting to create staff in Supabase: ${createStaffDto.email}`);
      const { data: newUser, error } = await this.supabaseService.client
        .from('User')
        .insert([
          {
            name: createStaffDto.name,
            email: createStaffDto.email,
            role: createStaffDto.role,
            passwordHash: hashedPassword,
            department: createStaffDto.department || (createStaffDto.role === 'ADMIN' ? 'Administration' : 'General'),
            position: createStaffDto.position || (createStaffDto.role === 'ADMIN' ? 'Administrator' : 'Staff Member'),
            inviteToken: accessToken,
            tokenExpiry: accessTokenExpiry.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
        .select()
        .single();

      let staffEntity: Omit<StaffEntity, 'password'>;
      let isSupabaseUser = false;

      if (error) {
        this.logger.warn(`⚠️ Supabase insert failed, using in-memory storage: ${error.message}`);
        
        // Create staff in memory as fallback
        const staffId = await this.idGeneratorService.generateStaffId();
        const newStaff: StaffEntity = {
          id: staffId,
          name: createStaffDto.name,
          email: createStaffDto.email,
          password: hashedPassword,
          role: createStaffDto.role,
          department: createStaffDto.department || (createStaffDto.role === 'ADMIN' ? 'Administration' : 'General'),
          position: createStaffDto.position || (createStaffDto.role === 'ADMIN' ? 'Administrator' : 'Staff Member'),
          status: StaffStatus.PENDING,
          hasAccess: false,
          verified: false,
          clientName: createStaffDto.clientName,
          accessToken,
          accessTokenExpiry,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'Admin'
        };
        
        this.staff.push(newStaff);
        this.saveStaffToFile(); // Save to persistent storage
        
        // Auto-sync to Supabase using unified sync service (non-blocking)
        this.unifiedSupabaseSync.syncStaff(newStaff).catch(error => {
          this.logger.error('❌ [DEPLOYMENT] Failed to sync staff to Supabase:', error);
        });
        
        const { password, ...staffWithoutPassword } = newStaff;
        staffEntity = staffWithoutPassword;
        
        this.logger.log(`✅ Staff created in memory: ${createStaffDto.email} (${createStaffDto.role}) - ID: ${newStaff.id}`);
      } else {
        // Successfully created in Supabase
        isSupabaseUser = true;
        
        // Convert Supabase user to StaffEntity format
        staffEntity = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role as StaffRole,
          department: newUser.department || (createStaffDto.role === 'ADMIN' ? 'Administration' : 'General'),
          position: newUser.position || (createStaffDto.role === 'ADMIN' ? 'Administrator' : 'Staff Member'),
          status: StaffStatus.PENDING,
          hasAccess: false,
          accessToken,
          accessTokenExpiry,
          createdAt: new Date(newUser.createdAt),
          updatedAt: new Date(newUser.updatedAt || newUser.createdAt),
          createdBy: 'Admin'
        };
        
        this.logger.log(`✅ Staff created in Supabase: ${createStaffDto.email} (${createStaffDto.role}) - ID: ${newUser.id}`);
      }

      // Send verification email (non-blocking in production)
      this.logger.log(`📧 Sending verification email to: ${createStaffDto.email}`);
      const isProduction = process.env.NODE_ENV === 'production';
      const isRender = process.env.RENDER === 'true';
      const isVercel = process.env.VERCEL === '1';
      
      let emailSent = false;
      
      if (isProduction && (isRender || isVercel)) {
        // Use webhook email service for Render/Vercel environments
        if (isRender) {
          this.webhookEmailService.sendAccessLink(
            createStaffDto.email,
            createStaffDto.name,
            accessToken,
            createStaffDto.role
          ).then(success => {
            if (success) {
              this.logger.log(`📧 Verification email sent successfully via webhook to: ${createStaffDto.email}`);
            } else {
              this.logger.log(`📧 Verification email logged for manual processing: ${createStaffDto.email}`);
            }
          }).catch(error => {
            this.logger.error(`📧 Webhook email error for ${createStaffDto.email}:`, error);
          });
        } else {
          // Non-blocking Gmail for Vercel
          this.gmailService.sendAccessLink(
            createStaffDto.email,
            createStaffDto.name,
            accessToken,
            createStaffDto.role
          ).then(success => {
            if (success) {
              this.logger.log(`📧 Verification email sent successfully to: ${createStaffDto.email}`);
            } else {
              this.logger.error(`📧 Verification email failed to send ❌ to ${createStaffDto.email}`);
            }
          }).catch(error => {
            this.logger.error(`📧 Verification email error for ${createStaffDto.email}:`, error);
          });
        }

        this.logger.log(`📧 Verification email queued for background sending to: ${createStaffDto.email}`);
      } else {
        // Blocking email sending for development/localhost
        emailSent = await this.gmailService.sendAccessLink(
          createStaffDto.email,
          createStaffDto.name,
          accessToken,
          createStaffDto.role
        );
        this.logger.log(`📧 Verification email ${emailSent ? 'sent successfully ✅' : 'failed to send ❌'} to: ${createStaffDto.email}`);
      }

      // Create notification for new staff member
      try {
        await this.notificationsService.notifyStaffAdded(
          staffEntity.id,
          createStaffDto.name,
          createStaffDto.role
        );
        this.logger.log(`🔔 Notification sent for new staff member: ${createStaffDto.name}`);
      } catch (error) {
        this.logger.error('Failed to send notification for new staff member:', error);
      }

      // Auto-sync to Supabase staff table (non-blocking for localhost and Render)
      if (!isSupabaseUser) {
        // Only sync if not already in Supabase (i.e., created in memory)
        this.syncStaffToSupabase(staffEntity as StaffEntity).catch(error => {
          this.logger.error(`❌ Failed to auto-sync staff to Supabase: ${createStaffDto.email}`, error);
        });
        this.logger.log(`🔄 Auto-sync to Supabase staff table queued for: ${createStaffDto.email}`);
      }

      this.logger.log(`🎉 Staff creation completed: ${createStaffDto.name} (${createStaffDto.email}) - ${isSupabaseUser ? 'Supabase' : 'Memory'} storage`);
      return { staff: staffEntity, emailSent };
    } catch (error) {
      this.logger.error('❌ Error creating staff:', error);
      throw error;
    }
  }

  async getAllStaff(): Promise<Omit<StaffEntity, 'password'>[]> {
    try {
      this.logger.log(`🔍 getAllStaff called - Fetching from both Supabase and memory`);
      
      const allStaff: Omit<StaffEntity, 'password'>[] = [];

      // First, try to get staff from Supabase (optional for demo mode)
      try {
        if (this.supabaseService && process.env.NODE_ENV === 'production') {
          this.logger.log('📋 Fetching staff from Supabase (production mode)...');
          const { data: users, error } = await this.supabaseService.client
            .from('User')
            .select('*')
            .order('createdAt', { ascending: false });

          if (!error && users && users.length > 0) {
            // Convert Supabase users to StaffEntity format
            const supabaseStaff: Omit<StaffEntity, 'password'>[] = users.map(user => {
              const isActive = !user.inviteToken;
              const status = isActive ? StaffStatus.ACTIVE : StaffStatus.PENDING;
              
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as StaffRole,
                department: user.department || (user.role === 'ADMIN' ? 'Administration' : 'General'),
                position: user.position || (user.role === 'ADMIN' ? 'Administrator' : 'Staff Member'),
                status: status,
                hasAccess: isActive,
                accessToken: user.inviteToken,
                accessTokenExpiry: user.tokenExpiry ? new Date(user.tokenExpiry) : undefined,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt || user.createdAt),
                createdBy: 'Admin',
                lastLogin: user.lastLogin ? new Date(user.lastLogin) : (isActive ? new Date() : undefined)
              };
            });
            
            allStaff.push(...supabaseStaff);
            this.logger.log(`📋 Found ${supabaseStaff.length} staff members in Supabase`);
          } else {
            this.logger.log('📋 No staff found in Supabase, using demo mode');
          }
        } else {
          this.logger.log('📋 Supabase disabled or demo mode - using in-memory staff');
        }
      } catch (supabaseError) {
        this.logger.log('📋 Supabase connection failed, using demo mode:', supabaseError.message);
      }

      // Then, get staff from in-memory storage (excluding duplicates)
      if (this.staff && this.staff.length > 0) {
        this.logger.log(`📋 Checking ${this.staff.length} in-memory staff members...`);
        
        const memoryStaff: Omit<StaffEntity, 'password'>[] = this.staff
          .filter(staff => {
            // Exclude if already exists in Supabase (by email)
            const existsInSupabase = allStaff.some(s => s.email === staff.email);
            return !existsInSupabase;
          })
          .map(staff => {
            const { password, ...staffWithoutPassword } = staff;
            return staffWithoutPassword;
          });
        
        allStaff.push(...memoryStaff);
        this.logger.log(`📋 Added ${memoryStaff.length} unique staff members from memory`);
      }

      // If no staff found anywhere, initialize with default staff
      if (allStaff.length === 0) {
        this.logger.log('📋 No staff found anywhere, initializing with default staff...');
        this.initializeDefaultStaff();
        
        // Return the initialized staff (without passwords)
        const defaultStaff: Omit<StaffEntity, 'password'>[] = this.staff.map(staff => {
          const { password, ...staffWithoutPassword } = staff;
          return staffWithoutPassword;
        });
        
        this.logger.log(`📋 Returning ${defaultStaff.length} default staff members`);
        return defaultStaff;
      }

      // Sort by creation date (newest first)
      allStaff.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      this.logger.log(`📋 Returning ${allStaff.length} total staff members (Supabase + Memory)`);
      
      // Log staff summary for debugging
      allStaff.forEach(staff => {
        this.logger.log(`   - ${staff.name} (${staff.email}) - ${staff.role} - ${staff.status}`);
      });
      
      return allStaff;
    } catch (error) {
      this.logger.error('Error in getAllStaff:', error);
      
      // Fallback to in-memory staff only
      if (this.staff && this.staff.length > 0) {
        this.logger.log('📋 Falling back to in-memory staff only');
        const fallbackStaff: Omit<StaffEntity, 'password'>[] = this.staff.map(staff => {
          const { password, ...staffWithoutPassword } = staff;
          return staffWithoutPassword;
        });
        return fallbackStaff;
      }
      
      this.logger.log('📋 Returning empty staff list due to error');
      return [];
    }
  }

  async getStaffById(id: number): Promise<Omit<StaffEntity, 'password'> | null> {
    try {
      this.logger.log(`🔍 Looking for staff ID: ${id}`);
      
      // First check Supabase
      const { data: supabaseUser, error } = await this.supabaseService.client
        .from('User')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && supabaseUser) {
        this.logger.log(`📋 Found staff in Supabase: ${supabaseUser.name} (${supabaseUser.email})`);
        
        const isActive = !supabaseUser.inviteToken;
        const status = isActive ? StaffStatus.ACTIVE : StaffStatus.PENDING;
        
        return {
          id: supabaseUser.id,
          name: supabaseUser.name,
          email: supabaseUser.email,
          role: supabaseUser.role as StaffRole,
          department: supabaseUser.department || (supabaseUser.role === 'ADMIN' ? 'Administration' : 'General'),
          position: supabaseUser.position || (supabaseUser.role === 'ADMIN' ? 'Administrator' : 'Staff Member'),
          status: status,
          hasAccess: isActive,
          accessToken: supabaseUser.inviteToken,
          accessTokenExpiry: supabaseUser.tokenExpiry ? new Date(supabaseUser.tokenExpiry) : undefined,
          createdAt: new Date(supabaseUser.createdAt),
          updatedAt: new Date(supabaseUser.updatedAt || supabaseUser.createdAt),
          createdBy: 'Admin',
          lastLogin: supabaseUser.lastLogin ? new Date(supabaseUser.lastLogin) : (isActive ? new Date() : undefined)
        };
      }

      // If not found in Supabase, check in-memory storage
      const staff = this.staff.find(s => s.id === id);
      if (!staff) {
        this.logger.log(`❌ Staff ID ${id} not found in Supabase or memory`);
        return null;
      }
      
      this.logger.log(`📋 Found staff in memory: ${staff.name} (${staff.email})`);
      const { password, ...staffWithoutPassword } = staff;
      return staffWithoutPassword;
    } catch (error) {
      this.logger.error(`Error finding staff by ID ${id}:`, error);
      return null;
    }
  }

  async updateStaff(id: number, updateStaffDto: UpdateStaffDto): Promise<Omit<StaffEntity, 'password'>> {
    const staffIndex = this.staff.findIndex(s => s.id === id);
    if (staffIndex === -1) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    const staff = this.staff[staffIndex];

    // Update fields
    if (updateStaffDto.name) staff.name = updateStaffDto.name;
    if (updateStaffDto.email) staff.email = updateStaffDto.email;
    if (updateStaffDto.role) staff.role = updateStaffDto.role;
    if (updateStaffDto.status) staff.status = updateStaffDto.status;
    if (updateStaffDto.department) staff.department = updateStaffDto.department;
    if (updateStaffDto.position) staff.position = updateStaffDto.position;
    if (updateStaffDto.clientName !== undefined) staff.clientName = updateStaffDto.clientName;
    if (updateStaffDto.hasAccess !== undefined) staff.hasAccess = updateStaffDto.hasAccess;

    // Hash new password if provided
    if (updateStaffDto.password) {
      staff.password = await bcrypt.hash(updateStaffDto.password, 10);
    }

    staff.updatedAt = new Date();
    this.saveStaffToFile(); // Save to persistent storage

    this.logger.log(`Staff updated: ${staff.email}`);

    const { password, ...staffWithoutPassword } = staff;
    return staffWithoutPassword;
  }

  async getStaffEnquiryCount(staffId: number): Promise<number> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('Enquiry')
        .select('id', { count: 'exact', head: true })
        .eq('staffId', staffId);

      if (error) {
        this.logger.error('Error counting staff enquiries:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      this.logger.error('Error in getStaffEnquiryCount:', error);
      return 0;
    }
  }

  async reassignEnquiries(fromStaffId: number, toStaffId: number): Promise<number> {
    try {
      // Update all enquiries assigned to fromStaffId to toStaffId
      const { data, error } = await this.supabaseService.client
        .from('Enquiry')
        .update({ staffId: toStaffId })
        .eq('staffId', fromStaffId)
        .select('id');

      if (error) {
        this.logger.error('Error reassigning enquiries:', error);
        throw new Error('Failed to reassign enquiries');
      }

      const reassignedCount = data?.length || 0;
      this.logger.log(`✅ Reassigned ${reassignedCount} enquiries from staff ${fromStaffId} to staff ${toStaffId}`);
      return reassignedCount;
    } catch (error) {
      this.logger.error('Error in reassignEnquiries:', error);
      throw error;
    }
  }

  async deleteStaff(id: number, currentUserEmail?: string): Promise<void> {
    try {
      // Check staff management permissions - only admin@gmail.com can delete staff
      this.checkStaffManagementPermission(currentUserEmail);
      
      // Protect the admin@gmail.com account from deletion
      if (id === 1) {
        this.logger.warn(`❌ Cannot delete system administrator: admin@gmail.com`);
        throw new Error(`Cannot delete system administrator. This account is protected and cannot be removed.`);
      }

      // First try to delete from Supabase
      const { data: supabaseUser, error: selectError } = await this.supabaseService.client
        .from('User')
        .select('email, name, role')
        .eq('id', id)
        .single();

      if (!selectError && supabaseUser) {
        // Check if user has assigned enquiries
        const { data: enquiries, error: enquiryError } = await this.supabaseService.client
          .from('Enquiry')
          .select('id')
          .eq('staffId', id)
          .limit(1);

        if (enquiryError) {
          this.logger.error('Error checking user enquiries:', enquiryError);
          throw new Error('Failed to check user dependencies');
        }

        if (enquiries && enquiries.length > 0) {
          this.logger.warn(`❌ Cannot delete user ${supabaseUser.email}: Has assigned enquiries`);
          throw new Error('Cannot delete staff member. This user has assigned enquiries. Please reassign or remove enquiries first.');
        }

        // Delete from Supabase
        const { error: deleteError } = await this.supabaseService.client
          .from('User')
          .delete()
          .eq('id', id);

        if (deleteError) {
          this.logger.error('Error deleting user from Supabase:', deleteError);
          
          // Handle foreign key constraint violations
          if (deleteError.code === '23503') {
            throw new Error('Cannot delete staff member. This user has assigned records. Please reassign or remove related data first.');
          }
          
          throw new Error('Failed to delete user from database');
        }

        this.logger.log(`✅ Staff deleted from Supabase: ${supabaseUser.email} (${supabaseUser.role})`);
        return;
      }

      // If not found in Supabase, try in-memory storage
      const staffIndex = this.staff.findIndex(s => s.id === id);
      if (staffIndex === -1) {
        throw new NotFoundException(`Staff member with ID ${id} not found`);
      }

      const staff = this.staff[staffIndex];
      
      // Double-check if it's the admin@gmail.com account
      if (staff.email === 'admin@gmail.com') {
        this.logger.warn(`❌ Cannot delete system administrator: ${staff.email}`);
        throw new Error(`Cannot delete system administrator. This account is protected and cannot be removed.`);
      }

      this.staff.splice(staffIndex, 1);
      this.saveStaffToFile(); // Save to persistent storage
      
      // Sync deletion to Supabase in background (non-blocking)
      this.syncStaffDeletionToSupabase(staff).catch(error => {
        this.logger.error('❌ Failed to sync staff deletion to Supabase:', error);
      });
      
      this.logger.log(`✅ Staff deleted from memory: ${staff.email}`);
    } catch (error) {
      this.logger.error('❌ Error deleting staff:', error);
      throw error;
    }
  }

  async revokeAccess(id: number): Promise<Omit<StaffEntity, 'password'>> {
    try {
      // First try to find and update in Supabase
      const { data: supabaseUser, error: selectError } = await this.supabaseService.client
        .from('User')
        .select('*')
        .eq('id', id)
        .single();

      if (!selectError && supabaseUser) {
        // For Supabase users, we can't directly revoke access since we don't have status fields
        // Instead, we'll set an invite token to indicate they need to re-verify
        const revokeToken = this.generateAccessToken();
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24);

        const { error: updateError } = await this.supabaseService.client
          .from('User')
          .update({
            inviteToken: revokeToken,
            tokenExpiry: tokenExpiry.toISOString()
          })
          .eq('id', id);

        if (updateError) {
          this.logger.error('Error revoking access in Supabase:', updateError);
          throw new Error('Failed to revoke access in database');
        }

        // Send revocation notification
        await this.gmailService.sendAccessRevokedNotification(
          supabaseUser.email,
          supabaseUser.name,
          supabaseUser.role
        );

        this.logger.log(`✅ Access revoked for Supabase user: ${supabaseUser.email} (${supabaseUser.role})`);

        // Return the updated staff info
        return {
          id: supabaseUser.id,
          name: supabaseUser.name,
          email: supabaseUser.email,
          role: supabaseUser.role as StaffRole,
          department: supabaseUser.role === 'ADMIN' ? 'Administration' : 'General',
          position: supabaseUser.role === 'ADMIN' ? 'Administrator' : 'Staff Member',
          status: StaffStatus.PENDING, // Now pending re-verification
          hasAccess: false,
          accessToken: revokeToken,
          accessTokenExpiry: tokenExpiry,
          createdAt: new Date(supabaseUser.createdAt),
          updatedAt: new Date(),
          createdBy: 'Admin'
        };
      }

      // If not found in Supabase, try in-memory storage
      const staff = this.staff.find(s => s.id === id);
      if (!staff) {
        throw new NotFoundException(`Staff member with ID ${id} not found`);
      }

      staff.hasAccess = false;
      staff.status = StaffStatus.INACTIVE;
      staff.accessToken = undefined;
      staff.accessTokenExpiry = undefined;
      staff.updatedAt = new Date();
      this.saveStaffToFile(); // Save to persistent storage

      // Send revocation notification
      await this.gmailService.sendAccessRevokedNotification(
        staff.email,
        staff.name,
        staff.role
      );

      this.logger.log(`✅ Access revoked for memory user: ${staff.email}`);

      const { password, ...staffWithoutPassword } = staff;
      return staffWithoutPassword;
    } catch (error) {
      this.logger.error('❌ Error revoking access:', error);
      throw error;
    }
  }

  async grantAccess(id: number): Promise<{ staff: Omit<StaffEntity, 'password'>; emailSent: boolean }> {
    try {
      // First try to find and update in Supabase
      const { data: supabaseUser, error: selectError } = await this.supabaseService.client
        .from('User')
        .select('*')
        .eq('id', id)
        .single();

      if (!selectError && supabaseUser) {
        // Generate new access token
        const accessToken = this.generateAccessToken();
        const accessTokenExpiry = new Date();
        accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 24);

        const { error: updateError } = await this.supabaseService.client
          .from('User')
          .update({
            inviteToken: accessToken,
            tokenExpiry: accessTokenExpiry.toISOString()
          })
          .eq('id', id);

        if (updateError) {
          this.logger.error('Error granting access in Supabase:', updateError);
          throw new Error('Failed to grant access in database');
        }

        // Send new access link
        const emailSent = await this.gmailService.sendAccessLink(
          supabaseUser.email,
          supabaseUser.name,
          accessToken,
          supabaseUser.role
        );

        this.logger.log(`✅ Access granted for Supabase user: ${supabaseUser.email} (${supabaseUser.role})`);

        // Return the updated staff info
        const staffInfo = {
          id: supabaseUser.id,
          name: supabaseUser.name,
          email: supabaseUser.email,
          role: supabaseUser.role as StaffRole,
          department: supabaseUser.role === 'ADMIN' ? 'Administration' : 'General',
          position: supabaseUser.role === 'ADMIN' ? 'Administrator' : 'Staff Member',
          status: StaffStatus.PENDING, // Pending verification
          hasAccess: true,
          accessToken: accessToken,
          accessTokenExpiry: accessTokenExpiry,
          createdAt: new Date(supabaseUser.createdAt),
          updatedAt: new Date(),
          createdBy: 'Admin'
        };

        return { staff: staffInfo, emailSent };
      }

      // If not found in Supabase, try in-memory storage
      const staff = this.staff.find(s => s.id === id);
      if (!staff) {
        throw new NotFoundException(`Staff member with ID ${id} not found`);
      }

      // Generate new access token
      const accessToken = this.generateAccessToken();
      const accessTokenExpiry = new Date();
      accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 24);

      staff.hasAccess = true;
      staff.status = StaffStatus.PENDING;
      staff.accessToken = accessToken;
      staff.accessTokenExpiry = accessTokenExpiry;
      staff.updatedAt = new Date();
      this.saveStaffToFile(); // Save to persistent storage

      // Send new access link
      const emailSent = await this.gmailService.sendAccessLink(
        staff.email,
        staff.name,
        accessToken,
        staff.role
      );

      this.logger.log(`✅ Access granted for memory user: ${staff.email}`);

      const { password, ...staffWithoutPassword } = staff;
      return { staff: staffWithoutPassword, emailSent };
    } catch (error) {
      this.logger.error('❌ Error granting access:', error);
      throw error;
    }
  }

  async verifyAccessToken(token: string): Promise<AccessTokenResult> {
    try {
      // First check in-memory staff (for backward compatibility)
      let staff = this.staff.find(s => s.accessToken === token);
      let isSupabaseUser = false;

      // If not found in memory, check Supabase
      if (!staff) {
        const { data: supabaseUsers, error } = await this.supabaseService.client
          .from('User')
          .select('*')
          .eq('inviteToken', token)
          .limit(1);

        if (error) {
          this.logger.error('Error checking Supabase for token:', error);
          throw new Error('Invalid access token');
        }

        if (!supabaseUsers || supabaseUsers.length === 0) {
          throw new Error('Invalid access token');
        }

        const supabaseUser = supabaseUsers[0];
        
        // Check token expiry
        if (!supabaseUser.tokenExpiry || new Date(supabaseUser.tokenExpiry) < new Date()) {
          throw new Error('Access token has expired');
        }

        isSupabaseUser = true;
        
        // Convert Supabase user to staff format for processing
        staff = {
          id: supabaseUser.id,
          name: supabaseUser.name,
          email: supabaseUser.email,
          role: supabaseUser.role as StaffRole,
          status: StaffStatus.PENDING,
          hasAccess: false,
          accessToken: supabaseUser.inviteToken,
          accessTokenExpiry: new Date(supabaseUser.tokenExpiry),
          createdAt: new Date(supabaseUser.createdAt),
          updatedAt: new Date(supabaseUser.createdAt),
          password: supabaseUser.passwordHash || '',
          createdBy: 'Admin'
        };
      } else {
        // Check token expiry for in-memory staff
        if (!staff.accessTokenExpiry || staff.accessTokenExpiry < new Date()) {
          throw new Error('Access token has expired');
        }
      }

      if (isSupabaseUser) {
        // Update user status in Supabase to ACTIVE
        const { error: updateError } = await this.supabaseService.client
          .from('User')
          .update({
            inviteToken: null, // Clear the token (one-time use)
            tokenExpiry: null,
            // Note: We don't have status/hasAccess fields in User table, 
            // but clearing the invite token indicates the user is active
          })
          .eq('id', staff.id);

        if (updateError) {
          this.logger.error('Error updating user status in Supabase:', updateError);
          throw new Error('Failed to activate user account');
        }

        this.logger.log(`✅ User activated in Supabase: ${staff.email} (${staff.role})`);
      } else {
        // Update in-memory staff
        staff.status = StaffStatus.ACTIVE;
        staff.hasAccess = true;
        staff.lastLogin = new Date();
        staff.accessToken = undefined; // One-time use
        staff.accessTokenExpiry = undefined;
        staff.updatedAt = new Date();
        this.saveStaffToFile(); // Save to persistent storage
      }

      // Generate JWT auth token
      const authToken = jwt.sign(
        { 
          id: staff.id, 
          email: staff.email, 
          role: staff.role,
          name: staff.name
        },
        'your-secret-key', // In production, use environment variable
        { expiresIn: '7d' }
      );

      this.logger.log(`✅ Access token verified and user activated: ${staff.email} (${staff.role})`);
      this.logger.log(`🎉 ${staff.role} staff member ${staff.name} is now ACTIVE in the system`);

      const { password, ...staffWithoutPassword } = staff;
      return { staff: staffWithoutPassword, authToken };
    } catch (error) {
      this.logger.error('❌ Error verifying access token:', error);
      throw error;
    }
  }

  async authenticateStaff(email: string, password: string): Promise<{ staff: Omit<StaffEntity, 'password'>; authToken: string } | null> {
    this.logger.log(`🔐 Attempting authentication for: ${email}`);
    
    const staff = this.staff.find(s => s.email === email);
    
    if (!staff || !staff.hasAccess || staff.status !== StaffStatus.ACTIVE) {
      this.logger.warn(`❌ Authentication failed for ${email}: Staff not found, no access, or inactive`);
      return null;
    }

    // Handle both plain text and hashed passwords for deployment compatibility
    let isPasswordValid = false;
    try {
      // First try bcrypt comparison (for hashed passwords)
      isPasswordValid = await bcrypt.compare(password, staff.password);
      
      // If bcrypt fails, try plain text comparison (for development/fallback)
      if (!isPasswordValid && staff.password === password) {
        isPasswordValid = true;
        this.logger.log(`⚠️ Plain text password authentication used for ${email} (development mode)`);
      }
    } catch (error) {
      // If bcrypt fails, try plain text comparison as fallback
      if (staff.password === password) {
        isPasswordValid = true;
        this.logger.log(`⚠️ Fallback to plain text password for ${email}`);
      } else {
        this.logger.error(`❌ Password comparison error for ${email}:`, error);
        return null;
      }
    }
    
    if (!isPasswordValid) {
      this.logger.warn(`❌ Authentication failed for ${email}: Invalid password`);
      return null;
    }

    // Update last login
    staff.lastLogin = new Date();
    staff.updatedAt = new Date();
    this.saveStaffToFile(); // Save to persistent storage

    // Generate JWT auth token with environment-based secret
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
    const authToken = jwt.sign(
      { 
        id: staff.id, 
        email: staff.email, 
        role: staff.role,
        name: staff.name
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    this.logger.log(`✅ Staff authenticated successfully: ${staff.email} (${staff.role}) - Ready for Vercel & Render deployment`);

    const { password: _, ...staffWithoutPassword } = staff;
    return { staff: staffWithoutPassword, authToken };
  }

  async getStaffStats(): Promise<StaffStats> {
    try {
      // Get all staff from Supabase only
      const allStaff = await this.getAllStaff();
      
      const totalStaff = allStaff.length;
      const activeStaff = allStaff.filter(s => s.status === StaffStatus.ACTIVE).length;
      const inactiveStaff = allStaff.filter(s => s.status === StaffStatus.INACTIVE).length;
      const pendingStaff = allStaff.filter(s => s.status === StaffStatus.PENDING).length;
      const adminCount = allStaff.filter(s => s.role === StaffRole.ADMIN).length;
      const employeeCount = allStaff.filter(s => s.role === StaffRole.EMPLOYEE).length;
      
      // Count recent logins (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentLogins = allStaff.filter(s => s.lastLogin && s.lastLogin > sevenDaysAgo).length;

      this.logger.log(`📊 Staff Statistics (Supabase): Total: ${totalStaff}, Active: ${activeStaff}, Pending: ${pendingStaff}, Admin: ${adminCount}, Employee: ${employeeCount}`);

      return {
        totalStaff,
        activeStaff,
        inactiveStaff,
        pendingStaff,
        adminCount,
        employeeCount,
        recentLogins
      };
    } catch (error) {
      this.logger.error('Error calculating staff stats:', error);
      
      // Return empty stats if Supabase fails
      return {
        totalStaff: 0,
        activeStaff: 0,
        inactiveStaff: 0,
        pendingStaff: 0,
        adminCount: 0,
        employeeCount: 0,
        recentLogins: 0
      };
    }
  }

  async testEmailConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      this.logger.log('📧 Testing Gmail connection...');
      
      // Reinitialize transporter to pick up any credential changes
      this.gmailService.reinitializeTransporter();
      
      const isConnected = await this.gmailService.testConnection();
      this.logger.log(`📧 Gmail connection test result: ${isConnected ? 'SUCCESS ✅' : 'FAILED ❌'}`);
      
      if (!isConnected) {
        return { 
          connected: false, 
          error: 'Gmail SMTP connection failed. Check app password format (should be 16 characters without spaces).' 
        };
      }
      
      return { connected: true };
    } catch (error) {
      this.logger.error('📧 Gmail connection test failed:', error);
      return { 
        connected: false, 
        error: `Gmail test failed: ${error.message}` 
      };
    }
  }

  async resendVerificationEmail(staffId: number): Promise<{ staff: Omit<StaffEntity, 'password'>; emailSent: boolean }> {
    try {
      this.logger.log(`📧 Attempting to resend verification email for staff ID: ${staffId}`);
      
      // First check in-memory staff
      let staff = this.staff.find(s => s.id === staffId);
      let isSupabaseUser = false;

      // If not found in memory, check Supabase
      if (!staff) {
        this.logger.log(`📧 Staff ID ${staffId} not found in memory, checking Supabase...`);
        
        const { data: supabaseUsers, error } = await this.supabaseService.client
          .from('User')
          .select('*')
          .eq('id', staffId)
          .limit(1);

        if (error) {
          this.logger.error('Error checking Supabase for staff:', error);
          throw new NotFoundException('Staff member not found');
        }

        if (!supabaseUsers || supabaseUsers.length === 0) {
          this.logger.error(`Staff member with ID ${staffId} not found in Supabase either`);
          throw new NotFoundException('Staff member not found');
        }

        const supabaseUser = supabaseUsers[0];
        isSupabaseUser = true;
        
        // Convert Supabase user to staff format for processing
        staff = {
          id: supabaseUser.id,
          name: supabaseUser.name,
          email: supabaseUser.email,
          role: supabaseUser.role as StaffRole,
          status: supabaseUser.inviteToken ? StaffStatus.PENDING : StaffStatus.ACTIVE,
          hasAccess: !supabaseUser.inviteToken,
          accessToken: supabaseUser.inviteToken,
          accessTokenExpiry: supabaseUser.tokenExpiry ? new Date(supabaseUser.tokenExpiry) : undefined,
          createdAt: new Date(supabaseUser.createdAt),
          updatedAt: new Date(supabaseUser.updatedAt || supabaseUser.createdAt),
          password: supabaseUser.passwordHash || '',
          department: supabaseUser.department || (supabaseUser.role === 'ADMIN' ? 'Administration' : 'General'),
          position: supabaseUser.position || (supabaseUser.role === 'ADMIN' ? 'Administrator' : 'Staff Member'),
          createdBy: 'Admin'
        };
        
        this.logger.log(`📧 Found staff in Supabase: ${staff.name} (${staff.email})`);
      }

      // Check if already verified
      if (staff.status === StaffStatus.ACTIVE && !staff.accessToken) {
        throw new Error('Staff member is already verified and active');
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken();
      const newAccessTokenExpiry = new Date();
      newAccessTokenExpiry.setHours(newAccessTokenExpiry.getHours() + 24); // 24 hours expiry

      if (isSupabaseUser) {
        // Update Supabase user with new token
        const { error: updateError } = await this.supabaseService.client
          .from('User')
          .update({
            inviteToken: newAccessToken,
            tokenExpiry: newAccessTokenExpiry.toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('id', staffId);

        if (updateError) {
          this.logger.error('Error updating Supabase user token:', updateError);
          throw new Error('Failed to update verification token');
        }

        // Update local staff object for email sending
        staff.accessToken = newAccessToken;
        staff.accessTokenExpiry = newAccessTokenExpiry;
        staff.updatedAt = new Date();
        
        this.logger.log(`📧 Updated Supabase user ${staff.email} with new verification token`);
      } else {
        // Update in-memory staff
        staff.accessToken = newAccessToken;
        staff.accessTokenExpiry = newAccessTokenExpiry;
        staff.updatedAt = new Date();
        this.saveStaffToFile(); // Save to persistent storage
        
        this.logger.log(`📧 Updated in-memory staff ${staff.email} with new verification token`);
      }

      // Send verification email
      this.logger.log(`📧 Sending verification email to: ${staff.email}`);
      const emailSent = await this.gmailService.sendAccessLink(
        staff.email,
        staff.name,
        staff.accessToken,
        staff.role
      );

      this.logger.log(`📧 Verification email ${emailSent ? 'sent successfully ✅' : 'failed to send ❌'} to ${staff.email}`);

      // Return staff without password
      const { password, ...staffWithoutPassword } = staff;
      return { staff: staffWithoutPassword, emailSent };
    } catch (error) {
      this.logger.error('❌ Error resending verification email:', error);
      throw error;
    }
  }

  // Method to clear Supabase and sync all current localhost staff
  async clearAndSyncAllStaffToSupabase(): Promise<{ cleared: number; synced: number; errors: number }> {
    console.log('🧹 Clearing existing staff from Supabase...');
    
    let clearedCount = 0;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Step 1: Clear existing staff from Supabase (except system users)
      const { error: deleteError } = await this.supabaseService.client
        .from('Staff')
        .delete()
        .neq('email', 'admin@gmail.com') // Don't delete system admin
        .neq('email', 'gowthaamankrishna1998@gmail.com'); // Don't delete system admin
      
      if (deleteError) {
        console.error('❌ Error clearing Supabase staff:', deleteError);
      } else {
        console.log('✅ Cleared existing staff from Supabase (kept system users)');
        clearedCount = 1; // Indicate successful clear
      }

      // Step 2: Sync all current localhost staff to Supabase
      console.log('🔄 Syncing', this.staff.length, 'localhost staff to Supabase...');
      
      for (const staff of this.staff) {
        try {
          await this.syncStaffToSupabase(staff);
          syncedCount++;
          console.log(`✅ Synced staff ${staff.id}: ${staff.name}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Failed to sync staff ${staff.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Staff sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { cleared: clearedCount, synced: syncedCount, errors: errorCount };
      
    } catch (error) {
      console.error('❌ Error in clearAndSyncAllStaffToSupabase:', error);
      return { cleared: 0, synced: syncedCount, errors: errorCount + 1 };
    }
  }

  async getStaffSyncStatus(): Promise<any> {
    try {
      const { count, error } = await this.supabaseService.client
        .from('Staff')
        .select('*', { count: 'exact', head: true });
      
      return {
        supabaseCount: count || 0,
        localCount: this.staff.length,
        lastSync: new Date().toISOString(),
        status: error ? 'error' : 'connected'
      };
    } catch (error) {
      return {
        supabaseCount: 0,
        localCount: this.staff.length,
        lastSync: null,
        status: 'disconnected',
        error: error.message
      };
    }
  }

  // Clear all staff
  async clearAllStaff(): Promise<{ message: string; cleared: number }> {
    const clearedCount = this.staff.length;
    this.staff = [];
    this.nextId = 1;
    this.saveStaffToFile();
    
    console.log('🗑️ Cleared all staff from storage:', clearedCount);
    return {
      message: `Cleared ${clearedCount} staff members from storage`,
      cleared: clearedCount
    };
  }

  // Sync staff deletion to Supabase
  private async syncStaffDeletionToSupabase(staff: StaffEntity): Promise<void> {
    if (!this.supabaseService) {
      console.log('⚠️ Supabase service not available, skipping staff deletion sync');
      return;
    }

    try {
      // Try to delete from Supabase staff table (lowercase as requested)
      const { error: staffError } = await this.supabaseService.client
        .from('staff')
        .delete()
        .eq('email', staff.email);

      if (staffError) {
        console.log('⚠️ Failed to delete from staff table:', staffError.message);
      } else {
        console.log(`✅ Staff deletion synced to Supabase staff table: ${staff.email}`);
      }

      // Also try to delete from User table if it exists there
      const { error: userError } = await this.supabaseService.client
        .from('User')
        .delete()
        .eq('email', staff.email);

      if (userError) {
        console.log('⚠️ Failed to delete from User table:', userError.message);
      } else {
        console.log(`✅ Staff deletion synced to Supabase User table: ${staff.email}`);
      }
    } catch (error) {
      console.error('❌ Error syncing staff deletion to Supabase:', error);
      throw error;
    }
  }

  // Sync staff to Supabase
  private async syncStaffToSupabase(staff: StaffEntity): Promise<void> {
    if (!this.supabaseService) {
      console.log('⚠️ Supabase service not available, skipping staff sync');
      return;
    }

    try {
      console.log('🔄 Syncing staff to Supabase:', staff.name);
      
      // Prepare staff data for Supabase
      const supabaseStaff = {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        password_hash: staff.password, // In real app, this would be hashed
        role: staff.role,
        department: staff.department,
        position: staff.position,
        status: staff.status,
        has_access: staff.hasAccess,
        access_token: staff.accessToken,
        access_token_expiry: staff.accessTokenExpiry?.toISOString(),
        last_login: staff.lastLogin?.toISOString(),
        created_at: staff.createdAt.toISOString(),
        updated_at: staff.updatedAt.toISOString()
      };

      // Upsert to Supabase staff table (lowercase as requested)
      const { data, error } = await this.supabaseService.client
        .from('staff')
        .upsert(supabaseStaff, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error syncing staff to Supabase:', error);
        throw error;
      }

      console.log('✅ Staff synced to Supabase successfully:', staff.name);
      
    } catch (error) {
      console.error('❌ Failed to sync staff to Supabase:', error);
      throw error;
    }
  }

  // Sync all staff to Supabase
  async syncAllStaffToSupabase(): Promise<{ message: string; synced: number; errors: number }> {
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    let synced = 0;
    let errors = 0;

    console.log('🔄 Starting bulk sync of', this.staff.length, 'staff members to Supabase');

    for (const staffMember of this.staff) {
      try {
        await this.syncStaffToSupabase(staffMember);
        synced++;
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('❌ Failed to sync staff:', staffMember.name, error);
        errors++;
      }
    }

    console.log('✅ Bulk staff sync completed:', synced, 'synced,', errors, 'errors');
    
    return {
      message: `Synced ${synced} staff members to Supabase (${errors} errors)`,
      synced,
      errors
    };
  }

  // Clear Supabase staff and sync current localhost data
  async clearSupabaseAndSyncLocal(): Promise<{ message: string; cleared: number; synced: number; errors: number }> {
    if (!this.supabaseService) {
      throw new Error('Supabase service not available');
    }

    console.log('🧹 Clearing existing staff from Supabase...');
    
    let clearedCount = 0;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Step 1: Clear existing staff from Supabase (except system users)
      const { error: deleteError } = await this.supabaseService.client
        .from('Staff')
        .delete()
        .neq('email', 'admin@gmail.com') // Don't delete system admin
        .neq('email', 'gowthaamankrishna1998@gmail.com'); // Don't delete system admin
      
      if (deleteError) {
        console.error('❌ Error clearing Supabase staff:', deleteError);
      } else {
        console.log('✅ Cleared existing staff from Supabase (kept system users)');
        clearedCount = 1; // Indicate successful clear
      }

      // Step 2: Sync all current localhost staff to Supabase
      console.log('🔄 Syncing', this.staff.length, 'localhost staff to Supabase...');
      
      for (const staffMember of this.staff) {
        try {
          await this.syncStaffToSupabase(staffMember);
          syncedCount++;
          console.log(`✅ Synced staff ${staffMember.id}: ${staffMember.name}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to sync staff ${staffMember.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Staff clear and sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { 
        message: `Cleared Supabase and synced ${syncedCount} staff members (${errorCount} errors)`,
        cleared: clearedCount, 
        synced: syncedCount, 
        errors: errorCount 
      };
      
    } catch (error) {
      console.error('❌ Error in clearSupabaseAndSyncLocal:', error);
      return { 
        message: 'Error during clear and sync operation',
        cleared: 0, 
        synced: syncedCount, 
        errors: errorCount + 1 
      };
    }
  }

  async testEmailDelivery(testEmail: string, testName: string): Promise<{ success: boolean; method: string; details: string }> {
    this.logger.log(`📧 Testing email delivery to: ${testEmail}`);
    
    const isRender = process.env.RENDER === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
      // Generate test access token
      const testToken = this.generateAccessToken();
      
      // Test the email service
      const emailSent = await this.gmailService.sendAccessLink(
        testEmail,
        testName,
        testToken,
        StaffRole.ADMIN
      );
      
      if (emailSent) {
        const method = isRender ? 'SendGrid/Webhook/Fallback' : 'SMTP/SendGrid';
        return {
          success: true,
          method: method,
          details: `Email test successful using ${method} delivery method`
        };
      } else {
        return {
          success: false,
          method: 'Failed',
          details: 'All email delivery methods failed'
        };
      }
    } catch (error) {
      this.logger.error(`❌ Email test failed for ${testEmail}:`, error);
      return {
        success: false,
        method: 'Error',
        details: `Email test error: ${error.message}`
      };
    }
  }

  // Maintain exactly 7 default staff members
  async maintainDefaultStaffCount(): Promise<void> {
    try {
      const defaultStaffEmails = [
        'gowthaamankrishna1998@gmail.com',
        'gowthaamaneswar1998@gmail.com', 
        'newacttmis@gmail.com',
        'dinesh@gmail.com',
        'tmsnunciya59@gmail.com',
        'admin@businessloan.com',
        'admin@gmail.com'
      ];

      // Count current default staff
      const currentDefaultStaff = this.staff.filter(s => defaultStaffEmails.includes(s.email));
      const currentTotal = this.staff.length;

      this.logger.log(`🔧 Staff maintenance check: ${currentTotal} total, ${currentDefaultStaff.length} default staff`);

      // If we have more than 7 staff, remove non-default ones
      if (currentTotal > 7) {
        const nonDefaultStaff = this.staff.filter(s => !defaultStaffEmails.includes(s.email));
        const toRemove = currentTotal - 7;
        
        this.logger.log(`🧹 Removing ${toRemove} non-default staff members to maintain 7 total`);
        
        // Remove oldest non-default staff first
        const staffToRemove = nonDefaultStaff
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .slice(0, toRemove);

        for (const staff of staffToRemove) {
          const index = this.staff.findIndex(s => s.id === staff.id);
          if (index !== -1) {
            this.staff.splice(index, 1);
            this.logger.log(`🗑️ Auto-removed staff: ${staff.name} (${staff.email})`);
          }
        }

        this.saveStaffToFile();
      }

      // If we have less than 7 default staff, reinitialize
      if (currentDefaultStaff.length < 7) {
        this.logger.log(`⚠️ Missing default staff members. Reinitializing to ensure all 7 are present.`);
        await this.resetToDefaultStaff();
      }

    } catch (error) {
      this.logger.error('Error maintaining default staff count:', error);
    }
  }

  // Reset to exactly 7 default staff members
  async resetToDefaultStaff(): Promise<{ message: string; staffCount: number; resetStaff: any[] }> {
    try {
      this.logger.log('🔄 Resetting to exactly 7 default staff members...');
      
      // Clear current staff
      this.staff = [];
      
      // Reinitialize with default 7 staff
      this.initializeDefaultStaff();
      
      // Save to file
      this.saveStaffToFile();
      
      // Clear Supabase and sync new default staff
      try {
        await this.clearSupabaseAndSyncLocal();
      } catch (error) {
        this.logger.warn('Could not sync to Supabase, but local reset completed:', error.message);
      }

      const resetStaff = this.staff.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        department: s.department,
        status: s.status
      }));

      this.logger.log(`✅ Successfully reset to ${this.staff.length} default staff members`);
      
      return {
        message: 'Successfully reset to 7 default staff members',
        staffCount: this.staff.length,
        resetStaff
      };
    } catch (error) {
      this.logger.error('Error resetting to default staff:', error);
      throw error;
    }
  }

  // Auto-cleanup method to be called periodically
  async autoCleanupStaff(): Promise<{ cleaned: number; maintained: number }> {
    try {
      this.logger.log('🧹 Starting automatic staff cleanup...');
      
      const beforeCount = this.staff.length;
      await this.maintainDefaultStaffCount();
      const afterCount = this.staff.length;
      
      const cleaned = beforeCount - afterCount;
      
      this.logger.log(`✅ Auto-cleanup completed: ${cleaned} staff removed, ${afterCount} maintained`);
      
      return {
        cleaned,
        maintained: afterCount
      };
    } catch (error) {
      this.logger.error('Error in auto-cleanup:', error);
      throw error;
    }
  }

}

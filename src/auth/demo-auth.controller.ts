import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseAuthService, LoginDto } from './supabase-auth.service';

@Controller('auth')
export class DemoAuthController {
  constructor(private readonly authService: SupabaseAuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      console.log('🔐 Login attempt for:', loginDto.email);
      console.log('🔐 Password provided:', loginDto.password ? '[PROVIDED]' : '[MISSING]');
      
      // All staff members have system access
      const demoUsers = [
        { email: 'gowthaamankrishna1998@gmail.com', password: '12345678', role: 'ADMIN', name: 'Perivi', id: 1 },
        { email: 'gowthaamaneswar1998@gmail.com', password: '12345678', role: 'EMPLOYEE', name: 'Venkat', id: 2 },
        { email: 'newacttmis@gmail.com', password: '12345678', role: 'ADMIN', name: 'Harish', id: 3 },
        { email: 'govindamarketing9998@gmail.com', password: '12345678', role: 'ADMIN', name: 'Pankil', id: 4 },
        { email: 'dinesh@gmail.com', password: '12345678', role: 'EMPLOYEE', name: 'Dinesh', id: 5 },
        { email: 'tmsnunciya59@gmail.com', password: '12345678', role: 'ADMIN', name: 'Nunciya', id: 6 },
        { email: 'admin@gmail.com', password: 'admin123', role: 'ADMIN', name: 'Admin User', id: 7 }
      ];

      const demoUser = demoUsers.find(u => u.email === loginDto.email && u.password === loginDto.password);
      
      if (demoUser) {
        console.log('✅ Direct demo login successful for:', loginDto.email);
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

      // Try the service if direct demo fails
      const result = await this.authService.login(loginDto);
      console.log('✅ Service login successful for:', loginDto.email);
      return result;
    } catch (error) {
      console.error('❌ Login failed for:', loginDto.email, 'Error:', error.message);
      console.error('❌ Error type:', error.constructor.name);
      
      if (error.message === 'Invalid credentials' || error.message.includes('Invalid credentials')) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('register')
  async register(@Body() registerDto: any) {
    try {
      const user = await this.authService.createUser({
        name: registerDto.name,
        email: registerDto.email,
        password: registerDto.password || 'defaultPassword',
        role: registerDto.role || 'EMPLOYEE'
      });

      return {
        message: 'Registration successful',
        user
      };
    } catch (error) {
      throw new HttpException(error.message || 'Registration failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('debug-login')
  async debugLogin(@Body() loginDto: LoginDto) {
    try {
      console.log('🔍 Debug login attempt for:', loginDto.email);
      
      // All staff members have system access
      const demoUsers = [
        { email: 'gowthaamankrishna1998@gmail.com', password: '12345678', role: 'ADMIN', name: 'Perivi', id: 1 },
        { email: 'gowthaamaneswar1998@gmail.com', password: '12345678', role: 'EMPLOYEE', name: 'Venkat', id: 2 },
        { email: 'newacttmis@gmail.com', password: '12345678', role: 'ADMIN', name: 'Harish', id: 3 },
        { email: 'govindamarketing9998@gmail.com', password: '12345678', role: 'ADMIN', name: 'Pankil', id: 4 },
        { email: 'dinesh@gmail.com', password: '12345678', role: 'EMPLOYEE', name: 'Dinesh', id: 5 },
        { email: 'tmsnunciya59@gmail.com', password: '12345678', role: 'ADMIN', name: 'Nunciya', id: 6 },
        { email: 'admin@gmail.com', password: 'admin123', role: 'ADMIN', name: 'Admin User', id: 7 }
      ];

      const demoUser = demoUsers.find(u => u.email === loginDto.email && u.password === loginDto.password);
      
      if (demoUser) {
        console.log('✅ Demo user found:', demoUser.email);
        return {
          success: true,
          message: 'Demo user authentication successful',
          user: demoUser,
          source: 'demo'
        };
      } else {
        console.log('❌ Demo user not found or password mismatch');
        return {
          success: false,
          message: 'Demo user not found or password mismatch',
          availableUsers: demoUsers.map(u => ({ email: u.email, role: u.role })),
          source: 'demo'
        };
      }
    } catch (error) {
      console.error('❌ Debug login error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Debug login failed'
      };
    }
  }

  @Post('test-credentials')
  async testCredentials(@Body() loginDto: LoginDto) {
    console.log('🧪 Test credentials endpoint called');
    console.log('📧 Email:', loginDto.email);
    console.log('🔑 Password:', loginDto.password ? '[PROVIDED]' : '[MISSING]');
    console.log('📦 Full body:', loginDto);
    
    return {
      message: 'Test credentials received',
      email: loginDto.email,
      passwordProvided: !!loginDto.password,
      timestamp: new Date().toISOString()
    };
  }

  @Get('check-user/:email')
  async checkUser(@Param('email') email: string) {
    try {
      console.log('🔍 Checking user details for:', email);
      
      // All staff members have system access
      const demoUsers = [
        { email: 'gowthaamankrishna1998@gmail.com', password: '12345678', role: 'ADMIN', name: 'Perivi', id: 1 },
        { email: 'gowthaamaneswar1998@gmail.com', password: '12345678', role: 'EMPLOYEE', name: 'Venkat', id: 2 },
        { email: 'newacttmis@gmail.com', password: '12345678', role: 'ADMIN', name: 'Harish', id: 3 },
        { email: 'govindamarketing9998@gmail.com', password: '12345678', role: 'ADMIN', name: 'Pankil', id: 4 },
        { email: 'dinesh@gmail.com', password: '12345678', role: 'EMPLOYEE', name: 'Dinesh', id: 5 },
        { email: 'tmsnunciya59@gmail.com', password: '12345678', role: 'ADMIN', name: 'Nunciya', id: 6 },
        { email: 'admin@gmail.com', password: 'admin123', role: 'ADMIN', name: 'Admin User', id: 7 }
      ];

      const demoUser = demoUsers.find(u => u.email === email);
      
      if (demoUser) {
        console.log('✅ Found demo user:', demoUser);
        return {
          found: true,
          source: 'demo',
          user: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role
          },
          timestamp: new Date().toISOString()
        };
      }

      // Check Supabase
      try {
        const supabaseUsers = await this.authService.getAllUsers();
        const supabaseUser = supabaseUsers.find(u => u.email === email);
        
        if (supabaseUser) {
          console.log('✅ Found Supabase user:', supabaseUser);
          return {
            found: true,
            source: 'supabase',
            user: supabaseUser,
            timestamp: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error('❌ Error checking Supabase:', error);
      }

      return {
        found: false,
        message: 'User not found in demo or Supabase',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error checking user:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('force-fresh-login')
  async forceFreshLogin(@Body() loginDto: LoginDto) {
    try {
      console.log('🔄 Force fresh login for:', loginDto.email);
      
      // All staff members have system access
      const demoUsers = [
        { email: 'gowthaamankrishna1998@gmail.com', password: '12345678', role: 'ADMIN', name: 'Perivi', id: 1 },
        { email: 'gowthaamaneswar1998@gmail.com', password: '12345678', role: 'EMPLOYEE', name: 'Venkat', id: 2 },
        { email: 'newacttmis@gmail.com', password: '12345678', role: 'ADMIN', name: 'Harish', id: 3 },
        { email: 'govindamarketing9998@gmail.com', password: '12345678', role: 'ADMIN', name: 'Pankil', id: 4 },
        { email: 'dinesh@gmail.com', password: '12345678', role: 'EMPLOYEE', name: 'Dinesh', id: 5 },
        { email: 'tmsnunciya59@gmail.com', password: '12345678', role: 'ADMIN', name: 'Nunciya', id: 6 },
        { email: 'admin@gmail.com', password: 'admin123', role: 'ADMIN', name: 'Admin User', id: 7 }
      ];

      const demoUser = demoUsers.find(u => u.email === loginDto.email && u.password === loginDto.password);
      
      if (demoUser) {
        console.log('✅ Force fresh login successful for:', loginDto.email, 'Role:', demoUser.role);
        return {
          access_token: 'fresh-demo-jwt-token-' + Date.now(),
          user: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role
          },
          message: 'Fresh login successful - cache cleared',
          timestamp: new Date().toISOString()
        };
      } else {
        console.log('❌ Invalid credentials for force fresh login');
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      console.error('❌ Force fresh login error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

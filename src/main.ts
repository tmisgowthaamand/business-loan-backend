import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { validateEnvironment } from './config/environment.validation';
import { SecurityInterceptor } from './common/interceptors/security.interceptor';

async function bootstrap() {
  // Validate environment variables first
  validateEnvironment();

  console.log('🚀 Starting NestJS application...');
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.RENDER === 'true';
  const isVercel = process.env.VERCEL === '1';
  
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Platform: ${isRender ? 'Render' : isVercel ? 'Vercel' : 'Local'}`);
  
  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
    cors: true, // Enable CORS at creation level
  });
  console.log('✅ NestJS application created successfully');

  // Security middleware
  if (isProduction) {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));
  }

  // Apply security interceptor globally
  app.useGlobalInterceptors(new SecurityInterceptor());

  // Enhanced validation pipe for production with security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Reject unknown properties for security
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProduction, // Hide validation errors in production
      stopAtFirstError: true, // Stop at first validation error for performance
      skipMissingProperties: false, // Validate all properties
      skipNullProperties: false, // Validate null properties
      skipUndefinedProperties: false, // Validate undefined properties
    }),
  );

  // Enhanced CORS configuration for production deployments
  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        // Local development
        'http://localhost:3000', 
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:5173',
        // Production deployments
        'https://business-loan-frontend.vercel.app',
        'https://business-loan-portal.vercel.app',
        'https://loan-management-system.vercel.app',
        // Render backend
        'https://business-loan-backend.onrender.com'
      ];
      
      // Allow all Vercel deployments (including preview deployments)
      if (origin.includes('.vercel.app') || origin.includes('-vercel.app')) {
        console.log('✅ CORS allowed Vercel origin:', origin);
        return callback(null, true);
      }
      
      // Allow all Render deployments
      if (origin.includes('.onrender.com')) {
        console.log('✅ CORS allowed Render origin:', origin);
        return callback(null, true);
      }
      
      // Allow localhost with any port for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log('✅ CORS allowed localhost origin:', origin);
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log('✅ CORS allowed origin:', origin);
        return callback(null, true);
      }
      
      // In production, be more restrictive for security
      if (isProduction) {
        console.log('❌ CORS blocked unknown origin in production:', origin);
        return callback(new Error('Not allowed by CORS'), false);
      }
      
      console.log('❌ CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With', 
      'Accept', 
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'X-CSRF-Token',
      'X-Forwarded-For',
      'X-Real-IP',
      'Cache-Control'
    ],
    exposedHeaders: ['Content-Length', 'X-Total-Count', 'X-Page-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: isProduction ? 86400 : 0, // Cache preflight for 24 hours in production
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5002; // Use Render's port or fallback to 5002
  console.log(`🌐 Attempting to start server on port ${port}...`);
  console.log(`📁 Current working directory: ${process.cwd()}`);
  console.log(`🔧 Node environment: ${process.env.NODE_ENV || 'development'}`);
  
  await app.listen(port, '0.0.0.0'); // Bind to all interfaces for Render
  console.log(`🎉 Backend server successfully running on port ${port}`);
  console.log(`📋 API endpoints available at /api/`);
  console.log(`🔧 Supabase endpoints: /api/supabase/ping`);
  console.log(`🌍 Server accessible at: http://0.0.0.0:${port}`);
}
bootstrap();

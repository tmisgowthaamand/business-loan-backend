import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 Starting NestJS application...');
  const app = await NestFactory.create(AppModule);
  console.log('✅ NestJS application created successfully');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow additional properties but ignore them
      transform: true,
    }),
  );

  // Enable CORS with comprehensive configuration
  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000', 
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:5173',
        'https://business-loan-frontend.vercel.app',
        'https://business-loan-portal.vercel.app'
      ];
      
      // Allow all Vercel deployments
      if (origin.includes('.vercel.app')) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
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
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
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

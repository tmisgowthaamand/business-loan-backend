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

  app.enableCors({
    origin: [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5173',
      'https://business-loan-portal.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

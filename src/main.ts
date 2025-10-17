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
      'http://127.0.0.1:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  const port = 5002; // Use port 5002 to avoid conflict
  console.log(`🌐 Attempting to start server on port ${port}...`);
  await app.listen(port);
  console.log(`🎉 Backend server successfully running on http://localhost:${port}`);
  console.log(`📋 API endpoints available at http://localhost:${port}/api/`);
  console.log(`🔧 Supabase endpoints: http://localhost:${port}/api/supabase/ping`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enhanced CORS configuration for Vercel and Render deployment
  const allowedOrigins = [
    // Local development
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5001', // Frontend port 5001
    'http://localhost:5173',
    // Vercel production and preview deployments
    'https://business-loan-frontend.vercel.app',
    'https://business-loan-frontend-*.vercel.app',
    // Allow all Vercel preview deployments
    /^https:\/\/business-loan-frontend-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/,
    // Render deployment
    'https://business-loan-frontend.onrender.com',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log('🚫 CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-CSRF-Token',
      'x-request-time',
      'X-Request-Time',
      'X-Client-Fingerprint',
      'X-Content-Type-Options',
      'Pragma',
      'Expires'
    ],
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5002;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

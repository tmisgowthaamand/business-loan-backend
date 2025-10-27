export function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredEnvVars = ['JWT_SECRET'];
  
  if (isProduction) {
    requiredEnvVars.push(
      'DATABASE_URL',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    );
  }

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please set these variables before starting the application.'
    );
  }

  // Enhanced JWT_SECRET validation
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long for security');
    }
    
    // Check for weak secrets in production
    if (isProduction) {
      const weakSecrets = [
        'fallback-secret-key-for-development',
        'your-super-secret-jwt-key-here-make-it-long-and-random',
        'secret',
        'jwt-secret',
        '12345678901234567890123456789012'
      ];
      
      if (weakSecrets.includes(process.env.JWT_SECRET)) {
        throw new Error('JWT_SECRET is using a default/weak value. Please use a strong, unique secret in production.');
      }
    }
  }

  // Validate other security-critical environment variables
  if (isProduction) {
    // Ensure no development URLs in production
    if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
      console.warn('⚠️ WARNING: FRONTEND_URL contains localhost in production environment');
    }
    
    // Check for secure database connections
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
      console.warn('⚠️ WARNING: DATABASE_URL should use postgresql:// for secure connections');
    }
  }

  console.log('✅ Environment validation passed');
}

export function getSecureConfig() {
  return {
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
    // Email configs (optional)
    gmailEmail: process.env.GMAIL_EMAIL,
    gmailPassword: process.env.GMAIL_APP_PASSWORD,
    sendGridApiKey: process.env.SENDGRID_API_KEY,
    sendGridFromEmail: process.env.SENDGRID_FROM_EMAIL,
  };
}

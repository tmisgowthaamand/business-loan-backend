const fs = require('fs');
const path = require('path');

// Gemini API Key for gokrishna98@gmail.com
const GEMINI_API_KEY = 'AIzaSyDPNfcSrIF9PngTAQ1U9Eekwk6KX0MHmYs';

// Path to .env file
const envPath = path.join(__dirname, '.env');

console.log('🔧 Setting up Gemini API Key...');
console.log('📧 Gmail Account: gokrishna98@gmail.com');
console.log('🔑 API Key: AIzaSyDPNfcSrIF9PngTAQ1U9Eekwk6KX0MHmYs');

try {
  let envContent = '';
  
  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 Found existing .env file');
    
    // Check if GEMINI_API_KEY already exists
    if (envContent.includes('GEMINI_API_KEY')) {
      // Replace existing key
      envContent = envContent.replace(
        /GEMINI_API_KEY=.*/,
        `GEMINI_API_KEY="${GEMINI_API_KEY}"`
      );
      console.log('🔄 Updated existing GEMINI_API_KEY');
    } else {
      // Add new key
      envContent += `\n# Gemini AI Configuration\nGEMINI_API_KEY="${GEMINI_API_KEY}"\n`;
      console.log('➕ Added new GEMINI_API_KEY');
    }
  } else {
    // Create new .env file with Gemini key
    envContent = `# Gemini AI Configuration
GEMINI_API_KEY="${GEMINI_API_KEY}"

# Add other environment variables as needed
# Copy from .env.example and update with your actual values
`;
    console.log('📝 Created new .env file');
  }
  
  // Write the updated content
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Gemini API Key setup complete!');
  console.log('🚀 You can now start the backend server with: npm start');
  console.log('🤖 The AI chatbot will be available with your Pro account access');
  
} catch (error) {
  console.error('❌ Error setting up Gemini API Key:', error.message);
  console.log('');
  console.log('📋 Manual Setup Instructions:');
  console.log('1. Create or edit your .env file in the backend directory');
  console.log('2. Add this line:');
  console.log(`   GEMINI_API_KEY="${GEMINI_API_KEY}"`);
  console.log('3. Save the file and restart your backend server');
}

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Business Loan Backend...');
console.log('=====================================');

// Environment info
console.log(`📍 Working Directory: ${process.cwd()}`);
console.log(`🔧 Node Version: ${process.version}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${process.env.PORT || 'not set'}`);

// Check if dist directory exists
const distPath = path.join(process.cwd(), 'dist');
console.log(`\n📁 Checking build output...`);

if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist directory not found!');
  console.error('💡 Solution: Run "npm run build" first');
  process.exit(1);
}

// Check if main.js exists
const mainPath = path.join(distPath, 'main.js');
if (!fs.existsSync(mainPath)) {
  console.error('❌ ERROR: dist/main.js not found!');
  console.error('💡 Solution: Ensure build completed successfully');
  
  // List what's actually in dist
  console.log('\n📋 Files in dist directory:');
  try {
    const files = fs.readdirSync(distPath);
    files.forEach(file => console.log(`   - ${file}`));
  } catch (err) {
    console.error('   Could not read dist directory');
  }
  
  process.exit(1);
}

console.log('✅ dist/main.js found');
console.log(`📄 File size: ${fs.statSync(mainPath).size} bytes`);

// Try to start the application
console.log('\n🎯 Starting application...');
try {
  require(mainPath);
} catch (error) {
  console.error('❌ ERROR: Failed to start application');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}

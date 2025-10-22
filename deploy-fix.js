#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Deployment Fix Script');
console.log('========================');

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    return null;
  }
}

function checkFile(filePath, description) {
  console.log(`\n📁 Checking ${description}...`);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${description} exists (${stats.size} bytes)`);
    return true;
  } else {
    console.log(`❌ ${description} not found`);
    return false;
  }
}

// Step 1: Clean and install dependencies
console.log('\n🧹 Step 1: Clean installation');
runCommand('rm -rf node_modules package-lock.json', 'Cleaning old dependencies');
runCommand('npm install', 'Installing fresh dependencies');

// Step 2: Generate Prisma client
console.log('\n🔧 Step 2: Generate Prisma client');
runCommand('npx prisma generate', 'Generating Prisma client');

// Step 3: Clean and build
console.log('\n🏗️ Step 3: Build application');
runCommand('rm -rf dist', 'Cleaning dist directory');
runCommand('npm run build', 'Building TypeScript');

// Step 4: Verify build output
console.log('\n✅ Step 4: Verify build');
const distExists = checkFile('./dist', 'dist directory');
const mainExists = checkFile('./dist/main.js', 'main.js file');

if (distExists && mainExists) {
  console.log('\n📋 Build contents:');
  try {
    const files = fs.readdirSync('./dist');
    files.forEach(file => {
      const filePath = path.join('./dist', file);
      const stats = fs.statSync(filePath);
      console.log(`   - ${file} (${stats.size} bytes)`);
    });
  } catch (err) {
    console.error('Could not list dist contents');
  }
  
  // Step 5: Test the build
  console.log('\n🧪 Step 5: Test build');
  try {
    console.log('Testing require of main.js...');
    delete require.cache[path.resolve('./dist/main.js')];
    
    // Just check if it can be required without running
    const mainModule = fs.readFileSync('./dist/main.js', 'utf8');
    if (mainModule.includes('bootstrap') && mainModule.includes('NestFactory')) {
      console.log('✅ main.js appears to be valid NestJS application');
    } else {
      console.log('⚠️ main.js may not be a valid NestJS application');
    }
  } catch (error) {
    console.error('❌ Build test failed:', error.message);
  }
  
  console.log('\n🎉 Deployment Fix Complete!');
  console.log('📋 Next steps for Render:');
  console.log('1. Commit all changes to git');
  console.log('2. Push to your repository');
  console.log('3. In Render dashboard, set:');
  console.log('   - Build Command: npm ci && npx prisma generate && npm run build');
  console.log('   - Start Command: node dist/main.js');
  console.log('4. Redeploy the service');
  
} else {
  console.log('\n❌ Build verification failed!');
  console.log('💡 Manual steps to try:');
  console.log('1. npm ci');
  console.log('2. npx prisma generate');
  console.log('3. npm run build');
  console.log('4. ls -la dist/');
  console.log('5. node dist/main.js');
}

const fs = require('fs');
const path = require('path');

console.log('🔍 Build Check Script');
console.log('===================');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
console.log(`📁 Checking dist directory: ${distPath}`);

if (fs.existsSync(distPath)) {
  console.log('✅ dist directory exists');
  
  // Check if main.js exists
  const mainPath = path.join(distPath, 'main.js');
  if (fs.existsSync(mainPath)) {
    console.log('✅ main.js exists');
    console.log(`📄 File size: ${fs.statSync(mainPath).size} bytes`);
  } else {
    console.log('❌ main.js not found');
  }
  
  // List all files in dist
  console.log('📋 Files in dist directory:');
  const files = fs.readdirSync(distPath, { recursive: true });
  files.forEach(file => {
    console.log(`   - ${file}`);
  });
} else {
  console.log('❌ dist directory does not exist');
  console.log('💡 Run "npm run build" to create it');
}

// Check package.json scripts
console.log('\n📋 Available scripts:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
Object.keys(packageJson.scripts).forEach(script => {
  console.log(`   - npm run ${script}: ${packageJson.scripts[script]}`);
});

console.log('\n🚀 To fix the deployment issue:');
console.log('1. Run: npm run build');
console.log('2. Verify: node dist/main.js');
console.log('3. Deploy with proper build command');

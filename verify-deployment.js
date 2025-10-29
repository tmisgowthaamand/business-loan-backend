#!/usr/bin/env node

/**
 * Deployment Verification Script for Render
 * Checks if all required dependencies and build artifacts are present
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment readiness...\n');

// Check package.json and lock file sync
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const packageLockExists = fs.existsSync('package-lock.json');

console.log('📦 Package Information:');
console.log(`   - Name: ${packageJson.name}`);
console.log(`   - Version: ${packageJson.version}`);
console.log(`   - Lock file exists: ${packageLockExists ? '✅' : '❌'}`);

// Check critical dependencies
const criticalDeps = ['@nestjs/core', '@nestjs/throttler', 'helmet'];
console.log('\n🔧 Critical Dependencies:');
criticalDeps.forEach(dep => {
  const version = packageJson.dependencies[dep];
  console.log(`   - ${dep}: ${version ? `✅ ${version}` : '❌ Missing'}`);
});

// Check build artifacts
const distExists = fs.existsSync('dist');
const mainJsExists = fs.existsSync('dist/main.js');

console.log('\n🏗️ Build Artifacts:');
console.log(`   - dist/ directory: ${distExists ? '✅' : '❌'}`);
console.log(`   - dist/main.js: ${mainJsExists ? '✅' : '❌'}`);

// Check scripts
const requiredScripts = ['build', 'start:prod', 'render:build', 'render:start'];
console.log('\n📜 Required Scripts:');
requiredScripts.forEach(script => {
  const exists = packageJson.scripts[script];
  console.log(`   - ${script}: ${exists ? '✅' : '❌'}`);
});

// Overall status
const allGood = packageLockExists && 
                criticalDeps.every(dep => packageJson.dependencies[dep]) &&
                requiredScripts.every(script => packageJson.scripts[script]);

console.log(`\n🚀 Deployment Status: ${allGood ? '✅ Ready' : '❌ Issues Found'}`);

if (allGood) {
  console.log('\n✨ All checks passed! Your backend is ready for Render deployment.');
  console.log('\n📋 Next steps:');
  console.log('   1. Commit and push your changes');
  console.log('   2. Deploy to Render using the render.yaml configuration');
  console.log('   3. Monitor the build logs for any issues');
} else {
  console.log('\n⚠️ Please fix the issues above before deploying.');
  process.exit(1);
}

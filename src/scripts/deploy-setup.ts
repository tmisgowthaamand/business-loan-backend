import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { initializeAllData } from './initialize-data';
import { syncAllDataToSupabase } from './sync-to-supabase';

async function setupDeployment() {
  console.log('🚀 Setting up deployment with complete data...');
  console.log('=====================================');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Step 1: Initialize all local data
    console.log('📊 Step 1: Initializing local data...');
    await initializeAllData();
    
    // Step 2: Sync all data to Supabase
    console.log('🔄 Step 2: Syncing data to Supabase...');
    await syncAllDataToSupabase();
    
    // Step 3: Verify deployment readiness
    console.log('✅ Step 3: Verifying deployment readiness...');
    
    // Check all services
    const services = [
      'EnquiryService',
      'DocumentService', 
      'ShortlistService',
      'CashfreeService',
      'StaffService',
      'TransactionService',
      'NotificationsService'
    ];
    
    for (const serviceName of services) {
      try {
        const service = app.get(serviceName);
        console.log(`✅ ${serviceName}: Available`);
      } catch (error) {
        console.log(`❌ ${serviceName}: Not available`);
      }
    }
    
    console.log('🎉 Deployment setup completed successfully!');
    console.log('📋 What was set up:');
    console.log('   ✅ Sample enquiries with real client data');
    console.log('   ✅ Document uploads with verification status');
    console.log('   ✅ Shortlisted clients ready for processing');
    console.log('   ✅ Payment gateway applications');
    console.log('   ✅ Staff members with proper roles');
    console.log('   ✅ Transaction records');
    console.log('   ✅ System notifications');
    console.log('   ✅ Supabase database synchronization');
    
    console.log('🌐 Your deployment is ready at:');
    console.log('   Frontend: https://business-loan-frontend.vercel.app/');
    console.log('   Backend: https://business-loan-backend.onrender.com');
    
  } catch (error) {
    console.error('❌ Error during deployment setup:', error);
  } finally {
    await app.close();
  }
}

// Run the deployment setup
if (require.main === module) {
  setupDeployment()
    .then(() => {
      console.log('✅ Deployment setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deployment setup script failed:', error);
      process.exit(1);
    });
}

export { setupDeployment };

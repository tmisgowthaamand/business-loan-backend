import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SupabaseService } from '../supabase/supabase.service';
import { EnquiryService } from '../enquiry/enquiry.service';

async function syncAllDataToSupabase() {
  console.log('🔄 Syncing data to Supabase...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get services
    const supabaseService = app.get(SupabaseService);
    const enquiryService = app.get(EnquiryService);

    // Test Supabase connection
    console.log('🔗 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabaseService.client
      .from('Enquiry')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Sync Enquiries with mock user
    console.log('📊 Syncing enquiries to Supabase...');
    const mockUser = { id: 1, role: 'ADMIN' } as any;
    const enquiries = await enquiryService.findAll({}, mockUser);
    let enquiriesSynced = 0;
    
    for (const enquiry of enquiries) {
      try {
        const { error } = await supabaseService.client
          .from('Enquiry')
          .upsert({
            id: enquiry.id,
            name: enquiry.name,
            mobile: enquiry.mobile,
            businessType: enquiry.businessType,
            businessName: enquiry.businessName,
            createdAt: enquiry.createdAt || new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (!error) {
          enquiriesSynced++;
        } else {
          console.error(`❌ Error syncing enquiry ${enquiry.name}:`, error);
        }
      } catch (error) {
        console.error(`❌ Error syncing enquiry ${enquiry.name}:`, error);
      }
    }
    console.log(`✅ Synced ${enquiriesSynced}/${enquiries.length} enquiries`);

    console.log('🎉 Supabase sync completed successfully!');
    console.log('📊 Sync Summary:');
    console.log(`   - Enquiries: ${enquiriesSynced}/${enquiries.length}`);

  } catch (error) {
    console.error('❌ Error during Supabase sync:', error);
  } finally {
    await app.close();
  }
}

// Run the sync
if (require.main === module) {
  syncAllDataToSupabase()
    .then(() => {
      console.log('✅ Supabase sync script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Supabase sync script failed:', error);
      process.exit(1);
    });
}

export { syncAllDataToSupabase };

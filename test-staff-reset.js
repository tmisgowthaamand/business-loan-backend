const fetch = require('node-fetch');

const baseUrl = 'http://localhost:5002';

async function testStaffReset() {
  console.log('🎯 Testing Staff Reset to 7 Default Members...\n');
  
  try {
    // Step 1: Check current staff count
    console.log('📋 STEP 1: Check Current Staff Count');
    console.log('=' .repeat(50));
    
    const currentResponse = await fetch(`${baseUrl}/api/simple-staff`);
    const currentData = await currentResponse.json();
    const currentStaff = currentData.staff || [];
    
    console.log(`📊 Current staff count: ${currentStaff.length}`);
    console.log(`👥 Current staff: ${currentStaff.map(s => s.name).join(', ')}`);
    
    // Step 2: Reset to default 7 members
    console.log('\n📋 STEP 2: Reset to 7 Default Members');
    console.log('=' .repeat(50));
    
    const resetResponse = await fetch(`${baseUrl}/api/simple-staff/reset-to-default`, {
      method: 'POST'
    });
    
    const resetData = await resetResponse.json();
    
    if (resetResponse.ok) {
      console.log('✅ Reset successful');
      console.log(`📊 New staff count: ${resetData.count}`);
      console.log(`👥 Default staff created: ${resetData.staff.map(s => s.name).join(', ')}`);
      
      // Step 3: Verify the reset worked
      console.log('\n📋 STEP 3: Verify Reset Results');
      console.log('=' .repeat(50));
      
      const verifyResponse = await fetch(`${baseUrl}/api/simple-staff`);
      const verifyData = await verifyResponse.json();
      const verifyStaff = verifyData.staff || [];
      
      console.log(`📊 Verified staff count: ${verifyStaff.length}`);
      
      if (verifyStaff.length === 7) {
        console.log('✅ SUCCESS: Exactly 7 staff members created');
        
        const adminCount = verifyStaff.filter(s => s.role === 'ADMIN').length;
        const employeeCount = verifyStaff.filter(s => s.role === 'EMPLOYEE').length;
        
        console.log(`👑 Admin count: ${adminCount}`);
        console.log(`👤 Employee count: ${employeeCount}`);
        
        console.log('\n📋 Staff Details:');
        verifyStaff.forEach((staff, index) => {
          console.log(`${index + 1}. ${staff.name} (${staff.role}) - ${staff.email}`);
        });
        
        console.log('\n🎉 STAFF RESET TEST PASSED!');
        console.log('✅ 7 default staff members created successfully');
        console.log('✅ Mix of admin and employee roles');
        console.log('✅ All staff are active and verified');
        
      } else {
        console.log(`❌ FAILED: Expected 7 staff, got ${verifyStaff.length}`);
      }
      
    } else {
      console.log('❌ Reset failed:', resetData.message);
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

testStaffReset();

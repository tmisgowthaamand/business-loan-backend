// Final Render deployment solution test
const fetch = require('node-fetch');

const testFinalSolution = async () => {
  console.log('🚀 Testing Final Render Solution...\n');
  
  const baseUrl = 'http://localhost:5002/api';
  
  // Step 1: Create staff
  console.log('📋 STEP 1: Creating staff');
  console.log('=' .repeat(40));
  
  const staff = {
    name: 'Final Test User',
    email: 'finaltest@example.com',
    password: 'final123',
    role: 'ADMIN',
    department: 'Testing',
    position: 'Final Tester'
  };
  
  let staffId = null;
  
  try {
    const createResponse = await fetch(`${baseUrl}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff)
    });
    
    const createResult = await createResponse.json();
    
    if (createResponse.ok) {
      console.log(`✅ Staff created: ${staff.name}`);
      console.log(`   🆔 ID: ${createResult.staff?.id}`);
      staffId = createResult.staff?.id;
    } else {
      console.log(`❌ Creation failed: ${createResult.message}`);
      return;
    }
  } catch (error) {
    console.log(`❌ Creation error: ${error.message}`);
    return;
  }
  
  // Step 2: Use immediate activation endpoint
  console.log('\n📋 STEP 2: Using immediate activation');
  console.log('=' .repeat(40));
  
  try {
    const activateResponse = await fetch(`${baseUrl}/staff/activate/${staffId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const activateResult = await activateResponse.json();
    
    if (activateResponse.ok) {
      console.log(`✅ Immediate activation successful`);
      console.log(`   👤 Name: ${activateResult.staff?.name}`);
      console.log(`   📊 Status: ${activateResult.staff?.status}`);
      console.log(`   🚪 Has Access: ${activateResult.staff?.hasAccess}`);
    } else {
      console.log(`❌ Activation failed: ${activateResult.message}`);
      return;
    }
  } catch (error) {
    console.log(`❌ Activation error: ${error.message}`);
    return;
  }
  
  // Step 3: Test login
  console.log('\n📋 STEP 3: Testing login');
  console.log('=' .repeat(40));
  
  try {
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: staff.email, 
        password: staff.password 
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (loginResponse.ok && loginResult.access_token) {
      console.log(`✅ Login successful!`);
      console.log(`   👤 Name: ${loginResult.user?.name}`);
      console.log(`   🔑 Role: ${loginResult.user?.role}`);
      console.log(`   🎫 Token: [PROVIDED]`);
      
      console.log('\n🎉 FINAL SOLUTION WORKS!');
      console.log('   ✅ Staff creation: Working');
      console.log('   ✅ Immediate activation: Working');
      console.log('   ✅ Login after activation: Working');
      console.log('   ✅ No email verification needed');
      console.log('   ✅ Perfect for Render deployment');
      
      console.log('\n🚀 RENDER DEPLOYMENT INSTRUCTIONS:');
      console.log('   1. Create staff: POST /api/staff');
      console.log('   2. Activate staff: POST /api/staff/activate/{id}');
      console.log('   3. Staff can login immediately');
      console.log('   4. No email verification required');
      
    } else {
      console.log(`❌ Login failed: ${loginResult.message}`);
    }
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
  }
};

testFinalSolution().catch(console.error);

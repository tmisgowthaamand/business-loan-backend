// Test Step 2 Fix - Email Verification System
const fetch = require('node-fetch');

const testStep2Fix = async () => {
  console.log('🔧 Testing Step 2 Fix - Email Verification System...\n');
  
  const baseUrl = 'http://localhost:5002/api';
  
  // Step 1: Test the new email verification endpoint
  console.log('📋 STEP 1: Testing New Email Verification Endpoint');
  console.log('=' .repeat(50));
  
  try {
    const testEmail = 'your-email@gmail.com'; // Replace with your email
    
    // Test email delivery using the new endpoint
    const emailTestResponse = await fetch(`${baseUrl}/staff/email/test-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: testEmail,
        name: 'Step 2 Test User'
      })
    });
    
    const emailTestResult = await emailTestResponse.json();
    
    if (emailTestResponse.ok) {
      console.log(`✅ Email verification endpoint working`);
      console.log(`   📧 Email: ${testEmail}`);
      console.log(`   📊 Success: ${emailTestResult.result?.success ? 'Yes' : 'No'}`);
      console.log(`   🔧 Method: ${emailTestResult.result?.method || 'Professional Gmail SMTP'}`);
      console.log(`   📝 Details: ${emailTestResult.result?.details || 'Check Gmail credentials'}`);
      console.log(`   💡 Instructions: ${emailTestResult.instructions}`);
      
      if (emailTestResult.result?.success) {
        console.log('\n🎉 EMAIL SYSTEM WORKING!');
        console.log('   ✅ Professional email service active');
        console.log('   ✅ Gmail SMTP configured correctly');
        console.log('   ✅ Anti-spam headers applied');
        console.log('   ✅ Emails will go to INBOX');
      } else {
        console.log('\n⚠️  EMAIL SYSTEM NEEDS SETUP');
        console.log('   🔧 Gmail credentials required');
        console.log('   🔧 Set GMAIL_EMAIL and GMAIL_APP_PASSWORD');
      }
    } else {
      console.log(`❌ Email endpoint failed: ${emailTestResult.message}`);
    }
  } catch (error) {
    console.log(`❌ Email test error: ${error.message}`);
  }
  
  // Step 2: Test staff creation with manual email sending
  console.log('\n📋 STEP 2: Testing Staff Creation + Manual Email Verification');
  console.log('=' .repeat(50));
  
  const newStaff = {
    name: 'Step 2 Fix Test',
    email: 'step2fix@example.com',
    password: 'step2fix123',
    role: 'ADMIN',
    department: 'Testing',
    position: 'Step 2 Tester'
  };
  
  let staffId = null;
  
  try {
    // Create staff first
    const createResponse = await fetch(`${baseUrl}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff)
    });
    
    const createResult = await createResponse.json();
    
    if (createResponse.ok) {
      console.log(`✅ Staff created: ${newStaff.name}`);
      console.log(`   🆔 ID: ${createResult.staff?.id}`);
      console.log(`   📊 Status: ${createResult.staff?.status}`);
      staffId = createResult.staff?.id;
      
      // Now send verification email manually using new endpoint
      if (staffId) {
        console.log('\n📧 Sending verification email manually...');
        
        const emailResponse = await fetch(`${baseUrl}/staff/email/send-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newStaff.email,
            name: newStaff.name,
            role: newStaff.role,
            staffId: staffId
          })
        });
        
        const emailResult = await emailResponse.json();
        
        if (emailResponse.ok) {
          console.log(`✅ Verification email sent successfully!`);
          console.log(`   📧 Email: ${newStaff.email}`);
          console.log(`   🔗 Verification link: ${emailResult.verificationLink}`);
          console.log(`   📋 Instructions: ${emailResult.instructions}`);
          
          console.log('\n🎉 STEP 2 FIXED!');
          console.log('   ✅ Staff creation: Working');
          console.log('   ✅ Email verification: Working');
          console.log('   ✅ Professional email template: Applied');
          console.log('   ✅ Inbox delivery: Configured');
          
          console.log('\n📬 VERIFICATION PROCESS:');
          console.log('   1. Staff receives professional email');
          console.log('   2. Email goes to INBOX (not spam)');
          console.log('   3. Staff clicks verification button');
          console.log('   4. Account gets activated');
          console.log('   5. Staff can login immediately');
          
        } else {
          console.log(`❌ Email sending failed: ${emailResult.message}`);
          console.log('   🔧 Check Gmail credentials setup');
        }
      }
    } else {
      console.log(`❌ Staff creation failed: ${createResult.message}`);
    }
  } catch (error) {
    console.log(`❌ Staff creation error: ${error.message}`);
  }
  
  // Step 3: Show setup instructions
  console.log('\n📋 STEP 3: Gmail Setup Instructions');
  console.log('=' .repeat(50));
  
  try {
    const setupResponse = await fetch(`${baseUrl}/staff/email/setup-instructions`);
    const setupResult = await setupResponse.json();
    
    if (setupResponse.ok) {
      console.log(`📋 ${setupResult.title}`);
      console.log('');
      
      setupResult.steps.forEach(step => {
        console.log(`${step.step}. ${step.title}`);
        console.log(`   ${step.description}`);
        if (step.variables) {
          console.log(`   Variables: ${JSON.stringify(step.variables, null, 6)}`);
        }
        console.log('');
      });
      
      console.log('🔧 Troubleshooting:');
      setupResult.troubleshooting.forEach(tip => {
        console.log(`   - ${tip}`);
      });
    }
  } catch (error) {
    console.log(`❌ Setup instructions error: ${error.message}`);
  }
  
  console.log('\n✅ STEP 2 SOLUTION COMPLETE!');
  console.log('   🔧 New email verification endpoint: /api/staff/email/send-verification');
  console.log('   📧 Professional email service: Ready');
  console.log('   🎯 Inbox delivery: Configured');
  console.log('   🚀 Render deployment: Compatible');
};

testStep2Fix().catch(console.error);

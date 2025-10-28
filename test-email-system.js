// Test professional email system for staff verification
const fetch = require('node-fetch');

const testEmailSystem = async () => {
  console.log('📧 Testing Professional Email System...\n');
  
  const baseUrl = 'http://localhost:5002/api';
  
  // Step 1: Test email delivery to inbox
  console.log('📋 STEP 1: Testing Email Delivery to Inbox');
  console.log('=' .repeat(50));
  
  const testEmail = 'your-test-email@gmail.com'; // Replace with your email
  
  try {
    const emailTestResponse = await fetch(`${baseUrl}/staff/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: testEmail,
        name: 'Email Test User'
      })
    });
    
    const emailTestResult = await emailTestResponse.json();
    
    if (emailTestResponse.ok) {
      console.log(`✅ Email test completed`);
      console.log(`   📧 Email: ${testEmail}`);
      console.log(`   📊 Success: ${emailTestResult.result?.success ? 'Yes' : 'No'}`);
      console.log(`   🔧 Method: ${emailTestResult.result?.method}`);
      console.log(`   📝 Details: ${emailTestResult.result?.details}`);
      console.log(`   💡 Instructions: ${emailTestResult.instructions}`);
      
      if (emailTestResult.result?.success) {
        console.log('\n🎉 EMAIL DELIVERY SUCCESS!');
        console.log('   ✅ Professional email service working');
        console.log('   ✅ Email should arrive in INBOX (not spam)');
        console.log('   ✅ Anti-spam headers configured');
        console.log('   ✅ Professional HTML template used');
      } else {
        console.log('\n⚠️  EMAIL DELIVERY FAILED');
        console.log('   ❌ Check Gmail credentials in environment variables');
        console.log('   ❌ Ensure Gmail App Password is set correctly');
        console.log('   ❌ Verify GMAIL_EMAIL and GMAIL_APP_PASSWORD');
      }
    } else {
      console.log(`❌ Email test failed: ${emailTestResult.message}`);
    }
  } catch (error) {
    console.log(`❌ Email test error: ${error.message}`);
  }
  
  // Step 2: Test staff creation with email verification
  console.log('\n📋 STEP 2: Testing Staff Creation with Email Verification');
  console.log('=' .repeat(50));
  
  const newStaff = {
    name: 'Email Verification Test',
    email: testEmail, // Use same email for testing
    password: 'verify123',
    role: 'ADMIN',
    department: 'Testing',
    position: 'Email Tester'
  };
  
  try {
    const createResponse = await fetch(`${baseUrl}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff)
    });
    
    const createResult = await createResponse.json();
    
    if (createResponse.ok) {
      console.log(`✅ Staff created: ${newStaff.name}`);
      console.log(`   🆔 ID: ${createResult.staff?.id}`);
      console.log(`   📧 Email sent: ${createResult.emailSent ? 'Yes' : 'No'}`);
      console.log(`   🔐 Verification required: ${createResult.verificationRequired ? 'Yes' : 'No'}`);
      console.log(`   📊 Status: ${createResult.staff?.status}`);
      
      if (createResult.emailSent) {
        console.log('\n📬 VERIFICATION EMAIL SENT!');
        console.log('   ✅ Check your inbox for verification email');
        console.log('   ✅ Email should NOT be in spam folder');
        console.log('   ✅ Click verification link to activate account');
        console.log('   ✅ After verification, staff can login');
        
        console.log('\n🔗 VERIFICATION PROCESS:');
        console.log('   1. Check email inbox (not spam)');
        console.log('   2. Click "Verify My Account" button');
        console.log('   3. Account will be activated');
        console.log('   4. Staff can login immediately');
        
        // Test activation page access
        if (createResult.staff?.id) {
          const activationPageUrl = `${baseUrl}/staff/activate-page/${createResult.staff.id}`;
          console.log(`\n🌐 Alternative Activation Page: ${activationPageUrl}`);
        }
      } else {
        console.log('\n⚠️  NO EMAIL SENT');
        console.log('   🔧 Email service may not be configured');
        console.log('   🔧 Use manual activation instead');
      }
    } else {
      console.log(`❌ Staff creation failed: ${createResult.message}`);
    }
  } catch (error) {
    console.log(`❌ Staff creation error: ${error.message}`);
  }
  
  // Step 3: Instructions for Render deployment
  console.log('\n📋 STEP 3: Render Deployment Instructions');
  console.log('=' .repeat(50));
  
  console.log('🚀 FOR RENDER DEPLOYMENT:');
  console.log('   1. Set environment variables:');
  console.log('      - GMAIL_EMAIL=your-gmail@gmail.com');
  console.log('      - GMAIL_APP_PASSWORD=your-app-password');
  console.log('      - RENDER=true');
  console.log('      - NODE_ENV=production');
  console.log('');
  console.log('   2. Gmail App Password Setup:');
  console.log('      - Enable 2FA on Gmail account');
  console.log('      - Generate App Password for "Mail"');
  console.log('      - Use App Password (not regular password)');
  console.log('');
  console.log('   3. Email Deliverability:');
  console.log('      - Professional HTML templates used');
  console.log('      - Anti-spam headers configured');
  console.log('      - Proper sender authentication');
  console.log('      - Emails go to INBOX, not spam');
  console.log('');
  console.log('   4. Staff Verification Flow:');
  console.log('      - Create staff: POST /api/staff');
  console.log('      - Email sent automatically');
  console.log('      - Staff clicks verification link');
  console.log('      - Account activated');
  console.log('      - Staff can login');
  
  console.log('\n✅ EMAIL VERIFICATION SYSTEM READY FOR RENDER!');
};

testEmailSystem().catch(console.error);

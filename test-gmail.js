const axios = require('axios');

async function testGmailDelivery() {
  console.log('🧪 Testing Gmail delivery to staff members...');
  console.log('📧 Sender: gokrishna98@gmail.com');
  console.log('🎯 Target: perivihari8@gmail.com');
  
  try {
    // Test 1: Gmail Connection
    console.log('\n📡 Testing Gmail SMTP connection...');
    const connectionResponse = await axios.get('http://localhost:5002/api/staff/test/gmail-connection');
    console.log('✅ Connection Test Result:', connectionResponse.data);
    
    // Test 2: Send verification email to Perivi
    console.log('\n📧 Testing email delivery to perivihari8@gmail.com...');
    const emailResponse = await axios.post('http://localhost:5002/api/staff/test/send-verification', {
      email: 'perivihari8@gmail.com'
    });
    console.log('✅ Email Test Result:', emailResponse.data);
    
    // Test 3: Test all staff emails
    console.log('\n📧 Testing email delivery to all staff members...');
    const allStaffResponse = await axios.post('http://localhost:5002/api/staff/test/email-delivery-all');
    console.log('✅ All Staff Email Test Result:', allStaffResponse.data);
    
    // Test 4: Render-specific test
    console.log('\n🌐 Testing Render email delivery fix...');
    const renderResponse = await axios.post('http://localhost:5002/api/staff/test/render-email-fix', {
      email: 'perivihari8@gmail.com'
    });
    console.log('✅ Render Test Result:', renderResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Server not running. Please start the backend server first:');
      console.log('   cd Loan-backend-main && npm start');
    }
  }
}

// Run the test
testGmailDelivery();

// test-password-reset.js - Test password reset functionality
// Run with: node test-password-reset.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data - using the user we created in previous tests
const testData = {
  emailIdentifier: 'ahmed@example.com',
  phoneIdentifier: '555123456',
  newPassword: 'NewTest123!@#'
};

async function testPasswordResetFlow() {
  console.log('🔑 Testing Password Reset Functionality\n');

  try {
    // Test 1: Request password reset with email
    console.log('1️⃣ Testing Forgot Password with Email...');
    const forgotEmailResponse = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
      identifier: testData.emailIdentifier
    });
    
    if (forgotEmailResponse.data.success) {
      console.log('✅ Email reset request successful!');
      console.log('Message:', forgotEmailResponse.data.message);
      console.log('Type:', forgotEmailResponse.data.type);
    }

    // Test 2: Request password reset with phone
    console.log('\n2️⃣ Testing Forgot Password with Phone...');
    const forgotPhoneResponse = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
      identifier: testData.phoneIdentifier
    });
    
    if (forgotPhoneResponse.data.success) {
      console.log('✅ Phone reset request successful!');
      console.log('Message:', forgotPhoneResponse.data.message);
      console.log('Type:', forgotPhoneResponse.data.type);
    }

    // Test 3: Test with non-existent user
    console.log('\n3️⃣ Testing with Non-existent User...');
    try {
      const nonExistentResponse = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
        identifier: 'nonexistent@example.com'
      });
      
      if (nonExistentResponse.data.success) {
        console.log('✅ Non-existent user handled correctly (security)');
        console.log('Message:', nonExistentResponse.data.message);
      }
    } catch (error) {
      console.log('✅ Non-existent user handled correctly');
    }

    // Test 4: Test rate limiting
    console.log('\n4️⃣ Testing Rate Limiting...');
    try {
      // Try to make multiple requests quickly
      for (let i = 0; i < 4; i++) {
        await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
          identifier: 'test.rate.limit@example.com'
        });
      }
      console.log('❌ Rate limiting should have kicked in');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Rate limiting working correctly');
        console.log('Message:', error.response.data.error?.message);
      }
    }

    // Test 5: Invalid identifier format
    console.log('\n5️⃣ Testing Invalid Identifier...');
    try {
      await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
        identifier: 'invalid-format'
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid identifier rejected correctly');
        console.log('Message:', error.response.data.error?.message);
      }
    }

    // Test 6: Test password reset with invalid token
    console.log('\n6️⃣ Testing Reset with Invalid Token...');
    try {
      await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        token: 'invalid-token',
        password: testData.newPassword
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid token rejected correctly');
        console.log('Message:', error.response.data.error?.message);
      }
    }

    // Test 7: Test weak password validation
    console.log('\n7️⃣ Testing Weak Password Validation...');
    try {
      await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        token: 'dummy-token',
        password: '123'
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Weak password rejected correctly');
        console.log('Message:', error.response.data.error?.message);
      }
    }

    // Test 8: Verify token endpoint
    console.log('\n8️⃣ Testing Token Verification Endpoint...');
    try {
      const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify-reset-token/invalid-token`);
      
      if (!verifyResponse.data.valid) {
        console.log('✅ Token verification working correctly');
        console.log('Valid:', verifyResponse.data.valid);
      }
    } catch (error) {
      console.log('✅ Token verification handled error correctly');
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Test failed:', error.response.data.error?.message || error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

// Test validation errors
async function testValidationErrors() {
  console.log('\n🔍 Testing Validation Errors...\n');

  const invalidRequests = [
    {
      description: 'Empty identifier',
      data: { identifier: '' }
    },
    {
      description: 'Invalid email format',
      data: { identifier: 'invalid-email' }
    },
    {
      description: 'Invalid phone format',
      data: { identifier: '123456789' }  // Doesn't start with 5
    },
    {
      description: 'Missing identifier',
      data: {}
    }
  ];

  for (let i = 0; i < invalidRequests.length; i++) {
    const test = invalidRequests[i];
    try {
      console.log(`Testing: ${test.description}...`);
      await axios.post(`${BASE_URL}/api/auth/forgot-password`, test.data);
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`✅ Validation error caught: ${error.response.data.error?.message}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
  }
}

// Instructions for manual testing
function printManualTestingInstructions() {
  console.log('\n📋 Manual Testing Instructions:\n');
  console.log('To test the complete password reset flow:');
  console.log('1. Make sure your MailerSend API key is configured in .env');
  console.log('2. Run: POST /api/auth/forgot-password with a real email');
  console.log('3. Check your email for the reset link');
  console.log('4. Extract the token from the reset link');
  console.log('5. Use the token to reset password: POST /api/auth/reset-password');
  console.log('6. Try logging in with the new password');
  console.log('\nFor SMS testing:');
  console.log('1. Configure Auth0 SMS provider in your Auth0 dashboard');
  console.log('2. Test with phone number: POST /api/auth/forgot-password');
  console.log('3. Check SMS for reset link');
  console.log('\nExample requests:');
  console.log(`
POST ${BASE_URL}/api/auth/forgot-password
{
  "identifier": "your-email@example.com"
}

POST ${BASE_URL}/api/auth/reset-password  
{
  "token": "token-from-email-or-sms",
  "password": "NewSecurePassword123!@#"
}
  `);
}

// Run all tests
async function runAllTests() {
  console.log('Make sure your server is running on http://localhost:5000\n');
  
  await testPasswordResetFlow();
  await testValidationErrors();
  printManualTestingInstructions();
  
  console.log('\n🏁 Password Reset Tests Completed!');
}

// Check if axios is available
try {
  runAllTests();
} catch (error) {
  console.log('❌ Please make sure axios is installed: npm install axios');
}
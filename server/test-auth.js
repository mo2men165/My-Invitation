// test-auth.js - Simple script to test the new authentication system
// Run with: node test-auth.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000'; // Adjust if your server runs on different port

// Test data
const testUser = {
  firstName: 'أحمد',
  lastName: 'المحمد',
  phone: '555123456', // Will be converted to +966555123456
  email: 'ahmed@example.com', // Optional
  city: 'الرياض',
  password: 'Test123!@#'
};

const testLogin = {
  identifier: '555123456', // Can be phone or email
  password: 'Test123!@#'
};

async function testAuthFlow() {
  console.log('🚀 Testing New Authentication System\n');

  try {
    // Test 1: Register new user
    console.log('1️⃣ Testing Registration...');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    if (registerResponse.data.success) {
      console.log('✅ Registration successful!');
      console.log('User:', registerResponse.data.user.name);
      console.log('Phone:', registerResponse.data.user.phone);
      console.log('Token received:', !!registerResponse.data.tokens.access_token);
      
      const accessToken = registerResponse.data.tokens.access_token;
      
      // Test 2: Access protected route with token from registration
      console.log('\n2️⃣ Testing Protected Route with Registration Token...');
      const protectedResponse = await axios.get(`${BASE_URL}/api/auth/protected`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (protectedResponse.data.message) {
        console.log('✅ Protected route access successful!');
        console.log('Message:', protectedResponse.data.message);
      }
      
      // Test 3: Get user profile
      console.log('\n3️⃣ Testing Get User Profile...');
      const profileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (profileResponse.data.success) {
        console.log('✅ Profile fetch successful!');
        console.log('Profile:', profileResponse.data.user.name);
      }
      
    } else {
      console.log('❌ Registration failed:', registerResponse.data.error?.message);
    }

    // Test 4: Login with phone number
    console.log('\n4️⃣ Testing Login with Phone...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, testLogin);
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log('User:', loginResponse.data.user.name);
      console.log('Last login:', loginResponse.data.user.lastLogin);
      
      // Test 5: Login with email (if email was provided)
      if (testUser.email) {
        console.log('\n5️⃣ Testing Login with Email...');
        const emailLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          identifier: testUser.email,
          password: testUser.password
        });
        
        if (emailLoginResponse.data.success) {
          console.log('✅ Email login successful!');
        }
      }
      
      // Test 6: Token refresh
      console.log('\n6️⃣ Testing Token Refresh...');
      const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refresh_token: loginResponse.data.tokens.refresh_token
      });
      
      if (refreshResponse.data.success) {
        console.log('✅ Token refresh successful!');
        console.log('New token received:', !!refreshResponse.data.access_token);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.error?.message);
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
async function testValidation() {
  console.log('\n🔍 Testing Validation...\n');

  const invalidRegistrations = [
    {
      // Missing required fields
      firstName: 'أحمد',
      // lastName missing
      phone: '555123456',
      city: 'الرياض',
      password: 'Test123!@#'
    },
    {
      // Invalid phone format
      firstName: 'أحمد',
      lastName: 'المحمد',
      phone: '1234567890', // Should start with 5
      city: 'الرياض',
      password: 'Test123!@#'
    },
    {
      // Invalid city
      firstName: 'أحمد',
      lastName: 'المحمد',
      phone: '555123456',
      city: 'دبي', // Not in allowed cities
      password: 'Test123!@#'
    },
    {
      // Weak password
      firstName: 'أحمد',
      lastName: 'المحمد',
      phone: '555123456',
      city: 'الرياض',
      password: '123' // Too weak
    }
  ];

  for (let i = 0; i < invalidRegistrations.length; i++) {
    try {
      console.log(`Testing invalid registration ${i + 1}...`);
      const response = await axios.post(`${BASE_URL}/api/auth/register`, invalidRegistrations[i]);
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

// Run tests
async function runAllTests() {
  console.log('Make sure your server is running on http://localhost:5000\n');
  
  await testAuthFlow();
  await testValidation();
  
  console.log('\n🏁 All tests completed!');
  console.log('\nNext steps:');
  console.log('1. Check your MongoDB to see the created user');
  console.log('2. Try the endpoints with Postman/Insomnia');
  console.log('3. Implement the frontend integration');
}

// Check if axios is available
try {
  runAllTests();
} catch (error) {
  console.log('❌ Please install axios first: npm install axios');
  console.log('Or test manually with curl/Postman');
}
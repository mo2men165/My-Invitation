// Debug test script for email functionality
// Run with: node test-email-debug.js

// Load environment variables first
require('dotenv').config();

const { emailService } = require('./dist/services/emailService');

async function testEmailDebug() {
  console.log('🔍 Debug email functionality...\n');

  // Test data for bill email
  const billEmailData = {
    paymentId: 'PAY_DEBUG_123456',
    totalAmount: 1500,
    paymentMethod: 'بطاقة ائتمان',
    transactionId: 'TXN_DEBUG_789012',
    paymentDate: new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    user: {
      name: 'أحمد محمد العتيبي',
      email: 'ahmed@example.com',
      phone: '+966501234567',
      city: 'الرياض'
    },
    events: [
      {
        eventId: 'EVENT_DEBUG_001',
        hostName: 'أحمد محمد العتيبي',
        eventDate: '2024-02-15',
        eventLocation: 'قاعة الأفراح الملكية - الرياض',
        packageType: 'premium',
        inviteCount: 200,
        price: 1500
      }
    ]
  };

  try {
    console.log('📧 Testing bill email with detailed error logging...');
    
    // Test the template generation first
    console.log('1. Testing template generation...');
    const template = emailService.createBillEmailTemplate(billEmailData);
    console.log('✅ Template generated successfully');
    console.log('   Subject:', template.subject);
    console.log('   HTML length:', template.html.length);
    
    // Test the actual email sending with detailed error handling
    console.log('\n2. Testing email sending...');
    console.log('   Environment check:');
    console.log('   - MAILERSEND_API_KEY:', process.env.MAILERSEND_API_KEY ? 'Set' : 'Not set');
    console.log('   - MAILERSEND_FROM_EMAIL:', process.env.MAILERSEND_FROM_EMAIL || 'Not set');
    console.log('   - MAILERSEND_FROM_NAME:', process.env.MAILERSEND_FROM_NAME || 'Not set');
    
    const result = await emailService.sendBillEmail(billEmailData);
    console.log('✅ Bill email sent successfully:', result);

  } catch (error) {
    console.error('❌ Email test failed with detailed error:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    // Check if it's a MailerSend specific error
    if (error.response) {
      console.error('   API Response status:', error.response.status);
      console.error('   API Response data:', error.response.data);
    }
    
    // Check if it's a network error
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  }
}

// Run the test
testEmailDebug().then(() => {
  console.log('\n✨ Debug test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Debug test failed:', error);
  process.exit(1);
});

// Test script for email functionality
// Run with: node test-email-functionality.js

// Load environment variables first
require('dotenv').config();

const { emailService } = require('./dist/services/emailService');

async function testEmailFunctionality() {
  console.log('🧪 Testing email functionality...\n');

  // Test data for bill email
  const billEmailData = {
    paymentId: 'PAY_TEST_123456',
    totalAmount: 2500,
    paymentMethod: 'بطاقة ائتمان',
    transactionId: 'TXN_TEST_789012',
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
        eventId: 'EVENT_001',
        hostName: 'أحمد محمد العتيبي',
        eventDate: '2024-02-15',
        eventLocation: 'قاعة الأفراح الملكية - الرياض',
        packageType: 'premium',
        inviteCount: 200,
        price: 1500
      },
      {
        eventId: 'EVENT_002',
        hostName: 'أحمد محمد العتيبي',
        eventDate: '2024-02-20',
        eventLocation: 'فندق الرياض الدولي',
        packageType: 'classic',
        inviteCount: 100,
        price: 1000
      }
    ]
  };

  // Test data for event details email
  const eventDetailsEmailData = {
    paymentId: 'PAY_TEST_123456',
    totalAmount: 2500,
    paymentMethod: 'بطاقة ائتمان',
    transactionId: 'TXN_TEST_789012',
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
        eventId: 'EVENT_001',
        hostName: 'أحمد محمد العتيبي',
        eventDate: '2024-02-15',
        eventLocation: 'قاعة الأفراح الملكية - الرياض',
        packageType: 'premium',
        inviteCount: 200,
        price: 1500,
        invitationText: 'يسرنا دعوتكم لحضور حفل زفافنا المبارك',
        startTime: '19:00',
        endTime: '23:00',
        additionalCards: 5,
        gateSupervisors: 2,
        fastDelivery: true,
        detectedCity: 'الرياض'
      },
      {
        eventId: 'EVENT_002',
        hostName: 'أحمد محمد العتيبي',
        eventDate: '2024-02-20',
        eventLocation: 'فندق الرياض الدولي',
        packageType: 'classic',
        inviteCount: 100,
        price: 1000,
        invitationText: 'دعوة لحضور حفل تخرجنا',
        startTime: '18:00',
        endTime: '22:00',
        additionalCards: 0,
        gateSupervisors: 1,
        fastDelivery: false,
        detectedCity: 'الرياض'
      }
    ]
  };

  try {
    console.log('📧 Testing bill email...');
    const billResult = await emailService.sendBillEmail(billEmailData);
    console.log('✅ Bill email sent successfully:', billResult);

    console.log('\n📧 Testing event details email...');
    const eventDetailsResult = await emailService.sendEventDetailsEmail(eventDetailsEmailData);
    console.log('✅ Event details email sent successfully:', eventDetailsResult);

    console.log('\n🎉 All email tests passed!');
    console.log('\n📋 Email recipients:');
    console.log('  - Bill email: accountant@myinvitation-sa.com');
    console.log('  - Event details: customersupport@myinvitation-sa.com, generalmanager@myinvitation-sa.com, ahmed.maher@myinvitation-sa.com');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testEmailFunctionality().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});

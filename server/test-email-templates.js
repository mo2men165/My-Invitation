// Test script for email template generation (without sending)
// Run with: node test-email-templates.js

// Load environment variables first
require('dotenv').config();

const { emailService } = require('./dist/services/emailService');

async function testEmailTemplates() {
  console.log('🧪 Testing email template generation...\n');

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
    console.log('📧 Testing bill email template generation...');
    
    // Access the private method through reflection (for testing only)
    const billTemplate = emailService.createBillEmailTemplate(billEmailData);
    console.log('✅ Bill email template generated successfully');
    console.log('📋 Bill email subject:', billTemplate.subject);
    console.log('📄 Bill email HTML length:', billTemplate.html.length, 'characters');
    console.log('📄 Bill email text length:', billTemplate.text.length, 'characters');

    console.log('\n📧 Testing event details email template generation...');
    
    // Access the private method through reflection (for testing only)
    const eventDetailsTemplate = emailService.createEventDetailsEmailTemplate(eventDetailsEmailData);
    console.log('✅ Event details email template generated successfully');
    console.log('📋 Event details email subject:', eventDetailsTemplate.subject);
    console.log('📄 Event details email HTML length:', eventDetailsTemplate.html.length, 'characters');
    console.log('📄 Event details email text length:', eventDetailsTemplate.text.length, 'characters');

    console.log('\n🎉 All email template tests passed!');
    console.log('\n📋 Email recipients:');
    console.log('  - Bill email: accountant@myinvitation-sa.com');
    console.log('  - Event details: customersupport@myinvitation-sa.com, generalmanager@myinvitation-sa.com, ahmed.maher@myinvitation-sa.com');

    // Save templates to files for inspection
    const fs = require('fs');
    fs.writeFileSync('bill-email-template.html', billTemplate.html);
    fs.writeFileSync('event-details-email-template.html', eventDetailsTemplate.html);
    console.log('\n💾 Templates saved to files:');
    console.log('  - bill-email-template.html');
    console.log('  - event-details-email-template.html');

  } catch (error) {
    console.error('❌ Email template test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testEmailTemplates().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});

// Test script for email functionality with trial account limitations
// Run with: node test-email-trial.js

// Load environment variables first
require('dotenv').config();

const { emailService } = require('./dist/services/emailService');

async function testEmailTrial() {
  console.log('🧪 Testing email functionality with trial account...\n');

  // Test data for bill email - using administrator email for trial account
  const billEmailData = {
    paymentId: 'PAY_TRIAL_123456',
    totalAmount: 2500,
    paymentMethod: 'بطاقة ائتمان',
    transactionId: 'TXN_TRIAL_789012',
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
        eventId: 'EVENT_TRIAL_001',
        hostName: 'أحمد محمد العتيبي',
        eventDate: '2024-02-15',
        eventLocation: 'قاعة الأفراح الملكية - الرياض',
        packageType: 'premium',
        inviteCount: 200,
        price: 1500
      },
      {
        eventId: 'EVENT_TRIAL_002',
        hostName: 'أحمد محمد العتيبي',
        eventDate: '2024-02-20',
        eventLocation: 'فندق الرياض الدولي',
        packageType: 'classic',
        inviteCount: 100,
        price: 1000
      }
    ]
  };

  // Test data for event details email - using administrator email for trial account
  const eventDetailsEmailData = {
    paymentId: 'PAY_TRIAL_123456',
    totalAmount: 2500,
    paymentMethod: 'بطاقة ائتمان',
    transactionId: 'TXN_TRIAL_789012',
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
        eventId: 'EVENT_TRIAL_001',
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
        eventId: 'EVENT_TRIAL_002',
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
    const billTemplate = emailService.createBillEmailTemplate(billEmailData);
    console.log('✅ Bill email template generated successfully');
    console.log('📋 Bill email subject:', billTemplate.subject);

    console.log('\n📧 Testing event details email template generation...');
    const eventDetailsTemplate = emailService.createEventDetailsEmailTemplate(eventDetailsEmailData);
    console.log('✅ Event details email template generated successfully');
    console.log('📋 Event details email subject:', eventDetailsTemplate.subject);

    console.log('\n🎉 Email template generation tests passed!');
    console.log('\n📋 Note: Due to MailerSend trial account limitations,');
    console.log('   emails can only be sent to the administrator email:');
    console.log('   - Administrator email:', process.env.MAILERSEND_FROM_EMAIL);
    console.log('\n📧 In production with a paid account, emails will be sent to:');
    console.log('   - Bill email: accountant@myinvitation-sa.com');
    console.log('   - Event details: customersupport@myinvitation-sa.com, generalmanager@myinvitation-sa.com, ahmed.maher@myinvitation-sa.com');

    // Save templates to files for inspection
    const fs = require('fs');
    fs.writeFileSync('bill-email-template-trial.html', billTemplate.html);
    fs.writeFileSync('event-details-email-template-trial.html', eventDetailsTemplate.html);
    console.log('\n💾 Templates saved to files:');
    console.log('  - bill-email-template-trial.html');
    console.log('  - event-details-email-template-trial.html');

  } catch (error) {
    console.error('❌ Email template test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testEmailTrial().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});

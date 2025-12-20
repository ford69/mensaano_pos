/**
 * Test script for Hubtel SMS integration
 * Run this script to test SMS functionality
 * 
 * Usage: node scripts/testSms.js
 */

require('dotenv').config();
const hubtelSmsService = require('../services/hubtelSmsService');

// Test data
const testOrder = {
  id: 'test123456',
  type: 'dine-in',
  tableNumber: 5,
  customer: {
    name: 'John Doe',
    phone: '0557780035' // Replace with your test phone number
  },
  items: [
    {
      menuItemId: 'item1',
      quantity: 2,
      size: 'large'
    },
    {
      menuItemId: 'item2',
      quantity: 1
    }
  ],
  status: 'pending',
  paymentStatus: 'unpaid',
  createdAt: new Date().toISOString()
};

const testMenuItems = [
  {
    id: 'item1',
    name: 'Chicken Shawarma',
    price: 25.00,
    sizeVariants: [
      { size: 'small', price: 20.00 },
      { size: 'large', price: 30.00 }
    ]
  },
  {
    id: 'item2',
    name: 'Beef Kebab',
    price: 35.00
  }
];

async function testSmsIntegration() {
  console.log('🧪 Testing Hubtel SMS Integration...\n');

  // Check configuration
  console.log('📋 Configuration Check:');
  console.log(`Client ID: ${process.env.HUBTEL_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`Client Secret: ${process.env.HUBTEL_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`Sender ID: ${process.env.HUBTEL_SENDER_ID || 'MENSAANO'}\n`);

  if (!process.env.HUBTEL_CLIENT_ID || !process.env.HUBTEL_CLIENT_SECRET) {
    console.log('❌ SMS configuration is incomplete. Please set the following environment variables:');
    console.log('   - HUBTEL_CLIENT_ID');
    console.log('   - HUBTEL_CLIENT_SECRET');
    console.log('   - HUBTEL_SENDER_ID (optional, defaults to MENSAANO)');
    console.log('\n📖 See config/hubtel.env.example for setup instructions.');
    return;
  }

  try {
    // Test 1: Phone number formatting
    console.log('🔧 Test 1: Phone Number Formatting');
    const testPhones = ['0557780035', '233557780035', '+233557780035', '557780035'];
    testPhones.forEach(phone => {
      try {
        const formatted = hubtelSmsService.formatPhoneNumber(phone);
        console.log(`   ${phone} → ${formatted}`);
      } catch (error) {
        console.log(`   ${phone} → ❌ Error: ${error.message}`);
      }
    });
    console.log('');

    // Test 2: Order confirmation SMS
    console.log('📱 Test 2: Order Confirmation SMS');
    try {
      const result = await hubtelSmsService.sendOrderConfirmation(testOrder, testMenuItems);
      console.log('   ✅ Order confirmation SMS sent successfully');
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.log(`   ❌ Order confirmation SMS failed: ${error.message}`);
    }
    console.log('');

    // Test 3: Order completion SMS
    console.log('📱 Test 3: Order Completion SMS');
    try {
      const result = await hubtelSmsService.sendOrderCompletion(testOrder, testMenuItems);
      console.log('   ✅ Order completion SMS sent successfully');
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.log(`   ❌ Order completion SMS failed: ${error.message}`);
    }
    console.log('');

    // Test 4: Simple SMS
    console.log('📱 Test 4: Simple SMS');
    try {
      const result = await hubtelSmsService.sendSms(testOrder.customer.phone, 'Test message from Mensaano POS system. This is a test SMS.');
      console.log('   ✅ Simple SMS sent successfully');
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.log(`   ❌ Simple SMS failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSmsIntegration().then(() => {
  console.log('\n🏁 SMS integration test completed.');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
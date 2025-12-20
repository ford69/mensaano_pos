# Hubtel SMS Integration Setup Guide

This guide will help you set up Hubtel SMS notifications for your POS system. SMS notifications will be sent when orders are created and when orders are completed.

## Prerequisites

1. A Hubtel account with SMS API access
2. Node.js backend environment
3. Valid phone numbers for testing

## Step 1: Get Hubtel API Credentials

1. **Login to your Hubtel account**
   - Go to [Hubtel Dashboard](https://designs.hubtel.com/)

2. **Navigate to SMS API**
   - Go to `Messaging` → `Manage` → `Programmable SMS`

3. **Create or use existing API Key**
   - If you don't have an API key, click "Create API Key"
   - If you have one, click "Details" to view credentials

4. **Get your credentials**
   - Copy your `Client ID`
   - Copy your `Client Secret`
   - Note your `Sender ID` (or use "MENSAANO")

5. **Fund your SMS API account**
   - Click "Add Funds" on your API key
   - Add sufficient balance for SMS messages

## Step 2: Configure Environment Variables

1. **Create environment file**
   ```bash
   cd backend
   cp config/hubtel.env.example .env
   ```

2. **Add your Hubtel credentials to .env**
   ```env
   HUBTEL_CLIENT_ID=your_actual_client_id_here
   HUBTEL_CLIENT_SECRET=your_actual_client_secret_here
   HUBTEL_SENDER_ID=MENSAANO
   ```

3. **Add to your main .env file** (if you have one)
   ```env
   # Add these lines to your existing .env file
   HUBTEL_CLIENT_ID=your_actual_client_id_here
   HUBTEL_CLIENT_SECRET=your_actual_client_secret_here
   HUBTEL_SENDER_ID=MENSAANO
   ```

## Step 3: Test the Integration

1. **Run the test script**
   ```bash
   cd backend
   node scripts/testSms.js
   ```

2. **Expected output**
   ```
   🧪 Testing Hubtel SMS Integration...

   📋 Configuration Check:
   Client ID: ✅ Set
   Client Secret: ✅ Set
   Sender ID: MENSAANO

   🔧 Test 1: Phone Number Formatting
   0557780035 → +233557780035
   233557780035 → +233557780035
   +233557780035 → +233557780035
   557780035 → +233557780035

   📱 Test 2: Order Confirmation SMS
   ✅ Order confirmation SMS sent successfully

   📱 Test 3: Order Completion SMS
   ✅ Order completion SMS sent successfully

   📱 Test 4: Simple SMS
   ✅ Simple SMS sent successfully

   🏁 SMS integration test completed.
   ```

## Step 4: Test with Real Orders

1. **Start your backend server**
   ```bash
   cd backend
   npm start
   ```

2. **Create a test order** through your frontend
   - Make sure to include a valid phone number
   - You should receive an SMS confirmation

3. **Mark the order as completed**
   - Update the order status to "completed"
   - You should receive a completion SMS

## SMS Message Examples

### Order Confirmation SMS
```
Hello John Doe! Your order #123456 has been received and is being prepared. Order type: Dine-In (Table 5). Total: ₵95.00. Thank you for choosing Mensaano & The Shawarma Shark!
```

### Order Completion SMS (Dine-In)
```
Hello John Doe! Your order #123456 is ready for pickup at Table 5. Total: ₵95.00. Enjoy your meal!
```

### Order Completion SMS (Delivery)
```
Hello John Doe! Your order #123456 is ready and will be delivered shortly. Total: ₵95.00. Thank you for choosing Mensaano & The Shawarma Shark!
```

## Troubleshooting

### Common Issues

1. **"SMS configuration missing" error**
   - Check that HUBTEL_CLIENT_ID and HUBTEL_CLIENT_SECRET are set in your .env file
   - Restart your server after adding environment variables

2. **"SMS failed" error**
   - Check your Hubtel account balance
   - Verify your API credentials are correct
   - Ensure your sender ID is approved

3. **Phone number formatting issues**
   - The system automatically formats Ghana phone numbers
   - Supported formats: 0557780035, 233557780035, +233557780035, 557780035
   - All will be converted to +233557780035

4. **No SMS received**
   - Check your phone number is correct
   - Verify your Hubtel account has sufficient balance
   - Check the server logs for error messages

### Debug Mode

To see detailed SMS logs, check your server console. You should see:
- ✅ SMS sent successfully
- ❌ SMS failed (with error details)
- ⚠️ No phone number provided

## Cost Information

- SMS messages typically cost around ₵0.05-₵0.10 per message
- Check your Hubtel dashboard for current pricing
- Monitor your usage in the Hubtel dashboard

## Security Notes

- Never commit your .env file to version control
- Keep your API credentials secure
- Use environment variables for all sensitive data

## Support

If you encounter issues:
1. Check the Hubtel documentation: https://docs-developers.hubtel.com/
2. Verify your account status in the Hubtel dashboard
3. Contact Hubtel support if API issues persist

## Features Implemented

✅ **Order Creation SMS**: Sent when a new order is created
✅ **Order Completion SMS**: Sent when order status changes to "completed"
✅ **Phone Number Formatting**: Automatic Ghana phone number formatting
✅ **Error Handling**: Graceful handling of SMS failures
✅ **Menu Item Integration**: SMS includes order details and totals
✅ **Dine-in vs Delivery**: Different messages for different order types
✅ **Test Script**: Comprehensive testing tool
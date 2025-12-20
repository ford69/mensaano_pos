const https = require('https');
const querystring = require('querystring');

class HubtelSmsService {
  constructor() {
    // Hubtel SMS API configuration
    this.baseUrl = 'https://smsc.hubtel.com/v1/messages/send';
    this.clientId = process.env.HUBTEL_CLIENT_ID;
    this.clientSecret = process.env.HUBTEL_CLIENT_SECRET;
    this.senderId = process.env.HUBTEL_SENDER_ID || 'MENSAANO';
  }

  /**
   * Send SMS message using Hubtel API
   * @param {string} phoneNumber - Recipient phone number (with country code)
   * @param {string} message - SMS message content
   * @returns {Promise<Object>} - API response
   */
  async sendSms(phoneNumber, message) {
    return new Promise((resolve, reject) => {
      // Validate required configuration
      if (!this.clientId || !this.clientSecret) {
        reject(new Error('Hubtel SMS configuration missing. Please set HUBTEL_CLIENT_ID and HUBTEL_CLIENT_SECRET environment variables.'));
        return;
      }

      // Format phone number (ensure it starts with +233 for Ghana)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Prepare request data
      const requestData = {
        From: this.senderId,
        To: formattedPhone,
        Content: message,
        ClientId: this.clientId,
        ClientSecret: this.clientSecret
      };

      // Convert to query string
      const postData = querystring.stringify(requestData);

      // Prepare HTTPS request options
      const options = {
        hostname: 'smsc.hubtel.com',
        port: 443,
        path: '/v1/messages/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      // Make the request
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
              console.log('✅ SMS sent successfully:', response);
              resolve(response);
            } else {
              console.error('❌ SMS failed:', response);
              reject(new Error(`SMS failed: ${response.message || 'Unknown error'}`));
            }
          } catch (error) {
            console.error('❌ Error parsing SMS response:', error);
            reject(new Error('Invalid response from SMS service'));
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ SMS request error:', error);
        reject(error);
      });

      // Send the request
      req.write(postData);
      req.end();
    });
  }

  /**
   * Format phone number for Ghana (+233)
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('233')) {
      // Already has country code
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      // Remove leading 0 and add country code
      return `+233${cleaned.substring(1)}`;
    } else if (cleaned.length === 9) {
      // Assume it's a local number without leading 0
      return `+233${cleaned}`;
    } else {
      // Return as is if it doesn't match expected patterns
      return `+${cleaned}`;
    }
  }

  /**
   * Send order confirmation SMS
   * @param {Object} order - Order object
   * @param {Array} menuItems - Menu items for order details
   * @returns {Promise<Object>} - SMS response
   */
  async sendOrderConfirmation(order, menuItems = []) {
    try {
      const customerName = order.customer.name;
      const orderNumber = order.id.slice(-6);
      const orderType = order.type === 'dine-in' ? `Dine-In (Table ${order.tableNumber})` : 'Delivery';
      
      // Calculate total
      let total = 0;
      order.items.forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        if (menuItem) {
          if (item.size && menuItem.sizeVariants) {
            const variant = menuItem.sizeVariants.find(v => v.size === item.size);
            total += variant ? variant.price * item.quantity : 0;
          } else {
            total += (menuItem.price || 0) * item.quantity;
          }
        }
      });

      const message = `Hello ${customerName}! Your order #${orderNumber} has been received and is being prepared. Order type: ${orderType}. Total: ₵${total.toFixed(2)}. Thank you for choosing Mensaano & The Shawarma Shark!`;

      return await this.sendSms(order.customer.phone, message);
    } catch (error) {
      console.error('❌ Error sending order confirmation SMS:', error);
      throw error;
    }
  }

  /**
   * Send order completion SMS
   * @param {Object} order - Order object
   * @param {Array} menuItems - Menu items for order details
   * @returns {Promise<Object>} - SMS response
   */
  async sendOrderCompletion(order, menuItems = []) {
    try {
      const customerName = order.customer.name;
      const orderNumber = order.id.slice(-6);
      const orderType = order.type === 'dine-in' ? `Dine-In (Table ${order.tableNumber})` : 'Delivery';
      
      // Calculate total
      let total = 0;
      order.items.forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        if (menuItem) {
          if (item.size && menuItem.sizeVariants) {
            const variant = menuItem.sizeVariants.find(v => v.size === item.size);
            total += variant ? variant.price * item.quantity : 0;
          } else {
            total += (menuItem.price || 0) * item.quantity;
          }
        }
      });

      let message;
      if (order.type === 'dine-in') {
        message = `Hello ${customerName}! Your order #${orderNumber} is ready for pickup at Table ${order.tableNumber}. Total: ₵${total.toFixed(2)}. Enjoy your meal!`;
      } else {
        message = `Hello ${customerName}! Your order #${orderNumber} is ready and will be delivered shortly. Total: ₵${total.toFixed(2)}. Thank you for choosing Mensaano & The Shawarma Shark!`;
      }

      return await this.sendSms(order.customer.phone, message);
    } catch (error) {
      console.error('❌ Error sending order completion SMS:', error);
      throw error;
    }
  }
}

module.exports = new HubtelSmsService();
const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
  type: String,
  tableNumber: Number,
  customer: {
    name: String,
    phone: String,
    address: String,
    riderContact: String,
  },
  items: [
    {
      menuItemId: String,
      quantity: Number,
      size: String,
      note: String,
    }
  ],
  status: String,
  paymentStatus: String,
  specialInstructions: String,
  createdBy: String,
  /** Set by POST /api/integration/orders for idempotent third-party ingestion */
  externalOrderId: { type: String, sparse: true, unique: true },
  /** e.g. whatsapp_ai, third_party */
  source: String,
  createdAt: String,
  updatedAt: String,
});
module.exports = mongoose.model('Order', OrderSchema); 
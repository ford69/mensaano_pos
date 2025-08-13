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
  createdAt: String,
  updatedAt: String,
});
module.exports = mongoose.model('Order', OrderSchema); 
const mongoose = require('mongoose');

const SizeVariantSchema = new mongoose.Schema({
  size: { type: String, required: true }, // 'small', 'medium', 'large'
  price: { type: Number, required: true },
  available: { type: Boolean, default: true }
});

const MenuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  available: Boolean,
  price: Number, // Single price for items without size variants
  sizeVariants: [SizeVariantSchema], // Optional size variants
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model('MenuItem', MenuItemSchema); 
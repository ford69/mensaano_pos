const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Get all orders
router.get('/', async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

// Create new order
router.post('/', async (req, res) => {
  try {
    // Add the creator information from the authenticated user
    const orderData = {
      ...req.body,
      createdBy: req.user.username, // Add the username of the user who created the order
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const order = new Order(orderData);
    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order
router.patch('/:id', async (req, res) => {
  try {
    console.log('🔍 BACKEND DEBUG: Updating order:', req.params.id);
    console.log('🔍 BACKEND DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    console.log('🔍 BACKEND DEBUG: Update data:', JSON.stringify(updateData, null, 2));
    
    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    console.log('🔍 BACKEND DEBUG: Updated order:', JSON.stringify(order, null, 2));
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router; 
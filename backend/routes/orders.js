const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const hubtelSmsService = require('../services/hubtelSmsService');

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
      createdBy: req.user.id, // Add the user ID of the user who created the order
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const order = new Order(orderData);
    await order.save();
    
    // Send SMS notification for order creation
    try {
      if (order.customer.phone) {
        const menuItems = await MenuItem.find();
        await hubtelSmsService.sendOrderConfirmation(order, menuItems);
        console.log('✅ Order confirmation SMS sent successfully');
      } else {
        console.log('⚠️ No phone number provided, skipping SMS notification');
      }
    } catch (smsError) {
      console.error('❌ Failed to send order confirmation SMS:', smsError.message);
      // Don't fail the order creation if SMS fails
    }
    
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
    
    // Get the original order to check if status is changing to completed
    const originalOrder = await Order.findById(req.params.id);
    const isStatusChangingToCompleted = originalOrder && 
      originalOrder.status !== 'completed' && 
      updateData.status === 'completed';
    
    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    console.log('🔍 BACKEND DEBUG: Updated order:', JSON.stringify(order, null, 2));
    
    // Send SMS notification for order completion
    if (isStatusChangingToCompleted) {
      try {
        if (order.customer.phone) {
          const menuItems = await MenuItem.find();
          await hubtelSmsService.sendOrderCompletion(order, menuItems);
          console.log('✅ Order completion SMS sent successfully');
        } else {
          console.log('⚠️ No phone number provided, skipping completion SMS notification');
        }
      } catch (smsError) {
        console.error('❌ Failed to send order completion SMS:', smsError.message);
        // Don't fail the order update if SMS fails
      }
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router; 
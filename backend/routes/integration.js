const express = require('express');
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const hubtelSmsService = require('../services/hubtelSmsService');
const integrationAuth = require('../middleware/integrationAuth');

const router = express.Router();
router.use(integrationAuth);

const CREATED_BY = () => process.env.INTEGRATION_ORDER_CREATED_BY || 'integration-external';

router.get('/menu_items', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    console.error('Integration menu_items GET:', err);
    res.status(500).json({ error: 'Failed to list menu items' });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const {
      externalOrderId,
      source = 'third_party',
      type,
      tableNumber,
      customer,
      items,
      status,
      paymentStatus,
      specialInstructions,
    } = req.body;

    if (!externalOrderId || typeof externalOrderId !== 'string' || !externalOrderId.trim()) {
      return res.status(400).json({ error: 'externalOrderId is required (non-empty string)' });
    }

    const trimmedExternalId = externalOrderId.trim();
    const existing = await Order.findOne({ externalOrderId: trimmedExternalId });
    if (existing) {
      return res.status(200).json(existing);
    }

    if (!type || !['dine-in', 'delivery'].includes(type)) {
      return res.status(400).json({ error: 'type must be "dine-in" or "delivery"' });
    }
    if (type === 'dine-in' && (tableNumber === undefined || tableNumber === null || Number.isNaN(Number(tableNumber)))) {
      return res.status(400).json({ error: 'tableNumber is required for dine-in orders' });
    }
    if (!customer || typeof customer.name !== 'string' || !customer.name.trim()) {
      return res.status(400).json({ error: 'customer.name is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }
    if (!status || !paymentStatus) {
      return res.status(400).json({ error: 'status and paymentStatus are required' });
    }

    for (const line of items) {
      if (!line.menuItemId || !mongoose.Types.ObjectId.isValid(line.menuItemId)) {
        return res.status(400).json({ error: `Invalid menuItemId: ${line.menuItemId}` });
      }
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty < 1) {
        return res.status(400).json({ error: 'Each item requires quantity >= 1' });
      }
    }

    const menuIds = items.map((i) => i.menuItemId);
    const foundCount = await MenuItem.countDocuments({ _id: { $in: menuIds } });
    if (foundCount !== menuIds.length) {
      return res.status(400).json({ error: 'One or more menuItemId values do not exist' });
    }

    const now = new Date().toISOString();
    const orderData = {
      type,
      tableNumber: type === 'dine-in' ? Number(tableNumber) : undefined,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone ? String(customer.phone).trim() : undefined,
        address: customer.address ? String(customer.address).trim() : undefined,
        riderContact: customer.riderContact ? String(customer.riderContact).trim() : undefined,
      },
      items: items.map((line) => ({
        menuItemId: String(line.menuItemId),
        quantity: Number(line.quantity),
        size: line.size ? String(line.size) : undefined,
        note: line.note ? String(line.note) : undefined,
      })),
      status,
      paymentStatus,
      specialInstructions: specialInstructions ? String(specialInstructions) : undefined,
      createdBy: CREATED_BY(),
      createdAt: now,
      updatedAt: now,
      externalOrderId: trimmedExternalId,
      source: typeof source === 'string' ? source.trim() || 'third_party' : 'third_party',
    };

    const order = new Order(orderData);
    try {
      await order.save();
    } catch (saveErr) {
      if (saveErr && saveErr.code === 11000) {
        const dup = await Order.findOne({ externalOrderId: trimmedExternalId });
        if (dup) return res.status(200).json(dup);
      }
      throw saveErr;
    }

    console.log('[integration] order persisted', {
      orderId: String(order._id),
      externalOrderId: trimmedExternalId,
      dbName: mongoose.connection?.db?.databaseName,
    });

    try {
      if (order.customer.phone) {
        const menuItems = await MenuItem.find();
        await hubtelSmsService.sendOrderConfirmation(order, menuItems);
      }
    } catch (smsError) {
      console.error('Integration order SMS:', smsError.message);
    }

    return res.status(201).json(order);
  } catch (err) {
    console.error('Integration orders POST:', err);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;

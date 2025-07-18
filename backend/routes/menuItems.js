const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

router.get('/', async (req, res) => {
  const items = await MenuItem.find();
  res.json(items);
});

router.post('/', async (req, res) => {
  const item = new MenuItem({
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await item.save();
  res.json(item);
});

router.patch('/:id', async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, {
    ...req.body,
    updatedAt: new Date().toISOString(),
  }, { new: true });
  res.json(item);
});

router.delete('/:id', async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router; 
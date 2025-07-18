const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'Email already in use' });

  const hash = await bcrypt.hash(password, 10);
  const user = new User({
    username,
    email,
    password: hash,
    role: role || 'waiter',
    createdAt: new Date().toISOString(),
  });
  await user.save();
  res.json({ success: true });
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('[LOGIN] Attempt with username:', username);
    const user = await User.findOne({ username });
    console.log('[LOGIN] User lookup result:', user ? `User found: ${user.username}` : 'No user found');
    if (!user) {
      console.log('[LOGIN] Invalid credentials: user not found');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] Password valid:', valid);
    if (!valid) {
      console.log('[LOGIN] Invalid credentials: password mismatch');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    console.log('[LOGIN] Login successful for:', user.username);
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('[LOGIN] Error during login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
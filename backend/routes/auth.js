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

    // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    let valid = false;
    if (user.password && user.password.startsWith('$2')) {
      // Password is hashed, use bcrypt.compare
      valid = await bcrypt.compare(password, user.password);
    } else {
      // Password is plain text (legacy users), compare directly and then hash it
      valid = user.password === password;
      if (valid && user.password) {
        // Hash the password for future logins
        const hash = await bcrypt.hash(password, 10);
        user.password = hash;
        await user.save();
        console.log('[LOGIN] Migrated user password to hashed format');
      }
    }
    
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
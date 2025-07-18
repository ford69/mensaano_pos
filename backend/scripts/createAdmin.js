const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const hash = await bcrypt.hash('password', 10); // <-- Set your admin password here
  const admin = new User({
    username: 'admin',
    password: hash,
    role: 'admin',
    createdAt: new Date().toISOString(),
  });
  await admin.save();
  console.log('Admin user created!');
  process.exit();
}

createAdmin(); 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function hashExistingPasswords() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find();
    console.log(`Found ${users.length} users`);

    let updated = 0;
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (!user.password || !user.password.startsWith('$2')) {
        if (!user.password) {
          console.log(`⚠️  User ${user.username} has no password - skipping`);
          continue;
        }

        console.log(`Hashing password for user: ${user.username}`);
        const hash = await bcrypt.hash(user.password, 10);
        user.password = hash;
        await user.save();
        updated++;
      } else {
        console.log(`✓ User ${user.username} already has hashed password`);
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updated} user(s).`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

hashExistingPasswords();

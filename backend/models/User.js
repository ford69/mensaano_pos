const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String, // hashed in production!
  role: String,
  createdAt: String,
});
module.exports = mongoose.model('User', UserSchema); 
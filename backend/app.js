const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const authMiddleware = require('./middleware/auth');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', authMiddleware, require('./routes/orders'));
app.use('/api/menu_items', require('./routes/menuItems'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => res.send('POS API Running'));

module.exports = app; 
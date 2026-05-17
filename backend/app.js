const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const authMiddleware = require('./middleware/auth');
const { integrationLimiter } = require('./middleware/rateLimits');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', authMiddleware, require('./routes/orders'));
app.use('/api/menu_items', require('./routes/menuItems'));
app.use('/api/users', require('./routes/users'));
app.use('/api/integration', integrationLimiter, require('./routes/integration'));

app.get('/', (req, res) => res.send('POS API Running'));

module.exports = app; 
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
require('dotenv').config();

const initDb = require('./config/initDb');
const { getExpressCorsOptions } = require('./config/cors');
const { initSocket } = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
const customerProfileRoutes = require('./routes/customerProfileRoutes');
const panditProfileRoutes = require('./routes/panditProfileRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

app.set('io', io);

app.use(cors(getExpressCorsOptions()));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'My-Pandit Backend is running',
  });
});

app.get('/reset-password', (req, res) => {
  const token = req.query.token;
  const query = token ? `?token=${encodeURIComponent(String(token))}` : '';
  res.redirect(`/api/auth/reset-password${query}`);
});

app.use('/api/auth', authRoutes);
app.use('/api/customer-profiles', customerProfileRoutes);
app.use('/api/pandit-profiles', panditProfileRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/push', require('./routes/pushRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/notifications', require('./routes/notificationsRoutes'));

const PORT = process.env.PORT || 5300;

async function startServer() {
  try {
    await initDb();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Local network: http://192.168.1.59:${PORT}`);
      console.log('Socket.io ready');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

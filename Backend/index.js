const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const initDb = require('./config/initDb');
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

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'My-Pandit Backend is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/customer-profiles', customerProfileRoutes);
app.use('/api/pandit-profiles', panditProfileRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);

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

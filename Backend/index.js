const express = require('express');
const cors = require('cors');
require('dotenv').config();

const initDb = require('./config/initDb');
const authRoutes = require('./routes/authRoutes');
const customerProfileRoutes = require('./routes/customerProfileRoutes');
const panditProfileRoutes = require('./routes/panditProfileRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

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

const PORT = process.env.PORT || 5300;

async function startServer() {
  try {
    await initDb();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Local network: http://192.168.1.59:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

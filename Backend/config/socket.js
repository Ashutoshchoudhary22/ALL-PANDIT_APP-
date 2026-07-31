const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'my-pandit-secret-key';

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const [rows] = await pool.query(
        'SELECT id, role, status FROM users WHERE id = ?',
        [decoded.id],
      );

      if (rows.length === 0 || rows[0].status === 'blocked') {
        return next(new Error('Unauthorized'));
      }

      socket.user = {
        id: rows[0].id,
        role: rows[0].role,
      };

      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const room = `${socket.user.role}:${socket.user.id}`;
    socket.join(room);
    console.log(`Socket connected: ${room}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${room}`);
    });
  });

  return io;
}

module.exports = { initSocket };

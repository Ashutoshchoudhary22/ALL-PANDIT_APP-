const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'my-pandit-secret-key';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT id, role, status, mobile, email FROM users WHERE id = ?',
      [decoded.id],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists. Please sign in again.',
        code: 'USER_DELETED',
      });
    }

    const user = rows[0];

    if (user.status === 'blocked') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    req.user = {
      ...decoded,
      id: user.id,
      role: user.role,
      status: user.status,
      mobile: user.mobile,
      email: user.email,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }
}

module.exports = authMiddleware;

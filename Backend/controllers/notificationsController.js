const pool = require('../config/db');

function parseData(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

exports.getMyNotifications = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1), 100);
    const unreadOnly = req.query.unreadOnly === 'true';

    const where = ['user_id = ?', 'recipient_role = ?'];
    const params = [req.user.id, req.user.role];

    if (unreadOnly) {
      where.push('read_at IS NULL');
    }

    const [rows] = await pool.query(
      `SELECT id, type, title, message, booking_id, data, read_at, created_at
       FROM notifications
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [...params, limit],
    );

    const [unreadRows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM notifications
       WHERE user_id = ? AND recipient_role = ? AND read_at IS NULL`,
      [req.user.id, req.user.role],
    );

    return res.json({
      success: true,
      data: {
        items: rows.map((row) => ({
          id: row.id,
          type: row.type,
          title: row.title,
          message: row.message || '',
          bookingId: row.booking_id ? Number(row.booking_id) : null,
          data: parseData(row.data),
          read: Boolean(row.read_at),
          createdAt: row.created_at,
        })),
        unreadCount: Number(unreadRows[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Could not load notifications' });
  }
};

exports.markMyNotificationsRead = async (req, res) => {
  try {
    const all = req.body?.all === true;
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map(Number).filter((id) => Number.isFinite(id))
      : [];

    if (!all && !ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Notification ids or all=true is required',
      });
    }

    const where = ['user_id = ?', 'recipient_role = ?', 'read_at IS NULL'];
    const params = [req.user.id, req.user.role];

    if (!all) {
      where.push('id IN (?)');
      params.push(ids);
    }

    const [result] = await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE ${where.join(' AND ')}`,
      params,
    );

    return res.json({ success: true, data: { updated: result.affectedRows } });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return res.status(500).json({ success: false, message: 'Could not update notifications' });
  }
};

const pool = require('../config/db');

async function saveNotification({
  userId,
  role,
  type,
  title,
  message,
  bookingId = null,
  data = {},
}) {
  if (!userId || !role || !type || !title) return null;

  const [result] = await pool.query(
    `INSERT INTO notifications
      (user_id, recipient_role, type, title, message, booking_id, data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      role,
      type,
      title,
      message || null,
      bookingId,
      JSON.stringify(data),
    ],
  );

  return result.insertId;
}

async function saveNotificationsForRoles(roles, notification) {
  if (!roles?.length) return [];

  const [users] = await pool.query(
    `SELECT id, role
     FROM users
     WHERE role IN (?) AND status = 'active'`,
    [roles],
  );

  return Promise.all(
    users.map((user) =>
      saveNotification({
        ...notification,
        userId: user.id,
        role: user.role,
      }),
    ),
  );
}

module.exports = {
  saveNotification,
  saveNotificationsForRoles,
};

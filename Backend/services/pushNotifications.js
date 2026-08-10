const pool = require('../config/db');
const { getMessaging } = require('../config/firebase');

const BOOKING_CHANNEL_ID = 'bookings';
const ADMIN_CHANNEL_ID = 'admin-alerts';

function normalizeData(data = {}) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value == null ? '' : String(value)]),
  );
}

async function sendPushToTokens(tokens, { title, body, data = {}, channelId = BOOKING_CHANNEL_ID }) {
  const messaging = getMessaging();
  if (!messaging) {
    console.warn(`Push skipped: Firebase Messaging is unavailable (${channelId}).`);
    return { sent: 0, failed: 0 };
  }
  if (!tokens.length) {
    console.warn(`Push skipped: no registered tokens found (${channelId}).`);
    return { sent: 0, failed: 0 };
  }

  const payload = {
    tokens,
    notification: {
      title,
      body,
    },
    data: normalizeData(data),
    android: {
      priority: 'high',
      ttl: 86400000,
      directBootOk: true,
      notification: {
        channelId,
        sound: 'default',
        priority: 'high',
        visibility: 'public',
        defaultVibrateTimings: true,
        defaultSound: true,
      },
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          'content-available': 1,
        },
      },
    },
  };

  const response = await messaging.sendEachForMulticast(payload);

  const invalidTokens = [];
  response.responses.forEach((item, index) => {
    if (item.success) return;

    const code = item.error?.code || '';
    console.warn(`FCM delivery failed for token ${tokens[index].slice(0, 16)}…: ${code || item.error?.message || 'unknown error'}`);
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    ) {
      invalidTokens.push(tokens[index]);
    }
  });

  if (invalidTokens.length) {
    await pool.query('DELETE FROM device_push_tokens WHERE token IN (?)', [invalidTokens]);
  }

  console.log(
    `FCM push result (${channelId}): sent=${response.successCount}, failed=${response.failureCount}, recipients=${tokens.length}.`,
  );

  return {
    sent: response.successCount,
    failed: response.failureCount,
  };
}

async function getUserPushTokens(userId, role) {
  const [rows] = await pool.query(
    `SELECT token
     FROM device_push_tokens
     WHERE user_id = ? AND app_role = ?`,
    [userId, role],
  );

  return rows.map((row) => row.token).filter(Boolean);
}

async function sendPushToUser(userId, role, { title, body, data = {} }) {
  try {
    const tokens = await getUserPushTokens(userId, role);
    return await sendPushToTokens(tokens, { title, body, data, channelId: BOOKING_CHANNEL_ID });
  } catch (error) {
    console.warn('sendPushToUser failed:', error.message);
    return { sent: 0, failed: 0 };
  }
}

async function getAdminPushTokens() {
  const [rows] = await pool.query(
    `SELECT token
     FROM device_push_tokens
     WHERE app_role IN ('admin', 'superadmin')`,
  );

  return rows.map((row) => row.token).filter(Boolean);
}

async function sendPushToAdmins({ title, body, data = {} }) {
  try {
    const tokens = await getAdminPushTokens();
    return await sendPushToTokens(tokens, {
      title,
      body,
      data,
      channelId: ADMIN_CHANNEL_ID,
    });
  } catch (error) {
    console.warn('sendPushToAdmins failed:', error.message);
    return { sent: 0, failed: 0 };
  }
}

async function upsertPushToken({ userId, role, token, platform }) {
  await pool.query(
    `INSERT INTO device_push_tokens (user_id, app_role, token, platform)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       app_role = VALUES(app_role),
       platform = VALUES(platform),
       updated_at = CURRENT_TIMESTAMP`,
    [userId, role, token, platform],
  );
}

async function removePushToken(userId, token) {
  await pool.query('DELETE FROM device_push_tokens WHERE user_id = ? AND token = ?', [
    userId,
    token,
  ]);
}

module.exports = {
  sendPushToUser,
  sendPushToAdmins,
  upsertPushToken,
  removePushToken,
};

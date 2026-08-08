const pool = require('../config/db');

const MIN_DISTANCE_METERS = 25;
const MIN_INTERVAL_MS = 5 * 60 * 1000;

function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

async function isUserTrackingEnabled(userId) {
  const [rows] = await pool.query(
    'SELECT location_tracking_enabled FROM users WHERE id = ?',
    [userId],
  );
  return Boolean(rows[0]?.location_tracking_enabled);
}

async function setUserTrackingEnabled(userId, enabled) {
  const [result] = await pool.query(
    'UPDATE users SET location_tracking_enabled = ? WHERE id = ?',
    [Boolean(enabled), userId],
  );
  return result.affectedRows > 0;
}

async function recordLocationPoint(userId, role, latitude, longitude) {
  const trackingEnabled = await isUserTrackingEnabled(userId);
  if (!trackingEnabled) {
    return { saved: false, reason: 'tracking_disabled' };
  }

  const [lastRows] = await pool.query(
    `SELECT latitude, longitude, recorded_at
     FROM location_history
     WHERE user_id = ? AND role = ?
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [userId, role],
  );

  if (lastRows.length > 0) {
    const last = lastRows[0];
    const elapsed = Date.now() - new Date(last.recorded_at).getTime();
    const moved = distanceMeters(
      parseFloat(last.latitude),
      parseFloat(last.longitude),
      latitude,
      longitude,
    );
    if (elapsed < MIN_INTERVAL_MS && moved < MIN_DISTANCE_METERS) {
      return { saved: false, reason: 'duplicate' };
    }
  }

  await pool.query(
    `INSERT INTO location_history (user_id, role, latitude, longitude)
     VALUES (?, ?, ?, ?)`,
    [userId, role, latitude, longitude],
  );

  return { saved: true };
}

async function getLocationHistoryDates(userId, role) {
  const [rows] = await pool.query(
    `SELECT DATE(recorded_at) AS track_date,
            COUNT(*) AS point_count,
            MIN(recorded_at) AS first_at,
            MAX(recorded_at) AS last_at
     FROM location_history
     WHERE user_id = ? AND role = ?
     GROUP BY DATE(recorded_at)
     ORDER BY track_date DESC`,
    [userId, role],
  );

  return rows.map((row) => ({
    date: row.track_date instanceof Date
      ? row.track_date.toISOString().slice(0, 10)
      : String(row.track_date).slice(0, 10),
    pointCount: Number(row.point_count || 0),
    firstAt: row.first_at,
    lastAt: row.last_at,
  }));
}

async function getLocationHistoryPoints(userId, role, date) {
  let query = `
    SELECT id, latitude, longitude, recorded_at
    FROM location_history
    WHERE user_id = ? AND role = ?
  `;
  const params = [userId, role];

  if (date) {
    query += ' AND DATE(recorded_at) = ?';
    params.push(date);
  }

  query += ' ORDER BY recorded_at ASC';

  const [rows] = await pool.query(query, params);

  return rows.map((row) => ({
    id: row.id,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    recordedAt: row.recorded_at,
  }));
}

module.exports = {
  isUserTrackingEnabled,
  setUserTrackingEnabled,
  recordLocationPoint,
  getLocationHistoryDates,
  getLocationHistoryPoints,
};

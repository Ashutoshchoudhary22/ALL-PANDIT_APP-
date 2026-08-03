const BLOCKING_STATUSES = ['in_progress', 'awaiting_payment'];
const SCHEDULED_BLOCKING_STATUSES = ['confirmed', 'payment_pending'];

const BLOCKING_WHERE = `
  status NOT IN ('completed', 'cancelled')
  AND (
    status IN ('in_progress', 'awaiting_payment')
    OR (
      status IN ('confirmed', 'payment_pending')
      AND TIMESTAMP(booking_date, booking_time) <= NOW()
    )
  )
`;

async function findPanditBlockingBooking(pool, panditProfileId) {
  const [rows] = await pool.query(
    `SELECT id, customer_id, status, payment_status, booking_date, booking_time
     FROM bookings
     WHERE pandit_profile_id = ?
       AND ${BLOCKING_WHERE}
     ORDER BY created_at DESC
     LIMIT 1`,
    [panditProfileId],
  );
  return rows[0] || null;
}

async function findAnyActiveBookingWithPandit(pool, panditProfileId, customerId = null) {
  let sql = `SELECT id, customer_id, status, payment_status
     FROM bookings
     WHERE pandit_profile_id = ?
       AND status NOT IN ('completed', 'cancelled')`;
  const params = [panditProfileId];

  if (customerId != null) {
    sql += ' AND customer_id = ?';
    params.push(customerId);
  }

  sql += ' ORDER BY created_at DESC LIMIT 1';

  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
}

async function getBusyPanditProfileIds(pool) {
  const [rows] = await pool.query(
    `SELECT DISTINCT pandit_profile_id AS id
     FROM bookings
     WHERE ${BLOCKING_WHERE}`,
  );
  return new Set(rows.map((row) => row.id));
}

async function getCustomerActiveBookedPanditIds(pool, customerId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT pandit_profile_id AS id
     FROM bookings
     WHERE customer_id = ?
       AND status NOT IN ('completed', 'cancelled')`,
    [customerId],
  );
  return new Set(rows.map((row) => row.id));
}

function isPanditCurrentlyBusy(busyPanditIds, panditProfileId) {
  return busyPanditIds.has(Number(panditProfileId));
}

module.exports = {
  BLOCKING_STATUSES,
  SCHEDULED_BLOCKING_STATUSES,
  findPanditBlockingBooking,
  findAnyActiveBookingWithPandit,
  getBusyPanditProfileIds,
  getCustomerActiveBookedPanditIds,
  isPanditCurrentlyBusy,
};

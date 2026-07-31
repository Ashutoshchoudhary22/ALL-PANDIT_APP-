const pool = require('../config/db');

function formatPanditBookingNotification(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    panditProfileId: row.pandit_profile_id,
    customerName: row.customer_name || 'Customer',
    customerMobile: row.customer_mobile || null,
    serviceName: row.service_name,
    bookingDate: row.booking_date,
    bookingTime: row.booking_time,
    address: row.address,
    latitude: row.latitude != null ? parseFloat(row.latitude) : null,
    longitude: row.longitude != null ? parseFloat(row.longitude) : null,
    specialRequirements: row.special_requirements,
    samagriRequired: Boolean(row.samagri_required),
    basePrice: Number(row.base_price),
    samagriCharge: Number(row.samagri_charge),
    totalPrice: Number(row.total_price),
    advanceAmount: Number(row.advance_amount ?? 0),
    remainingAmount: Number(row.remaining_amount ?? 0),
    paymentStatus: row.payment_status,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function fetchBookingNotificationRow(bookingId) {
  const [rows] = await pool.query(
    `SELECT b.*,
            pp.user_id AS pandit_user_id,
            TRIM(CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, ''))) AS customer_name,
            u.mobile AS customer_mobile
     FROM bookings b
     INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
     LEFT JOIN customer_profiles cp ON cp.customer_id = b.customer_id
     LEFT JOIN users u ON u.id = b.customer_id
     WHERE b.id = ?`,
    [bookingId],
  );

  return rows[0] || null;
}

async function notifyPanditNewBooking(io, bookingId) {
  if (!io) return null;

  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.pandit_user_id) return null;

  const payload = {
    type: 'booking:new',
    title: 'New Booking Received',
    message: `${row.customer_name || 'A customer'} booked ${row.service_name}. 40% advance paid.`,
    booking: formatPanditBookingNotification(row),
  };

  io.to(`pandit:${row.pandit_user_id}`).emit('booking:new', payload);
  return payload;
}

module.exports = {
  notifyPanditNewBooking,
  formatPanditBookingNotification,
};

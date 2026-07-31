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
    updatedAt: row.updated_at,
  };
}

async function fetchBookingNotificationRow(bookingId) {
  const [rows] = await pool.query(
    `SELECT b.*,
            pp.user_id AS pandit_user_id,
            pp.name AS pandit_name,
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
    title: 'New Booking Request',
    message: `${row.customer_name || 'A customer'} requested ${row.service_name}. Please review and approve.`,
    booking: formatPanditBookingNotification(row),
  };

  io.to(`pandit:${row.pandit_user_id}`).emit('booking:new', payload);
  return payload;
}

function formatCustomerBookingNotification(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    panditProfileId: row.pandit_profile_id,
    panditName: row.pandit_name || 'Pandit',
    serviceName: row.service_name,
    bookingDate: row.booking_date,
    bookingTime: row.booking_time,
    address: row.address,
    totalPrice: Number(row.total_price),
    advanceAmount: Number(row.advance_amount ?? 0),
    remainingAmount: Number(row.remaining_amount ?? 0),
    paymentStatus: row.payment_status,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function notifyCustomerBookingApproved(io, bookingId) {
  if (!io) return null;

  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.customer_id) return null;

  const payload = {
    type: 'booking:approved',
    title: 'Booking Approved',
    message: `${row.pandit_name || 'Pandit ji'} approved your ${row.service_name} booking. Pay 40% advance now to confirm.`,
    booking: formatCustomerBookingNotification(row),
  };

  io.to(`customer:${row.customer_id}`).emit('booking:approved', payload);
  return payload;
}

async function notifyPanditBookingPaymentConfirmed(io, bookingId) {
  if (!io) return null;

  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.pandit_user_id) return null;

  const advanceAmount = Number(row.advance_amount ?? 0);

  const payload = {
    type: 'booking:confirmed',
    title: 'Payment Received',
    message: `${row.customer_name || 'Customer'} paid 40% advance (₹${advanceAmount.toLocaleString('en-IN')}) for ${row.service_name}. Booking is confirmed.`,
    booking: formatPanditBookingNotification(row),
  };

  io.to(`pandit:${row.pandit_user_id}`).emit('booking:confirmed', payload);
  return payload;
}

module.exports = {
  notifyPanditNewBooking,
  notifyCustomerBookingApproved,
  notifyPanditBookingPaymentConfirmed,
  formatPanditBookingNotification,
  formatCustomerBookingNotification,
};

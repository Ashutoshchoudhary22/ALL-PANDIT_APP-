const pool = require('../config/db');
const { ADVANCE_RATE } = require('./razorpayService');
const { sendPushToUser, sendPushToAdmins } = require('./pushNotifications');
const {
  saveNotification,
  saveNotificationsForRoles,
} = require('./notificationHistoryService');

async function saveBookingNotification(userId, role, payload, bookingId) {
  await saveNotification({
    userId,
    role,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    bookingId,
    data: {
      type: payload.type,
      bookingId: String(bookingId),
      title: payload.title,
      message: payload.message,
    },
  });
}

function formatPanditBookingNotification(row) {
  const paymentStatus = row.payment_status;
  const advancePaid = paymentStatus === 'advance_paid' || paymentStatus === 'fully_paid';

  return {
    id: row.id,
    customerId: row.customer_id,
    panditProfileId: row.pandit_profile_id,
    customerName: row.customer_name || 'Customer',
    customerMobile: advancePaid ? row.customer_mobile || null : null,
    customerProfileImage: row.customer_profile_image || null,
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
            u.mobile AS customer_mobile,
            u.profile_image AS customer_profile_image,
            br.id AS review_id,
            br.rating AS review_rating
     FROM bookings b
     INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
     LEFT JOIN customer_profiles cp ON cp.customer_id = b.customer_id
     LEFT JOIN users u ON u.id = b.customer_id
     LEFT JOIN booking_reviews br ON br.booking_id = b.id
     WHERE b.id = ?`,
    [bookingId],
  );

  return rows[0] || null;
}

async function notifyPanditNewBooking(io, bookingId) {
  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.pandit_user_id) return null;

  const payload = {
    type: 'booking:new',
    title: 'New Booking Request',
    message: `${row.customer_name || 'A customer'} requested ${row.service_name}. Please review and approve.`,
    booking: formatPanditBookingNotification(row),
  };

  await saveBookingNotification(row.pandit_user_id, 'pandit', payload, row.id);
  await saveNotificationsForRoles(['admin', 'superadmin'], {
    type: 'admin:booking:new',
    title: 'New Booking',
    message: `${row.customer_name || 'A customer'} booked ${row.service_name}.`,
    bookingId: row.id,
    data: {
      type: 'admin:booking:new',
      bookingId: String(row.id),
      title: 'New Booking',
      message: `${row.customer_name || 'A customer'} booked ${row.service_name}.`,
    },
  });

  if (io) {
    io.to(`pandit:${row.pandit_user_id}`).emit('booking:new', payload);
  }

  await sendPushToUser(row.pandit_user_id, 'pandit', {
    title: payload.title,
    body: payload.message,
    data: {
      type: payload.type,
      bookingId: String(row.id),
      title: payload.title,
      message: payload.message,
    },
  });

  await sendPushToAdmins({
    title: 'New Booking',
    body: `${row.customer_name || 'A customer'} booked ${row.service_name}.`,
    data: {
      type: 'admin:booking:new',
      bookingId: String(row.id),
      title: 'New Booking',
      message: `${row.customer_name || 'A customer'} booked ${row.service_name}.`,
    },
  });

  return payload;
}

function formatCustomerBookingNotification(row, { includeSessionOtp = false } = {}) {
  const booking = {
    id: row.id,
    customerId: row.customer_id,
    panditProfileId: row.pandit_profile_id,
    panditName: row.pandit_name || 'Pandit',
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
    paymentStatus: row.payment_status || 'pending',
    razorpayOrderId: row.razorpay_order_id || null,
    razorpayPaymentId: row.razorpay_payment_id || null,
    status: row.status,
    startedAt: row.started_at || null,
    finishRequestedAt: row.finish_requested_at || null,
    remainingPaymentMethod: row.remaining_payment_method || null,
    advancePaymentMethod: row.advance_payment_method || null,
    walletAdvanceAmount: Number(row.wallet_advance_amount ?? 0),
    advancePaidAt: row.advance_paid_at || null,
    completedAt: row.completed_at || null,
    needsReview: row.status === 'completed' && !row.review_id,
    reviewRating: row.review_rating != null ? Number(row.review_rating) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includeSessionOtp) {
    if (row.status === 'confirmed' && row.start_otp) {
      booking.sessionOtp = row.start_otp;
      booking.sessionOtpPurpose = 'start';
      booking.sessionOtpHint =
        'Share this OTP with pandit ji when they arrive to start the puja.';
    } else if (row.status === 'in_progress' && row.finish_otp) {
      booking.sessionOtp = row.finish_otp;
      booking.sessionOtpPurpose = 'finish';
      booking.sessionOtpHint =
        'Share this OTP with pandit ji after puja is completed for remaining payment.';
    }
  }

  return booking;
}

function emitCustomerBookingEvent(io, customerId, payload) {
  if (!io || !customerId) return;
  io.to(`customer:${customerId}`).emit('booking:updated', payload);
  if (payload.type && payload.type !== 'booking:updated') {
    io.to(`customer:${customerId}`).emit(payload.type, payload);
  }
}

async function notifyCustomerBookingSubmitted(io, bookingId) {
  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.customer_id) return null;

  const payload = {
    type: 'booking:submitted',
    title: 'Booking Request Sent',
    message: `Your ${row.service_name} request was sent to ${row.pandit_name || 'pandit ji'}. Waiting for approval.`,
    booking: formatCustomerBookingNotification(row),
  };

  await saveBookingNotification(row.customer_id, 'customer', payload, row.id);
  emitCustomerBookingEvent(io, row.customer_id, payload);
  return payload;
}

async function notifyCustomerBookingRejected(io, bookingId) {
  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.customer_id) return null;

  const payload = {
    type: 'booking:rejected',
    title: 'Booking Rejected',
    message: `${row.pandit_name || 'Pandit ji'} rejected your ${row.service_name} booking request.`,
    booking: formatCustomerBookingNotification(row),
  };

  await saveBookingNotification(row.customer_id, 'customer', payload, row.id);
  emitCustomerBookingEvent(io, row.customer_id, payload);

  await sendPushToUser(row.customer_id, 'customer', {
    title: payload.title,
    body: payload.message,
    data: {
      type: payload.type,
      bookingId: String(row.id),
      title: payload.title,
      message: payload.message,
    },
  });

  return payload;
}

async function notifyPanditBookingRequestUpdated(io, bookingId, type) {
  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.pandit_user_id) return null;

  const payload = {
    type,
    booking: formatPanditBookingNotification(row),
  };

  if (io) {
    io.to(`pandit:${row.pandit_user_id}`).emit('booking:request_updated', payload);
  }

  return payload;
}

async function notifyCustomerBookingApproved(io, bookingId) {
  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.customer_id) return null;

  const payload = {
    type: 'booking:approved',
    title: 'Booking Approved',
    message: `${row.pandit_name || 'Pandit ji'} approved your ${row.service_name} booking. Pay ${Math.round(ADVANCE_RATE * 100)}% advance now to confirm.`,
    booking: formatCustomerBookingNotification(row),
  };

  await saveBookingNotification(row.customer_id, 'customer', payload, row.id);
  emitCustomerBookingEvent(io, row.customer_id, payload);

  await sendPushToUser(row.customer_id, 'customer', {
    title: payload.title,
    body: payload.message,
    data: {
      type: payload.type,
      bookingId: String(row.id),
      title: payload.title,
      message: payload.message,
    },
  });

  return payload;
}

async function notifyPanditBookingPaymentConfirmed(io, bookingId) {
  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.pandit_user_id) return null;

  const advanceAmount = Number(row.advance_amount ?? 0);

  const payload = {
    type: 'booking:confirmed',
    title: 'Payment Received',
    message: `${row.customer_name || 'Customer'} paid ${Math.round(ADVANCE_RATE * 100)}% advance (₹${advanceAmount.toLocaleString('en-IN')}) for ${row.service_name}. Booking is confirmed.`,
    booking: formatPanditBookingNotification(row),
  };

  await saveBookingNotification(row.pandit_user_id, 'pandit', payload, row.id);

  if (io) {
    io.to(`pandit:${row.pandit_user_id}`).emit('booking:confirmed', payload);
  }

  await sendPushToUser(row.pandit_user_id, 'pandit', {
    title: payload.title,
    body: payload.message,
    data: {
      type: payload.type,
      bookingId: String(row.id),
      title: payload.title,
      message: payload.message,
    },
  });

  return payload;
}

async function notifyCustomerFinishOtpSent(io, bookingId) {
  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.customer_id) return null;

  const payload = {
    type: 'booking:finish_otp',
    title: 'Puja Completion OTP',
    message: `Your ${row.service_name} puja is complete. Check your email for the OTP and share it with pandit ji.`,
    booking: formatCustomerBookingNotification(row, { includeSessionOtp: true }),
  };

  await saveBookingNotification(row.customer_id, 'customer', payload, row.id);
  emitCustomerBookingEvent(io, row.customer_id, payload);

  await sendPushToUser(row.customer_id, 'customer', {
    title: payload.title,
    body: payload.message,
    data: {
      type: payload.type,
      bookingId: String(row.id),
      title: payload.title,
      message: payload.message,
    },
  });

  return payload;
}

async function notifyCustomerReviewRequest(io, bookingId) {
  const row = await fetchBookingNotificationRow(bookingId);
  if (!row?.customer_id) return null;

  const payload = {
    type: 'booking:review_request',
    title: 'Rate Your Puja Experience',
    message: `How was your ${row.service_name} with ${row.pandit_name || 'pandit ji'}? Share a rating and review.`,
    booking: formatCustomerBookingNotification(row),
  };

  await saveBookingNotification(row.customer_id, 'customer', payload, row.id);
  emitCustomerBookingEvent(io, row.customer_id, payload);

  await sendPushToUser(row.customer_id, 'customer', {
    title: payload.title,
    body: payload.message,
    data: {
      type: payload.type,
      bookingId: String(row.id),
      title: payload.title,
      message: payload.message,
    },
  });

  return payload;
}

module.exports = {
  notifyPanditNewBooking,
  notifyPanditBookingRequestUpdated,
  notifyCustomerBookingSubmitted,
  notifyCustomerBookingApproved,
  notifyCustomerBookingRejected,
  notifyPanditBookingPaymentConfirmed,
  notifyCustomerFinishOtpSent,
  notifyCustomerReviewRequest,
  formatPanditBookingNotification,
  formatCustomerBookingNotification,
};

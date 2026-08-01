const pool = require('../config/db');
const {
  calculateAdvanceAmount,
  createAdvanceOrder,
  createRemainingOrder,
  verifyPaymentSignature,
} = require('../services/razorpayService');
const { sendBookingOtpEmail } = require('../config/mailer');
const generateOtp = require('../utils/generateOtp');
const {
  notifyPanditNewBooking,
  notifyCustomerBookingApproved,
  notifyPanditBookingPaymentConfirmed,
  notifyCustomerFinishOtpSent,
  notifyCustomerReviewRequest,
} = require('../services/bookingNotifications');

const SAMAGRI_RATE = 0.2;
const OTP_TTL_MINUTES = 10;

function otpExpiresAt() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

function isOtpExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}

async function fetchCustomerContact(customerId) {
  const [rows] = await pool.query(
    `SELECT cp.first_name, cp.last_name, u.email, u.mobile
     FROM users u
     LEFT JOIN customer_profiles cp ON cp.customer_id = u.id
     WHERE u.id = ?`,
    [customerId],
  );
  const row = rows[0] || {};
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return {
    name: name || 'Customer',
    email: row.email || null,
    mobile: row.mobile || null,
  };
}

function formatBooking(row, { includeSessionOtp = false } = {}) {
  const booking = {
    id: row.id,
    customerId: row.customer_id,
    panditProfileId: row.pandit_profile_id,
    panditName: row.pandit_name,
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
    advancePaidAt: row.advance_paid_at || null,
    completedAt: row.completed_at || null,
    needsReview: row.status === 'completed' && !row.review_id,
    reviewRating: row.review_rating != null ? Number(row.review_rating) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includeSessionOtp) {
    if (
      row.status === 'confirmed' &&
      row.start_otp &&
      !isOtpExpired(row.start_otp_expires_at)
    ) {
      booking.sessionOtp = row.start_otp;
      booking.sessionOtpPurpose = 'start';
      booking.sessionOtpHint = 'Share this OTP with pandit ji when they arrive to start the puja.';
    } else if (
      row.status === 'in_progress' &&
      row.finish_otp &&
      !isOtpExpired(row.finish_otp_expires_at)
    ) {
      booking.sessionOtp = row.finish_otp;
      booking.sessionOtpPurpose = 'finish';
      booking.sessionOtpHint =
        'Share this OTP with pandit ji after puja is completed for remaining payment.';
    }
  }

  return booking;
}

function normalizeTime(value) {
  if (!value?.trim()) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[4]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

async function fetchBookingById(bookingId) {
  const [rows] = await pool.query(
    `SELECT b.*, pp.name AS pandit_name
     FROM bookings b
     INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
     WHERE b.id = ?`,
    [bookingId],
  );
  return rows[0] || null;
}

async function panditOwnsBooking(userId, bookingId) {
  const [rows] = await pool.query(
    `SELECT b.id
     FROM bookings b
     INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
     WHERE b.id = ? AND pp.user_id = ?`,
    [bookingId, userId],
  );
  return rows.length > 0;
}

async function findActivePanditBooking(panditProfileId) {
  const [rows] = await pool.query(
    `SELECT id, customer_id, status, payment_status
     FROM bookings
     WHERE pandit_profile_id = ?
       AND status NOT IN ('completed', 'cancelled')
     ORDER BY created_at DESC
     LIMIT 1`,
    [panditProfileId],
  );
  return rows[0] || null;
}

function mapPanditBookingRow(row) {
  return {
    ...formatBooking(row),
    customerName: row.customer_name?.trim() || 'Customer',
    customerMobile: row.customer_mobile || null,
  };
}

exports.createBooking = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can create bookings',
      });
    }

    const {
      panditProfileId,
      serviceName,
      bookingDate,
      bookingTime,
      address,
      specialRequirements,
      samagriRequired,
      latitude,
      longitude,
    } = req.body;

    if (!panditProfileId || !serviceName?.trim() || !bookingDate || !bookingTime || !address?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pandit, service, date, time and address are required',
      });
    }

    const normalizedTime = normalizeTime(bookingTime);
    if (!normalizedTime) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking time',
      });
    }

    const bookingDay = new Date(`${bookingDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(bookingDay.getTime()) || bookingDay < today) {
      return res.status(400).json({
        success: false,
        message: 'Booking date must be today or in the future',
      });
    }

    const [profiles] = await pool.query(
      `SELECT pp.id, pp.name, pp.puja_services, pp.status
       FROM pandit_profiles pp
       WHERE pp.id = ?`,
      [panditProfileId],
    );

    if (profiles.length === 0 || profiles[0].status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Pandit profile not found or not available',
      });
    }

    const activeBooking = await findActivePanditBooking(panditProfileId);
    if (activeBooking) {
      const isSameCustomer = Number(activeBooking.customer_id) === Number(req.user.id);

      if (isSameCustomer && activeBooking.status === 'pending') {
        const row = await fetchBookingById(activeBooking.id);
        return res.status(200).json({
          success: true,
          message: 'Your booking request is already sent and awaiting pandit approval.',
          data: formatBooking(row),
        });
      }

      if (isSameCustomer) {
        if (activeBooking.status === 'payment_pending') {
          return res.status(409).json({
            success: false,
            message:
              'Your booking request was approved. Open the Bookings tab and complete the 40% advance payment.',
          });
        }
        return res.status(409).json({
          success: false,
          message: 'You already have an active booking with this pandit.',
        });
      }

      return res.status(409).json({
        success: false,
        message:
          'This pandit already has an active booking. Please wait until the current puja is completed.',
      });
    }

    const profile = profiles[0];
    let services = [];
    try {
      services =
        typeof profile.puja_services === 'string'
          ? JSON.parse(profile.puja_services)
          : profile.puja_services || [];
    } catch {
      services = [];
    }

    const selectedService = services.find((item) => item.name === serviceName.trim());
    if (!selectedService) {
      return res.status(400).json({
        success: false,
        message: 'Selected service is not offered by this pandit',
      });
    }

    const basePrice = Math.round(Number(selectedService.price));
    const needsSamagri = Boolean(samagriRequired);
    const samagriCharge = needsSamagri ? Math.round(basePrice * SAMAGRI_RATE) : 0;
    const totalPrice = basePrice + samagriCharge;
    const { advanceAmount, remainingAmount } = calculateAdvanceAmount(totalPrice);

    let bookingLatitude = latitude ?? null;
    let bookingLongitude = longitude ?? null;
    if (bookingLatitude == null || bookingLongitude == null) {
      const [customerProfiles] = await pool.query(
        `SELECT latitude, longitude FROM customer_profiles WHERE customer_id = ?`,
        [req.user.id],
      );
      if (customerProfiles[0]) {
        bookingLatitude = bookingLatitude ?? customerProfiles[0].latitude;
        bookingLongitude = bookingLongitude ?? customerProfiles[0].longitude;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO bookings
       (customer_id, pandit_profile_id, service_name, booking_date, booking_time, address,
        latitude, longitude, special_requirements, samagri_required, base_price, samagri_charge,
        total_price, advance_amount, remaining_amount, payment_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
      [
        req.user.id,
        panditProfileId,
        serviceName.trim(),
        bookingDate,
        normalizedTime,
        address.trim(),
        bookingLatitude,
        bookingLongitude,
        specialRequirements?.trim() || null,
        needsSamagri,
        basePrice,
        samagriCharge,
        totalPrice,
        advanceAmount,
        remainingAmount,
      ],
    );

    const bookingId = result.insertId;
    const row = await fetchBookingById(bookingId);
    await notifyPanditNewBooking(req.app.get('io'), bookingId);

    return res.status(201).json({
      success: true,
      message: 'Booking request sent to pandit. You will be able to pay after approval.',
      data: formatBooking(row),
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
    });
  }
};

exports.verifyBookingPayment = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can verify booking payments',
      });
    }

    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification details are required',
      });
    }

    const [rows] = await pool.query(
      `SELECT b.*, pp.name AS pandit_name
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       WHERE b.id = ? AND b.customer_id = ?`,
      [bookingId, req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const booking = rows[0];

    if (booking.payment_status === 'advance_paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        data: formatBooking(booking),
      });
    }

    if (booking.status !== 'payment_pending') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not approved for payment yet',
      });
    }

    if (booking.razorpay_order_id !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment order does not match this booking',
      });
    }

    const isValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    const startOtp = generateOtp();
    const expiresAt = otpExpiresAt();

    await pool.query(
      `UPDATE bookings
       SET razorpay_payment_id = ?, payment_status = 'advance_paid', status = 'confirmed',
           start_otp = ?, start_otp_expires_at = ?, advance_paid_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [razorpayPaymentId, startOtp, expiresAt, bookingId],
    );

    const customer = await fetchCustomerContact(booking.customer_id);
    if (customer.email) {
      await sendBookingOtpEmail(customer.email, customer.name, startOtp, 'start');
    } else {
      console.log(`[DEV] Start OTP for booking ${bookingId}: ${startOtp}`);
    }

    const row = await fetchBookingById(bookingId);
    await notifyPanditBookingPaymentConfirmed(req.app.get('io'), bookingId);

    return res.status(200).json({
      success: true,
      message: 'Payment successful! Start OTP sent to your email. Share it with pandit ji on arrival.',
      data: formatBooking(row, { includeSessionOtp: true }),
    });
  } catch (error) {
    console.error('Verify booking payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying payment',
    });
  }
};

exports.retryBookingPayment = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can retry booking payments',
      });
    }

    const bookingId = Number(req.params.id);
    if (!Number.isFinite(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking id',
      });
    }

    const [rows] = await pool.query(
      `SELECT b.*, pp.name AS pandit_name
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       WHERE b.id = ? AND b.customer_id = ?`,
      [bookingId, req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const booking = rows[0];

    if (booking.status !== 'payment_pending' || booking.payment_status === 'advance_paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking does not require advance payment',
      });
    }

    const [customers] = await pool.query(
      `SELECT cp.first_name, cp.last_name, u.mobile, u.email
       FROM customer_profiles cp
       INNER JOIN users u ON u.id = cp.customer_id
       WHERE cp.customer_id = ?`,
      [req.user.id],
    );
    const customer = customers[0] || {};
    const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();

    const payment = await createAdvanceOrder({
      bookingId,
      totalPrice: Number(booking.total_price),
      customerName,
      serviceName: booking.service_name,
    });

    await pool.query(`UPDATE bookings SET razorpay_order_id = ?, updated_at = NOW() WHERE id = ?`, [
      payment.orderId,
      bookingId,
    ]);

    const row = await fetchBookingById(bookingId);

    return res.status(200).json({
      success: true,
      message: 'Complete 40% advance payment to confirm your booking',
      data: formatBooking(row),
      payment: {
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        keyId: payment.keyId,
        advanceAmount: payment.advanceAmount,
      },
      customer: {
        name: customerName || undefined,
        email: customer.email || undefined,
        contact: customer.mobile || undefined,
      },
    });
  } catch (error) {
    console.error('Retry booking payment error:', error.cause || error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not initiate payment. Please try again.',
    });
  }
};

exports.getPanditBookingRequests = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({
        success: false,
        message: 'Only pandits can view booking requests',
      });
    }

    const [rows] = await pool.query(
      `SELECT b.*,
              pp.name AS pandit_name,
              TRIM(CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, ''))) AS customer_name,
              u.mobile AS customer_mobile,
              COALESCE(b.latitude, cp.latitude) AS latitude,
              COALESCE(b.longitude, cp.longitude) AS longitude
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       LEFT JOIN customer_profiles cp ON cp.customer_id = b.customer_id
       LEFT JOIN users u ON u.id = b.customer_id
       WHERE pp.user_id = ? AND b.status = 'pending'
       ORDER BY b.created_at ASC`,
      [req.user.id],
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapPanditBookingRow),
    });
  } catch (error) {
    console.error('Get pandit booking requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching booking requests',
    });
  }
};

exports.approveBooking = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({
        success: false,
        message: 'Only pandits can approve bookings',
      });
    }

    const bookingId = Number(req.params.id);
    if (!Number.isFinite(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking id',
      });
    }

    if (!(await panditOwnsBooking(req.user.id, bookingId))) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const [rows] = await pool.query(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
    const booking = rows[0];

    if (!booking || booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending booking requests can be approved',
      });
    }

    await pool.query(
      `UPDATE bookings SET status = 'payment_pending', updated_at = NOW() WHERE id = ?`,
      [bookingId],
    );

    const row = await fetchBookingById(bookingId);
    await notifyCustomerBookingApproved(req.app.get('io'), bookingId);

    return res.status(200).json({
      success: true,
      message: 'Booking approved. Customer can now complete the advance payment.',
      data: formatBooking(row),
    });
  } catch (error) {
    console.error('Approve booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while approving booking',
    });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({
        success: false,
        message: 'Only pandits can reject bookings',
      });
    }

    const bookingId = Number(req.params.id);
    if (!Number.isFinite(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking id',
      });
    }

    if (!(await panditOwnsBooking(req.user.id, bookingId))) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const [rows] = await pool.query(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
    const booking = rows[0];

    if (!booking || booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending booking requests can be rejected',
      });
    }

    await pool.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
      [bookingId],
    );

    const row = await fetchBookingById(bookingId);

    return res.status(200).json({
      success: true,
      message: 'Booking request rejected',
      data: formatBooking(row),
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while rejecting booking',
    });
  }
};

exports.getPanditBookings = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({
        success: false,
        message: 'Only pandits can view their bookings',
      });
    }

    const [rows] = await pool.query(
      `SELECT b.*,
              pp.name AS pandit_name,
              TRIM(CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, ''))) AS customer_name,
              u.mobile AS customer_mobile,
              COALESCE(b.latitude, cp.latitude) AS latitude,
              COALESCE(b.longitude, cp.longitude) AS longitude
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       LEFT JOIN customer_profiles cp ON cp.customer_id = b.customer_id
       LEFT JOIN users u ON u.id = b.customer_id
       WHERE pp.user_id = ?
         AND b.status IN ('payment_pending', 'confirmed', 'in_progress', 'awaiting_payment', 'completed', 'cancelled')
       ORDER BY b.updated_at DESC, b.booking_date DESC, b.booking_time DESC`,
      [req.user.id],
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapPanditBookingRow),
    });
  } catch (error) {
    console.error('Get pandit bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pandit bookings',
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can cancel bookings',
      });
    }

    const bookingId = Number(req.params.id);
    if (!Number.isFinite(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking id',
      });
    }

    const [rows] = await pool.query(
      `SELECT * FROM bookings WHERE id = ? AND customer_id = ?`,
      [bookingId, req.user.id],
    );
    const booking = rows[0];

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (!['pending', 'payment_pending'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or unpaid approved bookings can be cancelled',
      });
    }

    if (booking.payment_status === 'advance_paid') {
      return res.status(400).json({
        success: false,
        message: 'Paid bookings cannot be cancelled from the app',
      });
    }

    await pool.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
      [bookingId],
    );

    const row = await fetchBookingById(bookingId);

    return res.status(200).json({
      success: true,
      message: 'Booking request cancelled',
      data: formatBooking(row),
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking',
    });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can view their bookings',
      });
    }

    const [rows] = await pool.query(
      `SELECT b.*, pp.name AS pandit_name, br.id AS review_id, br.rating AS review_rating
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       LEFT JOIN booking_reviews br ON br.booking_id = b.id
       WHERE b.customer_id = ?
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [req.user.id],
    );

    return res.status(200).json({
      success: true,
      data: rows.map((row) => formatBooking(row, { includeSessionOtp: true })),
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
    });
  }
};

exports.startBookingPuja = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({ success: false, message: 'Only pandits can start a puja' });
    }

    const bookingId = Number(req.params.id);
    const { otp } = req.body;

    if (!Number.isFinite(bookingId) || !otp?.trim()) {
      return res.status(400).json({ success: false, message: 'Booking id and OTP are required' });
    }

    if (!(await panditOwnsBooking(req.user.id, bookingId))) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const [rows] = await pool.query(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
    const booking = rows[0];

    if (!booking || booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be started',
      });
    }

    if (!booking.start_otp || booking.start_otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid start OTP' });
    }

    if (isOtpExpired(booking.start_otp_expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'Start OTP has expired. Ask customer to check their email.',
      });
    }

    await pool.query(
      `UPDATE bookings
       SET status = 'in_progress', start_otp = NULL, start_otp_expires_at = NULL,
           started_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [bookingId],
    );

    const row = await fetchBookingById(bookingId);
    return res.status(200).json({
      success: true,
      message: 'Puja started successfully.',
      data: formatBooking(row),
    });
  } catch (error) {
    console.error('Start booking puja error:', error);
    return res.status(500).json({ success: false, message: 'Server error while starting puja' });
  }
};

exports.requestFinishBookingPuja = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({ success: false, message: 'Only pandits can finish a puja' });
    }

    const bookingId = Number(req.params.id);
    if (!Number.isFinite(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }

    if (!(await panditOwnsBooking(req.user.id, bookingId))) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const [rows] = await pool.query(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
    const booking = rows[0];

    if (!booking || booking.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Only in-progress bookings can be finished',
      });
    }

    if (booking.finish_otp && !isOtpExpired(booking.finish_otp_expires_at)) {
      return res.status(200).json({
        success: true,
        message: 'Finish OTP already sent to customer. Ask them for the OTP.',
        data: formatBooking(await fetchBookingById(bookingId)),
      });
    }

    const finishOtp = generateOtp();
    const expiresAt = otpExpiresAt();
    const customer = await fetchCustomerContact(booking.customer_id);

    await pool.query(
      `UPDATE bookings
       SET finish_otp = ?, finish_otp_expires_at = ?, finish_requested_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [finishOtp, expiresAt, bookingId],
    );

    if (customer.email) {
      await sendBookingOtpEmail(customer.email, customer.name, finishOtp, 'finish');
    } else {
      console.log(`[DEV] Finish OTP for booking ${bookingId}: ${finishOtp}`);
    }

    await notifyCustomerFinishOtpSent(req.app.get('io'), bookingId);

    const row = await fetchBookingById(bookingId);
    return res.status(200).json({
      success: true,
      message: 'Finish OTP sent to customer email. Ask them to share it with you.',
      data: formatBooking(row),
    });
  } catch (error) {
    console.error('Request finish booking puja error:', error);
    return res.status(500).json({ success: false, message: 'Server error while finishing puja' });
  }
};

exports.verifyFinishBookingOtp = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({ success: false, message: 'Only pandits can verify finish OTP' });
    }

    const bookingId = Number(req.params.id);
    const { otp } = req.body;

    if (!Number.isFinite(bookingId) || !otp?.trim()) {
      return res.status(400).json({ success: false, message: 'Booking id and OTP are required' });
    }

    if (!(await panditOwnsBooking(req.user.id, bookingId))) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const [rows] = await pool.query(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
    const booking = rows[0];

    if (!booking || booking.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in progress',
      });
    }

    if (!booking.finish_otp || booking.finish_otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid finish OTP' });
    }

    if (isOtpExpired(booking.finish_otp_expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'Finish OTP has expired. Tap Finish Puja again to resend.',
      });
    }

    await pool.query(
      `UPDATE bookings
       SET status = 'awaiting_payment', finish_otp = NULL, finish_otp_expires_at = NULL, updated_at = NOW()
       WHERE id = ?`,
      [bookingId],
    );

    const row = await fetchBookingById(bookingId);
    return res.status(200).json({
      success: true,
      message: 'OTP verified. Collect remaining 60% via cash or online payment.',
      data: formatBooking(row),
    });
  } catch (error) {
    console.error('Verify finish booking OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error while verifying OTP' });
  }
};

exports.completeBookingCash = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({ success: false, message: 'Only pandits can complete bookings' });
    }

    const bookingId = Number(req.params.id);
    if (!Number.isFinite(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }

    if (!(await panditOwnsBooking(req.user.id, bookingId))) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const [rows] = await pool.query(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
    const booking = rows[0];

    if (!booking || booking.status !== 'awaiting_payment') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not ready for remaining payment collection',
      });
    }

    await pool.query(
      `UPDATE bookings
       SET status = 'completed', payment_status = 'fully_paid', remaining_payment_method = 'cash',
           completed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [bookingId],
    );

    const row = await fetchBookingById(bookingId);
    await notifyCustomerReviewRequest(req.app.get('io'), bookingId);

    return res.status(200).json({
      success: true,
      message: 'Booking completed. Remaining amount marked as received in cash.',
      data: formatBooking(row),
    });
  } catch (error) {
    console.error('Complete booking cash error:', error);
    return res.status(500).json({ success: false, message: 'Server error while completing booking' });
  }
};

exports.retryRemainingPayment = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({
        success: false,
        message: 'Only pandits can initiate remaining payment',
      });
    }

    const bookingId = Number(req.params.id);
    if (!Number.isFinite(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }

    if (!(await panditOwnsBooking(req.user.id, bookingId))) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const [rows] = await pool.query(
      `SELECT b.*, pp.name AS pandit_name
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       WHERE b.id = ?`,
      [bookingId],
    );
    const booking = rows[0];

    if (!booking || booking.status !== 'awaiting_payment') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not ready for online remaining payment',
      });
    }

    if (booking.payment_status === 'fully_paid') {
      return res.status(400).json({ success: false, message: 'Booking is already fully paid' });
    }

    const customer = await fetchCustomerContact(booking.customer_id);
    const payment = await createRemainingOrder({
      bookingId,
      remainingAmount: Number(booking.remaining_amount),
      customerName: customer.name,
      serviceName: booking.service_name,
    });

    await pool.query(
      `UPDATE bookings SET razorpay_remaining_order_id = ?, updated_at = NOW() WHERE id = ?`,
      [payment.orderId, bookingId],
    );

    const row = await fetchBookingById(bookingId);

    return res.status(200).json({
      success: true,
      message: 'Complete remaining 60% payment via Razorpay',
      data: formatBooking(row),
      payment: {
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        keyId: payment.keyId,
        remainingAmount: payment.remainingAmount,
      },
      customer: {
        name: customer.name || undefined,
        email: customer.email || undefined,
        contact: customer.mobile || undefined,
      },
    });
  } catch (error) {
    console.error('Retry remaining payment error:', error.cause || error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not initiate remaining payment.',
    });
  }
};

exports.verifyRemainingPayment = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({
        success: false,
        message: 'Only pandits can verify remaining payment',
      });
    }

    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const bookingIdNum = Number(bookingId);
    if (!Number.isFinite(bookingIdNum) || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification details are required',
      });
    }

    if (!(await panditOwnsBooking(req.user.id, bookingIdNum))) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const [rows] = await pool.query(`SELECT * FROM bookings WHERE id = ?`, [bookingIdNum]);
    const booking = rows[0];

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.payment_status === 'fully_paid') {
      return res.status(200).json({
        success: true,
        message: 'Remaining payment already verified',
        data: formatBooking(await fetchBookingById(bookingIdNum)),
      });
    }

    if (booking.status !== 'awaiting_payment') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not awaiting remaining payment',
      });
    }

    if (booking.razorpay_remaining_order_id !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment order does not match this booking',
      });
    }

    const isValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    await pool.query(
      `UPDATE bookings
       SET razorpay_remaining_payment_id = ?, payment_status = 'fully_paid', status = 'completed',
           remaining_payment_method = 'online', completed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [razorpayPaymentId, bookingIdNum],
    );

    const row = await fetchBookingById(bookingIdNum);
    await notifyCustomerReviewRequest(req.app.get('io'), bookingIdNum);

    return res.status(200).json({
      success: true,
      message: 'Remaining payment successful! Booking is completed.',
      data: formatBooking(row),
    });
  } catch (error) {
    console.error('Verify remaining payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying remaining payment',
    });
  }
};

exports.submitBookingReview = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can submit reviews',
      });
    }

    const bookingId = Number(req.params.id);
    const rating = Number(req.body.rating);
    const comment = req.body.comment?.trim() || null;

    if (!Number.isFinite(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const [rows] = await pool.query(
      `SELECT b.*, pp.name AS pandit_name
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       WHERE b.id = ? AND b.customer_id = ?`,
      [bookingId, req.user.id],
    );
    const booking = rows[0];

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can review only completed bookings',
      });
    }

    const [existing] = await pool.query(
      `SELECT id FROM booking_reviews WHERE booking_id = ?`,
      [bookingId],
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Review already submitted for this booking',
      });
    }

    await pool.query(
      `INSERT INTO booking_reviews (booking_id, customer_id, pandit_profile_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [bookingId, req.user.id, booking.pandit_profile_id, rating, comment],
    );

    await pool.query(
      `UPDATE pandit_profiles pp
       SET rating = (
             SELECT ROUND(AVG(br.rating), 2)
             FROM booking_reviews br
             WHERE br.pandit_profile_id = pp.id
           ),
           total_reviews = (
             SELECT COUNT(*)
             FROM booking_reviews br
             WHERE br.pandit_profile_id = pp.id
           )
       WHERE pp.id = ?`,
      [booking.pandit_profile_id],
    );

    const [updatedRows] = await pool.query(
      `SELECT b.*, pp.name AS pandit_name, br.id AS review_id, br.rating AS review_rating
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       LEFT JOIN booking_reviews br ON br.booking_id = b.id
       WHERE b.id = ?`,
      [bookingId],
    );

    return res.status(201).json({
      success: true,
      message: 'Thank you for your review!',
      data: formatBooking(updatedRows[0]),
    });
  } catch (error) {
    console.error('Submit booking review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting review',
    });
  }
};

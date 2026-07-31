const pool = require('../config/db');
const {
  calculateAdvanceAmount,
  createAdvanceOrder,
  verifyPaymentSignature,
} = require('../services/razorpayService');
const { notifyPanditNewBooking } = require('../services/bookingNotifications');

const SAMAGRI_RATE = 0.2;

function formatBooking(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    panditProfileId: row.pandit_profile_id,
    panditName: row.pandit_name,
    serviceName: row.service_name,
    bookingDate: row.booking_date,
    bookingTime: row.booking_time,
    address: row.address,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

    const [result] = await pool.query(
      `INSERT INTO bookings
       (customer_id, pandit_profile_id, service_name, booking_date, booking_time, address,
        special_requirements, samagri_required, base_price, samagri_charge, total_price,
        advance_amount, remaining_amount, payment_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'payment_pending')`,
      [
        req.user.id,
        panditProfileId,
        serviceName.trim(),
        bookingDate,
        normalizedTime,
        address.trim(),
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

    let payment;
    let customer = {};
    let customerName = '';
    try {
      const [customers] = await pool.query(
        `SELECT cp.first_name, cp.last_name, u.mobile, u.email
         FROM customer_profiles cp
         INNER JOIN users u ON u.id = cp.customer_id
         WHERE cp.customer_id = ?`,
        [req.user.id],
      );
      customer = customers[0] || {};
      customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();

      payment = await createAdvanceOrder({
        bookingId,
        totalPrice,
        customerName,
        serviceName: serviceName.trim(),
      });

      await pool.query(`UPDATE bookings SET razorpay_order_id = ? WHERE id = ?`, [
        payment.orderId,
        bookingId,
      ]);
    } catch (paymentError) {
      await pool.query(`DELETE FROM bookings WHERE id = ?`, [bookingId]);
      console.error('Razorpay order error:', paymentError.cause || paymentError);
      return res.status(500).json({
        success: false,
        message: paymentError.message || 'Could not initiate payment. Please try again.',
      });
    }

    const row = await fetchBookingById(bookingId);
    const displayName = customerName || undefined;

    return res.status(201).json({
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
        name: displayName,
        email: customer.email || undefined,
        contact: customer.mobile || undefined,
      },
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

    await pool.query(
      `UPDATE bookings
       SET razorpay_payment_id = ?, payment_status = 'advance_paid', status = 'confirmed', updated_at = NOW()
       WHERE id = ?`,
      [razorpayPaymentId, bookingId],
    );

    const row = await fetchBookingById(bookingId);
    await notifyPanditNewBooking(req.app.get('io'), bookingId);

    return res.status(200).json({
      success: true,
      message: 'Booking successful! Pandit has been notified.',
      data: formatBooking(row),
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
              u.mobile AS customer_mobile
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       LEFT JOIN customer_profiles cp ON cp.customer_id = b.customer_id
       LEFT JOIN users u ON u.id = b.customer_id
       WHERE pp.user_id = ? AND b.payment_status = 'advance_paid'
       ORDER BY b.created_at DESC, b.booking_date DESC, b.booking_time DESC`,
      [req.user.id],
    );

    return res.status(200).json({
      success: true,
      data: rows.map((row) => ({
        ...formatBooking(row),
        customerName: row.customer_name?.trim() || 'Customer',
        customerMobile: row.customer_mobile || null,
      })),
    });
  } catch (error) {
    console.error('Get pandit bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pandit bookings',
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
      `SELECT b.*, pp.name AS pandit_name
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       WHERE b.customer_id = ?
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [req.user.id],
    );

    return res.status(200).json({
      success: true,
      data: rows.map(formatBooking),
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
    });
  }
};

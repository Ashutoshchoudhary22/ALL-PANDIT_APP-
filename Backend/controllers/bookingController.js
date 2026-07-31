const pool = require('../config/db');

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

    const [result] = await pool.query(
      `INSERT INTO bookings
       (customer_id, pandit_profile_id, service_name, booking_date, booking_time, address,
        special_requirements, samagri_required, base_price, samagri_charge, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
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
      ],
    );

    const [rows] = await pool.query(
      `SELECT b.*, pp.name AS pandit_name
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       WHERE b.id = ?`,
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      data: formatBooking(rows[0]),
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
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

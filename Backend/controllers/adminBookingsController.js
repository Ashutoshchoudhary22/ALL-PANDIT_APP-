const pool = require('../config/db');

function isPlatformAdmin(user) {
  return user?.role === 'admin' || user?.role === 'superadmin';
}

function roundMoney(value) {
  return Math.round(Number(value || 0));
}

function mapDisplayStatus(status) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'in_progress':
    case 'awaiting_payment':
      return 'Ongoing';
    case 'confirmed':
      return 'Upcoming';
    case 'pending':
    case 'payment_pending':
    default:
      return 'Pending';
  }
}

function buildStatusFilter(status) {
  switch (String(status || '').toLowerCase()) {
    case 'completed':
      return " AND b.status = 'completed'";
    case 'cancelled':
      return " AND b.status = 'cancelled'";
    case 'upcoming':
      return " AND b.status = 'confirmed'";
    case 'ongoing':
      return " AND b.status IN ('in_progress', 'awaiting_payment')";
    case 'pending':
      return " AND b.status IN ('pending', 'payment_pending')";
    default:
      return '';
  }
}

exports.listBookings = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view bookings',
      });
    }

    const statusFilter = buildStatusFilter(req.query.status);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);

    const [rows] = await pool.query(
      `SELECT b.id,
              b.service_name,
              b.booking_date,
              b.booking_time,
              b.total_price,
              b.advance_amount,
              b.remaining_amount,
              b.payment_status,
              b.status,
              b.created_at,
              pp.name AS pandit_name,
              TRIM(CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, ''))) AS customer_name
       FROM bookings b
       INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
       LEFT JOIN customer_profiles cp ON cp.customer_id = b.customer_id
       WHERE 1=1
       ${statusFilter}
       ORDER BY b.created_at DESC
       LIMIT ?`,
      [limit],
    );

    const bookings = rows.map((row) => ({
      id: row.id,
      customerName: row.customer_name?.trim() || 'Customer',
      panditName: row.pandit_name || 'Pandit',
      serviceName: row.service_name,
      bookingDate: row.booking_date,
      bookingTime: row.booking_time,
      totalPrice: roundMoney(row.total_price),
      advanceAmount: roundMoney(row.advance_amount),
      remainingAmount: roundMoney(row.remaining_amount),
      paymentStatus: row.payment_status,
      status: row.status,
      displayStatus: mapDisplayStatus(row.status),
      createdAt: row.created_at,
    }));

    const [summaryRows] = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM bookings
       GROUP BY status`,
    );

    const statusMap = new Map(summaryRows.map((row) => [row.status, Number(row.count ?? 0)]));

    return res.status(200).json({
      success: true,
      data: {
        total: bookings.length,
        summary: {
          totalBookings: Array.from(statusMap.values()).reduce((sum, count) => sum + count, 0),
          completed: statusMap.get('completed') ?? 0,
          confirmed: statusMap.get('confirmed') ?? 0,
          ongoing: (statusMap.get('in_progress') ?? 0) + (statusMap.get('awaiting_payment') ?? 0),
          pending: (statusMap.get('pending') ?? 0) + (statusMap.get('payment_pending') ?? 0),
          cancelled: statusMap.get('cancelled') ?? 0,
        },
        bookings,
      },
    });
  } catch (error) {
    console.error('List admin bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
    });
  }
};

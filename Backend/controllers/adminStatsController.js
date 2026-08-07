const pool = require('../config/db');

const PLATFORM_COMMISSION_RATE = 0.2;

function isPlatformAdmin(user) {
  return user?.role === 'admin' || user?.role === 'superadmin';
}

function roundMoney(value) {
  return Math.round(Number(value || 0));
}

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function formatShortDate(dateValue) {
  const date = new Date(dateValue);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
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

function buildLast7DayTrend(rows) {
  const countsByDay = new Map(
    rows.map((row) => [String(row.day).slice(0, 10), Number(row.count ?? 0)]),
  );
  const trend = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    trend.push({
      label: formatShortDate(date),
      count: countsByDay.get(key) ?? 0,
    });
  }

  return trend;
}

function withPercentages(items) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return items.map((item) => ({
    ...item,
    pct: total ? Number(((item.count / total) * 100).toFixed(1)) : 0,
  }));
}

exports.getDashboardStats = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view dashboard stats',
      });
    }

    const [
      [customerRows],
      [panditRows],
      [bookingRows],
      [reviewRows],
      [revenueRows],
      [collectedRows],
      [statusRows],
      [trendRows],
      [revenueTrendRows],
      [newUsersRows],
      [recentBookingRows],
      [thisWeekBookingRows],
      [lastWeekBookingRows],
      [thisWeekUserRows],
      [lastWeekUserRows],
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'customer'`),
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'pandit'`),
      pool.query(`SELECT COUNT(*) AS count FROM bookings`),
      pool.query(`SELECT COUNT(*) AS count FROM booking_reviews`),
      pool.query(
        `SELECT COALESCE(SUM(total_price), 0) AS amount
         FROM bookings
         WHERE status <> 'cancelled'`,
      ),
      pool.query(
        `SELECT COALESCE(SUM(
           CASE
             WHEN payment_status IN ('advance_paid', 'fully_paid') THEN advance_amount
             ELSE 0
           END
           +
           CASE
             WHEN payment_status = 'fully_paid' THEN remaining_amount
             ELSE 0
           END
         ), 0) AS amount
         FROM bookings`,
      ),
      pool.query(
        `SELECT status, COUNT(*) AS count
         FROM bookings
         GROUP BY status`,
      ),
      pool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM bookings
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY DATE(created_at)
         ORDER BY day ASC`,
      ),
      pool.query(
        `SELECT DATE_FORMAT(COALESCE(completed_at, updated_at, created_at), '%Y-%m') AS monthKey,
                COALESCE(SUM(
                  CASE
                    WHEN payment_status IN ('advance_paid', 'fully_paid') THEN advance_amount
                    ELSE 0
                  END
                  +
                  CASE
                    WHEN payment_status = 'fully_paid' THEN remaining_amount
                    ELSE 0
                  END
                ), 0) AS amount
         FROM bookings
         WHERE COALESCE(completed_at, updated_at, created_at) >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
         GROUP BY monthKey
         ORDER BY monthKey ASC`,
      ),
      pool.query(
        `SELECT role, COUNT(*) AS count
         FROM users
         WHERE role IN ('customer', 'pandit')
           AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         GROUP BY role`,
      ),
      pool.query(
        `SELECT b.id,
                b.service_name,
                b.booking_date,
                b.booking_time,
                b.total_price,
                b.status,
                b.created_at,
                pp.name AS pandit_name,
                TRIM(CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, ''))) AS customer_name
         FROM bookings b
         INNER JOIN pandit_profiles pp ON pp.id = b.pandit_profile_id
         LEFT JOIN customer_profiles cp ON cp.customer_id = b.customer_id
         ORDER BY b.created_at DESC
         LIMIT 5`,
      ),
      pool.query(
        `SELECT COUNT(*) AS count
         FROM bookings
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      ),
      pool.query(
        `SELECT COUNT(*) AS count
         FROM bookings
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
           AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      ),
      pool.query(
        `SELECT COUNT(*) AS count
         FROM users
         WHERE role IN ('customer', 'pandit')
           AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      ),
      pool.query(
        `SELECT COUNT(*) AS count
         FROM users
         WHERE role IN ('customer', 'pandit')
           AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
           AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      ),
    ]);

    const totalCustomers = Number(customerRows[0]?.count ?? 0);
    const totalPandits = Number(panditRows[0]?.count ?? 0);
    const totalUsers = totalCustomers + totalPandits;
    const totalBookings = Number(bookingRows[0]?.count ?? 0);
    const totalReviews = Number(reviewRows[0]?.count ?? 0);
    const totalRevenue = roundMoney(revenueRows[0]?.amount);
    const collectedRevenue = roundMoney(collectedRows[0]?.amount);
    const platformEarnings = roundMoney(collectedRevenue * PLATFORM_COMMISSION_RATE);
    const panditPayouts = Math.max(collectedRevenue - platformEarnings, 0);

    const statusMap = new Map(statusRows.map((row) => [row.status, Number(row.count ?? 0)]));
    const groupedStatus = withPercentages([
      { label: 'Completed', count: statusMap.get('completed') ?? 0 },
      { label: 'Upcoming', count: statusMap.get('confirmed') ?? 0 },
      {
        label: 'Ongoing',
        count: (statusMap.get('in_progress') ?? 0) + (statusMap.get('awaiting_payment') ?? 0),
      },
      { label: 'Cancelled', count: statusMap.get('cancelled') ?? 0 },
      {
        label: 'Pending',
        count: (statusMap.get('pending') ?? 0) + (statusMap.get('payment_pending') ?? 0),
      },
    ]).filter((item) => item.count > 0);

    const newUsersMap = new Map(newUsersRows.map((row) => [row.role, Number(row.count ?? 0)]));
    const newCustomersThisWeek = newUsersMap.get('customer') ?? 0;
    const newPanditsThisWeek = newUsersMap.get('pandit') ?? 0;
    const newUsersThisWeek = {
      customers: newCustomersThisWeek,
      pandits: newPanditsThisWeek,
      total: newCustomersThisWeek + newPanditsThisWeek,
    };

    const revenueTrend = revenueTrendRows.map((row) => {
      const [year, month] = String(row.monthKey).split('-').map(Number);
      const labelDate = new Date(year, month - 1, 1);
      return {
        label: labelDate.toLocaleDateString('en-IN', { month: 'short' }),
        amount: roundMoney(row.amount),
      };
    });

    const thisWeekBookings = Number(thisWeekBookingRows[0]?.count ?? 0);
    const lastWeekBookings = Number(lastWeekBookingRows[0]?.count ?? 0);
    const thisWeekUsers = Number(thisWeekUserRows[0]?.count ?? 0);
    const lastWeekUsers = Number(lastWeekUserRows[0]?.count ?? 0);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPandits,
        totalCustomers,
        totalBookings,
        totalReviews,
        totalRevenue,
        collectedRevenue,
        platformEarnings,
        panditPayouts,
        trends: {
          bookingsWeekChangePct: pctChange(thisWeekBookings, lastWeekBookings),
          newUsersWeekChangePct: pctChange(thisWeekUsers, lastWeekUsers),
        },
        bookingTrend: buildLast7DayTrend(trendRows),
        bookingsByStatus: groupedStatus.length
          ? groupedStatus
          : [{ label: 'No bookings', count: 0, pct: 0 }],
        revenueTrend,
        newUsersThisWeek,
        recentBookings: recentBookingRows.map((row) => ({
          id: row.id,
          customerName: row.customer_name?.trim() || 'Customer',
          panditName: row.pandit_name || 'Pandit',
          serviceName: row.service_name,
          bookingDate: row.booking_date,
          bookingTime: row.booking_time,
          totalPrice: roundMoney(row.total_price),
          status: row.status,
          displayStatus: mapDisplayStatus(row.status),
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats',
    });
  }
};

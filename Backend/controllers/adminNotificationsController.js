const pool = require('../config/db');

function isPlatformAdmin(user) {
  return user?.role === 'admin' || user?.role === 'superadmin';
}

exports.getAdminNotificationsFeed = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view notifications',
      });
    }

    const [[pendingPanditRows], [pendingUpdateRows], [recentBookingRows]] = await Promise.all([
      pool.query(
        `SELECT pp.id,
                pp.name,
                pp.created_at AS member_since
         FROM pandit_profiles pp
         WHERE pp.status = 'pending'
         ORDER BY pp.created_at DESC`,
      ),
      pool.query(
        `SELECT pp.id,
                pp.name,
                JSON_UNQUOTE(JSON_EXTRACT(pp.pending_changes, '$.submittedAt')) AS submitted_at,
                pp.updated_at
         FROM pandit_profiles pp
         WHERE pp.update_request_status = 'pending'
         ORDER BY COALESCE(
           JSON_UNQUOTE(JSON_EXTRACT(pp.pending_changes, '$.submittedAt')),
           pp.updated_at
         ) DESC`,
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
         WHERE b.status != 'cancelled'
         ORDER BY b.created_at DESC
         LIMIT 100`,
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pendingPandits: pendingPanditRows.map((row) => ({
          id: row.id,
          name: row.name,
          memberSince: row.member_since,
        })),
        pendingProfileUpdates: pendingUpdateRows.map((row) => ({
          id: row.id,
          name: row.name,
          submittedAt: row.submitted_at || row.updated_at,
        })),
        recentBookings: recentBookingRows.map((row) => ({
          id: row.id,
          customerName: row.customer_name?.trim() || 'Customer',
          panditName: row.pandit_name || 'Pandit',
          serviceName: row.service_name,
          bookingDate: row.booking_date,
          bookingTime: row.booking_time,
          totalPrice: Math.round(Number(row.total_price || 0)),
          status: row.status,
          createdAt: row.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Admin notifications feed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching admin notifications',
    });
  }
};

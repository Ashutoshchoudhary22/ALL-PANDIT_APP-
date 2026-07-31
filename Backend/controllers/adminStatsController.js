const pool = require('../config/db');

function isPlatformAdmin(user) {
  return user?.role === 'admin' || user?.role === 'superadmin';
}

exports.getDashboardStats = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view dashboard stats',
      });
    }

    const [[customerRow], [panditRow]] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'customer'`),
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'pandit'`),
    ]);

    const totalCustomers = Number(customerRow[0]?.count ?? 0);
    const totalPandits = Number(panditRow[0]?.count ?? 0);
    const totalUsers = totalCustomers + totalPandits;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPandits,
        totalCustomers,
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

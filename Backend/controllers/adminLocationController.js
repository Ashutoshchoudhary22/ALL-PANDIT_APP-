const pool = require('../config/db');
const {
  getLocationHistoryDates,
  getLocationHistoryPoints,
  isUserTrackingEnabled,
  recordLocationPoint,
  setUserTrackingEnabled,
} = require('../services/locationHistoryService');

function isPlatformAdmin(user) {
  return user?.role === 'admin' || user?.role === 'superadmin';
}

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase();
  if (role === 'customer' || role === 'pandit') return role;
  return null;
}

async function fetchUserRole(userId) {
  const [rows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [userId]);
  return rows[0] || null;
}

exports.getLocationTrackingStatus = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view location tracking status',
      });
    }

    const userId = Number(req.params.userId);
    const role = normalizeRole(req.query.role);

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId and role are required',
      });
    }

    const user = await fetchUserRole(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== role) {
      return res.status(400).json({
        success: false,
        message: 'Role does not match user account',
      });
    }

    const enabled = await isUserTrackingEnabled(userId);
    const dates = enabled ? await getLocationHistoryDates(userId, role) : [];

    return res.status(200).json({
      success: true,
      data: {
        userId,
        role,
        trackingEnabled: enabled,
        dates,
      },
    });
  } catch (error) {
    console.error('Get location tracking status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching location tracking status',
    });
  }
};

exports.setLocationTracking = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update location tracking',
      });
    }

    const userId = Number(req.params.userId);
    const role = normalizeRole(req.body.role ?? req.query.role);
    const enabled = Boolean(req.body.enabled);

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId and role are required',
      });
    }

    const user = await fetchUserRole(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== role) {
      return res.status(400).json({
        success: false,
        message: 'Role does not match user account',
      });
    }

    const updated = await setUserTrackingEnabled(userId, enabled);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const latitude = req.body.latitude != null ? Number(req.body.latitude) : null;
    const longitude = req.body.longitude != null ? Number(req.body.longitude) : null;

    if (enabled && latitude != null && longitude != null) {
      await recordLocationPoint(userId, role, latitude, longitude);
    }

    return res.status(200).json({
      success: true,
      message: enabled ? 'Location tracking enabled' : 'Location tracking disabled',
      data: {
        userId,
        role,
        trackingEnabled: enabled,
      },
    });
  } catch (error) {
    console.error('Set location tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating location tracking',
    });
  }
};

exports.getLocationHistoryDates = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view location history',
      });
    }

    const userId = Number(req.params.userId);
    const role = normalizeRole(req.query.role);

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId and role are required',
      });
    }

    const dates = await getLocationHistoryDates(userId, role);

    return res.status(200).json({
      success: true,
      data: dates,
    });
  } catch (error) {
    console.error('Get location history dates error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching location history dates',
    });
  }
};

exports.getLocationHistory = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view location history',
      });
    }

    const userId = Number(req.params.userId);
    const role = normalizeRole(req.query.role);
    const date = req.query.date ? String(req.query.date).slice(0, 10) : null;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId and role are required',
      });
    }

    const points = await getLocationHistoryPoints(userId, role, date);

    return res.status(200).json({
      success: true,
      data: {
        userId,
        role,
        date,
        points,
      },
    });
  } catch (error) {
    console.error('Get location history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching location history',
    });
  }
};

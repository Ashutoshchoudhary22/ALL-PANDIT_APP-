const { upsertPushToken, removePushToken } = require('../services/pushNotifications');

const ALLOWED_PLATFORMS = new Set(['android', 'ios', 'web']);

async function registerToken(req, res) {
  try {
    const token = String(req.body?.token || '').trim();
    const platform = String(req.body?.platform || 'android').trim().toLowerCase();

    if (!token) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    if (!ALLOWED_PLATFORMS.has(platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }

    await upsertPushToken({
      userId: req.user.id,
      role: req.user.role,
      token,
      platform,
    });

    return res.json({
      success: true,
      message: 'Push token registered',
    });
  } catch (error) {
    console.error('registerToken error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not register push token',
    });
  }
}

async function unregisterToken(req, res) {
  try {
    const token = String(req.body?.token || '').trim();
    if (!token) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    await removePushToken(req.user.id, token);

    return res.json({
      success: true,
      message: 'Push token removed',
    });
  } catch (error) {
    console.error('unregisterToken error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not remove push token',
    });
  }
}

module.exports = {
  registerToken,
  unregisterToken,
};

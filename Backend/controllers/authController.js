const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { sendOtpEmail, sendPasswordResetEmail, getAppSchemeForRole } = require('../config/mailer');
const generateOtp = require('../utils/generateOtp');
const { sendSmsOtp } = require('../services/msg91Service');

const JWT_SECRET = process.env.JWT_SECRET || 'my-pandit-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const RESET_TOKEN_HOURS = 1;
const OTP_EXPIRES_MINUTES = 10;

function formatUser(user) {
  return {
    id: user.id,
    role: user.role,
    accountType: user.role === 'customer' ? 'customer' : 'user',
    mobile: user.mobile,
    email: user.email,
    profileImage: user.profile_image,
    languageCode: user.language_code,
    status: user.status,
  };
}

function createUserToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      accountType: user.role === 'customer' ? 'customer' : 'user',
      mobile: user.mobile,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

async function findExistingUser(normalizedMobile, normalizedEmail) {
  const [existingMobile] = await pool.query(
    'SELECT id FROM users WHERE mobile = ?',
    [normalizedMobile],
  );

  if (existingMobile.length > 0) {
    return { conflict: 'Mobile number already registered' };
  }

  if (normalizedEmail) {
    const [existingEmail] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail],
    );

    if (existingEmail.length > 0) {
      return { conflict: 'Email already registered' };
    }
  }

  return null;
}

async function resolvePlatformAdminRole() {
  const [rows] = await pool.query(
    `SELECT id FROM users WHERE role IN ('superadmin', 'admin') LIMIT 1`,
  );
  return rows.length === 0 ? 'superadmin' : 'admin';
}

async function deliverSignupOtp({ mobile, email, otp }) {
  try {
    await sendSmsOtp({
      mobile,
      otp,
      expiresInMinutes: OTP_EXPIRES_MINUTES,
    });
    return { channel: 'sms' };
  } catch (smsError) {
    console.warn('MSG91 SMS OTP failed:', smsError.message);

    if (!email) {
      throw smsError;
    }

    const mailResult = await sendOtpEmail(email, mobile, otp);
    return { channel: 'email', devMode: mailResult.devMode };
  }
}

exports.signup = async (req, res) => {
  try {
    const { mobile, email, password, role } = req.body;

    if (!mobile?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const normalizedMobile = mobile.trim();
    const normalizedEmail = email?.trim().toLowerCase() || null;
    const normalizedRole = role?.trim()?.toLowerCase();

    let accountType = 'customer';
    if (normalizedRole === 'pandit') {
      accountType = 'pandit';
    } else if (normalizedRole === 'admin' || normalizedRole === 'superadmin') {
      accountType = await resolvePlatformAdminRole();
    }

    const existing = await findExistingUser(normalizedMobile, normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.conflict,
      });
    }

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query('DELETE FROM signup_otps WHERE mobile = ?', [normalizedMobile]);

    await pool.query(
      `INSERT INTO signup_otps (mobile, email, password_hash, account_type, otp, expires_at)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [normalizedMobile, normalizedEmail, passwordHash, accountType, otp, OTP_EXPIRES_MINUTES],
    );

    const delivery = await deliverSignupOtp({
      mobile: normalizedMobile,
      email: normalizedEmail,
      otp,
    });

    return res.status(200).json({
      success: true,
      message:
        delivery.channel === 'sms'
          ? 'OTP sent to your mobile number. Please verify to complete signup.'
          : 'SMS OTP could not be sent. OTP sent to your email instead.',
      data: {
        mobile: normalizedMobile,
        email: normalizedEmail,
        role: accountType,
        ...(process.env.NODE_ENV !== 'production' && delivery.devMode && { otp }),
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during signup',
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, email, otp } = req.body;

    if ((!mobile?.trim() && !email?.trim()) || !otp?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mobile or email with OTP is required',
      });
    }

    const normalizedMobile = mobile?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    const [rows] = await pool.query(
      normalizedMobile
        ? `SELECT id, mobile, email, password_hash, account_type, otp
           FROM signup_otps
           WHERE mobile = ? AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT 1`
        : `SELECT id, mobile, email, password_hash, account_type, otp
           FROM signup_otps
           WHERE email = ? AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT 1`,
      [normalizedMobile || normalizedEmail],
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please signup again.',
      });
    }

    const record = rows[0];

    if (record.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE mobile = ?', [
      record.mobile,
    ]);

    if (existing.length > 0) {
      await pool.query('DELETE FROM signup_otps WHERE mobile = ?', [record.mobile]);
      return res.status(409).json({
        success: false,
        message: 'Mobile number already registered',
      });
    }

    const userRole = record.account_type;

    const [result] = await pool.query(
      `INSERT INTO users (role, mobile, email, password_hash, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [userRole, record.mobile, record.email, record.password_hash],
    );

    await pool.query('DELETE FROM signup_otps WHERE mobile = ?', [record.mobile]);

    const [userRows] = await pool.query(
      `SELECT id, role, mobile, email, profile_image, language_code, status
       FROM users WHERE id = ?`,
      [result.insertId],
    );

    const user = formatUser(userRows[0]);
    const token = createUserToken(userRows[0]);

    return res.status(201).json({
      success: true,
      message:
        userRole === 'pandit'
          ? 'Pandit account verified and created successfully.'
          : userRole === 'superadmin'
            ? 'Super Admin account verified and created successfully.'
            : userRole === 'admin'
              ? 'Admin account verified and created successfully.'
              : 'Account verified and created successfully.',
      data: { user, token },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
    });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { mobile, email } = req.body;

    if (!mobile?.trim() && !email?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mobile or email is required',
      });
    }

    const normalizedMobile = mobile?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    const [rows] = await pool.query(
      normalizedMobile
        ? 'SELECT mobile, email FROM signup_otps WHERE mobile = ? ORDER BY created_at DESC LIMIT 1'
        : 'SELECT mobile, email FROM signup_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      [normalizedMobile || normalizedEmail],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No pending signup found. Please signup again.',
      });
    }

    const otp = generateOtp();
    const record = rows[0];

    await pool.query(
      `UPDATE signup_otps
       SET otp = ?, expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE)
       WHERE mobile = ?`,
      [otp, OTP_EXPIRES_MINUTES, record.mobile],
    );

    const delivery = await deliverSignupOtp({
      mobile: record.mobile,
      email: record.email,
      otp,
    });

    return res.status(200).json({
      success: true,
      message:
        delivery.channel === 'sms'
          ? 'New OTP sent to your mobile number'
          : 'SMS OTP could not be sent. New OTP sent to your email instead.',
      ...(process.env.NODE_ENV !== 'production' && delivery.devMode && { otp }),
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while resending OTP',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    if ((!email?.trim() && !mobile?.trim()) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile with password is required',
      });
    }

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedMobile = mobile?.trim();

    const [userRows] = await pool.query(
      normalizedMobile
        ? `SELECT id, role, mobile, email, password_hash, profile_image, language_code, status
           FROM users WHERE mobile = ?`
        : `SELECT id, role, mobile, email, password_hash, profile_image, language_code, status
           FROM users WHERE email = ?`,
      [normalizedMobile || normalizedEmail],
    );

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = userRows[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUser(user),
        token: createUserToken(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, mobile } = req.body;

    if (!email?.trim() && !mobile?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile is required',
      });
    }

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedMobile = mobile?.trim();

    const [userRows] = await pool.query(
      normalizedMobile
        ? 'SELECT id, email, role FROM users WHERE mobile = ?'
        : 'SELECT id, email, role FROM users WHERE email = ?',
      [normalizedMobile || normalizedEmail],
    );

    if (userRows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If this account exists, a reset link has been sent to your email',
      });
    }

    const user = userRows[0];

    if (!user.email?.trim()) {
      return res.status(200).json({
        success: true,
        message: 'If this account exists, a reset link has been sent to your email',
      });
    }

    const token = uuidv4();

    await pool.query(
      'UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0',
      [user.id],
    );

    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))',
      [user.id, token, RESET_TOKEN_HOURS],
    );

    const appUrl = (process.env.APP_URL || 'http://localhost:5300').replace(/\/$/, '');
    const resetLink = `${appUrl}/api/auth/reset-password?token=${token}`;
    const appScheme = getAppSchemeForRole(user.role);
    const appDeepLink = `${appScheme}://reset-password?token=${token}`;

    const mailResult = await sendPasswordResetEmail(
      user.email,
      resetLink,
      appDeepLink,
      user.role,
    );

    return res.status(200).json({
      success: true,
      message: 'If this account exists, a reset link has been sent to your email',
      ...(process.env.NODE_ENV !== 'production' &&
        mailResult?.devMode && { resetToken: token, resetLink, appDeepLink }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset request',
    });
  }
};

exports.showResetPasswordPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/reset-password.html'));
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const [userResetRows] = await pool.query(
      `SELECT id, user_id
       FROM password_resets
       WHERE token = ? AND used = 0 AND expires_at > NOW()`,
      [token],
    );

    if (userResetRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    const resetRecord = userResetRows[0];
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      resetRecord.user_id,
    ]);

    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [
      resetRecord.id,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset',
    });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, role, mobile, email, profile_image, language_code, status FROM users WHERE id = ?',
      [req.user.id],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists. Please sign in again.',
        code: 'USER_DELETED',
      });
    }

    return res.status(200).json({
      success: true,
      data: { user: formatUser(rows[0]) },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching session',
    });
  }
};

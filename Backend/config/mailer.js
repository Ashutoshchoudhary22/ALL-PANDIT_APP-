const nodemailer = require('nodemailer');
require('dotenv').config();

function getSmtpUser() {
  return (process.env.SMTP_MAIL || process.env.SMTP_USER || '').trim();
}

function getSmtpPass() {
  return (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '').trim();
}

function createTransporter() {
  const smtpUser = getSmtpUser();
  const smtpPass = getSmtpPass();
  const smtpService = process.env.SMTP_SERVICE?.trim();

  if (smtpService) {
    return nodemailer.createTransport({
      service: smtpService,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
    requireTLS: !secure && process.env.SMTP_REQUIRE_TLS !== 'false',
  });
}

async function verifySmtpConnection() {
  const transporter = createTransporter();
  await transporter.verify();
  return true;
}

async function sendOtpEmail(to, name, otp) {
  const smtpUser = getSmtpUser();
  const smtpPass = getSmtpPass();
  const isConfigured = smtpUser && smtpPass;

  if (!isConfigured) {
    console.log(`[DEV] OTP for ${to}: ${otp}`);
    return { devMode: true };
  }

  const from = process.env.SMTP_FROM || smtpUser;
  const transporter = createTransporter();

  const mailOptions = {
    from: `"My-Pandit" <${from}>`,
    to,
    subject: 'My-Pandit - Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7C3AED;">My-Pandit</h2>
        <p>Hi ${name},</p>
        <p>Your email verification OTP is:</p>
        <h1 style="color: #7C3AED; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p style="color: #9CA3AF; font-size: 12px;">© My-Pandit</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
    return { devMode: false };
  } catch (error) {
    console.error('Email send error:', error.message);

    if (error.responseCode === 535) {
      console.error(
        'SMTP login failed. Check SMTP_MAIL and SMTP_PASSWORD in .env (use Gmail App Password).',
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${to}: ${otp}`);
      return { devMode: true, emailFailed: true };
    }

    throw new Error('Failed to send OTP email. Please check SMTP settings.');
  }
}

async function sendBookingOtpEmail(to, name, otp, purpose) {
  const smtpUser = getSmtpUser();
  const smtpPass = getSmtpPass();
  const isConfigured = smtpUser && smtpPass;

  const isStart = purpose === 'start';
  const subject = isStart
    ? 'My-Pandit - Puja Start OTP'
    : 'My-Pandit - Puja Completion OTP';
  const heading = isStart ? 'Start Puja OTP' : 'Puja Completion OTP';
  const instruction = isStart
    ? 'Share this OTP with your pandit when they arrive to start the puja.'
    : 'Share this OTP with your pandit after the puja is completed to collect the remaining payment.';

  if (!isConfigured) {
    console.log(`[DEV] Booking ${purpose} OTP for ${to}: ${otp}`);
    return { devMode: true };
  }

  const from = process.env.SMTP_FROM || smtpUser;
  const transporter = createTransporter();

  const mailOptions = {
    from: `"My-Pandit" <${from}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #FF8C00;">My-Pandit</h2>
        <p>Hi ${name || 'Customer'},</p>
        <p><strong>${heading}</strong></p>
        <h1 style="color: #FF8C00; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
        <p>${instruction}</p>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #9CA3AF; font-size: 12px;">© My-Pandit</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking ${purpose} OTP email sent to ${to}`);
    return { devMode: false };
  } catch (error) {
    console.error('Booking OTP email error:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Booking ${purpose} OTP for ${to}: ${otp}`);
      return { devMode: true, emailFailed: true };
    }
    throw new Error('Failed to send booking OTP email.');
  }
}

function getAppSchemeForRole(role) {
  if (role === 'customer') return 'customerapp';
  if (role === 'pandit') return 'panditapp';
  if (role === 'admin' || role === 'superadmin') return 'superadmin';
  return 'customerapp';
}

async function sendPasswordResetEmail(to, resetLink, appDeepLink, role) {
  const smtpUser = getSmtpUser();
  const smtpPass = getSmtpPass();
  const isConfigured = smtpUser && smtpPass;

  if (!isConfigured) {
    console.log(`[DEV] Password reset link for ${to}: ${resetLink}`);
    if (appDeepLink) {
      console.log(`[DEV] App deep link: ${appDeepLink}`);
    }
    return { devMode: true };
  }

  const from = process.env.SMTP_FROM || smtpUser;
  const transporter = createTransporter();
  const appLabel =
    role === 'pandit'
      ? 'Pandit App'
      : role === 'admin' || role === 'superadmin'
        ? 'Super Admin App'
        : 'Customer App';

  const mailOptions = {
    from: `"ApnaAcharya" <${from}>`,
    to,
    subject: 'ApnaAcharya - Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7C3AED;">ApnaAcharya</h2>
        <p>Hi,</p>
        <p>We received a request to reset your password for your ${appLabel} account.</p>
        <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
        <p style="margin: 28px 0;">
          <a href="${resetLink}"
             style="background: #FF8C00; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; display: inline-block;">
            Reset Password
          </a>
        </p>
        ${
          appDeepLink
            ? `<p style="font-size: 14px; color: #4B5563;">On your phone? <a href="${appDeepLink}" style="color: #7C3AED;">Open in ${appLabel}</a></p>`
            : ''
        }
        <p style="font-size: 13px; color: #6B7280; word-break: break-all;">Or copy this link:<br>${resetLink}</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p style="color: #9CA3AF; font-size: 12px;">© ApnaAcharya</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
    return { devMode: false };
  } catch (error) {
    console.error('Password reset email error:', error.message);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Password reset link for ${to}: ${resetLink}`);
      return { devMode: true, emailFailed: true };
    }

    throw new Error('Failed to send password reset email. Please check SMTP settings.');
  }
}

module.exports = {
  sendOtpEmail,
  sendBookingOtpEmail,
  sendPasswordResetEmail,
  getAppSchemeForRole,
  verifySmtpConnection,
  createTransporter,
};

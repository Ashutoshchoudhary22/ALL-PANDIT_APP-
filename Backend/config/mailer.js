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

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildEmailShell({ title, greeting, bodyHtml, accentColor = '#C97400' }) {
  return `
    <div style="margin:0; padding:0; background:#FFF8ED;">
      <div style="max-width:620px; margin:0 auto; padding:28px 16px; font-family: Arial, sans-serif; color:#4A2B10;">
        <div style="text-align:center; margin-bottom:14px;">
          <div style="display:inline-block; padding:8px 18px; border:1px solid #F0D2A1; border-radius:999px; background:#FFF2DE; color:#9B5700; font-size:12px; letter-spacing:1px; font-weight:700;">
            APNAACHARYA
          </div>
        </div>
        <div style="background:linear-gradient(180deg, #FFFDF9 0%, #FFF6E7 100%); border:1px solid #EFCB96; border-radius:20px; padding:28px 24px; box-shadow:0 8px 24px rgba(158, 99, 14, 0.12);">
          <div style="width:64px; height:64px; margin:0 auto 12px; border-radius:999px; border:1px solid #F2D39F; background:#FFF8EE; text-align:center; line-height:64px; color:${accentColor}; font-size:30px; font-weight:700;">
            &#2384;
          </div>
          <h2 style="margin:0 0 18px; text-align:center; color:#5C1D1D; font-size:24px; line-height:1.3;">${title}</h2>
          <p style="margin:0 0 12px; font-size:15px; line-height:1.7;">${greeting}</p>
          ${bodyHtml}
          <p style="margin:20px 0 0; color:#8C6C46; font-size:12px; text-align:center;">
            This is an automated email from ApnaAcharya.
          </p>
        </div>
      </div>
    </div>
  `;
}

function buildOtpEmailHtml({ title, name, otp, instruction, validityText }) {
  const safeName = escapeHtml(name || 'User');
  const safeOtp = escapeHtml(otp);

  return buildEmailShell({
    title,
    greeting: `Hi ${safeName},`,
    bodyHtml: `
      <p style="margin:0 0 14px; font-size:15px; line-height:1.7;">${instruction}</p>
      <div style="margin:12px 0 16px; padding:16px; border-radius:14px; border:1px dashed #E9B870; background:#FFF3E0; text-align:center;">
        <div style="color:#8E4E00; font-size:12px; letter-spacing:1px; font-weight:700; margin-bottom:8px;">YOUR OTP</div>
        <div style="color:#7A1B1B; letter-spacing:8px; font-size:34px; line-height:1; font-weight:800;">${safeOtp}</div>
      </div>
      <p style="margin:0 0 12px; font-size:14px; line-height:1.7;">${validityText}</p>
      <p style="margin:0; font-size:14px; line-height:1.7;">If you did not request this, please ignore this email.</p>
    `,
  });
}

async function sendOtpEmail(to, name, otp) {
  const smtpUser = getSmtpUser();
  const smtpPass = getSmtpPass();
  const isConfigured = smtpUser && smtpPass;

  if (!isConfigured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured for OTP email delivery');
    }

    console.log(`[DEV] OTP for ${to}: ${otp}`);
    return { devMode: true };
  }

  const from = process.env.SMTP_FROM || smtpUser;
  const transporter = createTransporter();

  const mailOptions = {
    from: `"ApnaAcharya" <${from}>`,
    to,
    subject: 'My-Pandit - Email Verification OTP',
    html: buildOtpEmailHtml({
      title: 'Email Verification OTP',
      name,
      otp,
      instruction: 'Use the following OTP to verify your ApnaAcharya account.',
      validityText: 'This OTP is valid for <strong>10 minutes</strong>.',
    }),
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

function formatStartOtpEmailValidity(bookingDate) {
  const datePart = String(bookingDate || '').slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return 'This OTP is valid until 1 day after your puja date.';
  }

  const validUntil = new Date(year, month - 1, day + 1);
  const formatted = validUntil.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `This OTP is valid until <strong>${formatted}</strong> (1 day after your puja date).`;
}

async function sendBookingOtpEmail(to, name, otp, purpose, options = {}) {
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
  const validityText = isStart
    ? formatStartOtpEmailValidity(options.bookingDate)
    : 'This OTP is valid for <strong>10 minutes</strong>.';

  if (!isConfigured) {
    console.log(`[DEV] Booking ${purpose} OTP for ${to}: ${otp}`);
    return { devMode: true };
  }

  const from = process.env.SMTP_FROM || smtpUser;
  const transporter = createTransporter();

  const mailOptions = {
    from: `"ApnaAcharya" <${from}>`,
    to,
    subject,
    html: buildOtpEmailHtml({
      title: heading,
      name: name || 'Customer',
      otp,
      instruction,
      validityText,
    }),
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
    html: buildEmailShell({
      title: 'Reset Your Password',
      greeting: 'Hi,',
      bodyHtml: `
        <p style="margin:0 0 14px; font-size:15px; line-height:1.7;">
          We received a request to reset your password for your <strong>${escapeHtml(appLabel)}</strong> account.
        </p>
        <p style="margin:0 0 16px; font-size:15px; line-height:1.7;">
          Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
        </p>
        <div style="margin:20px 0 16px; text-align:center;">
          <a href="${resetLink}"
             style="background:#D78000; color:#fff; text-decoration:none; padding:13px 24px; border-radius:10px; font-weight:700; display:inline-block;">
            Reset Password
          </a>
        </div>
        ${
          appDeepLink
            ? `<p style="margin:0 0 10px; font-size:14px; color:#5E4224;">On your phone? <a href="${appDeepLink}" style="color:#7A1B1B; font-weight:700;">Open in ${escapeHtml(appLabel)}</a></p>`
            : ''
        }
        <p style="margin:0 0 10px; font-size:13px; color:#7A5E3F; word-break:break-all;">
          Or copy this link:<br>${escapeHtml(resetLink)}
        </p>
        <p style="margin:0; font-size:14px; line-height:1.7;">If you did not request a password reset, you can safely ignore this email.</p>
      `,
    }),
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

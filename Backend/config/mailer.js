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

module.exports = { sendOtpEmail, verifySmtpConnection, createTransporter };

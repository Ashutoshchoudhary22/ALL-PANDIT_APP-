require('dotenv').config();
const { verifySmtpConnection, createTransporter } = require('../config/mailer');

async function testEmail() {
  const smtpUser = process.env.SMTP_MAIL || process.env.SMTP_USER;

  console.log('Testing SMTP connection...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('Service:', process.env.SMTP_SERVICE);
  console.log('User:', smtpUser);

  try {
    await verifySmtpConnection();
    console.log('SMTP connection OK');

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"My-Pandit Test" <${process.env.SMTP_FROM || smtpUser}>`,
      to: smtpUser,
      subject: 'My-Pandit SMTP Test',
      text: 'If you received this, SMTP is working correctly.',
    });

    console.log('Test email sent:', info.messageId);
  } catch (error) {
    console.error('SMTP test failed:', error.message);
    process.exit(1);
  }
}

testEmail();

require('dotenv').config();
const { sendSmsOtp } = require('../services/msg91Service');

async function testMsg91Otp() {
  const mobile = process.argv[2];
  const otp = process.argv[3] || '123456';

  if (!mobile) {
    console.error('Usage: node scripts/test-msg91-otp.js <mobile> [otp]');
    process.exit(1);
  }

  console.log('Testing MSG91 OTP delivery...');
  console.log('Template ID configured:', Boolean(process.env.MSG91_OTP_TEMPLATE_ID));
  console.log('Auth key configured:', Boolean(process.env.MSG91_AUTH_KEY));

  try {
    const result = await sendSmsOtp({
      mobile,
      otp,
      expiresInMinutes: 10,
    });
    console.log('MSG91 success:', result);
  } catch (error) {
    console.error('MSG91 test failed:', error.message);
    process.exit(1);
  }
}

testMsg91Otp();

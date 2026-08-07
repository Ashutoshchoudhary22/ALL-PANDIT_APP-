require('dotenv').config();
const pool = require('../config/db');
const { sendPasswordResetEmail } = require('../config/mailer');

async function main() {
  const emailArg = process.argv[2];

  const [users] = await pool.query(
    'SELECT id, email, role, mobile FROM users WHERE email IS NOT NULL LIMIT 20',
  );
  console.log('Users with email:', JSON.stringify(users, null, 2));

  if (!emailArg) {
    console.log('\nUsage: node scripts/debug-forgot-password.js user@example.com');
    process.exit(0);
  }

  const normalizedEmail = emailArg.trim().toLowerCase();
  const [userRows] = await pool.query(
    'SELECT id, email, role FROM users WHERE email = ?',
    [normalizedEmail],
  );

  if (userRows.length === 0) {
    console.log(`No user found for email: ${normalizedEmail}`);
    process.exit(1);
  }

  const user = userRows[0];
  const token = 'debug-token-' + Date.now();
  const appUrl = (process.env.APP_URL || 'http://localhost:5300').replace(/\/$/, '');
  const resetLink = `${appUrl}/api/auth/reset-password?token=${token}`;
  const appDeepLink = `${user.role === 'pandit' ? 'panditapp' : user.role === 'customer' ? 'customerapp' : 'superadmin'}://reset-password?token=${token}`;

  console.log('Sending test reset email to:', user.email);
  const result = await sendPasswordResetEmail(user.email, resetLink, appDeepLink, user.role);
  console.log('Mail result:', result);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

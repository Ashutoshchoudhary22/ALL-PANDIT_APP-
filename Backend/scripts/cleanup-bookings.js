const pool = require('./config/db');

async function main() {
  const [result] = await pool.query(
    "DELETE FROM bookings WHERE status NOT IN ('completed', 'cancelled') OR status IS NULL",
  );
  const [rows] = await pool.query('SELECT id, pandit_profile_id, status FROM bookings');
  console.log('deleted rows:', result.affectedRows);
  console.log('remaining bookings:', rows.length);
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

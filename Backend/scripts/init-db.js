/**
 * Run database migrations (CREATE TABLE IF NOT EXISTS + missing columns).
 * Safe to run on production — existing data is not deleted.
 *
 * Usage (on server with production .env):
 *   node scripts/init-db.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const initDb = require('../config/initDb');

initDb()
  .then(() => {
    console.log('Database migration completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database migration failed:', error.message);
    process.exit(1);
  });

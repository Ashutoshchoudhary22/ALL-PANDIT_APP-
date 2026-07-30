const mysql = require('mysql2/promise');
require('dotenv').config();

async function ensureColumn(connection, table, column, definition) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  );

  if (rows[0].count === 0) {
    await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`Added column ${table}.${column}`);
  }
}

async function initDb() {
  const dbName = process.env.DB_NAME || 'app';

  const rootConnection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  });

  try {
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  } finally {
    await rootConnection.end();
  }

  const pool = require('./db');
  const connection = await pool.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        role ENUM('customer','pandit','admin','superadmin') NOT NULL,
        mobile VARCHAR(15) NOT NULL UNIQUE,
        email VARCHAR(150) NULL,
        password_hash VARCHAR(255) NULL,
        profile_image VARCHAR(500) NULL,
        language_code VARCHAR(10) DEFAULT 'hi',
        status ENUM('active','inactive','blocked','pending') DEFAULT 'active',
        last_login_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_users_email (email)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS signup_otps (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        mobile VARCHAR(15) NOT NULL,
        email VARCHAR(150) NULL,
        password_hash VARCHAR(255) NOT NULL,
        account_type ENUM('customer','pandit','admin','superadmin') NOT NULL DEFAULT 'customer',
        otp VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_signup_otps_email (email),
        INDEX idx_signup_otps_mobile (mobile)
      )
    `);

    await connection.query(`
      ALTER TABLE signup_otps
      MODIFY COLUMN account_type ENUM('customer','pandit','admin','superadmin') NOT NULL DEFAULT 'customer'
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS customer_profiles (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        customer_id BIGINT UNSIGNED NOT NULL UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        gender ENUM('male','female','other') NULL,
        dob DATE NULL,
        address TEXT NULL,
        city_id BIGINT UNSIGNED NULL,
        latitude DECIMAL(10,8) NULL,
        longitude DECIMAL(11,8) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS pandit_profiles (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        gender ENUM('male','female','other') DEFAULT 'male',
        bio TEXT NULL,
        experience_years INT DEFAULT 0,
        city_id BIGINT UNSIGNED NULL,
        latitude DECIMAL(10,8) NULL,
        longitude DECIMAL(11,8) NULL,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_reviews INT DEFAULT 0,
        total_bookings INT DEFAULT 0,
        is_verified BOOLEAN DEFAULT FALSE,
        is_online BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        same_day_booking BOOLEAN DEFAULT FALSE,
        status ENUM('pending','approved','rejected','blocked') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await ensureColumn(connection, 'pandit_profiles', 'aadhar_image', 'VARCHAR(500) NULL');
    await ensureColumn(connection, 'pandit_profiles', 'pandit_certificate_image', 'VARCHAR(500) NULL');
    await ensureColumn(connection, 'pandit_profiles', 'bank_account_holder', 'VARCHAR(150) NULL');
    await ensureColumn(connection, 'pandit_profiles', 'bank_account_number', 'VARCHAR(30) NULL');
    await ensureColumn(connection, 'pandit_profiles', 'bank_ifsc', 'VARCHAR(20) NULL');
    await ensureColumn(connection, 'pandit_profiles', 'bank_name', 'VARCHAR(150) NULL');
    await ensureColumn(connection, 'pandit_profiles', 'passbook_image', 'VARCHAR(500) NULL');
    await ensureColumn(connection, 'pandit_profiles', 'profile_image', 'VARCHAR(500) NULL');

    console.log('Database tables ready');
  } finally {
    connection.release();
  }
}

module.exports = initDb;

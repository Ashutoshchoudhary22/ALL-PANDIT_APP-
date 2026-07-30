-- My-Pandit MySQL Schema

CREATE DATABASE IF NOT EXISTS `app`;
USE `app`;

-- All accounts: customer, pandit, admin, superadmin
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
);

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

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
);

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
  aadhar_image VARCHAR(500) NULL,
  pandit_certificate_image VARCHAR(500) NULL,
  bank_account_holder VARCHAR(150) NULL,
  bank_account_number VARCHAR(30) NULL,
  bank_ifsc VARCHAR(20) NULL,
  bank_name VARCHAR(150) NULL,
  passbook_image VARCHAR(500) NULL,
  profile_image VARCHAR(500) NULL,
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
);

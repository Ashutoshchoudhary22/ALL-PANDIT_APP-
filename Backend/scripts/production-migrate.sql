-- Production migration for ApnaAcharya backend
-- Safe to run multiple times. Run against your production database.
-- Example: mysql -h HOST -u USER -p DB_NAME < scripts/production-migrate.sql

-- Push notifications
CREATE TABLE IF NOT EXISTS device_push_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  app_role ENUM('customer','pandit','admin','superadmin') NOT NULL,
  token VARCHAR(512) NOT NULL,
  platform ENUM('android','ios','web') NOT NULL DEFAULT 'android',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_device_push_token (token),
  INDEX idx_device_push_user_role (user_id, app_role),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notification history
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  recipient_role ENUM('customer','pandit','admin','superadmin') NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NULL,
  booking_id BIGINT UNSIGNED NULL,
  data JSON NULL,
  read_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_created (user_id, created_at),
  INDEX idx_notifications_booking (booking_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Location tracking history
CREATE TABLE IF NOT EXISTS location_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('customer','pandit') NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_location_history_user_role_time (user_id, role, recorded_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wallet tables (if missing)
CREATE TABLE IF NOT EXISTS customer_wallets (
  customer_id BIGINT UNSIGNED PRIMARY KEY,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  type ENUM('topup','debit_advance','debit_remaining','refund','adjustment') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL DEFAULT 0,
  reference_type ENUM('razorpay','booking','admin') NULL,
  reference_id VARCHAR(100) NULL,
  razorpay_order_id VARCHAR(100) NULL,
  razorpay_payment_id VARCHAR(100) NULL,
  status ENUM('pending','completed','failed') DEFAULT 'completed',
  description VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_wallet_payment (razorpay_payment_id),
  INDEX idx_wallet_tx_customer (customer_id, created_at)
);

-- Booking reviews (if missing)
CREATE TABLE IF NOT EXISTS booking_reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  pandit_profile_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pandit_profile_id) REFERENCES pandit_profiles(id) ON DELETE CASCADE,
  CHECK (rating BETWEEN 1 AND 5)
);

-- New columns (run manually if a specific ALTER fails — column may already exist)

ALTER TABLE users ADD COLUMN location_tracking_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE customer_profiles ADD COLUMN live_latitude DECIMAL(10,8) NULL;
ALTER TABLE customer_profiles ADD COLUMN live_longitude DECIMAL(11,8) NULL;
ALTER TABLE customer_profiles ADD COLUMN live_location_at DATETIME NULL;
ALTER TABLE customer_profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE pandit_profiles ADD COLUMN live_latitude DECIMAL(10,8) NULL;
ALTER TABLE pandit_profiles ADD COLUMN live_longitude DECIMAL(11,8) NULL;
ALTER TABLE pandit_profiles ADD COLUMN live_location_at DATETIME NULL;
ALTER TABLE pandit_profiles ADD COLUMN pending_changes JSON NULL;
ALTER TABLE pandit_profiles ADD COLUMN update_request_status ENUM('none','pending','rejected') DEFAULT 'none';
ALTER TABLE bookings ADD COLUMN advance_payment_method ENUM('razorpay','wallet') NULL;
ALTER TABLE bookings ADD COLUMN cancellation_fee_amount DECIMAL(10,2) NULL;
ALTER TABLE bookings ADD COLUMN refund_amount DECIMAL(10,2) NULL;
ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT NULL;
ALTER TABLE bookings ADD COLUMN wallet_advance_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN advance_paid_at DATETIME NULL;
ALTER TABLE bookings ADD COLUMN completed_at DATETIME NULL;

-- Booking status enum (ignore error if already updated)
ALTER TABLE bookings
  MODIFY COLUMN status ENUM(
    'payment_pending','pending','confirmed','in_progress','awaiting_payment','cancelled','completed'
  ) DEFAULT 'payment_pending';

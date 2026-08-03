const pool = require('../config/db');
const { ADVANCE_RATE } = require('./razorpayService');

async function withWalletLock(customerId, handler) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT IGNORE INTO customer_wallets (customer_id, balance) VALUES (?, 0)`,
      [customerId],
    );
    const [rows] = await connection.query(
      `SELECT balance FROM customer_wallets WHERE customer_id = ? FOR UPDATE`,
      [customerId],
    );
    const balance = Number(rows[0]?.balance ?? 0);
    const result = await handler(connection, balance);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getWalletSummary(customerId) {
  await pool.query(
    `INSERT IGNORE INTO customer_wallets (customer_id, balance) VALUES (?, 0)`,
    [customerId],
  );

  const [walletRows] = await pool.query(
    `SELECT balance, updated_at FROM customer_wallets WHERE customer_id = ?`,
    [customerId],
  );

  const [txRows] = await pool.query(
    `SELECT id, type, amount, balance_after AS balanceAfter, status, description,
            reference_type AS referenceType, reference_id AS referenceId,
            razorpay_order_id AS razorpayOrderId, razorpay_payment_id AS razorpayPaymentId,
            created_at AS createdAt
     FROM wallet_transactions
     WHERE customer_id = ? AND status = 'completed'
     ORDER BY created_at DESC
     LIMIT 20`,
    [customerId],
  );

  return {
    balance: Number(walletRows[0]?.balance ?? 0),
    updatedAt: walletRows[0]?.updated_at || null,
    transactions: txRows.map((row) => ({
      ...row,
      amount: Number(row.amount),
      balanceAfter: Number(row.balanceAfter),
    })),
  };
}

async function createPendingTopup(customerId, { amount, orderId }) {
  const [result] = await pool.query(
    `INSERT INTO wallet_transactions
      (customer_id, type, amount, balance_after, reference_type, reference_id, razorpay_order_id, status, description)
     VALUES (?, 'topup', ?, 0, 'razorpay', ?, ?, 'pending', ?)`,
    [customerId, amount, orderId, orderId, `Wallet top-up of ₹${amount}`],
  );
  return result.insertId;
}

async function completeTopup(customerId, { orderId, paymentId, signature, verifySignature }) {
  return withWalletLock(customerId, async (connection, balance) => {
    const [pendingRows] = await connection.query(
      `SELECT id, amount, status
       FROM wallet_transactions
       WHERE customer_id = ? AND razorpay_order_id = ? AND type = 'topup'
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [customerId, orderId],
    );

    const pending = pendingRows[0];
    if (!pending) {
      const error = new Error('Wallet top-up request not found');
      error.statusCode = 404;
      throw error;
    }

    if (pending.status === 'completed') {
      const [existingPayment] = await connection.query(
        `SELECT id FROM wallet_transactions WHERE razorpay_payment_id = ? LIMIT 1`,
        [paymentId],
      );
      if (existingPayment.length > 0) {
        return { balance, amount: Number(pending.amount), alreadyCompleted: true };
      }
    }

    if (pending.status !== 'pending') {
      const error = new Error('Wallet top-up is no longer pending');
      error.statusCode = 400;
      throw error;
    }

    const [duplicatePayment] = await connection.query(
      `SELECT id FROM wallet_transactions WHERE razorpay_payment_id = ? LIMIT 1`,
      [paymentId],
    );
    if (duplicatePayment.length > 0) {
      const error = new Error('This payment has already been processed');
      error.statusCode = 409;
      throw error;
    }

    const isValid = verifySignature({ orderId, paymentId, signature });
    if (!isValid) {
      const error = new Error('Payment verification failed');
      error.statusCode = 400;
      throw error;
    }

    const amount = Number(pending.amount);
    const newBalance = balance + amount;

    await connection.query(`UPDATE customer_wallets SET balance = ?, updated_at = NOW() WHERE customer_id = ?`, [
      newBalance,
      customerId,
    ]);

    await connection.query(
      `UPDATE wallet_transactions
       SET status = 'completed', balance_after = ?, razorpay_payment_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [newBalance, paymentId, pending.id],
    );

    return { balance: newBalance, amount, alreadyCompleted: false };
  });
}

async function debitForBookingAdvance(customerId, bookingId, amount) {
  return withWalletLock(customerId, async (connection, balance) => {
    if (balance < amount) {
      const error = new Error('Insufficient wallet balance');
      error.statusCode = 402;
      throw error;
    }

    const newBalance = balance - amount;

    await connection.query(`UPDATE customer_wallets SET balance = ?, updated_at = NOW() WHERE customer_id = ?`, [
      newBalance,
      customerId,
    ]);

    await connection.query(
      `INSERT INTO wallet_transactions
        (customer_id, type, amount, balance_after, reference_type, reference_id, status, description)
       VALUES (?, 'debit_advance', ?, ?, 'booking', ?, 'completed', ?)`,
      [
        customerId,
        -amount,
        newBalance,
        String(bookingId),
        `${Math.round(ADVANCE_RATE * 100)}% advance paid for booking #${bookingId}`,
      ],
    );

    return newBalance;
  });
}

async function refundBookingAdvance(customerId, bookingId, amount) {
  if (amount <= 0) return getWalletSummary(customerId).then((s) => s.balance);

  return withWalletLock(customerId, async (connection, balance) => {
    const newBalance = balance + amount;

    await connection.query(`UPDATE customer_wallets SET balance = ?, updated_at = NOW() WHERE customer_id = ?`, [
      newBalance,
      customerId,
    ]);

    await connection.query(
      `INSERT INTO wallet_transactions
        (customer_id, type, amount, balance_after, reference_type, reference_id, status, description)
       VALUES (?, 'refund', ?, ?, 'booking', ?, 'completed', ?)`,
      [
        customerId,
        amount,
        newBalance,
        String(bookingId),
        `Refund for cancelled booking #${bookingId}`,
      ],
    );

    return newBalance;
  });
}

module.exports = {
  withWalletLock,
  getWalletSummary,
  createPendingTopup,
  completeTopup,
  debitForBookingAdvance,
  refundBookingAdvance,
};

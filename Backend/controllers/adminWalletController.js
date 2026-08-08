const pool = require('../config/db');

function isPlatformAdmin(user) {
  return user?.role === 'admin' || user?.role === 'superadmin';
}

function roundMoney(value) {
  return Math.round(Number(value || 0));
}

exports.listCustomerWallets = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view customer wallets',
      });
    }

    const [rows] = await pool.query(
      `SELECT u.id AS customer_id,
              TRIM(CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, ''))) AS customer_name,
              cp.first_name,
              u.mobile,
              u.profile_image,
              COALESCE(cw.balance, 0) AS balance,
              cw.updated_at AS updated_at,
              (
                SELECT COUNT(*)
                FROM wallet_transactions wt
                WHERE wt.customer_id = u.id
              ) AS transaction_count
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.customer_id = u.id
       LEFT JOIN customer_wallets cw ON cw.customer_id = u.id
       WHERE u.role = 'customer'
         AND u.status != 'blocked'
       ORDER BY COALESCE(cw.balance, 0) DESC, u.id DESC`,
    );

    const wallets = rows.map((row) => ({
      customerId: row.customer_id,
      customerName: row.customer_name?.trim() || row.first_name?.trim() || 'Customer',
      mobile: row.mobile,
      profileImage: row.profile_image,
      balance: roundMoney(row.balance),
      updatedAt: row.updated_at,
      transactionCount: Number(row.transaction_count ?? 0),
    }));

    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalBalance,
        wallets,
      },
    });
  } catch (error) {
    console.error('List customer wallets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching customer wallets',
    });
  }
};

exports.getCustomerWalletTransactions = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view wallet transactions',
      });
    }

    const customerId = Number(req.params.customerId);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer id',
      });
    }

    const [[customerRows], [walletRows], [txRows]] = await Promise.all([
      pool.query(
        `SELECT u.id,
                TRIM(CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, ''))) AS customer_name,
                cp.first_name,
                u.mobile,
                u.profile_image
         FROM users u
         LEFT JOIN customer_profiles cp ON cp.customer_id = u.id
         WHERE u.id = ? AND u.role = 'customer'
         LIMIT 1`,
        [customerId],
      ),
      pool.query(
        `SELECT balance, updated_at
         FROM customer_wallets
         WHERE customer_id = ?`,
        [customerId],
      ),
      pool.query(
        `SELECT id,
                type,
                amount,
                balance_after AS balanceAfter,
                status,
                description,
                reference_type AS referenceType,
                reference_id AS referenceId,
                razorpay_order_id AS razorpayOrderId,
                razorpay_payment_id AS razorpayPaymentId,
                created_at AS createdAt
         FROM wallet_transactions
         WHERE customer_id = ?
         ORDER BY created_at DESC
         LIMIT 200`,
        [customerId],
      ),
    ]);

    if (customerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const customer = customerRows[0];

    return res.status(200).json({
      success: true,
      data: {
        customerId,
        customerName: customer.customer_name?.trim() || customer.first_name?.trim() || 'Customer',
        mobile: customer.mobile,
        profileImage: customer.profile_image,
        balance: roundMoney(walletRows[0]?.balance ?? 0),
        updatedAt: walletRows[0]?.updated_at || null,
        transactions: txRows.map((row) => ({
          id: row.id,
          type: row.type,
          amount: Number(row.amount),
          balanceAfter: Number(row.balanceAfter),
          status: row.status,
          description: row.description,
          referenceType: row.referenceType,
          referenceId: row.referenceId,
          razorpayOrderId: row.razorpayOrderId,
          razorpayPaymentId: row.razorpayPaymentId,
          createdAt: row.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get customer wallet transactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching wallet transactions',
    });
  }
};

const {
  createTopupOrder,
  verifyPaymentSignature,
} = require('../services/razorpayService');
const {
  getWalletSummary,
  createPendingTopup,
  completeTopup,
} = require('../services/walletService');

const MIN_TOPUP = 100;
const MAX_TOPUP = 50000;

async function fetchCustomerName(customerId) {
  const pool = require('../config/db');
  const [rows] = await pool.query(
    `SELECT cp.first_name, cp.last_name, u.mobile, u.email
     FROM users u
     LEFT JOIN customer_profiles cp ON cp.customer_id = u.id
     WHERE u.id = ?`,
    [customerId],
  );
  const row = rows[0] || {};
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return {
    name: name || undefined,
    email: row.email || undefined,
    contact: row.mobile || undefined,
  };
}

exports.getMyWallet = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Only customers can access wallet' });
    }

    const wallet = await getWalletSummary(req.user.id);

    return res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching wallet',
    });
  }
};

exports.createTopup = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Only customers can add wallet money' });
    }

    const amount = Math.round(Number(req.body.amount));
    if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
      return res.status(400).json({
        success: false,
        message: `Top-up amount must be between ₹${MIN_TOPUP} and ₹${MAX_TOPUP}`,
      });
    }

    const customer = await fetchCustomerName(req.user.id);
    const payment = await createTopupOrder({
      customerId: req.user.id,
      amount,
      customerName: customer.name,
    });

    await createPendingTopup(req.user.id, {
      amount,
      orderId: payment.orderId,
    });

    return res.status(200).json({
      success: true,
      message: 'Complete payment to add money to your wallet',
      payment: {
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        keyId: payment.keyId,
        topupAmount: payment.topupAmount,
      },
      customer,
    });
  } catch (error) {
    console.error('Create wallet topup error:', error.cause || error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not initiate wallet top-up',
    });
  }
};

exports.verifyTopup = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Only customers can verify wallet top-up' });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification details are required',
      });
    }

    const result = await completeTopup(req.user.id, {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      verifySignature: verifyPaymentSignature,
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyCompleted
        ? 'Wallet already credited for this payment'
        : `₹${result.amount} added to your wallet successfully`,
      data: {
        balance: result.balance,
        creditedAmount: result.amount,
      },
    });
  } catch (error) {
    console.error('Verify wallet topup error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Server error while verifying wallet top-up',
    });
  }
};

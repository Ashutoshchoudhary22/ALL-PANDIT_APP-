const crypto = require('crypto');
const Razorpay = require('razorpay');

const ADVANCE_RATE = 0.4;

function getClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  console.log("KEY_ID:", process.env.RAZORPAY_KEY_ID);
  console.log("KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function calculateAdvanceAmount(totalPrice) {
  const total = Math.max(0, Math.round(Number(totalPrice)));
  const advanceAmount = Math.max(1, Math.round(total * ADVANCE_RATE));
  const remainingAmount = Math.max(0, total - advanceAmount);
  return { advanceAmount, remainingAmount };
}

function toPaise(amountInRupees) {
  return Math.round(Number(amountInRupees) * 100);
}

function getRazorpayErrorMessage(error) {
  const description = error?.error?.description || error?.description;
  const code = error?.error?.code || error?.code;

  if (error?.statusCode === 401 || description === 'Authentication failed') {
    return 'Razorpay authentication failed. Please verify KEY_ID and KEY_SECRET in Backend .env are from the same Razorpay test account.';
  }

  if (description) {
    return description;
  }

  if (code) {
    return `Razorpay error: ${code}`;
  }

  return 'Could not initiate payment. Please try again.';
}

async function createAdvanceOrder({ bookingId, totalPrice, customerName, serviceName }) {
  const { advanceAmount } = calculateAdvanceAmount(totalPrice);
  const amountPaise = toPaise(advanceAmount);

  const client = getClient();
  try {
    const order = await client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `bk${bookingId}${Date.now().toString().slice(-8)}`.slice(0, 40),
      notes: {
        booking_id: String(bookingId),
        payment_type: 'advance',
        service_name: serviceName || '',
        customer_name: customerName || '',
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      advanceAmount,
    };
  } catch (error) {
    const message = getRazorpayErrorMessage(error);
    const wrapped = new Error(message);
    wrapped.cause = error;
    throw wrapped;
  }
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
  return expectedSignature === signature;
}

async function createRemainingOrder({ bookingId, remainingAmount, customerName, serviceName }) {
  const amountPaise = toPaise(remainingAmount);

  const client = getClient();
  try {
    const order = await client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `bk${bookingId}r${Date.now().toString().slice(-7)}`.slice(0, 40),
      notes: {
        booking_id: String(bookingId),
        payment_type: 'remaining',
        service_name: serviceName || '',
        customer_name: customerName || '',
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      remainingAmount,
    };
  } catch (error) {
    const message = getRazorpayErrorMessage(error);
    const wrapped = new Error(message);
    wrapped.cause = error;
    throw wrapped;
  }
}

async function createTopupOrder({ customerId, amount, customerName }) {
  const amountPaise = toPaise(amount);

  const client = getClient();
  try {
    const order = await client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `wt${customerId}${Date.now().toString().slice(-8)}`.slice(0, 40),
      notes: {
        customer_id: String(customerId),
        payment_type: 'wallet_topup',
        customer_name: customerName || '',
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      topupAmount: amount,
    };
  } catch (error) {
    const message = getRazorpayErrorMessage(error);
    const wrapped = new Error(message);
    wrapped.cause = error;
    throw wrapped;
  }
}

module.exports = {
  ADVANCE_RATE,
  calculateAdvanceAmount,
  createAdvanceOrder,
  createRemainingOrder,
  createTopupOrder,
  verifyPaymentSignature,
};

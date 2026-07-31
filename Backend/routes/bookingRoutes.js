const express = require('express');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, bookingController.createBooking);
router.post('/verify-payment', authMiddleware, bookingController.verifyBookingPayment);
router.get('/pandit/me', authMiddleware, bookingController.getPanditBookings);
router.get('/me', authMiddleware, bookingController.getMyBookings);
router.post('/:id/retry-payment', authMiddleware, bookingController.retryBookingPayment);

module.exports = router;

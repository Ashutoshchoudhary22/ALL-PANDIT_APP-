const express = require('express');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, bookingController.createBooking);
router.post('/verify-payment', authMiddleware, bookingController.verifyBookingPayment);
router.get('/pandit/requests', authMiddleware, bookingController.getPanditBookingRequests);
router.get('/pandit/me', authMiddleware, bookingController.getPanditBookings);
router.post('/pandit/:id/approve', authMiddleware, bookingController.approveBooking);
router.post('/pandit/:id/reject', authMiddleware, bookingController.rejectBooking);
router.get('/me', authMiddleware, bookingController.getMyBookings);
router.post('/:id/cancel', authMiddleware, bookingController.cancelBooking);
router.post('/:id/retry-payment', authMiddleware, bookingController.retryBookingPayment);

module.exports = router;

const express = require('express');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, bookingController.createBooking);
router.post('/verify-payment', authMiddleware, bookingController.verifyBookingPayment);
router.post('/verify-remaining-payment', authMiddleware, bookingController.verifyRemainingPayment);
router.get('/pandit/requests', authMiddleware, bookingController.getPanditBookingRequests);
router.get('/pandit/me', authMiddleware, bookingController.getPanditBookings);
router.get('/pandit/reviews', authMiddleware, bookingController.getPanditReviews);
router.post('/pandit/:id/approve', authMiddleware, bookingController.approveBooking);
router.post('/pandit/:id/reject', authMiddleware, bookingController.rejectBooking);
router.post('/pandit/:id/start', authMiddleware, bookingController.startBookingPuja);
router.post('/pandit/:id/request-finish', authMiddleware, bookingController.requestFinishBookingPuja);
router.post('/pandit/:id/verify-finish-otp', authMiddleware, bookingController.verifyFinishBookingOtp);
router.post('/pandit/:id/complete-cash', authMiddleware, bookingController.completeBookingCash);
router.post('/pandit/:id/retry-remaining-payment', authMiddleware, bookingController.retryRemainingPayment);
router.get('/me', authMiddleware, bookingController.getMyBookings);
router.post('/:id/review', authMiddleware, bookingController.submitBookingReview);
router.post('/:id/cancel', authMiddleware, bookingController.cancelBooking);
router.post('/:id/pay-with-wallet', authMiddleware, bookingController.payBookingWithWallet);
router.post('/:id/retry-payment', authMiddleware, bookingController.retryBookingPayment);

module.exports = router;

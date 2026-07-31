const express = require('express');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, bookingController.createBooking);
router.get('/me', authMiddleware, bookingController.getMyBookings);

module.exports = router;

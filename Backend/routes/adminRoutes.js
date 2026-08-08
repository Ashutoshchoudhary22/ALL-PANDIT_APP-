const express = require('express');
const authMiddleware = require('../middleware/auth');
const adminBookingsController = require('../controllers/adminBookingsController');
const adminLocationController = require('../controllers/adminLocationController');
const adminNotificationsController = require('../controllers/adminNotificationsController');
const adminReviewsController = require('../controllers/adminReviewsController');
const adminStatsController = require('../controllers/adminStatsController');
const adminWalletController = require('../controllers/adminWalletController');

const router = express.Router();

router.get('/stats', authMiddleware, adminStatsController.getDashboardStats);
router.get('/bookings', authMiddleware, adminBookingsController.listBookings);
router.get('/notifications', authMiddleware, adminNotificationsController.getAdminNotificationsFeed);
router.get('/wallets', authMiddleware, adminWalletController.listCustomerWallets);
router.get(
  '/wallets/:customerId/transactions',
  authMiddleware,
  adminWalletController.getCustomerWalletTransactions,
);
router.get('/pandit-reviews', authMiddleware, adminReviewsController.listPanditReviewSummaries);
router.get(
  '/pandit-reviews/:profileId',
  authMiddleware,
  adminReviewsController.getPanditReviews,
);
router.get(
  '/location-tracking/:userId',
  authMiddleware,
  adminLocationController.getLocationTrackingStatus,
);
router.patch(
  '/location-tracking/:userId',
  authMiddleware,
  adminLocationController.setLocationTracking,
);
router.get(
  '/location-history/:userId/dates',
  authMiddleware,
  adminLocationController.getLocationHistoryDates,
);
router.get(
  '/location-history/:userId',
  authMiddleware,
  adminLocationController.getLocationHistory,
);

module.exports = router;

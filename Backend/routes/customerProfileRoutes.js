const express = require('express');
const customerProfileController = require('../controllers/customerProfileController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, customerProfileController.createProfile);
router.get('/', authMiddleware, customerProfileController.listAllProfiles);
router.get('/me', authMiddleware, customerProfileController.getMyProfile);
router.put('/me', authMiddleware, customerProfileController.updateMyProfile);
router.patch('/me/live-location', authMiddleware, customerProfileController.updateLiveLocation);
router.get('/customer/:customerId', authMiddleware, customerProfileController.getProfileByCustomerId);

module.exports = router;

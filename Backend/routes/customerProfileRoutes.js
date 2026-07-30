const express = require('express');
const customerProfileController = require('../controllers/customerProfileController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, customerProfileController.createProfile);
router.get('/me', authMiddleware, customerProfileController.getMyProfile);
router.put('/me', authMiddleware, customerProfileController.updateMyProfile);
router.get('/customer/:customerId', authMiddleware, customerProfileController.getProfileByCustomerId);

module.exports = router;

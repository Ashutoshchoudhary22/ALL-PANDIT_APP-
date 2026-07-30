const express = require('express');
const panditProfileController = require('../controllers/panditProfileController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, panditProfileController.createProfile);
router.get('/me', authMiddleware, panditProfileController.getMyProfile);
router.put('/me', authMiddleware, panditProfileController.updateMyProfile);
router.get('/user/:userId', authMiddleware, panditProfileController.getProfileByUserId);

module.exports = router;

const express = require('express');
const authMiddleware = require('../middleware/auth');
const adminStatsController = require('../controllers/adminStatsController');

const router = express.Router();

router.get('/stats', authMiddleware, adminStatsController.getDashboardStats);

module.exports = router;

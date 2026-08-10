const express = require('express');

const authMiddleware = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

router.get('/', authMiddleware, notificationsController.getMyNotifications);
router.patch('/read', authMiddleware, notificationsController.markMyNotificationsRead);

module.exports = router;

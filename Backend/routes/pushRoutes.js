const express = require('express');

const authMiddleware = require('../middleware/auth');
const pushController = require('../controllers/pushController');

const router = express.Router();

router.post('/register', authMiddleware, pushController.registerToken);
router.delete('/register', authMiddleware, pushController.unregisterToken);

module.exports = router;

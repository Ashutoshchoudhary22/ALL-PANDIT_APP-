const express = require('express');
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/me', authMiddleware, walletController.getMyWallet);
router.post('/topup', authMiddleware, walletController.createTopup);
router.post('/verify-topup', authMiddleware, walletController.verifyTopup);

module.exports = router;

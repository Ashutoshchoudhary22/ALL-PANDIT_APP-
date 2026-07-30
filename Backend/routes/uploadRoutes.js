const express = require('express');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/status', uploadController.getCloudinaryStatus);
router.post('/image', authMiddleware, upload.single('image'), uploadController.uploadImage);
router.delete('/image', authMiddleware, uploadController.deleteImage);

module.exports = router;

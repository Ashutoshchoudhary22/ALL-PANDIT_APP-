const express = require('express');
const panditProfileController = require('../controllers/panditProfileController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, panditProfileController.createProfile);
router.get('/public/popular-services', authMiddleware, panditProfileController.listPopularServices);
router.get('/public', authMiddleware, panditProfileController.listPublicProfiles);
router.get('/public/:profileId', authMiddleware, panditProfileController.getPublicProfileById);
router.get('/', authMiddleware, panditProfileController.listAllProfiles);
router.get('/me', authMiddleware, panditProfileController.getMyProfile);
router.put('/me', authMiddleware, panditProfileController.updateMyProfile);
router.patch('/me/live-location', authMiddleware, panditProfileController.updateLiveLocation);
router.get('/user/:userId', authMiddleware, panditProfileController.getProfileByUserId);
router.patch('/:profileId/status', authMiddleware, panditProfileController.updateProfileStatus);
router.patch(
  '/:profileId/update-request',
  authMiddleware,
  panditProfileController.updateProfileUpdateRequest,
);
router.get('/:profileId', authMiddleware, panditProfileController.getProfileById);

module.exports = router;

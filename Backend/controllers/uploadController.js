const { Readable } = require('stream');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const ALLOWED_FOLDERS = ['profiles', 'pandits', 'services', 'banners', 'documents'];

function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

function uploadFromBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });

    bufferToStream(buffer).pipe(uploadStream);
  });
}

exports.uploadImage = async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Cloudinary is not configured. Add CLOUDINARY_* keys to Backend/.env',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required (field name: image)',
      });
    }

    const folderInput = req.body.folder?.trim() || 'general';
    const folder = ALLOWED_FOLDERS.includes(folderInput) ? folderInput : 'general';
    const userId = req.user?.id || 'guest';
    const role = req.user?.role || 'unknown';

    const result = await uploadFromBuffer(req.file.buffer, {
      folder: `my-pandit/${folder}`,
      public_id: `${role}-${userId}-${Date.now()}`,
      resource_type: 'image',
      overwrite: false,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        folder: result.folder,
      },
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Cloudinary is not configured',
      });
    }

    const { publicId } = req.query;

    if (!publicId?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'publicId is required',
      });
    }

    const decodedPublicId = decodeURIComponent(publicId);

    if (!decodedPublicId.startsWith('my-pandit/')) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete images outside my-pandit folder',
      });
    }

    const result = await cloudinary.uploader.destroy(decodedPublicId, {
      resource_type: 'image',
    });

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: { result: result.result },
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete image',
    });
  }
};

exports.getCloudinaryStatus = (_req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      configured: isCloudinaryConfigured(),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
      folders: ALLOWED_FOLDERS,
    },
  });
};

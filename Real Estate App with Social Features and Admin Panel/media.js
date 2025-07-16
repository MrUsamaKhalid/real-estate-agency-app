const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');

// Import middleware
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { uploadLimiter, strictLimiter } = require('../middleware/security');
const { asyncHandler } = require('../middleware/errorHandler');

// Import controller
const {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getFileInfo,
  getSignedUploadUrl,
  createImageUrl,
  uploadProfilePicture,
  uploadPostImages,
  getUserFiles,
  getUploadStats,
  handleSingleUpload,
  handleMultipleUpload,
} = require('../controllers/mediaController');

// Validation rules
const fileTypeValidation = [
  body('fileType')
    .optional()
    .isIn(['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'])
    .withMessage('File type must be IMAGE, VIDEO, DOCUMENT, or AUDIO'),
  body('folder')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Folder name must be between 1 and 100 characters'),
  body('tags')
    .optional()
    .custom((value) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          throw new Error('Tags must be an array');
        }
        return true;
      } catch (error) {
        throw new Error('Tags must be valid JSON array');
      }
    }),
  body('generateThumbnails')
    .optional()
    .isBoolean()
    .withMessage('Generate thumbnails must be boolean'),
  body('optimizeImages')
    .optional()
    .isBoolean()
    .withMessage('Optimize images must be boolean'),
];

const signedUrlValidation = [
  body('folder')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Folder name must be between 1 and 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('resourceType')
    .optional()
    .isIn(['image', 'video', 'raw'])
    .withMessage('Resource type must be image, video, or raw'),
];

const transformationValidation = [
  body('width')
    .optional()
    .isInt({ min: 1, max: 4096 })
    .withMessage('Width must be between 1 and 4096'),
  body('height')
    .optional()
    .isInt({ min: 1, max: 4096 })
    .withMessage('Height must be between 1 and 4096'),
  body('quality')
    .optional()
    .isIn(['auto:low', 'auto:good', 'auto:best', 'auto:eco'])
    .withMessage('Invalid quality setting'),
  body('format')
    .optional()
    .isIn(['jpg', 'png', 'webp', 'gif', 'auto'])
    .withMessage('Invalid format'),
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('fileType')
    .optional()
    .isIn(['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'])
    .withMessage('Invalid file type'),
];

// Routes

// Upload single file
router.post(
  '/upload',
  uploadLimiter,
  authenticateToken,
  handleSingleUpload,
  fileTypeValidation,
  handleValidationErrors,
  asyncHandler(uploadSingle)
);

// Upload multiple files
router.post(
  '/upload-multiple',
  uploadLimiter,
  authenticateToken,
  handleMultipleUpload,
  fileTypeValidation,
  handleValidationErrors,
  asyncHandler(uploadMultiple)
);

// Upload profile picture
router.post(
  '/profile-picture',
  uploadLimiter,
  authenticateToken,
  handleSingleUpload,
  asyncHandler(uploadProfilePicture)
);

// Upload post images
router.post(
  '/post-images',
  uploadLimiter,
  authenticateToken,
  handleMultipleUpload,
  body('postId')
    .optional()
    .isUUID()
    .withMessage('Post ID must be a valid UUID'),
  handleValidationErrors,
  asyncHandler(uploadPostImages)
);

// Get signed upload URL for direct uploads
router.post(
  '/signed-url',
  uploadLimiter,
  authenticateToken,
  signedUrlValidation,
  handleValidationErrors,
  asyncHandler(getSignedUploadUrl)
);

// Create image transformation URL
router.post(
  '/transform/:publicId',
  authenticateToken,
  param('publicId')
    .notEmpty()
    .withMessage('Public ID is required'),
  transformationValidation,
  handleValidationErrors,
  asyncHandler(createImageUrl)
);

// Get file information
router.get(
  '/info/:cloudinaryId',
  authenticateToken,
  param('cloudinaryId')
    .notEmpty()
    .withMessage('Cloudinary ID is required'),
  query('resourceType')
    .optional()
    .isIn(['image', 'video', 'raw'])
    .withMessage('Resource type must be image, video, or raw'),
  handleValidationErrors,
  asyncHandler(getFileInfo)
);

// Get user's uploaded files
router.get(
  '/my-files',
  authenticateToken,
  paginationValidation,
  handleValidationErrors,
  asyncHandler(getUserFiles)
);

// Delete file
router.delete(
  '/:cloudinaryId',
  uploadLimiter,
  authenticateToken,
  param('cloudinaryId')
    .notEmpty()
    .withMessage('Cloudinary ID is required'),
  query('resourceType')
    .optional()
    .isIn(['image', 'video', 'raw'])
    .withMessage('Resource type must be image, video, or raw'),
  handleValidationErrors,
  asyncHandler(deleteFile)
);

// Admin routes

// Get upload statistics (admin only)
router.get(
  '/admin/stats',
  authenticateToken,
  requireRole(['admin']),
  asyncHandler(getUploadStats)
);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.',
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files at once.',
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.',
      });
    }
  }
  
  next(error);
});

module.exports = router;


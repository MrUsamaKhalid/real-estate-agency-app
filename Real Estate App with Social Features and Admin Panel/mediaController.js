const MediaService = require('../services/mediaService');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow all file types - validation will be done in MediaService
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 10, // Max 10 files at once
  },
});

// Upload single file
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const { fileType = 'IMAGE', folder, generateThumbnails = true, optimizeImages = true } = req.body;
    const userId = req.user.userId;

    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    const fileMetadata = await MediaService.uploadFile(req.file, {
      fileType: fileType.toUpperCase(),
      userId,
      folder,
      generateThumbnails: generateThumbnails === 'true',
      optimizeImages: optimizeImages === 'true',
      tags,
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileMetadata,
    });
  } catch (error) {
    console.error('Upload single file error:', error);
    
    if (error.message.includes('Invalid file') || error.message.includes('File too large')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
    });
  }
};

// Upload multiple files
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided',
      });
    }

    const { fileType = 'IMAGE', folder, generateThumbnails = true, optimizeImages = true } = req.body;
    const userId = req.user.userId;

    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    const result = await MediaService.uploadMultipleFiles(req.files, {
      fileType: fileType.toUpperCase(),
      userId,
      folder,
      generateThumbnails: generateThumbnails === 'true',
      optimizeImages: optimizeImages === 'true',
      tags,
    });

    res.json({
      success: true,
      message: `${result.successful.length} files uploaded successfully`,
      files: result.successful,
      failed: result.failed,
      totalUploaded: result.successful.length,
      totalFailed: result.failed.length,
    });
  } catch (error) {
    console.error('Upload multiple files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
    });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const { cloudinaryId } = req.params;
    const { resourceType = 'image' } = req.query;

    // TODO: Add authorization check - user should only be able to delete their own files
    // or admin can delete any file

    const result = await MediaService.deleteFile(cloudinaryId, resourceType);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
    });
  }
};

// Get file info
const getFileInfo = async (req, res) => {
  try {
    const { cloudinaryId } = req.params;
    const { resourceType = 'image' } = req.query;

    const fileInfo = await MediaService.getFileInfo(cloudinaryId, resourceType);

    res.json({
      success: true,
      file: fileInfo,
    });
  } catch (error) {
    console.error('Get file info error:', error);
    
    if (error.http_code === 404) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get file info',
    });
  }
};

// Generate signed upload URL for direct uploads
const getSignedUploadUrl = async (req, res) => {
  try {
    const { folder, tags, transformation, resourceType = 'image' } = req.body;
    const userId = req.user.userId;

    const uploadData = MediaService.generateSignedUploadUrl({
      folder: folder || `uploads/${userId}`,
      tags: tags || [],
      transformation,
      resourceType,
    });

    res.json({
      success: true,
      uploadData,
    });
  } catch (error) {
    console.error('Generate signed URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate signed upload URL',
    });
  }
};

// Create image transformation URL
const createImageUrl = async (req, res) => {
  try {
    const { publicId } = req.params;
    const transformations = req.body;

    const imageUrl = MediaService.createImageUrl(publicId, transformations);

    res.json({
      success: true,
      url: imageUrl,
    });
  } catch (error) {
    console.error('Create image URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create image URL',
    });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const userId = req.user.userId;

    // Validate that it's an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed for profile pictures',
      });
    }

    // Validate image dimensions
    await MediaService.validateImageDimensions(req.file.buffer, 100, 100, 2048, 2048);

    const fileMetadata = await MediaService.uploadFile(req.file, {
      fileType: 'IMAGE',
      userId,
      folder: `profile-pictures/${userId}`,
      generateThumbnails: true,
      optimizeImages: true,
      tags: ['profile-picture'],
    });

    // Update user's profile picture in database
    const { User } = require('../models');
    await User.update(
      { profilePicture: fileMetadata.url },
      { where: { id: userId } }
    );

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      file: fileMetadata,
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    
    if (error.message.includes('Image too') || error.message.includes('Invalid file')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
    });
  }
};

// Upload post images
const uploadPostImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided',
      });
    }

    const userId = req.user.userId;
    const { postId } = req.body;

    // Validate that all files are images
    const invalidFiles = req.files.filter(file => !file.mimetype.startsWith('image/'));
    if (invalidFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed for posts',
      });
    }

    const result = await MediaService.uploadMultipleFiles(req.files, {
      fileType: 'IMAGE',
      userId,
      folder: `posts/${postId || 'temp'}`,
      generateThumbnails: true,
      optimizeImages: true,
      tags: ['post-image', postId || 'temp'],
    });

    res.json({
      success: true,
      message: `${result.successful.length} images uploaded successfully`,
      files: result.successful,
      failed: result.failed,
    });
  } catch (error) {
    console.error('Upload post images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload post images',
    });
  }
};

// Get user's uploaded files
const getUserFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, fileType, folder } = req.query;

    // TODO: Implement database query to get user's files
    // This would require storing file metadata in the database
    
    res.json({
      success: true,
      message: 'Feature not implemented yet',
      files: [],
      totalCount: 0,
      currentPage: parseInt(page),
      totalPages: 0,
    });
  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user files',
    });
  }
};

// Get file upload statistics (admin only)
const getUploadStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // TODO: Implement upload statistics
    // This would require storing file metadata in the database
    
    res.json({
      success: true,
      stats: {
        totalFiles: 0,
        totalSize: 0,
        filesByType: {},
        uploadsToday: 0,
        uploadsThisWeek: 0,
        uploadsThisMonth: 0,
      },
    });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upload statistics',
    });
  }
};

// Middleware for handling file uploads
const handleSingleUpload = upload.single('file');
const handleMultipleUpload = upload.array('files', 10);

module.exports = {
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
  
  // Middleware
  handleSingleUpload,
  handleMultipleUpload,
};


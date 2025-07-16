const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class MediaService {
  // File type configurations
  static FILE_TYPES = {
    IMAGE: {
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 10 * 1024 * 1024, // 10MB
      folder: 'images',
    },
    VIDEO: {
      extensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
      mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
      maxSize: 100 * 1024 * 1024, // 100MB
      folder: 'videos',
    },
    DOCUMENT: {
      extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
      mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf'],
      maxSize: 25 * 1024 * 1024, // 25MB
      folder: 'documents',
    },
    AUDIO: {
      extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
      mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
      maxSize: 50 * 1024 * 1024, // 50MB
      folder: 'audio',
    },
  };

  // Image processing configurations
  static IMAGE_SIZES = {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 },
    original: null,
  };

  // Validate file type and size
  static validateFile(file, fileType) {
    const config = this.FILE_TYPES[fileType];
    if (!config) {
      throw new Error('Invalid file type specified');
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.extensions.includes(ext)) {
      throw new Error(`Invalid file extension. Allowed: ${config.extensions.join(', ')}`);
    }

    // Check MIME type
    if (!config.mimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid MIME type. Allowed: ${config.mimeTypes.join(', ')}`);
    }

    // Check file size
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    return true;
  }

  // Upload single file
  static async uploadFile(file, options = {}) {
    try {
      const {
        fileType = 'IMAGE',
        userId,
        folder = null,
        generateThumbnails = true,
        optimizeImages = true,
        tags = [],
      } = options;

      // Validate file
      this.validateFile(file, fileType);

      const config = this.FILE_TYPES[fileType];
      const uploadFolder = folder || `${config.folder}/${userId}`;
      const publicId = `${uploadFolder}/${uuidv4()}`;

      let uploadResult;

      if (fileType === 'IMAGE') {
        uploadResult = await this.uploadImage(file, {
          publicId,
          generateThumbnails,
          optimizeImages,
          tags,
        });
      } else if (fileType === 'VIDEO') {
        uploadResult = await this.uploadVideo(file, {
          publicId,
          tags,
        });
      } else {
        uploadResult = await this.uploadDocument(file, {
          publicId,
          tags,
        });
      }

      // Save file metadata to database (if needed)
      const fileMetadata = {
        id: uuidv4(),
        originalName: file.originalname,
        fileName: uploadResult.public_id,
        fileType,
        mimeType: file.mimetype,
        size: file.size,
        url: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        userId,
        tags,
        metadata: uploadResult,
        createdAt: new Date(),
      };

      return fileMetadata;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  // Upload image with processing
  static async uploadImage(file, options) {
    try {
      const { publicId, generateThumbnails, optimizeImages, tags } = options;

      let processedBuffer = file.buffer;

      // Optimize image if requested
      if (optimizeImages) {
        processedBuffer = await this.optimizeImage(file.buffer, file.mimetype);
      }

      // Upload original image
      const uploadOptions = {
        public_id: publicId,
        resource_type: 'image',
        folder: path.dirname(publicId),
        tags: ['original', ...tags],
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      };

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(processedBuffer);
      });

      // Generate thumbnails if requested
      if (generateThumbnails) {
        uploadResult.thumbnails = await this.generateImageThumbnails(publicId);
      }

      return uploadResult;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  // Upload video with processing
  static async uploadVideo(file, options) {
    try {
      const { publicId, tags } = options;

      const uploadOptions = {
        public_id: publicId,
        resource_type: 'video',
        folder: path.dirname(publicId),
        tags: ['original', ...tags],
        eager: [
          { width: 640, height: 480, crop: 'limit', quality: 'auto:good' },
          { width: 1280, height: 720, crop: 'limit', quality: 'auto:good' },
        ],
        eager_async: true,
      };

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });

      // Generate video thumbnail
      uploadResult.thumbnail = cloudinary.url(publicId, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 640, height: 360, crop: 'limit' },
          { start_offset: '1' }, // Thumbnail from 1 second
        ],
      });

      return uploadResult;
    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    }
  }

  // Upload document
  static async uploadDocument(file, options) {
    try {
      const { publicId, tags } = options;

      const uploadOptions = {
        public_id: publicId,
        resource_type: 'raw',
        folder: path.dirname(publicId),
        tags: ['document', ...tags],
      };

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });

      return uploadResult;
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  // Optimize image
  static async optimizeImage(buffer, mimeType) {
    try {
      let sharpInstance = sharp(buffer);

      // Get image metadata
      const metadata = await sharpInstance.metadata();

      // Resize if too large
      if (metadata.width > 2048 || metadata.height > 2048) {
        sharpInstance = sharpInstance.resize(2048, 2048, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Convert to appropriate format and optimize
      if (mimeType === 'image/png') {
        return await sharpInstance
          .png({ quality: 90, compressionLevel: 9 })
          .toBuffer();
      } else if (mimeType === 'image/webp') {
        return await sharpInstance
          .webp({ quality: 85 })
          .toBuffer();
      } else {
        // Default to JPEG
        return await sharpInstance
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      }
    } catch (error) {
      console.error('Image optimization error:', error);
      return buffer; // Return original if optimization fails
    }
  }

  // Generate image thumbnails
  static async generateImageThumbnails(publicId) {
    try {
      const thumbnails = {};

      for (const [sizeName, dimensions] of Object.entries(this.IMAGE_SIZES)) {
        if (sizeName === 'original') continue;

        thumbnails[sizeName] = cloudinary.url(publicId, {
          width: dimensions.width,
          height: dimensions.height,
          crop: 'fill',
          quality: 'auto:good',
          fetch_format: 'auto',
        });
      }

      return thumbnails;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return {};
    }
  }

  // Upload multiple files
  static async uploadMultipleFiles(files, options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      const results = await Promise.allSettled(uploadPromises);

      const successful = [];
      const failed = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push({
            file: files[index].originalname,
            error: result.reason.message,
          });
        }
      });

      return { successful, failed };
    } catch (error) {
      console.error('Multiple file upload error:', error);
      throw error;
    }
  }

  // Delete file
  static async deleteFile(cloudinaryId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(cloudinaryId, {
        resource_type: resourceType,
      });

      return result;
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }

  // Get file info
  static async getFileInfo(cloudinaryId, resourceType = 'image') {
    try {
      const result = await cloudinary.api.resource(cloudinaryId, {
        resource_type: resourceType,
      });

      return result;
    } catch (error) {
      console.error('Get file info error:', error);
      throw error;
    }
  }

  // Generate signed upload URL for direct uploads
  static generateSignedUploadUrl(options = {}) {
    try {
      const {
        folder = 'uploads',
        tags = [],
        transformation = null,
        resourceType = 'image',
      } = options;

      const timestamp = Math.round(new Date().getTime() / 1000);
      
      const params = {
        timestamp,
        folder,
        tags: tags.join(','),
        resource_type: resourceType,
      };

      if (transformation) {
        params.transformation = transformation;
      }

      const signature = cloudinary.utils.api_sign_request(
        params,
        process.env.CLOUDINARY_API_SECRET
      );

      return {
        url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        params: {
          ...params,
          signature,
          api_key: process.env.CLOUDINARY_API_KEY,
        },
      };
    } catch (error) {
      console.error('Signed URL generation error:', error);
      throw error;
    }
  }

  // Create image transformations
  static createImageUrl(publicId, transformations = {}) {
    try {
      return cloudinary.url(publicId, {
        ...transformations,
        secure: true,
      });
    } catch (error) {
      console.error('Image URL creation error:', error);
      throw error;
    }
  }

  // Validate image dimensions
  static async validateImageDimensions(buffer, minWidth = 100, minHeight = 100, maxWidth = 4096, maxHeight = 4096) {
    try {
      const metadata = await sharp(buffer).metadata();
      
      if (metadata.width < minWidth || metadata.height < minHeight) {
        throw new Error(`Image too small. Minimum dimensions: ${minWidth}x${minHeight}`);
      }
      
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        throw new Error(`Image too large. Maximum dimensions: ${maxWidth}x${maxHeight}`);
      }
      
      return true;
    } catch (error) {
      console.error('Image dimension validation error:', error);
      throw error;
    }
  }

  // Extract video metadata
  static async extractVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  // Clean up temporary files
  static async cleanupTempFiles(filePaths) {
    try {
      const deletePromises = filePaths.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error(`Failed to delete temp file ${filePath}:`, error);
        }
      });

      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = MediaService;


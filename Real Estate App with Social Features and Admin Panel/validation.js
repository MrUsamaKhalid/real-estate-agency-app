const { body, param, query, validationResult } = require('express-validator');
const { validateEmail, validatePassword } = require('../utils/auth');

// Common validation rules
const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address')
  .isLength({ max: 255 })
  .withMessage('Email must be less than 255 characters');

const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');

const nameValidation = (field) => 
  body(field)
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage(`${field} must be between 1 and 50 characters`)
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`);

// Authentication validations
const registerValidation = [
  nameValidation('firstName'),
  nameValidation('lastName'),
  emailValidation,
  passwordValidation,
  body('role')
    .isIn(['agent', 'newcomer', 'faculty', 'admin'])
    .withMessage('Role must be one of: agent, newcomer, faculty, admin'),
  body('agreeToTerms')
    .isBoolean()
    .custom((value) => {
      if (!value) {
        throw new Error('You must agree to the terms and conditions');
      }
      return true;
    }),
];

const loginValidation = [
  emailValidation,
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const forgotPasswordValidation = [
  emailValidation,
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 32, max: 64 })
    .withMessage('Invalid token format'),
  passwordValidation,
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  passwordValidation.withMessage('New password must be at least 8 characters long and contain uppercase, lowercase, and number'),
];

const verifyEmailValidation = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 32, max: 64 })
    .withMessage('Invalid token format'),
];

// User profile validations
const updateProfileValidation = [
  nameValidation('firstName').optional(),
  nameValidation('lastName').optional(),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]{10,}$/)
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
];

// Agent profile validations
const updateAgentProfileValidation = [
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters'),
  body('specialties')
    .optional()
    .isArray()
    .withMessage('Specialties must be an array')
    .custom((specialties) => {
      if (specialties.length > 10) {
        throw new Error('Maximum 10 specialties allowed');
      }
      return true;
    }),
  body('specialties.*')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each specialty must be between 1 and 50 characters'),
  body('areasOfOperation')
    .optional()
    .isArray()
    .withMessage('Areas of operation must be an array')
    .custom((areas) => {
      if (areas.length > 10) {
        throw new Error('Maximum 10 areas of operation allowed');
      }
      return true;
    }),
  body('areasOfOperation.*')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each area must be between 1 and 100 characters'),
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),
  body('licenseNumber')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('License number must be between 1 and 50 characters'),
  body('socialMediaLinks')
    .optional()
    .isObject()
    .withMessage('Social media links must be an object'),
  body('socialMediaLinks.instagram')
    .optional()
    .isURL()
    .withMessage('Instagram URL must be valid'),
  body('socialMediaLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be valid'),
  body('socialMediaLinks.facebook')
    .optional()
    .isURL()
    .withMessage('Facebook URL must be valid'),
  body('socialMediaLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter URL must be valid'),
];

// Post validations
const createPostValidation = [
  body('content')
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Post content must be between 1 and 2000 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
    .custom((images) => {
      if (images.length > 10) {
        throw new Error('Maximum 10 images allowed per post');
      }
      return true;
    }),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 20) {
        throw new Error('Maximum 20 tags allowed per post');
      }
      return true;
    }),
  body('tags.*')
    .optional()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
];

const updatePostValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID'),
  body('content')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Post content must be between 1 and 2000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 20) {
        throw new Error('Maximum 20 tags allowed per post');
      }
      return true;
    }),
];

// Comment validations
const createCommentValidation = [
  param('postId')
    .isUUID()
    .withMessage('Invalid post ID'),
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment content must be between 1 and 500 characters'),
];

const updateCommentValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid comment ID'),
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment content must be between 1 and 500 characters'),
];

// Search validations
const searchValidation = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('type')
    .optional()
    .isIn(['users', 'posts', 'agents', 'all'])
    .withMessage('Search type must be one of: users, posts, agents, all'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Pagination validations
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'email'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
];

// ID parameter validation
const idValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
];

// File upload validations
const fileUploadValidation = [
  body('fileType')
    .optional()
    .isIn(['image', 'document', 'video'])
    .withMessage('File type must be one of: image, document, video'),
];

// Notification validations
const notificationValidation = [
  body('title')
    .notEmpty()
    .withMessage('Notification title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('message')
    .notEmpty()
    .withMessage('Notification message is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),
  body('type')
    .optional()
    .isIn(['info', 'success', 'warning', 'error'])
    .withMessage('Notification type must be one of: info, success, warning, error'),
  body('recipients')
    .optional()
    .isArray()
    .withMessage('Recipients must be an array'),
  body('recipients.*')
    .optional()
    .isUUID()
    .withMessage('Each recipient must be a valid user ID'),
];

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  
  next();
};

// Custom validation functions
const customValidations = {
  // Check if email is unique
  isEmailUnique: async (email, { req }) => {
    const { User } = require('../models');
    const existingUser = await User.findOne({ 
      where: { 
        email: email.toLowerCase(),
        id: { [require('sequelize').Op.ne]: req.user?.userId || null }
      }
    });
    
    if (existingUser) {
      throw new Error('Email is already in use');
    }
    return true;
  },

  // Check if user exists
  userExists: async (userId) => {
    const { User } = require('../models');
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    return true;
  },

  // Check if post exists
  postExists: async (postId) => {
    const { Post } = require('../models');
    const post = await Post.findByPk(postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    return true;
  },
};

module.exports = {
  // Authentication validations
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyEmailValidation,
  
  // Profile validations
  updateProfileValidation,
  updateAgentProfileValidation,
  
  // Post validations
  createPostValidation,
  updatePostValidation,
  
  // Comment validations
  createCommentValidation,
  updateCommentValidation,
  
  // Search and pagination
  searchValidation,
  paginationValidation,
  
  // Common validations
  idValidation,
  fileUploadValidation,
  notificationValidation,
  
  // Middleware
  handleValidationErrors,
  
  // Custom validations
  customValidations,
};


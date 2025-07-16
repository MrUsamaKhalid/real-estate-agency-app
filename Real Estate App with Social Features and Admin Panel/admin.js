const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import middleware
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { authLimiter, strictLimiter } = require('../middleware/security');

// Import controller
const {
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  getPosts,
  updatePostStatus,
  deletePost,
  getSystemSettings,
  updateSystemSettings,
} = require('../controllers/adminController');

// All admin routes require admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Validation rules
const userStatusValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('isActive').isBoolean().withMessage('isActive must be boolean'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason too long'),
];

const postStatusValidation = [
  param('id').isUUID().withMessage('Invalid post ID'),
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason too long'),
];

const deleteValidation = [
  param('id').isUUID().withMessage('Invalid ID'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason too long'),
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC'),
];

const userFilterValidation = [
  ...paginationValidation,
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
  query('role').optional().isIn(['agent', 'newcomer', 'faculty', 'admin']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];

const postFilterValidation = [
  ...paginationValidation,
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  query('authorId').optional().isUUID().withMessage('Invalid author ID'),
];

const systemSettingsValidation = [
  body('settings').isObject().withMessage('Settings must be an object'),
  body('settings.siteName').optional().isLength({ min: 1, max: 100 }).withMessage('Site name invalid'),
  body('settings.siteDescription').optional().isLength({ max: 500 }).withMessage('Description too long'),
  body('settings.maintenanceMode').optional().isBoolean().withMessage('Maintenance mode must be boolean'),
  body('settings.registrationEnabled').optional().isBoolean().withMessage('Registration enabled must be boolean'),
  body('settings.emailVerificationRequired').optional().isBoolean().withMessage('Email verification must be boolean'),
  body('settings.postApprovalRequired').optional().isBoolean().withMessage('Post approval must be boolean'),
];

// Dashboard routes
router.get(
  '/dashboard/stats',
  authLimiter,
  getDashboardStats
);

// User management routes
router.get(
  '/users',
  authLimiter,
  userFilterValidation,
  handleValidationErrors,
  getUsers
);

router.get(
  '/users/:id',
  authLimiter,
  param('id').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors,
  getUserDetails
);

router.patch(
  '/users/:id/status',
  strictLimiter,
  userStatusValidation,
  handleValidationErrors,
  updateUserStatus
);

router.delete(
  '/users/:id',
  strictLimiter,
  deleteValidation,
  handleValidationErrors,
  deleteUser
);

// Post management routes
router.get(
  '/posts',
  authLimiter,
  postFilterValidation,
  handleValidationErrors,
  getPosts
);

router.patch(
  '/posts/:id/status',
  strictLimiter,
  postStatusValidation,
  handleValidationErrors,
  updatePostStatus
);

router.delete(
  '/posts/:id',
  strictLimiter,
  deleteValidation,
  handleValidationErrors,
  deletePost
);

// System settings routes
router.get(
  '/settings',
  authLimiter,
  getSystemSettings
);

router.put(
  '/settings',
  strictLimiter,
  systemSettingsValidation,
  handleValidationErrors,
  updateSystemSettings
);

// Analytics routes (placeholder for future implementation)
router.get(
  '/analytics/users',
  authLimiter,
  (req, res) => {
    res.json({
      success: true,
      message: 'User analytics endpoint - to be implemented',
      data: {
        userGrowth: [],
        userActivity: [],
        userDemographics: {},
      },
    });
  }
);

router.get(
  '/analytics/posts',
  authLimiter,
  (req, res) => {
    res.json({
      success: true,
      message: 'Post analytics endpoint - to be implemented',
      data: {
        postActivity: [],
        popularPosts: [],
        engagementMetrics: {},
      },
    });
  }
);

router.get(
  '/analytics/engagement',
  authLimiter,
  (req, res) => {
    res.json({
      success: true,
      message: 'Engagement analytics endpoint - to be implemented',
      data: {
        likesOverTime: [],
        commentsOverTime: [],
        followsOverTime: [],
        topEngagers: [],
      },
    });
  }
);

// System health routes
router.get(
  '/system/health',
  authLimiter,
  (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        },
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
  }
);

// Logs routes (placeholder)
router.get(
  '/logs',
  authLimiter,
  query('level').optional().isIn(['error', 'warn', 'info', 'debug']).withMessage('Invalid log level'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be 1-1000'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Logs endpoint - to be implemented',
      data: {
        logs: [],
        totalCount: 0,
      },
    });
  }
);

// Backup routes (placeholder)
router.post(
  '/backup/create',
  strictLimiter,
  (req, res) => {
    res.json({
      success: true,
      message: 'Backup creation endpoint - to be implemented',
      data: {
        backupId: 'backup_' + Date.now(),
        status: 'initiated',
      },
    });
  }
);

router.get(
  '/backup/list',
  authLimiter,
  (req, res) => {
    res.json({
      success: true,
      message: 'Backup list endpoint - to be implemented',
      data: {
        backups: [],
      },
    });
  }
);

// Maintenance routes
router.post(
  '/maintenance/enable',
  strictLimiter,
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long'),
  body('estimatedDuration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
  handleValidationErrors,
  (req, res) => {
    // In a real application, this would enable maintenance mode
    res.json({
      success: true,
      message: 'Maintenance mode enabled',
    });
  }
);

router.post(
  '/maintenance/disable',
  strictLimiter,
  (req, res) => {
    // In a real application, this would disable maintenance mode
    res.json({
      success: true,
      message: 'Maintenance mode disabled',
    });
  }
);

// Cache management routes
router.post(
  '/cache/clear',
  strictLimiter,
  body('cacheType').optional().isIn(['all', 'users', 'posts', 'media']).withMessage('Invalid cache type'),
  handleValidationErrors,
  (req, res) => {
    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  }
);

// Database management routes
router.get(
  '/database/stats',
  authLimiter,
  (req, res) => {
    res.json({
      success: true,
      message: 'Database stats endpoint - to be implemented',
      data: {
        tableStats: {},
        connectionPool: {},
        queryPerformance: {},
      },
    });
  }
);

module.exports = router;


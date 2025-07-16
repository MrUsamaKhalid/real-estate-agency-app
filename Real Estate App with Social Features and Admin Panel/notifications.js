const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { User, AgentProfile, Notification } = require('../models');
const { 
  authenticateToken, 
  requireAdmin 
} = require('../middleware/auth');
const { 
  asyncHandler, 
  AppError,
  createValidationError,
  createNotFoundError,
  createForbiddenError
} = require('../middleware/errorHandler');

const router = express.Router();

// Helper function to check validation errors
const checkValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Validation failed', errors.array());
  }
};

// @route   GET /api/notifications
// @desc    Get notifications for current user
// @access  Private
router.get('/', authenticateToken, [
  query('type')
    .optional()
    .isIn(['like', 'comment', 'follow', 'mention', 'post_approved', 'post_rejected', 'announcement', 'welcome', 'system'])
    .withMessage('Invalid notification type'),
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { type, unreadOnly, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;

  // Build where clause
  const whereClause = {
    recipientId: userId,
    expiresAt: {
      [require('sequelize').Op.or]: [
        null,
        { [require('sequelize').Op.gt]: new Date() }
      ]
    }
  };

  if (type) {
    whereClause.type = type;
  }

  if (unreadOnly === 'true') {
    whereClause.isRead = false;
  }

  const { count, rows: notifications } = await Notification.findAndCountAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'sender',
      attributes: ['id', 'firstName', 'lastName'],
      include: [{
        model: AgentProfile,
        as: 'agentProfile',
        attributes: ['profilePhotoUrl']
      }],
      required: false
    }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalNotifications: count,
        hasNext: offset + notifications.length < count,
        hasPrev: page > 1
      }
    }
  });
}));

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count for current user
// @access  Private
router.get('/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const unreadCount = await Notification.getUnreadCount(userId);

  res.json({
    success: true,
    data: {
      unreadCount
    }
  });
}));

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:id/read', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid notification ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findByPk(id);
  if (!notification) {
    throw createNotFoundError('Notification');
  }

  // Check if notification belongs to current user
  if (notification.recipientId !== userId) {
    throw createForbiddenError('You can only mark your own notifications as read');
  }

  await notification.markAsRead();

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
}));

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read for current user
// @access  Private
router.put('/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  await Notification.markAllAsRead(userId);

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid notification ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findByPk(id);
  if (!notification) {
    throw createNotFoundError('Notification');
  }

  // Check if notification belongs to current user
  if (notification.recipientId !== userId) {
    throw createForbiddenError('You can only delete your own notifications');
  }

  await notification.destroy();

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
}));

// @route   POST /api/notifications/announcement
// @desc    Create an announcement notification (admin only)
// @access  Private (Admin)
router.post('/announcement', authenticateToken, requireAdmin, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('recipientIds')
    .optional()
    .isArray()
    .withMessage('Recipient IDs must be an array'),
  body('recipientIds.*')
    .optional()
    .isUUID()
    .withMessage('Each recipient ID must be a valid UUID'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid ISO 8601 date')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { title, message, recipientIds, priority = 'normal', expiresAt } = req.body;
  const senderId = req.user.id;

  // If specific recipients provided, validate they exist
  if (recipientIds && recipientIds.length > 0) {
    const existingUsers = await User.findAll({
      where: {
        id: recipientIds,
        isActive: true
      },
      attributes: ['id']
    });

    if (existingUsers.length !== recipientIds.length) {
      throw new AppError('Some recipient users not found or inactive', 400);
    }
  }

  // Create notifications
  const notifications = await Notification.createAnnouncementNotification(
    title,
    message,
    senderId,
    recipientIds
  );

  // Update notifications with additional fields if provided
  if (priority !== 'normal' || expiresAt) {
    const updateData = {};
    if (priority !== 'normal') updateData.priority = priority;
    if (expiresAt) updateData.expiresAt = new Date(expiresAt);

    await Notification.update(updateData, {
      where: {
        id: notifications.map(n => n.id)
      }
    });
  }

  // Emit real-time notifications
  const io = req.app.get('io');
  if (io) {
    if (recipientIds && recipientIds.length > 0) {
      // Send to specific users
      recipientIds.forEach(recipientId => {
        io.to(`user_${recipientId}`).emit('notification', {
          type: 'announcement',
          title,
          message,
          priority,
          senderId,
          senderName: `${req.user.firstName} ${req.user.lastName}`
        });
      });
    } else {
      // Broadcast to all connected users
      io.emit('notification', {
        type: 'announcement',
        title,
        message,
        priority,
        senderId,
        senderName: `${req.user.firstName} ${req.user.lastName}`
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Announcement sent to ${recipientIds ? recipientIds.length : 'all'} users`,
    data: {
      notificationCount: notifications.length
    }
  });
}));

// @route   POST /api/notifications/test
// @desc    Create a test notification (development only)
// @access  Private
router.post('/test', authenticateToken, [
  body('type')
    .isIn(['like', 'comment', 'follow', 'mention', 'system'])
    .withMessage('Invalid notification type'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
], asyncHandler(async (req, res) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    throw createForbiddenError('Test notifications not allowed in production');
  }

  checkValidationErrors(req);

  const { type, title, message } = req.body;
  const userId = req.user.id;

  const notification = await Notification.create({
    recipientId: userId,
    senderId: userId,
    type,
    title,
    message,
    data: { test: true }
  });

  // Emit real-time notification
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${userId}`).emit('notification', {
      type,
      title,
      message,
      test: true
    });
  }

  res.status(201).json({
    success: true,
    message: 'Test notification created',
    data: {
      notification
    }
  });
}));

// @route   GET /api/notifications/stats
// @desc    Get notification statistics for current user
// @access  Private
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { Op } = require('sequelize');

  const [
    totalNotifications,
    unreadNotifications,
    todayNotifications,
    weekNotifications
  ] = await Promise.all([
    Notification.count({
      where: { recipientId: userId }
    }),
    Notification.count({
      where: { 
        recipientId: userId,
        isRead: false
      }
    }),
    Notification.count({
      where: {
        recipientId: userId,
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    Notification.count({
      where: {
        recipientId: userId,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  // Get notification type breakdown
  const typeBreakdown = await Notification.findAll({
    where: { recipientId: userId },
    attributes: [
      'type',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['type'],
    raw: true
  });

  res.json({
    success: true,
    data: {
      stats: {
        totalNotifications,
        unreadNotifications,
        todayNotifications,
        weekNotifications,
        readPercentage: totalNotifications > 0 
          ? Math.round(((totalNotifications - unreadNotifications) / totalNotifications) * 100)
          : 0
      },
      typeBreakdown: typeBreakdown.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {})
    }
  });
}));

// @route   PUT /api/notifications/settings
// @desc    Update notification preferences for current user
// @access  Private
router.put('/settings', authenticateToken, [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  body('notificationTypes')
    .optional()
    .isObject()
    .withMessage('Notification types must be an object'),
  body('quietHours')
    .optional()
    .isObject()
    .withMessage('Quiet hours must be an object')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { emailNotifications, pushNotifications, notificationTypes, quietHours } = req.body;
  const userId = req.user.id;

  // Get or create user settings
  const { UserSettings } = require('../models');
  let userSettings = await UserSettings.findOne({ where: { userId } });
  
  if (!userSettings) {
    userSettings = await UserSettings.create({ userId });
  }

  // Update notification preferences
  const currentPrefs = userSettings.notificationPreferences || {};
  const updatedPrefs = {
    ...currentPrefs,
    ...(emailNotifications !== undefined && { emailNotifications }),
    ...(pushNotifications !== undefined && { pushNotifications }),
    ...(notificationTypes !== undefined && { notificationTypes }),
    ...(quietHours !== undefined && { quietHours })
  };

  await userSettings.update({
    notificationPreferences: updatedPrefs
  });

  res.json({
    success: true,
    message: 'Notification settings updated successfully',
    data: {
      notificationPreferences: updatedPrefs
    }
  });
}));

module.exports = router;


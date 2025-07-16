const NotificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const result = await NotificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await NotificationService.markAsRead(id, userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await NotificationService.deleteNotification(id, userId);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    });
  }
};

// Register push token
const registerPushToken = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const userId = req.user.userId;
    const { token, type, endpoint, keys } = req.body;

    const tokenData = {
      token,
      type, // 'fcm', 'apns', 'web'
      endpoint, // for web push
      keys, // for web push
    };

    await NotificationService.registerPushToken(userId, tokenData);

    res.json({
      success: true,
      message: 'Push token registered successfully',
    });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register push token',
    });
  }
};

// Send test notification (for development/testing)
const sendTestNotification = async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test notifications not allowed in production',
      });
    }

    const userId = req.user.userId;
    const { title = 'Test Notification', message = 'This is a test notification' } = req.body;

    await NotificationService.createNotification({
      userId,
      type: 'system_announcement',
      title,
      message,
      data: { test: true },
      sendPush: true,
      sendEmail: false,
    });

    res.json({
      success: true,
      message: 'Test notification sent',
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
    });
  }
};

// Update notification preferences
const updatePreferences = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const userId = req.user.userId;
    const { 
      emailNotifications = true,
      pushNotifications = true,
      notificationTypes = {}
    } = req.body;

    const { User } = require('../models');
    
    await User.update(
      {
        emailNotificationsEnabled: emailNotifications,
        pushNotificationsEnabled: pushNotifications,
        notificationPreferences: notificationTypes,
      },
      { where: { id: userId } }
    );

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
    });
  }
};

// Get notification preferences
const getPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { User } = require('../models');

    const user = await User.findByPk(userId, {
      attributes: [
        'emailNotificationsEnabled',
        'pushNotificationsEnabled',
        'notificationPreferences',
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      preferences: {
        emailNotifications: user.emailNotificationsEnabled,
        pushNotifications: user.pushNotificationsEnabled,
        notificationTypes: user.notificationPreferences || {},
      },
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
    });
  }
};

// Send bulk notification (admin only)
const sendBulkNotification = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { 
      userIds, 
      title, 
      message, 
      type = 'system_announcement',
      sendPush = true,
      sendEmail = false,
      data = {}
    } = req.body;

    // If no specific user IDs provided, send to all users
    let targetUserIds = userIds;
    
    if (!targetUserIds || targetUserIds.length === 0) {
      const { User } = require('../models');
      const users = await User.findAll({
        attributes: ['id'],
        where: { isActive: true },
      });
      targetUserIds = users.map(user => user.id);
    }

    const notificationData = {
      type,
      title,
      message,
      data,
      sendPush,
      sendEmail,
    };

    await NotificationService.sendBulkNotifications(targetUserIds, notificationData);

    res.json({
      success: true,
      message: `Bulk notification sent to ${targetUserIds.length} users`,
      recipientCount: targetUserIds.length,
    });
  } catch (error) {
    console.error('Send bulk notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notification',
    });
  }
};

// Get notification statistics (admin only)
const getNotificationStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { Notification } = require('../models');
    const { Op } = require('sequelize');

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalNotifications,
      unreadNotifications,
      last24HoursCount,
      last7DaysCount,
      last30DaysCount,
      notificationsByType,
    ] = await Promise.all([
      Notification.count(),
      Notification.count({ where: { read: false } }),
      Notification.count({ where: { createdAt: { [Op.gte]: last24Hours } } }),
      Notification.count({ where: { createdAt: { [Op.gte]: last7Days } } }),
      Notification.count({ where: { createdAt: { [Op.gte]: last30Days } } }),
      Notification.findAll({
        attributes: [
          'type',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        ],
        group: ['type'],
        raw: true,
      }),
    ]);

    res.json({
      success: true,
      stats: {
        total: totalNotifications,
        unread: unreadNotifications,
        readRate: totalNotifications > 0 ? ((totalNotifications - unreadNotifications) / totalNotifications * 100).toFixed(2) : 0,
        periods: {
          last24Hours: last24HoursCount,
          last7Days: last7DaysCount,
          last30Days: last30DaysCount,
        },
        byType: notificationsByType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerPushToken,
  sendTestNotification,
  updatePreferences,
  getPreferences,
  sendBulkNotification,
  getNotificationStats,
};


const { Notification, User } = require('../models');
const { sendEmail, emailTemplates } = require('../utils/auth');
const webpush = require('web-push');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for push notifications
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

// Configure web-push for browser notifications
webpush.setVapidDetails(
  `mailto:${process.env.SMTP_FROM}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class NotificationService {
  // Notification types
  static TYPES = {
    NEW_FOLLOWER: 'new_follower',
    POST_LIKE: 'post_like',
    POST_COMMENT: 'post_comment',
    COMMENT_REPLY: 'comment_reply',
    MENTION: 'mention',
    NEW_MESSAGE: 'new_message',
    SYSTEM_ANNOUNCEMENT: 'system_announcement',
    WELCOME: 'welcome',
    EMAIL_VERIFIED: 'email_verified',
    PASSWORD_CHANGED: 'password_changed',
    PROFILE_UPDATED: 'profile_updated',
    POST_APPROVED: 'post_approved',
    POST_REJECTED: 'post_rejected',
  };

  // Create a new notification
  static async createNotification({
    userId,
    type,
    title,
    message,
    data = {},
    sendPush = true,
    sendEmail = false,
    priority = 'normal'
  }) {
    try {
      // Create notification in database
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data,
        priority,
        read: false,
      });

      // Send push notification if enabled
      if (sendPush) {
        await this.sendPushNotification(userId, {
          title,
          body: message,
          data: {
            notificationId: notification.id,
            type,
            ...data,
          },
        });
      }

      // Send email notification if enabled
      if (sendEmail) {
        await this.sendEmailNotification(userId, {
          type,
          title,
          message,
          data,
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send push notification to user
  static async sendPushNotification(userId, payload) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.pushTokens || user.pushTokens.length === 0) {
        return;
      }

      const pushPromises = user.pushTokens.map(async (token) => {
        try {
          // Firebase push notification
          if (token.type === 'fcm') {
            const message = {
              token: token.token,
              notification: {
                title: payload.title,
                body: payload.body,
              },
              data: payload.data || {},
              android: {
                notification: {
                  icon: 'ic_notification',
                  color: '#2563eb',
                  sound: 'default',
                },
              },
              apns: {
                payload: {
                  aps: {
                    badge: 1,
                    sound: 'default',
                  },
                },
              },
            };

            return admin.messaging().send(message);
          }

          // Web push notification
          if (token.type === 'web') {
            const webPayload = JSON.stringify({
              title: payload.title,
              body: payload.body,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/badge-72x72.png',
              data: payload.data || {},
            });

            return webpush.sendNotification(
              {
                endpoint: token.endpoint,
                keys: token.keys,
              },
              webPayload
            );
          }
        } catch (error) {
          console.error(`Failed to send push notification to token ${token.token}:`, error);
          
          // Remove invalid tokens
          if (error.code === 'messaging/registration-token-not-registered' ||
              error.statusCode === 410) {
            await this.removeInvalidPushToken(userId, token.token);
          }
        }
      });

      await Promise.allSettled(pushPromises);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Send email notification
  static async sendEmailNotification(userId, { type, title, message, data }) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.emailNotificationsEnabled) {
        return;
      }

      let emailTemplate;

      switch (type) {
        case this.TYPES.NEW_FOLLOWER:
          emailTemplate = {
            subject: `${data.followerName} started following you`,
            html: this.generateFollowerEmailTemplate(user.firstName, data),
          };
          break;

        case this.TYPES.POST_LIKE:
          emailTemplate = {
            subject: `${data.likerName} liked your post`,
            html: this.generateLikeEmailTemplate(user.firstName, data),
          };
          break;

        case this.TYPES.POST_COMMENT:
          emailTemplate = {
            subject: `${data.commenterName} commented on your post`,
            html: this.generateCommentEmailTemplate(user.firstName, data),
          };
          break;

        case this.TYPES.SYSTEM_ANNOUNCEMENT:
          emailTemplate = {
            subject: title,
            html: this.generateAnnouncementEmailTemplate(user.firstName, { title, message, data }),
          };
          break;

        default:
          emailTemplate = {
            subject: title,
            html: this.generateGenericEmailTemplate(user.firstName, { title, message }),
          };
      }

      await sendEmail(user.email, emailTemplate);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Register push token for user
  static async registerPushToken(userId, tokenData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const pushTokens = user.pushTokens || [];
      
      // Remove existing token if it exists
      const filteredTokens = pushTokens.filter(t => t.token !== tokenData.token);
      
      // Add new token
      filteredTokens.push({
        token: tokenData.token,
        type: tokenData.type, // 'fcm', 'apns', 'web'
        endpoint: tokenData.endpoint, // for web push
        keys: tokenData.keys, // for web push
        createdAt: new Date(),
      });

      await user.update({ pushTokens: filteredTokens });
      
      return { success: true };
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  // Remove invalid push token
  static async removeInvalidPushToken(userId, token) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return;

      const pushTokens = user.pushTokens || [];
      const filteredTokens = pushTokens.filter(t => t.token !== token);

      await user.update({ pushTokens: filteredTokens });
    } catch (error) {
      console.error('Error removing invalid push token:', error);
    }
  }

  // Get notifications for user
  static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    try {
      const offset = (page - 1) * limit;
      const whereClause = { userId };
      
      if (unreadOnly) {
        whereClause.read = false;
      }

      const { count, rows } = await Notification.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      return {
        notifications: rows,
        totalCount: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        hasMore: offset + rows.length < count,
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.update({ read: true, readAt: new Date() });
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId) {
    try {
      await Notification.update(
        { read: true, readAt: new Date() },
        { where: { userId, read: false } }
      );

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.destroy();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get unread count for user
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: { userId, read: false },
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Send bulk notifications
  static async sendBulkNotifications(userIds, notificationData) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        ...notificationData,
        read: false,
      }));

      const createdNotifications = await Notification.bulkCreate(notifications);

      // Send push notifications in parallel
      const pushPromises = userIds.map(userId =>
        this.sendPushNotification(userId, {
          title: notificationData.title,
          body: notificationData.message,
          data: notificationData.data || {},
        })
      );

      await Promise.allSettled(pushPromises);

      return createdNotifications;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  // Email template generators
  static generateFollowerEmailTemplate(userName, data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Follower!</h2>
        <p>Hi ${userName},</p>
        <p>${data.followerName} started following you on Real Estate Agency.</p>
        <a href="${process.env.FRONTEND_URL}/profile/${data.followerId}" 
           style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Profile
        </a>
      </div>
    `;
  }

  static generateLikeEmailTemplate(userName, data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your post was liked!</h2>
        <p>Hi ${userName},</p>
        <p>${data.likerName} liked your post.</p>
        <a href="${process.env.FRONTEND_URL}/posts/${data.postId}" 
           style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Post
        </a>
      </div>
    `;
  }

  static generateCommentEmailTemplate(userName, data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New comment on your post!</h2>
        <p>Hi ${userName},</p>
        <p>${data.commenterName} commented on your post:</p>
        <blockquote style="border-left: 3px solid #2563eb; padding-left: 15px; margin: 20px 0;">
          ${data.commentContent}
        </blockquote>
        <a href="${process.env.FRONTEND_URL}/posts/${data.postId}" 
           style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Post
        </a>
      </div>
    `;
  }

  static generateAnnouncementEmailTemplate(userName, { title, message, data }) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${title}</h2>
        <p>Hi ${userName},</p>
        <p>${message}</p>
        ${data.actionUrl ? `
          <a href="${data.actionUrl}" 
             style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            ${data.actionText || 'Learn More'}
          </a>
        ` : ''}
      </div>
    `;
  }

  static generateGenericEmailTemplate(userName, { title, message }) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${title}</h2>
        <p>Hi ${userName},</p>
        <p>${message}</p>
      </div>
    `;
  }
}

module.exports = NotificationService;


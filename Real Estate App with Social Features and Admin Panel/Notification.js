const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'recipient_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'sender_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  type: {
    type: DataTypes.ENUM(
      'like', 'comment', 'follow', 'mention', 'post_approved',
      'post_rejected', 'announcement', 'welcome', 'system'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  isPushSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_push_sent'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  }
}, {
  tableName: 'notifications',
  updatedAt: false,
  indexes: [
    {
      fields: ['recipient_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['created_at'],
      order: [['created_at', 'DESC']]
    },
    {
      fields: ['priority']
    }
  ]
});

// Instance methods
Notification.prototype.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

Notification.prototype.markPushSent = function() {
  this.isPushSent = true;
  return this.save();
};

// Class methods
Notification.findByRecipient = function(recipientId, options = {}) {
  return this.findAll({
    where: {
      recipientId,
      expiresAt: {
        [sequelize.Op.or]: [
          null,
          { [sequelize.Op.gt]: new Date() }
        ]
      },
      ...options.where
    },
    order: [['createdAt', 'DESC']],
    include: [{
      model: sequelize.models.User,
      as: 'sender',
      attributes: ['id', 'firstName', 'lastName'],
      include: [{
        model: sequelize.models.AgentProfile,
        attributes: ['profilePhotoUrl']
      }]
    }],
    ...options
  });
};

Notification.findUnread = function(recipientId, options = {}) {
  return this.findAll({
    where: {
      recipientId,
      isRead: false,
      expiresAt: {
        [sequelize.Op.or]: [
          null,
          { [sequelize.Op.gt]: new Date() }
        ]
      },
      ...options.where
    },
    order: [['createdAt', 'DESC']],
    ...options
  });
};

Notification.getUnreadCount = function(recipientId) {
  return this.count({
    where: {
      recipientId,
      isRead: false,
      expiresAt: {
        [sequelize.Op.or]: [
          null,
          { [sequelize.Op.gt]: new Date() }
        ]
      }
    }
  });
};

Notification.markAllAsRead = function(recipientId) {
  return this.update(
    { isRead: true },
    {
      where: {
        recipientId,
        isRead: false
      }
    }
  );
};

Notification.createLikeNotification = async function(postId, likerId, postOwnerId) {
  if (likerId === postOwnerId) return null; // Don't notify self

  const liker = await sequelize.models.User.findByPk(likerId);
  const post = await sequelize.models.Post.findByPk(postId);

  return this.create({
    recipientId: postOwnerId,
    senderId: likerId,
    type: 'like',
    title: 'New Like',
    message: `${liker.getFullName()} liked your post`,
    data: {
      postId,
      postContent: post.content.substring(0, 100)
    }
  });
};

Notification.createCommentNotification = async function(postId, commenterId, postOwnerId) {
  if (commenterId === postOwnerId) return null; // Don't notify self

  const commenter = await sequelize.models.User.findByPk(commenterId);
  const post = await sequelize.models.Post.findByPk(postId);

  return this.create({
    recipientId: postOwnerId,
    senderId: commenterId,
    type: 'comment',
    title: 'New Comment',
    message: `${commenter.getFullName()} commented on your post`,
    data: {
      postId,
      postContent: post.content.substring(0, 100)
    }
  });
};

Notification.createFollowNotification = async function(followerId, followingId) {
  const follower = await sequelize.models.User.findByPk(followerId);

  return this.create({
    recipientId: followingId,
    senderId: followerId,
    type: 'follow',
    title: 'New Follower',
    message: `${follower.getFullName()} started following you`,
    data: {
      followerId
    }
  });
};

Notification.createPostApprovalNotification = async function(postId, approverId) {
  const post = await sequelize.models.Post.findByPk(postId);
  const approver = await sequelize.models.User.findByPk(approverId);

  return this.create({
    recipientId: post.userId,
    senderId: approverId,
    type: 'post_approved',
    title: 'Post Approved',
    message: `Your post has been approved by ${approver.getFullName()}`,
    data: {
      postId,
      postContent: post.content.substring(0, 100)
    }
  });
};

Notification.createAnnouncementNotification = async function(title, message, senderId, recipientIds = null) {
  const notifications = [];
  
  if (recipientIds) {
    // Send to specific users
    for (const recipientId of recipientIds) {
      notifications.push({
        recipientId,
        senderId,
        type: 'announcement',
        title,
        message,
        priority: 'high'
      });
    }
  } else {
    // Send to all active users
    const users = await sequelize.models.User.findAll({
      where: { isActive: true },
      attributes: ['id']
    });
    
    for (const user of users) {
      notifications.push({
        recipientId: user.id,
        senderId,
        type: 'announcement',
        title,
        message,
        priority: 'high'
      });
    }
  }

  return this.bulkCreate(notifications);
};

module.exports = Notification;


const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mediaUrls: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'media_urls'
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video', 'mixed'),
    defaultValue: 'image',
    field: 'media_type'
  },
  postType: {
    type: DataTypes.ENUM('regular', 'story', 'highlight', 'announcement'),
    defaultValue: 'regular',
    field: 'post_type'
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_published'
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_approved'
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'like_count'
  },
  commentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'comment_count'
  },
  shareCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'share_count'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  externalShareSettings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'external_share_settings'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'scheduled_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at'
  }
}, {
  tableName: 'posts',
  paranoid: true,
  deletedAt: 'deletedAt',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_published']
    },
    {
      fields: ['is_approved']
    },
    {
      fields: ['post_type']
    },
    {
      fields: ['created_at'],
      order: [['created_at', 'DESC']]
    },
    {
      using: 'gin',
      fields: ['tags']
    }
  ]
});

// Instance methods
Post.prototype.incrementLikeCount = function() {
  return this.increment('likeCount');
};

Post.prototype.decrementLikeCount = function() {
  return this.decrement('likeCount');
};

Post.prototype.incrementCommentCount = function() {
  return this.increment('commentCount');
};

Post.prototype.decrementCommentCount = function() {
  return this.decrement('commentCount');
};

Post.prototype.incrementShareCount = function() {
  return this.increment('shareCount');
};

Post.prototype.incrementViewCount = function() {
  return this.increment('viewCount');
};

Post.prototype.approve = async function(approvedBy) {
  this.isApproved = true;
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  return this.save();
};

Post.prototype.reject = async function() {
  this.isApproved = false;
  this.approvedBy = null;
  this.approvedAt = null;
  return this.save();
};

// Class methods
Post.findPublished = function(options = {}) {
  return this.findAll({
    where: {
      isPublished: true,
      isApproved: true,
      ...options.where
    },
    order: [['createdAt', 'DESC']],
    ...options
  });
};

Post.findPending = function() {
  return this.findAll({
    where: {
      isPublished: true,
      isApproved: false
    },
    order: [['createdAt', 'ASC']],
    include: [{
      model: sequelize.models.User,
      attributes: ['firstName', 'lastName', 'email']
    }]
  });
};

Post.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      userId,
      isPublished: true,
      ...options.where
    },
    order: [['createdAt', 'DESC']],
    ...options
  });
};

Post.findByTag = function(tag, options = {}) {
  return this.findAll({
    where: {
      tags: {
        [sequelize.Op.contains]: [tag]
      },
      isPublished: true,
      isApproved: true,
      ...options.where
    },
    order: [['createdAt', 'DESC']],
    ...options
  });
};

Post.findStories = function(options = {}) {
  return this.findAll({
    where: {
      postType: 'story',
      isPublished: true,
      isApproved: true,
      expiresAt: {
        [sequelize.Op.gt]: new Date()
      },
      ...options.where
    },
    order: [['createdAt', 'DESC']],
    ...options
  });
};

Post.getTrending = function(limit = 10) {
  return this.findAll({
    where: {
      isPublished: true,
      isApproved: true,
      createdAt: {
        [sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    order: [
      [sequelize.literal('(like_count + comment_count + share_count)'), 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit
  });
};

module.exports = Post;


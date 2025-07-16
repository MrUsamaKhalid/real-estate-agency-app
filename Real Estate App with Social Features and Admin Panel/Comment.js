const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'post_id',
    references: {
      model: 'posts',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  parentCommentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'parent_comment_id',
    references: {
      model: 'comments',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'like_count'
  },
  replyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'reply_count'
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_approved'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at'
  }
}, {
  tableName: 'comments',
  paranoid: true,
  deletedAt: 'deletedAt',
  indexes: [
    {
      fields: ['post_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['parent_comment_id']
    },
    {
      fields: ['created_at'],
      order: [['created_at', 'DESC']]
    }
  ]
});

// Instance methods
Comment.prototype.incrementLikeCount = function() {
  return this.increment('likeCount');
};

Comment.prototype.decrementLikeCount = function() {
  return this.decrement('likeCount');
};

Comment.prototype.incrementReplyCount = function() {
  return this.increment('replyCount');
};

Comment.prototype.decrementReplyCount = function() {
  return this.decrement('replyCount');
};

// Class methods
Comment.findByPost = function(postId, options = {}) {
  return this.findAll({
    where: {
      postId,
      parentCommentId: null, // Top-level comments only
      isApproved: true,
      ...options.where
    },
    order: [['createdAt', 'ASC']],
    include: [
      {
        model: sequelize.models.User,
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: Comment,
        as: 'replies',
        include: [{
          model: sequelize.models.User,
          attributes: ['id', 'firstName', 'lastName']
        }],
        order: [['createdAt', 'ASC']]
      }
    ],
    ...options
  });
};

Comment.findReplies = function(parentCommentId, options = {}) {
  return this.findAll({
    where: {
      parentCommentId,
      isApproved: true,
      ...options.where
    },
    order: [['createdAt', 'ASC']],
    include: [{
      model: sequelize.models.User,
      attributes: ['id', 'firstName', 'lastName']
    }],
    ...options
  });
};

Comment.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      userId,
      isApproved: true,
      ...options.where
    },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: sequelize.models.User,
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: sequelize.models.Post,
        attributes: ['id', 'content']
      }
    ],
    ...options
  });
};

module.exports = Comment;


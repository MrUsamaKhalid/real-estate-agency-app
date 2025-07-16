const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Like = sequelize.define('Like', {
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
  postId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'post_id',
    references: {
      model: 'posts',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  commentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'comment_id',
    references: {
      model: 'comments',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'likes',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'post_id'],
      where: {
        post_id: {
          [sequelize.Op.ne]: null
        }
      }
    },
    {
      unique: true,
      fields: ['user_id', 'comment_id'],
      where: {
        comment_id: {
          [sequelize.Op.ne]: null
        }
      }
    },
    {
      fields: ['post_id']
    },
    {
      fields: ['comment_id']
    }
  ],
  validate: {
    targetCheck() {
      if ((this.postId && this.commentId) || (!this.postId && !this.commentId)) {
        throw new Error('Like must target either a post or a comment, but not both or neither');
      }
    }
  }
});

// Class methods
Like.findByPost = function(postId) {
  return this.findAll({
    where: { postId },
    include: [{
      model: sequelize.models.User,
      attributes: ['id', 'firstName', 'lastName']
    }]
  });
};

Like.findByComment = function(commentId) {
  return this.findAll({
    where: { commentId },
    include: [{
      model: sequelize.models.User,
      attributes: ['id', 'firstName', 'lastName']
    }]
  });
};

Like.findByUser = function(userId) {
  return this.findAll({
    where: { userId },
    include: [
      {
        model: sequelize.models.Post,
        attributes: ['id', 'content', 'userId']
      },
      {
        model: sequelize.models.Comment,
        attributes: ['id', 'content', 'postId']
      }
    ]
  });
};

Like.togglePostLike = async function(userId, postId) {
  const existingLike = await this.findOne({
    where: { userId, postId }
  });

  if (existingLike) {
    await existingLike.destroy();
    return { liked: false, like: null };
  } else {
    const newLike = await this.create({ userId, postId });
    return { liked: true, like: newLike };
  }
};

Like.toggleCommentLike = async function(userId, commentId) {
  const existingLike = await this.findOne({
    where: { userId, commentId }
  });

  if (existingLike) {
    await existingLike.destroy();
    return { liked: false, like: null };
  } else {
    const newLike = await this.create({ userId, commentId });
    return { liked: true, like: newLike };
  }
};

module.exports = Like;


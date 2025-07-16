const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const AgentProfile = require('./AgentProfile');
const Post = require('./Post');
const Comment = require('./Comment');
const Like = require('./Like');
const Follow = require('./Follow');
const Notification = require('./Notification');

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasOne(AgentProfile, {
    foreignKey: 'userId',
    as: 'agentProfile',
    onDelete: 'CASCADE'
  });

  User.hasMany(Post, {
    foreignKey: 'userId',
    as: 'posts',
    onDelete: 'CASCADE'
  });

  User.hasMany(Comment, {
    foreignKey: 'userId',
    as: 'comments',
    onDelete: 'CASCADE'
  });

  User.hasMany(Like, {
    foreignKey: 'userId',
    as: 'likes',
    onDelete: 'CASCADE'
  });

  User.hasMany(Follow, {
    foreignKey: 'followerId',
    as: 'following',
    onDelete: 'CASCADE'
  });

  User.hasMany(Follow, {
    foreignKey: 'followingId',
    as: 'followers',
    onDelete: 'CASCADE'
  });

  User.hasMany(Notification, {
    foreignKey: 'recipientId',
    as: 'receivedNotifications',
    onDelete: 'CASCADE'
  });

  User.hasMany(Notification, {
    foreignKey: 'senderId',
    as: 'sentNotifications',
    onDelete: 'SET NULL'
  });

  // AgentProfile associations
  AgentProfile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE'
  });

  // Post associations
  Post.belongsTo(User, {
    foreignKey: 'userId',
    as: 'author',
    onDelete: 'CASCADE'
  });

  Post.belongsTo(User, {
    foreignKey: 'approvedBy',
    as: 'approver',
    onDelete: 'SET NULL'
  });

  Post.hasMany(Comment, {
    foreignKey: 'postId',
    as: 'comments',
    onDelete: 'CASCADE'
  });

  Post.hasMany(Like, {
    foreignKey: 'postId',
    as: 'likes',
    onDelete: 'CASCADE'
  });

  // Comment associations
  Comment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'author',
    onDelete: 'CASCADE'
  });

  Comment.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'post',
    onDelete: 'CASCADE'
  });

  Comment.belongsTo(Comment, {
    foreignKey: 'parentCommentId',
    as: 'parentComment',
    onDelete: 'CASCADE'
  });

  Comment.hasMany(Comment, {
    foreignKey: 'parentCommentId',
    as: 'replies',
    onDelete: 'CASCADE'
  });

  Comment.hasMany(Like, {
    foreignKey: 'commentId',
    as: 'likes',
    onDelete: 'CASCADE'
  });

  // Like associations
  Like.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE'
  });

  Like.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'post',
    onDelete: 'CASCADE'
  });

  Like.belongsTo(Comment, {
    foreignKey: 'commentId',
    as: 'comment',
    onDelete: 'CASCADE'
  });

  // Follow associations
  Follow.belongsTo(User, {
    foreignKey: 'followerId',
    as: 'follower',
    onDelete: 'CASCADE'
  });

  Follow.belongsTo(User, {
    foreignKey: 'followingId',
    as: 'following',
    onDelete: 'CASCADE'
  });

  // Notification associations
  Notification.belongsTo(User, {
    foreignKey: 'recipientId',
    as: 'recipient',
    onDelete: 'CASCADE'
  });

  Notification.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender',
    onDelete: 'SET NULL'
  });
};

// Initialize associations
defineAssociations();

// Model hooks for maintaining counts
const setupHooks = () => {
  // Update follower/following counts when follow relationship changes
  Follow.addHook('afterCreate', async (follow) => {
    const [followerProfile, followingProfile] = await Promise.all([
      AgentProfile.findOne({ where: { userId: follow.followerId } }),
      AgentProfile.findOne({ where: { userId: follow.followingId } })
    ]);

    if (followerProfile) {
      await followerProfile.increment('followingCount');
    }
    if (followingProfile) {
      await followingProfile.increment('followerCount');
    }
  });

  Follow.addHook('afterDestroy', async (follow) => {
    const [followerProfile, followingProfile] = await Promise.all([
      AgentProfile.findOne({ where: { userId: follow.followerId } }),
      AgentProfile.findOne({ where: { userId: follow.followingId } })
    ]);

    if (followerProfile && followerProfile.followingCount > 0) {
      await followerProfile.decrement('followingCount');
    }
    if (followingProfile && followingProfile.followerCount > 0) {
      await followingProfile.decrement('followerCount');
    }
  });

  // Update like counts when likes change
  Like.addHook('afterCreate', async (like) => {
    if (like.postId) {
      const post = await Post.findByPk(like.postId);
      if (post) {
        await post.increment('likeCount');
      }
    } else if (like.commentId) {
      const comment = await Comment.findByPk(like.commentId);
      if (comment) {
        await comment.increment('likeCount');
      }
    }
  });

  Like.addHook('afterDestroy', async (like) => {
    if (like.postId) {
      const post = await Post.findByPk(like.postId);
      if (post && post.likeCount > 0) {
        await post.decrement('likeCount');
      }
    } else if (like.commentId) {
      const comment = await Comment.findByPk(like.commentId);
      if (comment && comment.likeCount > 0) {
        await comment.decrement('likeCount');
      }
    }
  });

  // Update comment counts when comments change
  Comment.addHook('afterCreate', async (comment) => {
    const post = await Post.findByPk(comment.postId);
    if (post) {
      await post.increment('commentCount');
    }

    if (comment.parentCommentId) {
      const parentComment = await Comment.findByPk(comment.parentCommentId);
      if (parentComment) {
        await parentComment.increment('replyCount');
      }
    }
  });

  Comment.addHook('afterDestroy', async (comment) => {
    const post = await Post.findByPk(comment.postId);
    if (post && post.commentCount > 0) {
      await post.decrement('commentCount');
    }

    if (comment.parentCommentId) {
      const parentComment = await Comment.findByPk(comment.parentCommentId);
      if (parentComment && parentComment.replyCount > 0) {
        await parentComment.decrement('replyCount');
      }
    }
  });

  // Update post counts when posts change
  Post.addHook('afterCreate', async (post) => {
    const agentProfile = await AgentProfile.findOne({ where: { userId: post.userId } });
    if (agentProfile) {
      await agentProfile.increment('postCount');
    }
  });

  Post.addHook('afterDestroy', async (post) => {
    const agentProfile = await AgentProfile.findOne({ where: { userId: post.userId } });
    if (agentProfile && agentProfile.postCount > 0) {
      await agentProfile.decrement('postCount');
    }
  });
};

// Initialize hooks
setupHooks();

// Export all models
module.exports = {
  sequelize,
  User,
  AgentProfile,
  Post,
  Comment,
  Like,
  Follow,
  Notification
};


const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { User, AgentProfile, Follow } = require('../models');
const { 
  authenticateToken 
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

// @route   GET /api/follows/:userId/followers
// @desc    Get followers of a user
// @access  Public
router.get('/:userId/followers', [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID'),
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

  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user || !user.isActive) {
    throw createNotFoundError('User');
  }

  const { count, rows: follows } = await Follow.findAndCountAll({
    where: {
      followingId: userId,
      status: 'active'
    },
    include: [{
      model: User,
      as: 'follower',
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      include: [{
        model: AgentProfile,
        as: 'agentProfile',
        attributes: ['profilePhotoUrl', 'bio', 'specialties']
      }]
    }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  const followers = follows.map(follow => follow.follower);

  res.json({
    success: true,
    data: {
      followers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalFollowers: count,
        hasNext: offset + followers.length < count,
        hasPrev: page > 1
      }
    }
  });
}));

// @route   GET /api/follows/:userId/following
// @desc    Get users that a user is following
// @access  Public
router.get('/:userId/following', [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID'),
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

  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user || !user.isActive) {
    throw createNotFoundError('User');
  }

  const { count, rows: follows } = await Follow.findAndCountAll({
    where: {
      followerId: userId,
      status: 'active'
    },
    include: [{
      model: User,
      as: 'following',
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      include: [{
        model: AgentProfile,
        as: 'agentProfile',
        attributes: ['profilePhotoUrl', 'bio', 'specialties']
      }]
    }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  const following = follows.map(follow => follow.following);

  res.json({
    success: true,
    data: {
      following,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalFollowing: count,
        hasNext: offset + following.length < count,
        hasPrev: page > 1
      }
    }
  });
}));

// @route   POST /api/follows/:userId
// @desc    Follow or unfollow a user
// @access  Private
router.post('/:userId', authenticateToken, [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { userId } = req.params;
  const followerId = req.user.id;

  // Check if trying to follow self
  if (followerId === userId) {
    throw new AppError('You cannot follow yourself', 400);
  }

  // Check if user to follow exists
  const userToFollow = await User.findByPk(userId);
  if (!userToFollow || !userToFollow.isActive) {
    throw createNotFoundError('User');
  }

  const { following, follow } = await Follow.toggleFollow(followerId, userId);

  // Update follower/following counts in agent profiles
  const [followerProfile, followingProfile] = await Promise.all([
    AgentProfile.findOne({ where: { userId: followerId } }),
    AgentProfile.findOne({ where: { userId } })
  ]);

  if (following) {
    if (followerProfile) {
      await followerProfile.incrementFollowingCount();
    }
    if (followingProfile) {
      await followingProfile.incrementFollowerCount();
    }
  } else {
    if (followerProfile && followerProfile.followingCount > 0) {
      await followerProfile.decrementFollowingCount();
    }
    if (followingProfile && followingProfile.followerCount > 0) {
      await followingProfile.decrementFollowerCount();
    }
  }

  // Emit real-time notification to the followed user
  if (following) {
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        type: 'follow',
        message: `${req.user.firstName} ${req.user.lastName} started following you`,
        senderId: req.user.id,
        senderName: `${req.user.firstName} ${req.user.lastName}`
      });
    }
  }

  res.json({
    success: true,
    message: following ? 'User followed successfully' : 'User unfollowed successfully',
    data: {
      following,
      followId: follow ? follow.id : null
    }
  });
}));

// @route   GET /api/follows/check/:userId
// @desc    Check if current user is following a specific user
// @access  Private
router.get('/check/:userId', authenticateToken, [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { userId } = req.params;
  const followerId = req.user.id;

  const isFollowing = await Follow.isFollowing(followerId, userId);

  res.json({
    success: true,
    data: {
      isFollowing
    }
  });
}));

// @route   GET /api/follows/mutual/:userId
// @desc    Get mutual follows between current user and another user
// @access  Private
router.get('/mutual/:userId', authenticateToken, [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { userId } = req.params;
  const { limit = 10 } = req.query;
  const currentUserId = req.user.id;

  if (currentUserId === userId) {
    throw new AppError('Cannot get mutual follows with yourself', 400);
  }

  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user || !user.isActive) {
    throw createNotFoundError('User');
  }

  const mutualFollows = await Follow.getMutualFollows(currentUserId, userId);

  res.json({
    success: true,
    data: {
      mutualFollows: mutualFollows.slice(0, parseInt(limit)),
      totalMutual: mutualFollows.length
    }
  });
}));

// @route   GET /api/follows/suggestions
// @desc    Get follow suggestions for current user
// @access  Private
router.get('/suggestions', authenticateToken, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { limit = 10 } = req.query;
  const currentUserId = req.user.id;
  const { Op } = require('sequelize');

  // Get users that current user is not following
  const currentFollowing = await Follow.findAll({
    where: {
      followerId: currentUserId,
      status: 'active'
    },
    attributes: ['followingId']
  });

  const followingIds = currentFollowing.map(follow => follow.followingId);
  followingIds.push(currentUserId); // Exclude self

  // Find suggested users (agents with high follower counts that user is not following)
  const suggestions = await User.findAll({
    where: {
      id: {
        [Op.notIn]: followingIds
      },
      isActive: true,
      role: 'agent'
    },
    include: [{
      model: AgentProfile,
      as: 'agentProfile',
      where: {
        visibility: 'public'
      },
      attributes: ['profilePhotoUrl', 'bio', 'specialties', 'followerCount']
    }],
    attributes: ['id', 'firstName', 'lastName', 'email'],
    order: [
      [{ model: AgentProfile, as: 'agentProfile' }, 'followerCount', 'DESC'],
      [{ model: AgentProfile, as: 'agentProfile' }, 'isFeatured', 'DESC']
    ],
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: {
      suggestions
    }
  });
}));

// @route   GET /api/follows/stats/:userId
// @desc    Get follow statistics for a user
// @access  Public
router.get('/stats/:userId', [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { userId } = req.params;

  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user || !user.isActive) {
    throw createNotFoundError('User');
  }

  const { followerCount, followingCount } = await Follow.getFollowCounts(userId);

  // Get recent followers (last 7 days)
  const recentFollowers = await Follow.count({
    where: {
      followingId: userId,
      status: 'active',
      createdAt: {
        [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });

  res.json({
    success: true,
    data: {
      stats: {
        followerCount,
        followingCount,
        recentFollowers
      }
    }
  });
}));

// @route   DELETE /api/follows/:followId
// @desc    Remove a follower (block)
// @access  Private
router.delete('/:followId', authenticateToken, [
  param('followId')
    .isUUID()
    .withMessage('Invalid follow ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { followId } = req.params;

  const follow = await Follow.findByPk(followId);
  if (!follow) {
    throw createNotFoundError('Follow relationship');
  }

  // Only the user being followed can remove followers
  if (follow.followingId !== req.user.id) {
    throw createForbiddenError('You can only remove your own followers');
  }

  await follow.destroy();

  // Update counts
  const [followerProfile, followingProfile] = await Promise.all([
    AgentProfile.findOne({ where: { userId: follow.followerId } }),
    AgentProfile.findOne({ where: { userId: follow.followingId } })
  ]);

  if (followerProfile && followerProfile.followingCount > 0) {
    await followerProfile.decrementFollowingCount();
  }
  if (followingProfile && followingProfile.followerCount > 0) {
    await followingProfile.decrementFollowerCount();
  }

  res.json({
    success: true,
    message: 'Follower removed successfully'
  });
}));

module.exports = router;


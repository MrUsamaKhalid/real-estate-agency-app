const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { User, AgentProfile, Post, Comment, Like } = require('../models');
const { 
  authenticateToken, 
  requireAgent,
  requireAdmin,
  optionalAuth 
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

// @route   GET /api/posts
// @desc    Get posts feed with filtering and pagination
// @access  Public
router.get('/', optionalAuth, [
  query('type')
    .optional()
    .isIn(['regular', 'story', 'highlight', 'announcement'])
    .withMessage('Invalid post type'),
  query('userId')
    .optional()
    .isUUID()
    .withMessage('Invalid user ID'),
  query('tag')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Tag cannot be empty'),
  query('location')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Location must be at least 2 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'trending'])
    .withMessage('Invalid sort option')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { 
    type, 
    userId, 
    tag, 
    location, 
    page = 1, 
    limit = 20, 
    sortBy = 'newest' 
  } = req.query;
  
  const offset = (page - 1) * limit;
  const { Op } = require('sequelize');

  // Build where clause
  const whereClause = {
    isPublished: true,
    isApproved: true
  };

  if (type) {
    whereClause.postType = type;
  }

  if (userId) {
    whereClause.userId = userId;
  }

  if (tag) {
    whereClause.tags = {
      [Op.contains]: [tag]
    };
  }

  if (location) {
    whereClause.location = {
      [Op.iLike]: `%${location}%`
    };
  }

  // Handle story expiration
  if (type === 'story') {
    whereClause.expiresAt = {
      [Op.gt]: new Date()
    };
  }

  // Build order clause
  let orderClause;
  switch (sortBy) {
    case 'newest':
      orderClause = [['createdAt', 'DESC']];
      break;
    case 'oldest':
      orderClause = [['createdAt', 'ASC']];
      break;
    case 'popular':
      orderClause = [
        [require('sequelize').literal('(like_count + comment_count + share_count)'), 'DESC'],
        ['createdAt', 'DESC']
      ];
      break;
    case 'trending':
      // Trending: posts from last 7 days sorted by engagement
      whereClause.createdAt = {
        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      };
      orderClause = [
        [require('sequelize').literal('(like_count + comment_count + share_count)'), 'DESC'],
        ['createdAt', 'DESC']
      ];
      break;
    default:
      orderClause = [['createdAt', 'DESC']];
  }

  const { count, rows: posts } = await Post.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName'],
        include: [{
          model: AgentProfile,
          as: 'agentProfile',
          attributes: ['profilePhotoUrl', 'bio']
        }]
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: orderClause,
    distinct: true
  });

  // If user is authenticated, check if they liked each post
  if (req.user) {
    const postIds = posts.map(post => post.id);
    const userLikes = await Like.findAll({
      where: {
        userId: req.user.id,
        postId: postIds
      },
      attributes: ['postId']
    });
    
    const likedPostIds = new Set(userLikes.map(like => like.postId));
    
    posts.forEach(post => {
      post.dataValues.isLikedByUser = likedPostIds.has(post.id);
    });
  }

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalPosts: count,
        hasNext: offset + posts.length < count,
        hasPrev: page > 1
      }
    }
  });
}));

// @route   GET /api/posts/trending
// @desc    Get trending posts
// @access  Public
router.get('/trending', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { limit = 10 } = req.query;

  const posts = await Post.getTrending(parseInt(limit));

  res.json({
    success: true,
    data: {
      posts
    }
  });
}));

// @route   GET /api/posts/pending
// @desc    Get posts pending approval (admin only)
// @access  Private (Admin)
router.get('/pending', authenticateToken, requireAdmin, [
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

  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: posts } = await Post.findAndCountAll({
    where: {
      isPublished: true,
      isApproved: false
    },
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalPosts: count,
        hasNext: offset + posts.length < count,
        hasPrev: page > 1
      }
    }
  });
}));

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public
router.get('/:id', optionalAuth, [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const post = await Post.findByPk(id, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName'],
        include: [{
          model: AgentProfile,
          as: 'agentProfile',
          attributes: ['profilePhotoUrl', 'bio']
        }]
      },
      {
        model: Comment,
        as: 'comments',
        where: { parentCommentId: null },
        required: false,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Comment,
            as: 'replies',
            include: [{
              model: User,
              as: 'author',
              attributes: ['id', 'firstName', 'lastName']
            }]
          }
        ],
        order: [['createdAt', 'ASC']]
      }
    ]
  });

  if (!post || !post.isPublished || !post.isApproved) {
    throw createNotFoundError('Post');
  }

  // Check if story has expired
  if (post.postType === 'story' && post.expiresAt && post.expiresAt < new Date()) {
    throw createNotFoundError('Post');
  }

  // Increment view count
  await post.incrementViewCount();

  // Check if user liked the post
  if (req.user) {
    const userLike = await Like.findOne({
      where: {
        userId: req.user.id,
        postId: post.id
      }
    });
    post.dataValues.isLikedByUser = !!userLike;
  }

  res.json({
    success: true,
    data: {
      post
    }
  });
}));

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private (Agent)
router.post('/', authenticateToken, requireAgent, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
  body('mediaUrls')
    .optional()
    .isArray()
    .withMessage('Media URLs must be an array'),
  body('mediaType')
    .optional()
    .isIn(['image', 'video', 'mixed'])
    .withMessage('Invalid media type'),
  body('postType')
    .optional()
    .isIn(['regular', 'story', 'highlight', 'announcement'])
    .withMessage('Invalid post type'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date'),
  body('externalShareSettings')
    .optional()
    .isObject()
    .withMessage('External share settings must be an object')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const {
    content,
    mediaUrls = [],
    mediaType = 'image',
    postType = 'regular',
    tags = [],
    location,
    scheduledAt,
    externalShareSettings = {}
  } = req.body;

  // Set expiration for stories (24 hours)
  let expiresAt = null;
  if (postType === 'story') {
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  // Check if scheduled post is in the future
  if (scheduledAt && new Date(scheduledAt) <= new Date()) {
    throw new AppError('Scheduled date must be in the future', 400);
  }

  // Auto-approve for admins, require approval for others
  const isApproved = req.user.role === 'admin';

  const post = await Post.create({
    userId: req.user.id,
    content,
    mediaUrls,
    mediaType,
    postType,
    tags,
    location,
    scheduledAt,
    expiresAt,
    externalShareSettings,
    isApproved
  });

  // Fetch the created post with author info
  const createdPost = await Post.findByPk(post.id, {
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'firstName', 'lastName'],
      include: [{
        model: AgentProfile,
        as: 'agentProfile',
        attributes: ['profilePhotoUrl']
      }]
    }]
  });

  // Emit real-time update if approved
  if (isApproved) {
    const io = req.app.get('io');
    if (io) {
      io.emit('post_update', {
        type: 'new_post',
        post: createdPost
      });
    }
  }

  res.status(201).json({
    success: true,
    message: isApproved ? 'Post created successfully' : 'Post created and pending approval',
    data: {
      post: createdPost
    }
  });
}));

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private (Author or Admin)
router.put('/:id', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
  body('mediaUrls')
    .optional()
    .isArray()
    .withMessage('Media URLs must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;
  const { content, mediaUrls, tags, location } = req.body;

  const post = await Post.findByPk(id);
  if (!post) {
    throw createNotFoundError('Post');
  }

  // Check permissions
  const isAuthor = req.user.id === post.userId;
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isAdmin) {
    throw createForbiddenError('You can only edit your own posts');
  }

  // Build update data
  const updateData = {};
  if (content !== undefined) updateData.content = content;
  if (mediaUrls !== undefined) updateData.mediaUrls = mediaUrls;
  if (tags !== undefined) updateData.tags = tags;
  if (location !== undefined) updateData.location = location;

  // If content changed and user is not admin, require re-approval
  if (content !== undefined && !isAdmin) {
    updateData.isApproved = false;
  }

  await post.update(updateData);

  // Fetch updated post
  const updatedPost = await Post.findByPk(id, {
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'firstName', 'lastName'],
      include: [{
        model: AgentProfile,
        as: 'agentProfile',
        attributes: ['profilePhotoUrl']
      }]
    }]
  });

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: {
      post: updatedPost
    }
  });
}));

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (Author or Admin)
router.delete('/:id', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const post = await Post.findByPk(id);
  if (!post) {
    throw createNotFoundError('Post');
  }

  // Check permissions
  const isAuthor = req.user.id === post.userId;
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isAdmin) {
    throw createForbiddenError('You can only delete your own posts');
  }

  await post.destroy();

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
}));

// @route   POST /api/posts/:id/approve
// @desc    Approve a post (admin only)
// @access  Private (Admin)
router.post('/:id/approve', authenticateToken, requireAdmin, [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const post = await Post.findByPk(id);
  if (!post) {
    throw createNotFoundError('Post');
  }

  await post.approve(req.user.id);

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('post_update', {
      type: 'post_approved',
      postId: post.id
    });
  }

  res.json({
    success: true,
    message: 'Post approved successfully'
  });
}));

// @route   POST /api/posts/:id/reject
// @desc    Reject a post (admin only)
// @access  Private (Admin)
router.post('/:id/reject', authenticateToken, requireAdmin, [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const post = await Post.findByPk(id);
  if (!post) {
    throw createNotFoundError('Post');
  }

  await post.reject();

  res.json({
    success: true,
    message: 'Post rejected successfully'
  });
}));

// @route   POST /api/posts/:id/like
// @desc    Toggle like on a post
// @access  Private
router.post('/:id/like', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const post = await Post.findByPk(id);
  if (!post || !post.isPublished || !post.isApproved) {
    throw createNotFoundError('Post');
  }

  const { liked } = await Like.togglePostLike(req.user.id, id);

  // Update post like count
  if (liked) {
    await post.incrementLikeCount();
  } else {
    await post.decrementLikeCount();
  }

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('post_update', {
      type: 'like_toggle',
      postId: id,
      liked,
      userId: req.user.id
    });
  }

  res.json({
    success: true,
    message: liked ? 'Post liked' : 'Post unliked',
    data: {
      liked
    }
  });
}));

// @route   POST /api/posts/:id/share
// @desc    Share a post (increment share count)
// @access  Private
router.post('/:id/share', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const post = await Post.findByPk(id);
  if (!post || !post.isPublished || !post.isApproved) {
    throw createNotFoundError('Post');
  }

  await post.incrementShareCount();

  res.json({
    success: true,
    message: 'Post shared successfully'
  });
}));

module.exports = router;


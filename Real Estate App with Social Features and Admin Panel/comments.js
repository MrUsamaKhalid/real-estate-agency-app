const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { User, AgentProfile, Post, Comment, Like } = require('../models');
const { 
  authenticateToken, 
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

// @route   GET /api/comments/post/:postId
// @desc    Get comments for a specific post
// @access  Public
router.get('/post/:postId', optionalAuth, [
  param('postId')
    .isUUID()
    .withMessage('Invalid post ID'),
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
    .isIn(['newest', 'oldest', 'popular'])
    .withMessage('Invalid sort option')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { postId } = req.params;
  const { page = 1, limit = 20, sortBy = 'newest' } = req.query;
  const offset = (page - 1) * limit;

  // Check if post exists and is accessible
  const post = await Post.findByPk(postId);
  if (!post || !post.isPublished || !post.isApproved) {
    throw createNotFoundError('Post');
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
      orderClause = [['likeCount', 'DESC'], ['createdAt', 'DESC']];
      break;
    default:
      orderClause = [['createdAt', 'DESC']];
  }

  const { count, rows: comments } = await Comment.findAndCountAll({
    where: {
      postId,
      parentCommentId: null, // Top-level comments only
      isApproved: true
    },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName'],
        include: [{
          model: AgentProfile,
          as: 'agentProfile',
          attributes: ['profilePhotoUrl']
        }]
      },
      {
        model: Comment,
        as: 'replies',
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName'],
          include: [{
            model: AgentProfile,
            as: 'agentProfile',
            attributes: ['profilePhotoUrl']
          }]
        }],
        order: [['createdAt', 'ASC']],
        limit: 3 // Limit initial replies shown
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: orderClause,
    distinct: true
  });

  // If user is authenticated, check if they liked each comment
  if (req.user) {
    const commentIds = comments.flatMap(comment => [
      comment.id,
      ...comment.replies.map(reply => reply.id)
    ]);
    
    const userLikes = await Like.findAll({
      where: {
        userId: req.user.id,
        commentId: commentIds
      },
      attributes: ['commentId']
    });
    
    const likedCommentIds = new Set(userLikes.map(like => like.commentId));
    
    comments.forEach(comment => {
      comment.dataValues.isLikedByUser = likedCommentIds.has(comment.id);
      comment.replies.forEach(reply => {
        reply.dataValues.isLikedByUser = likedCommentIds.has(reply.id);
      });
    });
  }

  res.json({
    success: true,
    data: {
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalComments: count,
        hasNext: offset + comments.length < count,
        hasPrev: page > 1
      }
    }
  });
}));

// @route   GET /api/comments/:id/replies
// @desc    Get replies for a specific comment
// @access  Public
router.get('/:id/replies', optionalAuth, [
  param('id')
    .isUUID()
    .withMessage('Invalid comment ID'),
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

  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // Check if parent comment exists
  const parentComment = await Comment.findByPk(id);
  if (!parentComment || !parentComment.isApproved) {
    throw createNotFoundError('Comment');
  }

  const { count, rows: replies } = await Comment.findAndCountAll({
    where: {
      parentCommentId: id,
      isApproved: true
    },
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'firstName', 'lastName'],
      include: [{
        model: AgentProfile,
        as: 'agentProfile',
        attributes: ['profilePhotoUrl']
      }]
    }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'ASC']]
  });

  // If user is authenticated, check if they liked each reply
  if (req.user) {
    const replyIds = replies.map(reply => reply.id);
    const userLikes = await Like.findAll({
      where: {
        userId: req.user.id,
        commentId: replyIds
      },
      attributes: ['commentId']
    });
    
    const likedReplyIds = new Set(userLikes.map(like => like.commentId));
    
    replies.forEach(reply => {
      reply.dataValues.isLikedByUser = likedReplyIds.has(reply.id);
    });
  }

  res.json({
    success: true,
    data: {
      replies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalReplies: count,
        hasNext: offset + replies.length < count,
        hasPrev: page > 1
      }
    }
  });
}));

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', authenticateToken, [
  body('postId')
    .isUUID()
    .withMessage('Valid post ID is required'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content must be between 1 and 1000 characters'),
  body('parentCommentId')
    .optional()
    .isUUID()
    .withMessage('Invalid parent comment ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { postId, content, parentCommentId } = req.body;

  // Check if post exists and is accessible
  const post = await Post.findByPk(postId);
  if (!post || !post.isPublished || !post.isApproved) {
    throw createNotFoundError('Post');
  }

  // If replying to a comment, check if parent comment exists
  if (parentCommentId) {
    const parentComment = await Comment.findByPk(parentCommentId);
    if (!parentComment || parentComment.postId !== postId) {
      throw createNotFoundError('Parent comment');
    }
  }

  // Create comment
  const comment = await Comment.create({
    postId,
    userId: req.user.id,
    parentCommentId,
    content
  });

  // Fetch the created comment with author info
  const createdComment = await Comment.findByPk(comment.id, {
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

  // Update post comment count
  await post.incrementCommentCount();

  // Update parent comment reply count if this is a reply
  if (parentCommentId) {
    const parentComment = await Comment.findByPk(parentCommentId);
    if (parentComment) {
      await parentComment.incrementReplyCount();
    }
  }

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('comment_update', {
      type: 'new_comment',
      comment: createdComment,
      postId
    });
  }

  res.status(201).json({
    success: true,
    message: 'Comment created successfully',
    data: {
      comment: createdComment
    }
  });
}));

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private (Author only)
router.put('/:id', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid comment ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content must be between 1 and 1000 characters')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;
  const { content } = req.body;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    throw createNotFoundError('Comment');
  }

  // Check if user is the author
  if (comment.userId !== req.user.id) {
    throw createForbiddenError('You can only edit your own comments');
  }

  await comment.update({ content });

  // Fetch updated comment
  const updatedComment = await Comment.findByPk(id, {
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
    message: 'Comment updated successfully',
    data: {
      comment: updatedComment
    }
  });
}));

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private (Author or Admin)
router.delete('/:id', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid comment ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    throw createNotFoundError('Comment');
  }

  // Check permissions
  const isAuthor = comment.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isAdmin) {
    throw createForbiddenError('You can only delete your own comments');
  }

  // Get post and parent comment for count updates
  const post = await Post.findByPk(comment.postId);
  const parentComment = comment.parentCommentId 
    ? await Comment.findByPk(comment.parentCommentId)
    : null;

  await comment.destroy();

  // Update counts
  if (post && post.commentCount > 0) {
    await post.decrementCommentCount();
  }

  if (parentComment && parentComment.replyCount > 0) {
    await parentComment.decrementReplyCount();
  }

  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
}));

// @route   POST /api/comments/:id/like
// @desc    Toggle like on a comment
// @access  Private
router.post('/:id/like', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid comment ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const comment = await Comment.findByPk(id);
  if (!comment || !comment.isApproved) {
    throw createNotFoundError('Comment');
  }

  const { liked } = await Like.toggleCommentLike(req.user.id, id);

  // Update comment like count
  if (liked) {
    await comment.incrementLikeCount();
  } else {
    await comment.decrementLikeCount();
  }

  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('comment_update', {
      type: 'like_toggle',
      commentId: id,
      liked,
      userId: req.user.id
    });
  }

  res.json({
    success: true,
    message: liked ? 'Comment liked' : 'Comment unliked',
    data: {
      liked
    }
  });
}));

// @route   GET /api/comments/user/:userId
// @desc    Get comments by a specific user
// @access  Public
router.get('/user/:userId', [
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

  const { count, rows: comments } = await Comment.findAndCountAll({
    where: {
      userId,
      isApproved: true
    },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: Post,
        as: 'post',
        attributes: ['id', 'content'],
        where: {
          isPublished: true,
          isApproved: true
        }
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalComments: count,
        hasNext: offset + comments.length < count,
        hasPrev: page > 1
      }
    }
  });
}));

module.exports = router;


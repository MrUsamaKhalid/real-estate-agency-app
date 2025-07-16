const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { User, AgentProfile, Post, Follow } = require('../models');
const { 
  authenticateToken, 
  requireAdmin, 
  requireAgent,
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

// @route   GET /api/users
// @desc    Get all users (admin only) or search users
// @access  Private (Admin) / Public (search)
router.get('/', optionalAuth, [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  query('role')
    .optional()
    .isIn(['agent', 'admin', 'newcomer', 'faculty', 'management'])
    .withMessage('Invalid role'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { search, role, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // If no search term and user is not admin, require authentication
  if (!search && (!req.user || req.user.role !== 'admin')) {
    throw createForbiddenError('Access denied');
  }

  const whereClause = {
    isActive: true
  };

  // Add role filter
  if (role) {
    whereClause.role = role;
  }

  // Add search filter
  if (search) {
    const { Op } = require('sequelize');
    whereClause[Op.or] = [
      {
        firstName: {
          [Op.iLike]: `%${search}%`
        }
      },
      {
        lastName: {
          [Op.iLike]: `%${search}%`
        }
      },
      {
        email: {
          [Op.iLike]: `%${search}%`
        }
      }
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    include: [{
      model: AgentProfile,
      as: 'agentProfile',
      attributes: ['profilePhotoUrl', 'bio', 'specialties', 'areasOfOperation']
    }],
    attributes: { exclude: ['passwordHash', 'emailVerificationToken', 'passwordResetToken'] },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['firstName', 'ASC'], ['lastName', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count,
        hasNext: offset + users.length < count,
        hasPrev: page > 1
      }
    }
  });
}));

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const user = await User.findByPk(id, {
    include: [{
      model: AgentProfile,
      as: 'agentProfile'
    }],
    attributes: { exclude: ['passwordHash', 'emailVerificationToken', 'passwordResetToken'] }
  });

  if (!user || !user.isActive) {
    throw createNotFoundError('User');
  }

  res.json({
    success: true,
    data: {
      user
    }
  });
}));

// @route   PUT /api/users/:id
// @desc    Update user (admin only or own profile)
// @access  Private
router.put('/:id', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['agent', 'admin', 'newcomer', 'faculty', 'management'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;
  const { firstName, lastName, phone, role, isActive } = req.body;

  // Check if user exists
  const user = await User.findByPk(id);
  if (!user) {
    throw createNotFoundError('User');
  }

  // Check permissions
  const isOwnProfile = req.user.id === id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwnProfile && !isAdmin) {
    throw createForbiddenError('You can only update your own profile');
  }

  // Only admins can change role and isActive
  if ((role !== undefined || isActive !== undefined) && !isAdmin) {
    throw createForbiddenError('Only admins can change role or account status');
  }

  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (role !== undefined && isAdmin) updateData.role = role;
  if (isActive !== undefined && isAdmin) updateData.isActive = isActive;

  await user.update(updateData);

  // If role changed to agent, create agent profile
  if (role === 'agent' && !await AgentProfile.findOne({ where: { userId: id } })) {
    await AgentProfile.create({ userId: id });
  }

  // Fetch updated user with profile
  const updatedUser = await User.findByPk(id, {
    include: [{
      model: AgentProfile,
      as: 'agentProfile'
    }],
    attributes: { exclude: ['passwordHash', 'emailVerificationToken', 'passwordResetToken'] }
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: updatedUser
    }
  });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (req.user.id === id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const user = await User.findByPk(id);
  if (!user) {
    throw createNotFoundError('User');
  }

  // Soft delete
  await user.update({ 
    isActive: false,
    deletedAt: new Date()
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Public
router.get('/:id/stats', [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  // Check if user exists and is active
  const user = await User.findByPk(id, {
    where: { isActive: true }
  });

  if (!user) {
    throw createNotFoundError('User');
  }

  // Get statistics
  const [postCount, followerCount, followingCount] = await Promise.all([
    Post.count({
      where: {
        userId: id,
        isPublished: true,
        isApproved: true
      }
    }),
    Follow.count({
      where: {
        followingId: id,
        status: 'active'
      }
    }),
    Follow.count({
      where: {
        followerId: id,
        status: 'active'
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        postCount,
        followerCount,
        followingCount
      }
    }
  });
}));

// @route   GET /api/users/:id/posts
// @desc    Get user's posts
// @access  Public
router.get('/:id/posts', [
  param('id')
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

  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  // Check if user exists
  const user = await User.findByPk(id, {
    where: { isActive: true }
  });

  if (!user) {
    throw createNotFoundError('User');
  }

  const { count, rows: posts } = await Post.findAndCountAll({
    where: {
      userId: id,
      isPublished: true,
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
    order: [['createdAt', 'DESC']]
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

// @route   POST /api/users/bulk-create
// @desc    Create multiple users (admin only)
// @access  Private (Admin)
router.post('/bulk-create', authenticateToken, requireAdmin, [
  body('users')
    .isArray({ min: 1 })
    .withMessage('Users array is required'),
  body('users.*.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('users.*.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('users.*.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('users.*.role')
    .isIn(['agent', 'newcomer', 'faculty', 'management'])
    .withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { users } = req.body;

  // Check for duplicate emails in the request
  const emails = users.map(user => user.email);
  const uniqueEmails = [...new Set(emails)];
  if (emails.length !== uniqueEmails.length) {
    throw new AppError('Duplicate emails found in request', 400);
  }

  // Check for existing users
  const existingUsers = await User.findAll({
    where: {
      email: emails
    },
    attributes: ['email']
  });

  if (existingUsers.length > 0) {
    const existingEmails = existingUsers.map(user => user.email);
    throw new AppError(`Users already exist with emails: ${existingEmails.join(', ')}`, 409);
  }

  // Create users with default password
  const defaultPassword = 'TempPassword123!';
  const usersToCreate = users.map(user => ({
    ...user,
    passwordHash: defaultPassword,
    emailVerificationToken: require('crypto').randomBytes(32).toString('hex')
  }));

  const createdUsers = await User.bulkCreate(usersToCreate);

  // Create agent profiles for agents
  const agentProfiles = [];
  for (const user of createdUsers) {
    if (user.role === 'agent') {
      agentProfiles.push({ userId: user.id });
    }
  }

  if (agentProfiles.length > 0) {
    await AgentProfile.bulkCreate(agentProfiles);
  }

  res.status(201).json({
    success: true,
    message: `${createdUsers.length} users created successfully`,
    data: {
      users: createdUsers.map(user => user.toJSON())
    }
  });
}));

module.exports = router;


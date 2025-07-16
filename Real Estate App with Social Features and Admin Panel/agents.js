const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { User, AgentProfile, Post, Follow } = require('../models');
const { 
  authenticateToken, 
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

// @route   GET /api/agents
// @desc    Get all agent profiles with filtering
// @access  Public
router.get('/', [
  query('specialty')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Specialty must be at least 2 characters'),
  query('area')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Area must be at least 2 characters'),
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
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
    .isIn(['followers', 'posts', 'sales', 'experience', 'newest'])
    .withMessage('Invalid sort option')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { 
    specialty, 
    area, 
    featured, 
    search, 
    page = 1, 
    limit = 20, 
    sortBy = 'followers' 
  } = req.query;
  
  const offset = (page - 1) * limit;
  const { Op } = require('sequelize');

  // Build where clause
  const whereClause = {
    visibility: 'public'
  };

  if (featured !== undefined) {
    whereClause.isFeatured = featured === 'true';
  }

  if (specialty) {
    whereClause.specialties = {
      [Op.contains]: [specialty]
    };
  }

  if (area) {
    whereClause.areasOfOperation = {
      [Op.contains]: [area]
    };
  }

  // User search clause
  const userWhereClause = {
    isActive: true,
    role: 'agent'
  };

  if (search) {
    userWhereClause[Op.or] = [
      {
        firstName: {
          [Op.iLike]: `%${search}%`
        }
      },
      {
        lastName: {
          [Op.iLike]: `%${search}%`
        }
      }
    ];
  }

  // Build order clause
  let orderClause;
  switch (sortBy) {
    case 'followers':
      orderClause = [['followerCount', 'DESC']];
      break;
    case 'posts':
      orderClause = [['postCount', 'DESC']];
      break;
    case 'sales':
      orderClause = [['totalSales', 'DESC']];
      break;
    case 'experience':
      orderClause = [['yearsExperience', 'DESC']];
      break;
    case 'newest':
      orderClause = [['createdAt', 'DESC']];
      break;
    default:
      orderClause = [['followerCount', 'DESC']];
  }

  const { count, rows: agents } = await AgentProfile.findAndCountAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'user',
      where: userWhereClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt']
    }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: orderClause,
    distinct: true
  });

  res.json({
    success: true,
    data: {
      agents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalAgents: count,
        hasNext: offset + agents.length < count,
        hasPrev: page > 1
      }
    }
  });
}));

// @route   GET /api/agents/featured
// @desc    Get featured agents
// @access  Public
router.get('/featured', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { limit = 10 } = req.query;

  const agents = await AgentProfile.findAll({
    where: {
      isFeatured: true,
      visibility: 'public'
    },
    include: [{
      model: User,
      as: 'user',
      where: { isActive: true, role: 'agent' },
      attributes: ['id', 'firstName', 'lastName', 'email']
    }],
    limit: parseInt(limit),
    order: [['followerCount', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      agents
    }
  });
}));

// @route   GET /api/agents/top
// @desc    Get top performing agents
// @access  Public
router.get('/top', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  query('metric')
    .optional()
    .isIn(['sales', 'followers', 'posts'])
    .withMessage('Invalid metric')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { limit = 10, metric = 'sales' } = req.query;

  let orderField;
  switch (metric) {
    case 'sales':
      orderField = 'totalSales';
      break;
    case 'followers':
      orderField = 'followerCount';
      break;
    case 'posts':
      orderField = 'postCount';
      break;
    default:
      orderField = 'totalSales';
  }

  const agents = await AgentProfile.findAll({
    where: {
      visibility: 'public'
    },
    include: [{
      model: User,
      as: 'user',
      where: { isActive: true, role: 'agent' },
      attributes: ['id', 'firstName', 'lastName', 'email']
    }],
    limit: parseInt(limit),
    order: [[orderField, 'DESC']]
  });

  res.json({
    success: true,
    data: {
      agents,
      metric
    }
  });
}));

// @route   GET /api/agents/:id
// @desc    Get agent profile by ID
// @access  Public
router.get('/:id', [
  param('id')
    .isUUID()
    .withMessage('Invalid agent ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const agent = await AgentProfile.findByPk(id, {
    include: [{
      model: User,
      as: 'user',
      where: { isActive: true, role: 'agent' },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt']
    }]
  });

  if (!agent || agent.visibility === 'private') {
    throw createNotFoundError('Agent profile');
  }

  res.json({
    success: true,
    data: {
      agent
    }
  });
}));

// @route   PUT /api/agents/:id
// @desc    Update agent profile
// @access  Private (Agent or Admin)
router.put('/:id', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid agent ID'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters'),
  body('specialties')
    .optional()
    .isArray()
    .withMessage('Specialties must be an array'),
  body('areasOfOperation')
    .optional()
    .isArray()
    .withMessage('Areas of operation must be an array'),
  body('preferredDevelopers')
    .optional()
    .isArray()
    .withMessage('Preferred developers must be an array'),
  body('yearsExperience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('License number must not exceed 100 characters'),
  body('socialMediaLinks')
    .optional()
    .isObject()
    .withMessage('Social media links must be an object'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'company_only'])
    .withMessage('Invalid visibility option')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;
  const {
    bio,
    specialties,
    areasOfOperation,
    preferredDevelopers,
    yearsExperience,
    licenseNumber,
    socialMediaLinks,
    visibility
  } = req.body;

  // Find agent profile
  const agent = await AgentProfile.findByPk(id, {
    include: [{
      model: User,
      as: 'user'
    }]
  });

  if (!agent) {
    throw createNotFoundError('Agent profile');
  }

  // Check permissions
  const isOwnProfile = req.user.id === agent.userId;
  const isAdmin = req.user.role === 'admin';

  if (!isOwnProfile && !isAdmin) {
    throw createForbiddenError('You can only update your own profile');
  }

  // Build update data
  const updateData = {};
  if (bio !== undefined) updateData.bio = bio;
  if (specialties !== undefined) updateData.specialties = specialties;
  if (areasOfOperation !== undefined) updateData.areasOfOperation = areasOfOperation;
  if (preferredDevelopers !== undefined) updateData.preferredDevelopers = preferredDevelopers;
  if (yearsExperience !== undefined) updateData.yearsExperience = yearsExperience;
  if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
  if (socialMediaLinks !== undefined) updateData.socialMediaLinks = socialMediaLinks;
  if (visibility !== undefined) updateData.visibility = visibility;

  await agent.update(updateData);

  // Fetch updated profile
  const updatedAgent = await AgentProfile.findByPk(id, {
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
    }]
  });

  res.json({
    success: true,
    message: 'Agent profile updated successfully',
    data: {
      agent: updatedAgent
    }
  });
}));

// @route   POST /api/agents/:id/feature
// @desc    Toggle featured status (admin only)
// @access  Private (Admin)
router.post('/:id/feature', authenticateToken, [
  param('id')
    .isUUID()
    .withMessage('Invalid agent ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  if (req.user.role !== 'admin') {
    throw createForbiddenError('Only admins can feature agents');
  }

  const { id } = req.params;

  const agent = await AgentProfile.findByPk(id);
  if (!agent) {
    throw createNotFoundError('Agent profile');
  }

  await agent.update({
    isFeatured: !agent.isFeatured
  });

  res.json({
    success: true,
    message: `Agent ${agent.isFeatured ? 'featured' : 'unfeatured'} successfully`,
    data: {
      isFeatured: agent.isFeatured
    }
  });
}));

// @route   GET /api/agents/:id/stats
// @desc    Get detailed agent statistics
// @access  Public
router.get('/:id/stats', [
  param('id')
    .isUUID()
    .withMessage('Invalid agent ID')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);

  const { id } = req.params;

  const agent = await AgentProfile.findByPk(id, {
    include: [{
      model: User,
      as: 'user',
      where: { isActive: true, role: 'agent' }
    }]
  });

  if (!agent || agent.visibility === 'private') {
    throw createNotFoundError('Agent profile');
  }

  // Get additional statistics
  const [recentPosts, totalLikes, totalComments] = await Promise.all([
    Post.findAll({
      where: {
        userId: agent.userId,
        isPublished: true,
        isApproved: true,
        createdAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      attributes: ['id', 'likeCount', 'commentCount', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10
    }),
    Post.sum('likeCount', {
      where: {
        userId: agent.userId,
        isPublished: true,
        isApproved: true
      }
    }),
    Post.sum('commentCount', {
      where: {
        userId: agent.userId,
        isPublished: true,
        isApproved: true
      }
    })
  ]);

  const stats = {
    followerCount: agent.followerCount,
    followingCount: agent.followingCount,
    postCount: agent.postCount,
    totalSales: agent.totalSales,
    totalListings: agent.totalListings,
    totalLikes: totalLikes || 0,
    totalComments: totalComments || 0,
    recentPostsCount: recentPosts.length,
    avgLikesPerPost: agent.postCount > 0 ? Math.round((totalLikes || 0) / agent.postCount) : 0,
    avgCommentsPerPost: agent.postCount > 0 ? Math.round((totalComments || 0) / agent.postCount) : 0
  };

  res.json({
    success: true,
    data: {
      stats,
      recentPosts
    }
  });
}));

// @route   GET /api/agents/specialties/list
// @desc    Get list of all specialties
// @access  Public
router.get('/specialties/list', asyncHandler(async (req, res) => {
  const { QueryTypes } = require('sequelize');
  const { sequelize } = require('../config/database');

  // Get all unique specialties from agent profiles
  const specialties = await sequelize.query(`
    SELECT DISTINCT jsonb_array_elements_text(specialties) as specialty
    FROM agent_profiles 
    WHERE specialties IS NOT NULL 
    AND jsonb_array_length(specialties) > 0
    ORDER BY specialty
  `, {
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: {
      specialties: specialties.map(row => row.specialty)
    }
  });
}));

// @route   GET /api/agents/areas/list
// @desc    Get list of all areas of operation
// @access  Public
router.get('/areas/list', asyncHandler(async (req, res) => {
  const { QueryTypes } = require('sequelize');
  const { sequelize } = require('../config/database');

  // Get all unique areas from agent profiles
  const areas = await sequelize.query(`
    SELECT DISTINCT jsonb_array_elements_text(areas_of_operation) as area
    FROM agent_profiles 
    WHERE areas_of_operation IS NOT NULL 
    AND jsonb_array_length(areas_of_operation) > 0
    ORDER BY area
  `, {
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: {
      areas: areas.map(row => row.area)
    }
  });
}));

module.exports = router;


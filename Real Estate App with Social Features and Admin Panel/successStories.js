const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { 
  authenticateToken, 
  requireAgent,
  requireAdmin 
} = require('../middleware/auth');
const { 
  asyncHandler, 
  createValidationError
} = require('../middleware/errorHandler');

const router = express.Router();

// Helper function to check validation errors
const checkValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Validation failed', errors.array());
  }
};

// @route   GET /api/success-stories
// @desc    Get success stories
// @access  Public
router.get('/', [
  query('featured').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);
  
  // TODO: Implement success stories retrieval
  res.json({
    success: true,
    data: {
      stories: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalStories: 0
      }
    }
  });
}));

// @route   POST /api/success-stories
// @desc    Create a success story
// @access  Private (Agent/Admin)
router.post('/', authenticateToken, requireAgent, [
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('content').trim().isLength({ min: 1 })
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);
  
  // TODO: Implement success story creation
  res.status(201).json({
    success: true,
    message: 'Success story created successfully'
  });
}));

module.exports = router;


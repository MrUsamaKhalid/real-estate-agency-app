const express = require('express');
const { query, validationResult } = require('express-validator');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler, createValidationError } = require('../middleware/errorHandler');

const router = express.Router();

// Helper function to check validation errors
const checkValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Validation failed', errors.array());
  }
};

// @route   GET /api/search
// @desc    Global search across users, posts, etc.
// @access  Public
router.get('/', optionalAuth, [
  query('q').trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('type').optional().isIn(['users', 'posts', 'agents', 'all']).withMessage('Invalid search type')
], asyncHandler(async (req, res) => {
  checkValidationErrors(req);
  
  const { q, type = 'all' } = req.query;
  
  res.json({
    success: true,
    data: {
      query: q,
      type,
      results: {
        users: [],
        posts: [],
        agents: []
      }
    }
  });
}));

module.exports = router;


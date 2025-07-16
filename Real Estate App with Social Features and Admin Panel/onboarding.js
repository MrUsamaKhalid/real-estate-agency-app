const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/onboarding/content
// @desc    Get onboarding content
// @access  Private
router.get('/content', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      content: []
    }
  });
}));

module.exports = router;


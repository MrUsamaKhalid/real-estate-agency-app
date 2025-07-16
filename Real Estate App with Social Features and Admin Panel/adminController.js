const { User, AgentProfile, Post, Comment, Like, Follow, Notification } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const NotificationService = require('../services/notificationService');

// Dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const [
      totalUsers,
      totalAgents,
      totalPosts,
      totalComments,
      activeUsers24h,
      newUsers7d,
      newPosts7d,
      pendingPosts,
    ] = await Promise.all([
      User.count({ where: { isActive: true } }),
      User.count({ where: { role: 'agent', isActive: true } }),
      Post.count(),
      Comment.count(),
      User.count({
        where: {
          lastLoginAt: { [Op.gte]: last24Hours },
          isActive: true,
        },
      }),
      User.count({
        where: {
          createdAt: { [Op.gte]: last7Days },
          isActive: true,
        },
      }),
      Post.count({
        where: {
          createdAt: { [Op.gte]: last7Days },
        },
      }),
      Post.count({
        where: {
          status: 'pending',
        },
      }),
    ]);

    // Get user growth data for the last 30 days
    const userGrowthData = await User.findAll({
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      ],
      where: {
        createdAt: { [Op.gte]: last30Days },
        isActive: true,
      },
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
      raw: true,
    });

    // Get post activity data for the last 30 days
    const postActivityData = await Post.findAll({
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      ],
      where: {
        createdAt: { [Op.gte]: last30Days },
      },
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
      raw: true,
    });

    // Get top agents by followers
    const topAgents = await User.findAll({
      where: { role: 'agent', isActive: true },
      include: [
        {
          model: AgentProfile,
          as: 'agentProfile',
          attributes: ['bio', 'specialties', 'areasOfOperation'],
        },
        {
          model: Follow,
          as: 'followers',
          attributes: [],
        },
      ],
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'profilePicture',
        [require('sequelize').fn('COUNT', require('sequelize').col('followers.id')), 'followerCount'],
      ],
      group: ['User.id', 'agentProfile.id'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('followers.id')), 'DESC']],
      limit: 10,
      subQuery: false,
    });

    // Get recent activity
    const recentActivity = await Post.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'profilePicture'],
        },
      ],
      attributes: ['id', 'content', 'createdAt', 'status'],
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalAgents,
          totalPosts,
          totalComments,
          activeUsers24h,
          newUsers7d,
          newPosts7d,
          pendingPosts,
        },
        charts: {
          userGrowth: userGrowthData,
          postActivity: postActivityData,
        },
        topAgents: topAgents.map(agent => ({
          id: agent.id,
          name: `${agent.firstName} ${agent.lastName}`,
          email: agent.email,
          profilePicture: agent.profilePicture,
          followerCount: parseInt(agent.dataValues.followerCount) || 0,
          specialties: agent.agentProfile?.specialties || [],
        })),
        recentActivity: recentActivity.map(post => ({
          id: post.id,
          content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          author: post.author,
          createdAt: post.createdAt,
          status: post.status,
        })),
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
};

// User management
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Role filter
    if (role) {
      whereClause.role = role;
    }

    // Status filter
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: AgentProfile,
          as: 'agentProfile',
          required: false,
          attributes: ['bio', 'specialties', 'areasOfOperation', 'yearsOfExperience'],
        },
      ],
      attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
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
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

// Get single user details
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: AgentProfile,
          as: 'agentProfile',
          required: false,
        },
        {
          model: Post,
          as: 'posts',
          limit: 5,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'content', 'createdAt', 'status'],
        },
        {
          model: Follow,
          as: 'followers',
          attributes: [],
        },
        {
          model: Follow,
          as: 'following',
          attributes: [],
        },
      ],
      attributes: {
        exclude: ['password', 'refreshToken', 'passwordResetToken'],
        include: [
          [require('sequelize').fn('COUNT', require('sequelize').col('followers.id')), 'followerCount'],
          [require('sequelize').fn('COUNT', require('sequelize').col('following.id')), 'followingCount'],
        ],
      },
      group: ['User.id', 'agentProfile.id', 'posts.id'],
      subQuery: false,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get additional statistics
    const [postCount, commentCount, likeCount] = await Promise.all([
      Post.count({ where: { authorId: id } }),
      Comment.count({ where: { authorId: id } }),
      Like.count({ where: { userId: id } }),
    ]);

    res.json({
      success: true,
      data: {
        user,
        statistics: {
          postCount,
          commentCount,
          likeCount,
          followerCount: parseInt(user.dataValues.followerCount) || 0,
          followingCount: parseInt(user.dataValues.followingCount) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.update({ isActive });

    // Send notification to user if deactivated
    if (!isActive) {
      await NotificationService.createNotification({
        userId: id,
        type: 'system_announcement',
        title: 'Account Status Update',
        message: `Your account has been ${isActive ? 'activated' : 'deactivated'}${reason ? `: ${reason}` : ''}`,
        data: { reason, adminAction: true },
        sendEmail: true,
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete by deactivating
    await user.update({ 
      isActive: false,
      deletedAt: new Date(),
      deletionReason: reason,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};

// Post management
const getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      search = '',
      authorId = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Search filter
    if (search) {
      whereClause.content = { [Op.iLike]: `%${search}%` };
    }

    // Author filter
    if (authorId) {
      whereClause.authorId = authorId;
    }

    const { count, rows: posts } = await Post.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'profilePicture'],
        },
        {
          model: Like,
          as: 'likes',
          attributes: [],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: [],
        },
      ],
      attributes: {
        include: [
          [require('sequelize').fn('COUNT', require('sequelize').col('likes.id')), 'likeCount'],
          [require('sequelize').fn('COUNT', require('sequelize').col('comments.id')), 'commentCount'],
        ],
      },
      group: ['Post.id', 'author.id'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      subQuery: false,
    });

    res.json({
      success: true,
      data: {
        posts: posts.map(post => ({
          ...post.toJSON(),
          likeCount: parseInt(post.dataValues.likeCount) || 0,
          commentCount: parseInt(post.dataValues.commentCount) || 0,
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalPosts: count,
          hasNext: offset + posts.length < count,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
    });
  }
};

// Update post status
const updatePostStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await post.update({ 
      status,
      reviewedAt: new Date(),
      reviewedBy: req.user.userId,
      reviewReason: reason,
    });

    // Send notification to post author
    const notificationType = status === 'approved' ? 'post_approved' : 'post_rejected';
    const notificationTitle = status === 'approved' ? 'Post Approved' : 'Post Rejected';
    const notificationMessage = status === 'approved' 
      ? 'Your post has been approved and is now visible to other users.'
      : `Your post has been rejected${reason ? `: ${reason}` : ''}.`;

    await NotificationService.createNotification({
      userId: post.authorId,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      data: { postId: id, reason, adminAction: true },
      sendEmail: true,
    });

    res.json({
      success: true,
      message: `Post ${status} successfully`,
    });
  } catch (error) {
    console.error('Update post status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post status',
    });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Send notification to post author before deletion
    await NotificationService.createNotification({
      userId: post.authorId,
      type: 'system_announcement',
      title: 'Post Deleted',
      message: `Your post has been deleted by an administrator${reason ? `: ${reason}` : ''}.`,
      data: { postId: id, reason, adminAction: true },
      sendEmail: true,
    });

    await post.destroy();

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
    });
  }
};

// System settings
const getSystemSettings = async (req, res) => {
  try {
    // This would typically come from a settings table or configuration
    const settings = {
      siteName: process.env.SITE_NAME || 'Real Estate Agency',
      siteDescription: process.env.SITE_DESCRIPTION || 'Social platform for real estate agents',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
      emailVerificationRequired: process.env.EMAIL_VERIFICATION_REQUIRED !== 'false',
      postApprovalRequired: process.env.POST_APPROVAL_REQUIRED === 'true',
      maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
      allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'png', 'gif', 'pdf'],
    };

    res.json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
    });
  }
};

// Update system settings
const updateSystemSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // In a real application, you would save these to a database
    // For now, we'll just return success
    const { settings } = req.body;

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: { settings },
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  getPosts,
  updatePostStatus,
  deletePost,
  getSystemSettings,
  updateSystemSettings,
};


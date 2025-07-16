const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const path = require('path');
require('dotenv').config();

// Import security middleware
const { 
  corsOptions, 
  helmetConfig, 
  generalLimiter,
  sanitizeInputs,
  requestLogger,
  addSecurityHeaders,
  maintenanceMode,
  validateContentType,
  securityErrorHandler
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const agentRoutes = require('./routes/agents');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const followRoutes = require('./routes/follows');
const notificationRoutes = require('./routes/notifications');
const companyRoutes = require('./routes/company');
const successStoryRoutes = require('./routes/successStories');
const onboardingRoutes = require('./routes/onboarding');
const mediaRoutes = require('./routes/media');
const searchRoutes = require('./routes/search');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Maintenance mode check
app.use(maintenanceMode);

// Enhanced security middleware
app.use(helmet({
  ...helmetConfig,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(addSecurityHeaders);

// Enhanced CORS configuration
app.use(cors({
  ...corsOptions,
  origin: true, // Allow all origins for development - should be restricted in production
}));

// Enhanced rate limiting
app.use('/api/', generalLimiter);

// Additional rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    error: 'Too many file uploads, please try again later'
  }
});

// Body parsing middleware with enhanced security
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// File upload middleware with rate limiting
app.use('/api/media', uploadLimiter);
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded'
}));

// Input sanitization
app.use(sanitizeInputs);

// Compression middleware
app.use(compression());

// Enhanced logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
  app.use(requestLogger);
} else {
  app.use(morgan('combined'));
}

// Static files with security headers
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));
app.use('/public', express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Real Estate Agency API',
    version: '1.0.0',
    description: 'API for Real Estate Agency social platform',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      agents: '/api/agents',
      posts: '/api/posts',
      comments: '/api/comments',
      follows: '/api/follows',
      notifications: '/api/notifications',
      company: '/api/company',
      successStories: '/api/success-stories',
      onboarding: '/api/onboarding',
      media: '/api/media',
      search: '/api/search',
      analytics: '/api/analytics',
      admin: '/api/admin',
    },
    documentation: `${process.env.FRONTEND_URL}/api-docs`,
    security: {
      rateLimit: '100 requests per 15 minutes',
      cors: 'Enabled with credentials',
      helmet: 'Security headers enabled',
      validation: 'Input sanitization enabled'
    }
  });
});

// API routes with enhanced security
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/success-stories', successStoryRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Security error handler
app.use(securityErrorHandler);

// Global error handling middleware
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  
  // Close server
  if (app.server) {
    app.server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;


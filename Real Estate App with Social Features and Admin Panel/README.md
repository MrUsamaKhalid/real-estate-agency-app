# Real Estate Agency Backend API

A comprehensive Node.js/Express backend API for a real estate agency social platform with Instagram-like features for agents.

## Features

- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Agent Profiles** - Instagram-like profiles with bios, specialties, and social features
- **Social Feed System** - Posts, comments, likes, and follows
- **Real-time Notifications** - Socket.IO powered notifications
- **Media Upload** - Cloudinary integration for image/video uploads
- **Admin Panel** - User management and content moderation
- **Search & Filtering** - Advanced search across users, posts, and agents
- **Analytics** - User engagement and platform analytics

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Real-time**: Socket.IO for live updates
- **File Upload**: Cloudinary for media storage
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting

## Project Structure

```
src/
├── config/          # Database and app configuration
├── controllers/     # Route controllers (placeholder)
├── middleware/      # Custom middleware (auth, error handling)
├── models/          # Sequelize database models
├── routes/          # API route definitions
├── services/        # Business logic services (placeholder)
└── utils/           # Utility functions (placeholder)
```

## Database Models

- **Users** - Core user entity with role-based access
- **AgentProfiles** - Extended profiles for real estate agents
- **Posts** - Social media posts with rich content
- **Comments** - Threaded comments on posts
- **Likes** - Like system for posts and comments
- **Follows** - Social following relationships
- **Notifications** - Comprehensive notification system
- **Company Info** - Company details and management
- **Success Stories** - Showcase company achievements
- **Onboarding Content** - Educational content for newcomers

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password with token

### Users
- `GET /api/users` - Get users (with search)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/:id/stats` - Get user statistics

### Agents
- `GET /api/agents` - Get agent profiles with filtering
- `GET /api/agents/featured` - Get featured agents
- `GET /api/agents/top` - Get top performing agents
- `GET /api/agents/:id` - Get agent profile
- `PUT /api/agents/:id` - Update agent profile
- `POST /api/agents/:id/feature` - Toggle featured status

### Posts
- `GET /api/posts` - Get posts feed with filtering
- `GET /api/posts/trending` - Get trending posts
- `GET /api/posts/pending` - Get posts pending approval
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Toggle like on post
- `POST /api/posts/:id/approve` - Approve post (admin)

### Comments
- `GET /api/comments/post/:postId` - Get comments for post
- `GET /api/comments/:id/replies` - Get comment replies
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Toggle like on comment

### Follows
- `GET /api/follows/:userId/followers` - Get user followers
- `GET /api/follows/:userId/following` - Get users being followed
- `POST /api/follows/:userId` - Follow/unfollow user
- `GET /api/follows/check/:userId` - Check if following user
- `GET /api/follows/suggestions` - Get follow suggestions

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `POST /api/notifications/announcement` - Create announcement

## Setup Instructions

1. **Clone and Install**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb real_estate_app
   
   # Run migrations (when implemented)
   npm run db:migrate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for all required environment variables including:
- Database connection settings
- JWT secret key
- Cloudinary credentials
- Email service configuration
- Firebase settings for push notifications

## Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - express-validator for all inputs
- **CORS Protection** - Configurable cross-origin requests
- **Helmet Security** - Security headers and protection
- **SQL Injection Prevention** - Sequelize ORM parameterized queries

## Real-time Features

- **Live Notifications** - Instant notification delivery
- **Post Updates** - Real-time feed updates
- **Comment Updates** - Live comment threads
- **Follow Notifications** - Instant follow alerts

## Development

- **Hot Reload** - nodemon for development
- **Error Handling** - Comprehensive error middleware
- **Logging** - Morgan HTTP request logging
- **Validation** - Input validation on all endpoints
- **Documentation** - Inline code documentation

## Deployment

The API is designed to be deployed on any Node.js hosting platform:
- Heroku, Railway, or similar PaaS
- AWS EC2, DigitalOcean, or VPS
- Docker containers
- Serverless functions (with modifications)

## Contributing

1. Follow the established code structure
2. Add proper validation to all endpoints
3. Include error handling
4. Update documentation for new features
5. Test all endpoints before committing

## License

MIT License - see LICENSE file for details


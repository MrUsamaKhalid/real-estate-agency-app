# Real Estate Agency Social Platform

A comprehensive full-stack social platform designed specifically for real estate agencies, featuring agent profiles, social feeds, content management, and administrative tools. Built with modern technologies including React, Node.js, PostgreSQL, and Redis.

## 🌟 Features

### Core Functionality
- **User Authentication**: Secure sign-up/login with JWT tokens and email verification
- **Agent Profiles**: Instagram-like profiles with bios, specialties, and social features
- **Social Feed**: Daily updates, posts with images, likes, comments, and sharing
- **Follow System**: Follow/unfollow agents and build professional networks
- **Real-time Notifications**: Push notifications, email alerts, and in-app notifications
- **Media Management**: Image/video upload with cloud storage and optimization
- **Search & Discovery**: Advanced search and filtering for agents and content

### User Roles
- **Agents**: Full access to create content, manage profiles, and engage socially
- **Newcomers**: Limited access for onboarding and learning
- **Faculty/Management**: Administrative oversight and content management
- **Admin**: Complete system administration and user management

### Administrative Features
- **Admin Dashboard**: Comprehensive analytics and system overview
- **User Management**: Create, edit, activate/deactivate user accounts
- **Content Moderation**: Approve/reject posts and manage content quality
- **System Settings**: Configure platform settings and preferences
- **Analytics**: User engagement, content performance, and growth metrics

### Company Features
- **Company Information**: About us, history, mission, and vision
- **Team Profiles**: Management and faculty member profiles
- **Success Stories**: Showcase achievements and client testimonials
- **Onboarding**: Structured introduction for new team members

## 🏗️ Architecture

### Technology Stack

**Frontend (Web)**
- React 18 with Vite
- Tailwind CSS for styling
- shadcn/ui component library
- React Router for navigation
- Context API for state management

**Frontend (Mobile)**
- React Native with Expo
- Native navigation
- AsyncStorage for local data
- Push notifications

**Backend**
- Node.js with Express.js
- PostgreSQL database with Sequelize ORM
- Redis for caching and sessions
- JWT authentication
- Socket.io for real-time features

**Infrastructure**
- Docker containerization
- Nginx reverse proxy
- Cloudinary for media storage
- Email service integration
- Optional monitoring with Prometheus/Grafana

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Web     │    │  React Native   │    │   Admin Panel   │
│   Application   │    │   Mobile App    │    │   Dashboard     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │     Nginx Proxy        │
                    │   (Load Balancer)      │
                    └─────────────┬───────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │   Node.js Backend      │
                    │   (Express + Socket.io) │
                    └─────────────┬───────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────┴───────┐    ┌─────────┴───────┐    ┌─────────┴───────┐
│   PostgreSQL    │    │     Redis       │    │   Cloudinary    │
│   Database      │    │     Cache       │    │  Media Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd real-estate-app
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker (Recommended)**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Initialize database
   docker-compose exec backend npm run migrate
   docker-compose exec backend npm run seed
   ```

4. **Or start manually**
   ```bash
   # Start database services
   docker-compose up -d postgres redis
   
   # Install and start backend
   cd backend
   npm install
   npm run migrate
   npm run seed
   npm run dev
   
   # Install and start frontend (new terminal)
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Web App: http://localhost:5173
   - API: http://localhost:3000
   - Admin: http://localhost:5173/admin

### Default Accounts

After seeding the database, you can use these default accounts:

- **Admin**: admin@realestate.com / admin123
- **Agent**: agent@realestate.com / agent123
- **Newcomer**: newcomer@realestate.com / newcomer123

## 📱 Mobile App Setup

### React Native Development

1. **Install dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **Start Metro bundler**
   ```bash
   npm start
   ```

3. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

### Building for Production

```bash
# iOS
cd ios && xcodebuild -workspace RealEstateAgency.xcworkspace -scheme RealEstateAgency archive

# Android
cd android && ./gradlew assembleRelease
```

## 🔧 Development

### Project Structure

```
real-estate-app/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── uploads/            # File uploads
│   └── package.json
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Helper functions
│   └── package.json
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── utils/          # Helper functions
│   └── package.json
├── nginx/                  # Nginx configuration
├── monitoring/             # Monitoring configs
├── docker-compose.yml      # Docker services
└── README.md
```

### API Documentation

The API follows RESTful conventions with comprehensive documentation available at `/api` when the server is running.

#### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

#### User Management
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent profile

#### Social Features
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Add comment

#### Follow System
- `POST /api/follows/:userId` - Follow user
- `DELETE /api/follows/:userId` - Unfollow user
- `GET /api/follows/followers` - Get followers
- `GET /api/follows/following` - Get following

#### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read

#### Media Upload
- `POST /api/media/upload` - Upload single file
- `POST /api/media/upload-multiple` - Upload multiple files
- `POST /api/media/profile-picture` - Upload profile picture
- `DELETE /api/media/:id` - Delete media file

#### Admin Endpoints
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - Manage users
- `PATCH /api/admin/users/:id/status` - Update user status
- `GET /api/admin/posts` - Manage posts
- `PATCH /api/admin/posts/:id/status` - Approve/reject posts

### Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Core user information and authentication
- **AgentProfiles**: Extended agent information and specialties
- **Posts**: Social media posts with content and metadata
- **Comments**: Post comments and replies
- **Likes**: Post and comment likes
- **Follows**: User following relationships
- **Notifications**: System and user notifications
- **Media**: File upload metadata and references

### Environment Variables

Key environment variables for configuration:

```bash
# Application
NODE_ENV=development|production
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=real_estate_agency
DB_USER=postgres
DB_PASSWORD=your-password

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Media Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # Test coverage report
```

### Frontend Testing

```bash
cd frontend
npm test                   # Run React tests
npm run test:e2e          # End-to-end tests
npm run test:coverage     # Coverage report
```

### API Testing

Use the included Postman collection or test with curl:

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📊 Monitoring

### Application Monitoring

The application includes optional monitoring with Prometheus and Grafana:

```bash
# Start with monitoring
docker-compose --profile monitoring up -d

# Access dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3002 (admin/admin123)
```

### Health Checks

Built-in health check endpoints:

- `GET /health` - Application health
- `GET /api/health` - API health with database connectivity
- `GET /metrics` - Prometheus metrics (if enabled)

### Logging

Structured logging with different levels:

```javascript
// Backend logging
logger.info('User registered', { userId, email });
logger.error('Database connection failed', { error });
logger.warn('Rate limit exceeded', { ip, endpoint });
```

## 🚀 Deployment

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including:

- Docker deployment
- Cloud provider setup (AWS, GCP, DigitalOcean)
- SSL configuration
- Database setup
- Monitoring and logging
- Backup and recovery

### Quick Production Setup

```bash
# Clone and configure
git clone <repository-url> /opt/real-estate-app
cd /opt/real-estate-app
cp .env.example .env
# Edit .env with production values

# Deploy with Docker
docker-compose up -d

# Initialize database
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed:production
```

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards

- **JavaScript**: ESLint with Airbnb configuration
- **React**: Follow React best practices and hooks patterns
- **Node.js**: Use async/await, proper error handling
- **Database**: Use migrations for schema changes
- **Testing**: Maintain test coverage above 80%
- **Documentation**: Update README and API docs for changes

### Commit Convention

Follow conventional commits:

```
feat: add user profile editing
fix: resolve authentication token expiry
docs: update API documentation
test: add unit tests for user service
refactor: optimize database queries
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and community support

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **Port Conflicts**: Check if ports 3000, 5173, 5432, 6379 are available
3. **Environment Variables**: Verify all required environment variables are set
4. **Docker Issues**: Ensure Docker daemon is running and has sufficient resources

### Performance Tips

- Use Redis caching for frequently accessed data
- Optimize database queries with proper indexes
- Implement CDN for static assets
- Enable gzip compression
- Monitor and optimize bundle sizes

## 🔮 Roadmap

### Upcoming Features

- **Real-time Chat**: Direct messaging between agents
- **Calendar Integration**: Appointment scheduling
- **Advanced Analytics**: Detailed performance metrics
- **Mobile Push Notifications**: Enhanced mobile experience
- **API Rate Limiting**: Advanced rate limiting and quotas
- **Multi-language Support**: Internationalization
- **Advanced Search**: Elasticsearch integration
- **Video Calls**: Integrated video conferencing

### Technical Improvements

- **Microservices**: Split into smaller services
- **GraphQL**: Alternative API interface
- **Kubernetes**: Container orchestration
- **CI/CD Pipeline**: Automated testing and deployment
- **Performance Monitoring**: APM integration
- **Security Enhancements**: Advanced security features

---

**Built with ❤️ by the Real Estate Agency Development Team**

For more information, visit our [documentation](./docs/) or contact the development team.


# Real Estate Agency Application - Deployment Guide

This comprehensive guide covers the deployment of the Real Estate Agency social platform, including both development and production environments. The application consists of a React frontend, Node.js/Express backend, PostgreSQL database, Redis cache, and optional monitoring stack.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

## Prerequisites

Before deploying the Real Estate Agency application, ensure you have the following prerequisites installed and configured:

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2
- **Memory**: Minimum 4GB RAM (8GB+ recommended for production)
- **Storage**: Minimum 20GB free space (50GB+ recommended for production)
- **Network**: Stable internet connection for downloading dependencies and cloud services

### Required Software

- **Docker**: Version 20.10+ with Docker Compose v2
- **Node.js**: Version 18+ (for local development)
- **PostgreSQL**: Version 13+ (if not using Docker)
- **Redis**: Version 6+ (if not using Docker)
- **Git**: For version control and deployment

### Cloud Services (Production)

- **Cloudinary**: For media storage and processing
- **Email Service**: SMTP provider (Gmail, SendGrid, etc.)
- **Domain**: Custom domain with SSL certificate
- **Cloud Provider**: AWS, Google Cloud, DigitalOcean, or similar

## Environment Setup

### Environment Variables

Create a `.env` file in the root directory with the following configuration:

```bash
# Application Environment
NODE_ENV=production
FRONTEND_PORT=3001
BACKEND_PORT=3000
HTTP_PORT=80
HTTPS_PORT=443

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=real_estate_agency
DB_USER=postgres
DB_PASSWORD=your-secure-database-password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-redis-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Application URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com

# Monitoring (Optional)
GRAFANA_USER=admin
GRAFANA_PASSWORD=your-secure-grafana-password
```

### Security Configuration

Generate secure passwords and secrets:

```bash
# Generate JWT secrets (32+ characters)
openssl rand -base64 32

# Generate database password
openssl rand -base64 24

# Generate Redis password
openssl rand -base64 16
```

## Local Development

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd real-estate-app
   ```

2. **Install dependencies**:
   ```bash
   # Backend dependencies
   cd backend
   npm install
   cd ..

   # Frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d postgres redis
   ```

5. **Run database migrations**:
   ```bash
   cd backend
   npm run migrate
   npm run seed
   cd ..
   ```

6. **Start development servers**:
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

7. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Admin Dashboard: http://localhost:5173/admin

### Development Tools

- **API Documentation**: http://localhost:3000/api-docs
- **Database Admin**: Use pgAdmin or similar tools
- **Redis CLI**: `docker exec -it real-estate-redis redis-cli`

## Docker Deployment

### Development Environment

Use the development Docker Compose configuration for local development with hot reloading:

```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Environment

Deploy the full production stack with Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services (if needed)
docker-compose up -d --scale backend=3

# Update services
docker-compose pull
docker-compose up -d

# Stop services
docker-compose down
```

### Service Management

```bash
# Restart specific service
docker-compose restart backend

# View service status
docker-compose ps

# Execute commands in containers
docker-compose exec backend npm run migrate
docker-compose exec postgres psql -U postgres -d real_estate_agency

# View resource usage
docker stats
```

## Production Deployment

### Server Setup

1. **Provision a server** (minimum 2 CPU cores, 4GB RAM):
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Configure firewall**:
   ```bash
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **Set up SSL certificates** (using Let's Encrypt):
   ```bash
   sudo apt install certbot
   sudo certbot certonly --standalone -d your-domain.com -d api.your-domain.com
   ```

### Application Deployment

1. **Clone and configure**:
   ```bash
   git clone <repository-url> /opt/real-estate-app
   cd /opt/real-estate-app
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Deploy with Docker**:
   ```bash
   docker-compose up -d
   ```

3. **Initialize database**:
   ```bash
   docker-compose exec backend npm run migrate
   docker-compose exec backend npm run seed:production
   ```

4. **Set up reverse proxy** (Nginx):
   ```bash
   # Copy SSL certificates
   sudo cp /etc/letsencrypt/live/your-domain.com/* ./nginx/ssl/

   # Update nginx configuration
   # Edit nginx/conf.d/default.conf with your domain
   
   # Restart nginx
   docker-compose restart nginx
   ```

### Automated Deployment

Create a deployment script (`deploy.sh`):

```bash
#!/bin/bash
set -e

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Build and deploy
docker-compose pull
docker-compose up -d --build

# Run migrations
docker-compose exec -T backend npm run migrate

# Health check
sleep 30
curl -f http://localhost/health || exit 1

echo "Deployment completed successfully!"
```

## Cloud Deployment

### AWS Deployment

1. **EC2 Instance Setup**:
   - Launch EC2 instance (t3.medium or larger)
   - Configure security groups (ports 22, 80, 443)
   - Attach Elastic IP address

2. **RDS Database**:
   ```bash
   # Create RDS PostgreSQL instance
   # Update .env with RDS endpoint
   DB_HOST=your-rds-endpoint.amazonaws.com
   ```

3. **ElastiCache Redis**:
   ```bash
   # Create ElastiCache Redis cluster
   # Update .env with Redis endpoint
   REDIS_HOST=your-redis-cluster.cache.amazonaws.com
   ```

4. **Application Load Balancer**:
   - Configure ALB with SSL termination
   - Set up target groups for backend services
   - Configure health checks

### Google Cloud Platform

1. **Compute Engine**:
   ```bash
   # Create VM instance
   gcloud compute instances create real-estate-app \
     --machine-type=e2-standard-2 \
     --image-family=ubuntu-2004-lts \
     --image-project=ubuntu-os-cloud
   ```

2. **Cloud SQL**:
   ```bash
   # Create PostgreSQL instance
   gcloud sql instances create real-estate-db \
     --database-version=POSTGRES_13 \
     --tier=db-f1-micro
   ```

3. **Memorystore Redis**:
   ```bash
   # Create Redis instance
   gcloud redis instances create real-estate-cache \
     --size=1 \
     --region=us-central1
   ```

### DigitalOcean Deployment

1. **Droplet Setup**:
   - Create droplet (2GB RAM minimum)
   - Add SSH key for secure access
   - Configure firewall rules

2. **Managed Database**:
   - Create PostgreSQL cluster
   - Create Redis cluster
   - Update connection strings in .env

3. **Load Balancer**:
   - Set up load balancer with SSL
   - Configure health checks
   - Add droplets to backend pool

## Monitoring and Logging

### Application Monitoring

Enable the monitoring stack:

```bash
# Start with monitoring services
docker-compose --profile monitoring up -d

# Access monitoring dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3002
```

### Log Management

1. **Centralized Logging**:
   ```bash
   # View application logs
   docker-compose logs -f backend
   docker-compose logs -f frontend

   # Export logs
   docker-compose logs --no-color backend > backend.log
   ```

2. **Log Rotation**:
   ```bash
   # Configure logrotate
   sudo nano /etc/logrotate.d/real-estate-app
   ```

### Health Checks

Monitor application health:

```bash
# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost:3001/health

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping
```

### Performance Monitoring

1. **Application Metrics**:
   - Response times
   - Error rates
   - Database query performance
   - Memory and CPU usage

2. **Business Metrics**:
   - User registrations
   - Post creation rates
   - Active users
   - Feature usage

## Backup and Recovery

### Database Backup

1. **Automated Backups**:
   ```bash
   # Create backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   docker-compose exec -T postgres pg_dump -U postgres real_estate_agency > backup_$DATE.sql
   
   # Compress and store
   gzip backup_$DATE.sql
   aws s3 cp backup_$DATE.sql.gz s3://your-backup-bucket/
   ```

2. **Backup Restoration**:
   ```bash
   # Restore from backup
   gunzip backup_20240115_120000.sql.gz
   docker-compose exec -T postgres psql -U postgres -d real_estate_agency < backup_20240115_120000.sql
   ```

### File Backup

1. **Media Files**:
   ```bash
   # Backup uploaded files
   tar -czf media_backup_$(date +%Y%m%d).tar.gz ./backend/uploads
   ```

2. **Configuration Backup**:
   ```bash
   # Backup configuration files
   tar -czf config_backup_$(date +%Y%m%d).tar.gz .env docker-compose.yml nginx/
   ```

### Disaster Recovery

1. **Recovery Plan**:
   - Document recovery procedures
   - Test recovery process regularly
   - Maintain offsite backups
   - Define RTO and RPO targets

2. **Failover Procedures**:
   - Database failover
   - Application server failover
   - DNS failover
   - Load balancer configuration

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   ```bash
   # Check database status
   docker-compose exec postgres pg_isready
   
   # View database logs
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec backend npm run db:test
   ```

2. **Memory Issues**:
   ```bash
   # Check memory usage
   docker stats
   
   # Increase memory limits in docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 1G
   ```

3. **SSL Certificate Issues**:
   ```bash
   # Renew certificates
   sudo certbot renew
   
   # Test certificate
   openssl s_client -connect your-domain.com:443
   ```

### Performance Optimization

1. **Database Optimization**:
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_posts_author_id ON posts(author_id);
   CREATE INDEX idx_posts_created_at ON posts(created_at);
   
   -- Analyze query performance
   EXPLAIN ANALYZE SELECT * FROM posts WHERE author_id = 'user-id';
   ```

2. **Caching Strategy**:
   ```javascript
   // Implement Redis caching
   const redis = require('redis');
   const client = redis.createClient();
   
   // Cache frequently accessed data
   await client.setex('user:profile:123', 3600, JSON.stringify(userProfile));
   ```

3. **CDN Configuration**:
   - Configure CloudFront or similar CDN
   - Cache static assets
   - Optimize image delivery

### Debugging

1. **Application Debugging**:
   ```bash
   # Enable debug mode
   NODE_ENV=development docker-compose up backend
   
   # View detailed logs
   docker-compose logs -f --tail=100 backend
   ```

2. **Network Debugging**:
   ```bash
   # Test network connectivity
   docker-compose exec backend ping postgres
   docker-compose exec backend ping redis
   
   # Check port accessibility
   telnet localhost 3000
   ```

## Security Considerations

### Application Security

1. **Authentication and Authorization**:
   - Implement strong password policies
   - Use JWT tokens with appropriate expiration
   - Implement role-based access control
   - Enable two-factor authentication

2. **Data Protection**:
   - Encrypt sensitive data at rest
   - Use HTTPS for all communications
   - Implement proper input validation
   - Sanitize user inputs

3. **API Security**:
   - Implement rate limiting
   - Use CORS properly
   - Validate all inputs
   - Log security events

### Infrastructure Security

1. **Server Hardening**:
   ```bash
   # Disable root login
   sudo nano /etc/ssh/sshd_config
   # PermitRootLogin no
   
   # Configure firewall
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   ```

2. **Container Security**:
   - Use non-root users in containers
   - Scan images for vulnerabilities
   - Keep base images updated
   - Limit container capabilities

3. **Network Security**:
   - Use private networks for internal communication
   - Implement network segmentation
   - Monitor network traffic
   - Use VPN for administrative access

### Compliance

1. **Data Privacy**:
   - Implement GDPR compliance
   - Provide data export/deletion
   - Maintain audit logs
   - Document data processing

2. **Security Auditing**:
   - Regular security assessments
   - Penetration testing
   - Vulnerability scanning
   - Code security reviews

This deployment guide provides comprehensive instructions for deploying the Real Estate Agency application in various environments. Follow the appropriate sections based on your deployment requirements and infrastructure preferences. Regular maintenance, monitoring, and security updates are essential for a successful production deployment.


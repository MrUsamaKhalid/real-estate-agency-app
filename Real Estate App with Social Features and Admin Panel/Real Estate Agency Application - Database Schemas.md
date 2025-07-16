# Real Estate Agency Application - Database Schemas

## Overview

This document outlines the comprehensive database schema design for the real estate agency web and mobile application. The database is designed to support a social media-like platform for real estate agents with features including user authentication, agent profiles, social feeds, company information, and administrative management.

## Database Technology

**Recommended Database**: PostgreSQL
- Provides ACID compliance for financial and business-critical data
- Excellent support for JSON data types for flexible content storage
- Strong indexing capabilities for search functionality
- Robust support for relationships and constraints

## Core Entities and Relationships

### 1. Users Table

The central user entity that supports multiple user roles including agents, admins, newcomers, and faculty/management.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('agent', 'admin', 'newcomer', 'faculty', 'management')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

### 2. Agent Profiles Table

Extended profile information specifically for agents, supporting Instagram-like features.

```sql
CREATE TABLE agent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_photo_url VARCHAR(500),
    bio TEXT,
    specialties JSONB, -- Array of specialties like areas, developers
    areas_of_operation JSONB, -- Geographic areas they work in
    preferred_developers JSONB, -- Developers they specialize in
    years_experience INTEGER,
    license_number VARCHAR(100),
    social_media_links JSONB, -- Instagram, LinkedIn, etc.
    total_sales INTEGER DEFAULT 0,
    total_listings INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'company_only')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_profiles_user_id ON agent_profiles(user_id);
CREATE INDEX idx_agent_profiles_featured ON agent_profiles(is_featured);
CREATE INDEX idx_agent_profiles_visibility ON agent_profiles(visibility);
```

### 3. Posts Table

Social media-style posts by agents with rich content support.

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls JSONB, -- Array of image/video URLs
    media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'mixed')),
    post_type VARCHAR(20) DEFAULT 'regular' CHECK (post_type IN ('regular', 'story', 'highlight', 'announcement')),
    tags JSONB, -- Hashtags and mentions
    location VARCHAR(255),
    is_published BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    external_share_settings JSONB, -- Settings for sharing to Instagram/Facebook
    scheduled_at TIMESTAMP,
    expires_at TIMESTAMP, -- For stories
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(is_published);
CREATE INDEX idx_posts_approved ON posts(is_approved);
CREATE INDEX idx_posts_type ON posts(post_type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

### 4. Comments Table

Comments on posts with nested reply support.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

### 5. Likes Table

Like system for posts and comments.

```sql
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT likes_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_likes_user_post ON likes(user_id, post_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX idx_likes_user_comment ON likes(user_id, comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_comment_id ON likes(comment_id);
```

### 6. Follows Table

Follow/following relationship between users.

```sql
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT follows_self_check CHECK (follower_id != following_id)
);

CREATE UNIQUE INDEX idx_follows_unique ON follows(follower_id, following_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_follows_status ON follows(status);
```

### 7. Company Information Table

Company details, history, and management information.

```sql
CREATE TABLE company_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mission TEXT,
    vision TEXT,
    history TEXT,
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    address JSONB, -- Structured address data
    contact_info JSONB, -- Phone, email, social media
    founded_year INTEGER,
    employee_count INTEGER,
    office_locations JSONB, -- Multiple office locations
    achievements JSONB, -- Timeline of achievements
    certifications JSONB, -- Company certifications
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. Faculty/Management Profiles Table

Profiles for company leadership and faculty members.

```sql
CREATE TABLE faculty_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    bio TEXT,
    profile_photo_url VARCHAR(500),
    qualifications JSONB, -- Education, certifications
    experience_years INTEGER,
    specializations JSONB,
    contact_info JSONB,
    social_media_links JSONB,
    is_public BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faculty_profiles_user_id ON faculty_profiles(user_id);
CREATE INDEX idx_faculty_profiles_public ON faculty_profiles(is_public);
CREATE INDEX idx_faculty_profiles_order ON faculty_profiles(display_order);
```

### 9. Notifications Table

Comprehensive notification system for all user interactions.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'like', 'comment', 'follow', 'mention', 'post_approved', 
        'post_rejected', 'announcement', 'welcome', 'system'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data like post_id, comment_id
    is_read BOOLEAN DEFAULT false,
    is_push_sent BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 10. Success Stories Table

Company success stories and case studies.

```sql
CREATE TABLE success_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    featured_image_url VARCHAR(500),
    media_urls JSONB, -- Additional images/videos
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    property_type VARCHAR(100),
    sale_amount DECIMAL(15,2),
    location VARCHAR(255),
    completion_date DATE,
    tags JSONB,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_success_stories_agent ON success_stories(agent_id);
CREATE INDEX idx_success_stories_featured ON success_stories(is_featured);
CREATE INDEX idx_success_stories_published ON success_stories(is_published);
CREATE INDEX idx_success_stories_created_at ON success_stories(created_at DESC);
```

### 11. Onboarding Content Table

Educational content for newcomers.

```sql
CREATE TABLE onboarding_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN (
        'video', 'article', 'document', 'interactive', 'quiz'
    )),
    content_url VARCHAR(500),
    content_data JSONB, -- For interactive content or quiz data
    category VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 0,
    duration_minutes INTEGER, -- Estimated completion time
    is_required BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    target_roles JSONB, -- Which roles should see this content
    prerequisites JSONB, -- Required previous content
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_onboarding_content_category ON onboarding_content(category);
CREATE INDEX idx_onboarding_content_published ON onboarding_content(is_published);
CREATE INDEX idx_onboarding_content_order ON onboarding_content(order_index);
```

### 12. User Progress Table

Track user progress through onboarding content.

```sql
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES onboarding_content(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN (
        'not_started', 'in_progress', 'completed', 'skipped'
    )),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_spent_minutes INTEGER DEFAULT 0,
    quiz_score INTEGER, -- For quiz content
    notes TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_user_progress_unique ON user_progress(user_id, content_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
```

### 13. Analytics Table

Track user engagement and platform analytics.

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    platform VARCHAR(50), -- web, ios, android
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_platform ON analytics_events(platform);
```

### 14. Media Files Table

Track uploaded media files with metadata.

```sql
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER, -- For images/videos
    height INTEGER, -- For images/videos
    duration INTEGER, -- For videos/audio in seconds
    alt_text VARCHAR(255),
    is_processed BOOLEAN DEFAULT false,
    processing_status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB, -- EXIF data, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_files_user ON media_files(user_id);
CREATE INDEX idx_media_files_type ON media_files(file_type);
CREATE INDEX idx_media_files_created_at ON media_files(created_at DESC);
```

### 15. Settings Table

User and system settings.

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    display_preferences JSONB DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_user_settings_user ON user_settings(user_id);
```

## Database Triggers and Functions

### Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_profiles_updated_at BEFORE UPDATE ON agent_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Continue for other tables...
```

### Counter Update Triggers

```sql
-- Update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment follower count for the followed user
        UPDATE agent_profiles 
        SET follower_count = follower_count + 1 
        WHERE user_id = NEW.following_id;
        
        -- Increment following count for the follower
        UPDATE agent_profiles 
        SET following_count = following_count + 1 
        WHERE user_id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement follower count for the followed user
        UPDATE agent_profiles 
        SET follower_count = follower_count - 1 
        WHERE user_id = OLD.following_id;
        
        -- Decrement following count for the follower
        UPDATE agent_profiles 
        SET following_count = following_count - 1 
        WHERE user_id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_counts_trigger
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
```

## Indexes for Performance

### Search Indexes

```sql
-- Full-text search indexes
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || email));
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', content));
CREATE INDEX idx_agent_profiles_search ON agent_profiles USING gin(to_tsvector('english', bio));

-- JSON indexes for filtering
CREATE INDEX idx_agent_specialties ON agent_profiles USING gin(specialties);
CREATE INDEX idx_agent_areas ON agent_profiles USING gin(areas_of_operation);
CREATE INDEX idx_post_tags ON posts USING gin(tags);
```

## Data Relationships Summary

The database schema supports the following key relationships:

1. **Users** are the central entity, with different roles (agent, admin, newcomer, faculty)
2. **Agent Profiles** extend user information for agents with social media features
3. **Posts** belong to users and support rich media content with approval workflow
4. **Comments** create threaded discussions on posts
5. **Likes** and **Follows** create social interactions between users
6. **Notifications** keep users informed of all platform activities
7. **Success Stories** showcase company achievements linked to agents
8. **Onboarding Content** provides structured learning paths for newcomers
9. **Analytics** track user behavior and platform usage
10. **Media Files** manage all uploaded content with proper metadata

This schema provides a solid foundation for a comprehensive real estate agency social platform with room for future enhancements and scalability.


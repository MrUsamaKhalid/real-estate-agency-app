const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AgentProfile = sequelize.define('AgentProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  profilePhotoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'profile_photo_url'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  specialties: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  areasOfOperation: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'areas_of_operation'
  },
  preferredDevelopers: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'preferred_developers'
  },
  yearsExperience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'years_experience'
  },
  licenseNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'license_number'
  },
  socialMediaLinks: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'social_media_links'
  },
  totalSales: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_sales'
  },
  totalListings: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_listings'
  },
  followerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'follower_count'
  },
  followingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'following_count'
  },
  postCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'post_count'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_featured'
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'company_only'),
    defaultValue: 'public'
  }
}, {
  tableName: 'agent_profiles',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['visibility']
    },
    {
      using: 'gin',
      fields: ['specialties']
    },
    {
      using: 'gin',
      fields: ['areas_of_operation']
    }
  ]
});

// Instance methods
AgentProfile.prototype.incrementFollowerCount = function() {
  return this.increment('followerCount');
};

AgentProfile.prototype.decrementFollowerCount = function() {
  return this.decrement('followerCount');
};

AgentProfile.prototype.incrementFollowingCount = function() {
  return this.increment('followingCount');
};

AgentProfile.prototype.decrementFollowingCount = function() {
  return this.decrement('followingCount');
};

AgentProfile.prototype.incrementPostCount = function() {
  return this.increment('postCount');
};

AgentProfile.prototype.decrementPostCount = function() {
  return this.decrement('postCount');
};

// Class methods
AgentProfile.findFeatured = function() {
  return this.findAll({
    where: { isFeatured: true, visibility: 'public' },
    include: [{
      model: sequelize.models.User,
      attributes: ['firstName', 'lastName', 'email']
    }]
  });
};

AgentProfile.findBySpecialty = function(specialty) {
  return this.findAll({
    where: {
      specialties: {
        [sequelize.Op.contains]: [specialty]
      },
      visibility: 'public'
    }
  });
};

AgentProfile.findByArea = function(area) {
  return this.findAll({
    where: {
      areasOfOperation: {
        [sequelize.Op.contains]: [area]
      },
      visibility: 'public'
    }
  });
};

AgentProfile.getTopAgents = function(limit = 10) {
  return this.findAll({
    where: { visibility: 'public' },
    order: [
      ['totalSales', 'DESC'],
      ['followerCount', 'DESC']
    ],
    limit,
    include: [{
      model: sequelize.models.User,
      attributes: ['firstName', 'lastName', 'email']
    }]
  });
};

module.exports = AgentProfile;


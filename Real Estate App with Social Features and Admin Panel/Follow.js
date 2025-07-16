const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Follow = sequelize.define('Follow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  followerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'follower_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  followingId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'following_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('active', 'blocked', 'pending'),
    defaultValue: 'active'
  }
}, {
  tableName: 'follows',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['follower_id', 'following_id']
    },
    {
      fields: ['follower_id']
    },
    {
      fields: ['following_id']
    },
    {
      fields: ['status']
    }
  ],
  validate: {
    selfFollowCheck() {
      if (this.followerId === this.followingId) {
        throw new Error('Users cannot follow themselves');
      }
    }
  }
});

// Class methods
Follow.findFollowers = function(userId, options = {}) {
  return this.findAll({
    where: {
      followingId: userId,
      status: 'active',
      ...options.where
    },
    include: [{
      model: sequelize.models.User,
      as: 'follower',
      attributes: ['id', 'firstName', 'lastName', 'email'],
      include: [{
        model: sequelize.models.AgentProfile,
        attributes: ['profilePhotoUrl', 'bio']
      }]
    }],
    order: [['createdAt', 'DESC']],
    ...options
  });
};

Follow.findFollowing = function(userId, options = {}) {
  return this.findAll({
    where: {
      followerId: userId,
      status: 'active',
      ...options.where
    },
    include: [{
      model: sequelize.models.User,
      as: 'following',
      attributes: ['id', 'firstName', 'lastName', 'email'],
      include: [{
        model: sequelize.models.AgentProfile,
        attributes: ['profilePhotoUrl', 'bio']
      }]
    }],
    order: [['createdAt', 'DESC']],
    ...options
  });
};

Follow.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({
    where: {
      followerId,
      followingId,
      status: 'active'
    }
  });
  return !!follow;
};

Follow.toggleFollow = async function(followerId, followingId) {
  if (followerId === followingId) {
    throw new Error('Users cannot follow themselves');
  }

  const existingFollow = await this.findOne({
    where: { followerId, followingId }
  });

  if (existingFollow) {
    if (existingFollow.status === 'active') {
      await existingFollow.destroy();
      return { following: false, follow: null };
    } else {
      existingFollow.status = 'active';
      await existingFollow.save();
      return { following: true, follow: existingFollow };
    }
  } else {
    const newFollow = await this.create({
      followerId,
      followingId,
      status: 'active'
    });
    return { following: true, follow: newFollow };
  }
};

Follow.getFollowCounts = async function(userId) {
  const [followerCount, followingCount] = await Promise.all([
    this.count({
      where: {
        followingId: userId,
        status: 'active'
      }
    }),
    this.count({
      where: {
        followerId: userId,
        status: 'active'
      }
    })
  ]);

  return { followerCount, followingCount };
};

Follow.getMutualFollows = async function(userId1, userId2) {
  const user1Following = await this.findAll({
    where: {
      followerId: userId1,
      status: 'active'
    },
    attributes: ['followingId']
  });

  const user2Following = await this.findAll({
    where: {
      followerId: userId2,
      status: 'active'
    },
    attributes: ['followingId']
  });

  const user1FollowingIds = user1Following.map(f => f.followingId);
  const user2FollowingIds = user2Following.map(f => f.followingId);

  const mutualIds = user1FollowingIds.filter(id => user2FollowingIds.includes(id));

  if (mutualIds.length === 0) {
    return [];
  }

  return sequelize.models.User.findAll({
    where: {
      id: mutualIds
    },
    attributes: ['id', 'firstName', 'lastName'],
    include: [{
      model: sequelize.models.AgentProfile,
      attributes: ['profilePhotoUrl']
    }]
  });
};

module.exports = Follow;


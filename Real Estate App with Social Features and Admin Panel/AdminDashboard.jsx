import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1,
    limit: 20
  });
  const [postFilters, setPostFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 20
  });

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  // Fetch dashboard statistics
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Fetch users when filters change
  useEffect(() => {
    if (selectedTab === 'users') {
      fetchUsers();
    }
  }, [selectedTab, userFilters]);

  // Fetch posts when filters change
  useEffect(() => {
    if (selectedTab === 'posts') {
      fetchPosts();
    }
  }, [selectedTab, postFilters]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams(userFilters);
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams(postFilters);
      const response = await fetch(`/api/admin/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const updateUserStatus = async (userId, isActive, reason = '') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive, reason })
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const updatePostStatus = async (postId, status, reason = '') => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, reason })
      });
      
      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Error updating post status:', error);
    }
  };

  const StatCard = ({ title, value, description, icon: Icon, trend }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );

  const UserRow = ({ user }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <img
          src={user.profilePicture || '/default-avatar.png'}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <div className="font-medium">{user.firstName} {user.lastName}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
          {user.role}
        </Badge>
        <Badge variant={user.isActive ? 'default' : 'secondary'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant={user.isActive ? 'destructive' : 'default'}
          onClick={() => updateUserStatus(user.id, !user.isActive)}
        >
          {user.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </div>
  );

  const PostRow = ({ post }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="font-medium truncate">{post.content.substring(0, 100)}...</div>
        <div className="text-sm text-gray-500">
          By {post.author.firstName} {post.author.lastName} • {new Date(post.createdAt).toLocaleDateString()}
        </div>
        <div className="flex items-center space-x-4 mt-2">
          <span className="text-sm">{post.likeCount} likes</span>
          <span className="text-sm">{post.commentCount} comments</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge 
          variant={
            post.status === 'approved' ? 'default' : 
            post.status === 'rejected' ? 'destructive' : 
            'secondary'
          }
        >
          {post.status}
        </Badge>
        {post.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => updatePostStatus(post.id, 'approved')}
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updatePostStatus(post.id, 'rejected')}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your real estate agency platform</p>
        </div>
        <Button onClick={fetchDashboardStats}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {dashboardStats && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Users"
                  value={dashboardStats.overview.totalUsers}
                  description="Active platform users"
                  icon={Users}
                />
                <StatCard
                  title="Total Agents"
                  value={dashboardStats.overview.totalAgents}
                  description="Registered agents"
                  icon={Shield}
                />
                <StatCard
                  title="Total Posts"
                  value={dashboardStats.overview.totalPosts}
                  description="Published content"
                  icon={FileText}
                />
                <StatCard
                  title="Pending Posts"
                  value={dashboardStats.overview.pendingPosts}
                  description="Awaiting approval"
                  icon={AlertTriangle}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Agents</CardTitle>
                    <CardDescription>Most followed agents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardStats.topAgents.slice(0, 5).map((agent) => (
                        <div key={agent.id} className="flex items-center space-x-4">
                          <img
                            src={agent.profilePicture || '/default-avatar.png'}
                            alt={agent.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-gray-500">{agent.followerCount} followers</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest posts and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardStats.recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4">
                          <img
                            src={activity.author.profilePicture || '/default-avatar.png'}
                            alt={activity.author.firstName}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {activity.author.firstName} {activity.author.lastName}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {activity.content}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant={activity.status === 'approved' ? 'default' : 'secondary'}>
                            {activity.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search users..."
                value={userFilters.search}
                onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <Select
              value={userFilters.role}
              onValueChange={(value) => setUserFilters(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="newcomer">Newcomer</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={userFilters.status}
              onValueChange={(value) => setUserFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {users.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search posts..."
                value={postFilters.search}
                onChange={(e) => setPostFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <Select
              value={postFilters.status}
              onValueChange={(value) => setPostFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">Advanced analytics and reporting features coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="text-center py-12">
            <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">System Settings</h3>
            <p className="text-gray-600">System configuration and settings management coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;


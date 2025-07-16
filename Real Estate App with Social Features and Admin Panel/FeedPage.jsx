import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Plus,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Camera
} from 'lucide-react'

const FeedPage = () => {
  const { user, isAgent } = useAuth()
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  useEffect(() => {
    // Mock posts data
    setPosts([
      {
        id: 1,
        author: {
          id: 1,
          name: 'Sarah Johnson',
          role: 'Senior Agent',
          avatar: null
        },
        content: 'Just closed another amazing deal in downtown! 🏢 The market is really picking up this quarter. Excited to help more clients find their dream properties.',
        images: [],
        likes: 24,
        comments: 8,
        shares: 3,
        timestamp: '2 hours ago',
        isLiked: false
      },
      {
        id: 2,
        author: {
          id: 2,
          name: 'Michael Chen',
          role: 'Property Specialist',
          avatar: null
        },
        content: 'Market update: Residential properties in the suburban area are seeing a 15% increase in demand. Great time for both buyers and sellers! 📈',
        images: [],
        likes: 18,
        comments: 12,
        shares: 7,
        timestamp: '4 hours ago',
        isLiked: true
      },
      {
        id: 3,
        author: {
          id: 3,
          name: 'Emily Rodriguez',
          role: 'Market Analyst',
          avatar: null
        },
        content: 'Attended an amazing real estate conference today. Learned so much about emerging market trends and new technologies in property management. Knowledge sharing is key! 🎯',
        images: [],
        likes: 31,
        comments: 15,
        shares: 9,
        timestamp: '6 hours ago',
        isLiked: false
      }
    ])
  }, [])

  const handleCreatePost = async () => {
    if (!newPost.trim()) return
    
    setIsPosting(true)
    
    // Simulate API call
    setTimeout(() => {
      const post = {
        id: Date.now(),
        author: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          avatar: null
        },
        content: newPost,
        images: [],
        likes: 0,
        comments: 0,
        shares: 0,
        timestamp: 'Just now',
        isLiked: false
      }
      
      setPosts(prev => [post, ...prev])
      setNewPost('')
      setIsPosting(false)
    }, 1000)
  }

  const handleLike = (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ))
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-16 h-16 mx-auto">
                  <AvatarFallback className="text-lg">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{user?.firstName} {user?.lastName}</CardTitle>
                <CardDescription>
                  <Badge variant="secondary">{user?.role}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">24</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">156</div>
                    <div className="text-xs text-muted-foreground">Following</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  View Profile
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium">Market Growth</div>
                    <div className="text-sm text-muted-foreground">+15% this month</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Active Agents</div>
                    <div className="text-sm text-muted-foreground">150+ online</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-medium">This Week</div>
                    <div className="text-sm text-muted-foreground">25 new deals</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post (for agents) */}
            {isAgent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share an Update</CardTitle>
                  <CardDescription>
                    What's happening in your real estate world?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Share your latest success, market insights, or tips..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Camera className="w-4 h-4 mr-2" />
                        Photo
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        Location
                      </Button>
                    </div>
                    <Button 
                      onClick={handleCreatePost}
                      disabled={!newPost.trim() || isPosting}
                    >
                      {isPosting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {post.author.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{post.author.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {post.author.role} • {post.timestamp}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">{post.content}</p>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={post.isLiked ? 'text-red-500' : ''}
                        >
                          <Heart className={`w-4 h-4 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          {post.comments}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4 mr-2" />
                          {post.shares}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trending Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">#MarketUpdate</div>
                  <div className="text-xs text-muted-foreground">45 posts</div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium">#LuxuryHomes</div>
                  <div className="text-xs text-muted-foreground">32 posts</div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium">#FirstTimeBuyers</div>
                  <div className="text-xs text-muted-foreground">28 posts</div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium">#InvestmentTips</div>
                  <div className="text-xs text-muted-foreground">21 posts</div>
                </div>
              </CardContent>
            </Card>

            {/* Suggested Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested Connections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'David Wilson', role: 'Commercial Agent' },
                  { name: 'Lisa Park', role: 'Property Manager' },
                  { name: 'James Miller', role: 'Investment Advisor' }
                ].map((person, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{person.name}</div>
                        <div className="text-xs text-muted-foreground">{person.role}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Follow
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedPage


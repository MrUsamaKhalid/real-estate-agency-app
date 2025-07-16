import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, Phone, Mail, Calendar, TrendingUp } from 'lucide-react'

const AgentProfilePage = () => {
  const { id } = useParams()

  // Mock agent data
  const agent = {
    id: parseInt(id),
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@realestate.com',
    phone: '+1 (555) 123-4567',
    role: 'Senior Agent',
    specialties: ['Luxury Homes', 'Commercial', 'Investment'],
    location: 'Downtown District',
    bio: 'Experienced real estate professional with over 10 years in luxury and commercial properties. Passionate about helping clients achieve their real estate dreams.',
    totalSales: 45,
    rating: 4.9,
    reviewCount: 127,
    followerCount: 234,
    followingCount: 89,
    joinedDate: '2020-01-15'
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarFallback className="text-2xl">
                    {agent.firstName[0]}{agent.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{agent.firstName} {agent.lastName}</CardTitle>
                <p className="text-muted-foreground">{agent.role}</p>
                <div className="flex items-center justify-center space-x-1 mt-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{agent.rating}</span>
                  <span className="text-muted-foreground">({agent.reviewCount} reviews)</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{agent.totalSales}</div>
                    <div className="text-xs text-muted-foreground">Sales</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{agent.followerCount}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{agent.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{agent.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{agent.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Joined {new Date(agent.joinedDate).getFullYear()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {agent.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <Button className="w-full">Contact Agent</Button>
                  <Button variant="outline" className="w-full">Follow</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{agent.bio}</p>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium">Closed a luxury home deal</div>
                      <div className="text-sm text-muted-foreground">2 days ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="font-medium">Received 5-star review</div>
                      <div className="text-sm text-muted-foreground">1 week ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No recent posts to display.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentProfilePage


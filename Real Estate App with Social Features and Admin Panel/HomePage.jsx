import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  TrendingUp,
  Award,
  Building2,
  ArrowRight,
  Star,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Target,
  Heart,
  Shield
} from 'lucide-react'

const HomePage = () => {
  const { isAuthenticated, user } = useAuth()
  const [featuredAgents, setFeaturedAgents] = useState([])
  const [stats, setStats] = useState({
    totalAgents: 150,
    totalSales: 2500,
    happyClients: 5000,
    yearsExperience: 15
  })

  useEffect(() => {
    // Mock featured agents data
    setFeaturedAgents([
      {
        id: 1,
        name: 'Sarah Johnson',
        role: 'Senior Agent',
        specialties: ['Luxury Homes', 'Commercial'],
        totalSales: 45,
        rating: 4.9,
        image: null,
        location: 'Downtown District'
      },
      {
        id: 2,
        name: 'Michael Chen',
        role: 'Property Specialist',
        specialties: ['Residential', 'Investment'],
        totalSales: 38,
        rating: 4.8,
        image: null,
        location: 'Suburban Area'
      },
      {
        id: 3,
        name: 'Emily Rodriguez',
        role: 'Market Analyst',
        specialties: ['Market Research', 'Consulting'],
        totalSales: 52,
        rating: 5.0,
        image: null,
        location: 'Business District'
      }
    ])
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  🏆 #1 Real Estate Platform
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Connect with
                  <span className="text-primary"> Top Agents</span>
                  <br />
                  in Real Estate
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Join our exclusive social platform where real estate professionals 
                  connect, share insights, and grow their business together.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Button size="lg" asChild>
                    <Link to="/feed">
                      <Users className="mr-2 h-5 w-5" />
                      Explore Feed
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild>
                      <Link to="/register">
                        Get Started
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <Link to="/agents">
                        Browse Agents
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalAgents}+</div>
                  <div className="text-sm text-muted-foreground">Expert Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalSales}+</div>
                  <div className="text-sm text-muted-foreground">Properties Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.happyClients}+</div>
                  <div className="text-sm text-muted-foreground">Happy Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.yearsExperience}+</div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </div>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl p-8 backdrop-blur-sm border">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="transform rotate-3 hover:rotate-6 transition-transform">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Agent Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-full"></div>
                        <div>
                          <div className="text-xs font-medium">Sarah J.</div>
                          <div className="text-xs text-muted-foreground">Top Performer</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="transform -rotate-2 hover:-rotate-6 transition-transform mt-8">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Latest Post</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        "Just closed another deal! 🏡"
                      </div>
                      <div className="flex items-center mt-2 space-x-1">
                        <Heart className="w-3 h-3 text-red-500" />
                        <span className="text-xs">24 likes</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We provide the tools and community that real estate professionals need to succeed
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Professional Network</CardTitle>
                <CardDescription>
                  Connect with top agents, share experiences, and learn from industry leaders
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Market Insights</CardTitle>
                <CardDescription>
                  Get real-time market updates, trends, and insights from experienced professionals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Trusted Platform</CardTitle>
                <CardDescription>
                  Secure, verified profiles and a trusted environment for professional growth
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Agents Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Meet Our Top Agents
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with our highest-performing agents who are making a difference in real estate
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredAgents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <CardTitle>{agent.name}</CardTitle>
                  <CardDescription>{agent.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{agent.rating}</span>
                    <span className="text-muted-foreground">({agent.totalSales} sales)</span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{agent.location}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-center">
                    {agent.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/agents/${agent.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link to="/agents">
                View All Agents
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Company Values Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  Our Mission & Values
                </h2>
                <p className="text-xl text-muted-foreground">
                  We're committed to revolutionizing the real estate industry through 
                  innovation, collaboration, and excellence.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Excellence in Service</h3>
                    <p className="text-muted-foreground">
                      We strive to provide exceptional service and support to all our agents and clients.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Community First</h3>
                    <p className="text-muted-foreground">
                      Building strong relationships and fostering a supportive community of professionals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Integrity & Trust</h3>
                    <p className="text-muted-foreground">
                      Operating with transparency, honesty, and ethical practices in everything we do.
                    </p>
                  </div>
                </div>
              </div>

              <Button size="lg" asChild>
                <Link to="/company">
                  Learn More About Us
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-background rounded-lg p-4 shadow-sm">
                      <Award className="w-8 h-8 text-primary mb-2" />
                      <div className="text-sm font-medium">Industry Awards</div>
                      <div className="text-xs text-muted-foreground">15+ Recognition</div>
                    </div>
                    <div className="bg-background rounded-lg p-4 shadow-sm">
                      <Building2 className="w-8 h-8 text-primary mb-2" />
                      <div className="text-sm font-medium">Office Locations</div>
                      <div className="text-xs text-muted-foreground">25+ Cities</div>
                    </div>
                  </div>
                  <div className="space-y-4 mt-8">
                    <div className="bg-background rounded-lg p-4 shadow-sm">
                      <TrendingUp className="w-8 h-8 text-primary mb-2" />
                      <div className="text-sm font-medium">Growth Rate</div>
                      <div className="text-xs text-muted-foreground">150% YoY</div>
                    </div>
                    <div className="bg-background rounded-lg p-4 shadow-sm">
                      <Users className="w-8 h-8 text-primary mb-2" />
                      <div className="text-sm font-medium">Team Members</div>
                      <div className="text-xs text-muted-foreground">500+ Professionals</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Ready to Join Our Community?
              </h2>
              <p className="text-xl opacity-90">
                Connect with top real estate professionals, share your expertise, 
                and grow your business with our exclusive platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/register">
                    Get Started Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                  <Link to="/company">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage


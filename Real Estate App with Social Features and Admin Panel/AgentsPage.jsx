import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search,
  Filter,
  Star,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Users,
  Award,
  Grid3X3,
  List
} from 'lucide-react'

const AgentsPage = () => {
  const [agents, setAgents] = useState([])
  const [filteredAgents, setFilteredAgents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [viewMode, setViewMode] = useState('grid')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock agents data
    const mockAgents = [
      {
        id: 1,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@realestate.com',
        phone: '+1 (555) 123-4567',
        role: 'Senior Agent',
        specialties: ['Luxury Homes', 'Commercial', 'Investment'],
        location: 'Downtown District',
        bio: 'Experienced real estate professional with over 10 years in luxury and commercial properties.',
        totalSales: 45,
        rating: 4.9,
        reviewCount: 127,
        followerCount: 234,
        isFeatured: true,
        profilePhoto: null,
        joinedDate: '2020-01-15'
      },
      {
        id: 2,
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@realestate.com',
        phone: '+1 (555) 234-5678',
        role: 'Property Specialist',
        specialties: ['Residential', 'Investment', 'First-Time Buyers'],
        location: 'Suburban Area',
        bio: 'Passionate about helping families find their perfect home. Specializing in residential properties.',
        totalSales: 38,
        rating: 4.8,
        reviewCount: 89,
        followerCount: 189,
        isFeatured: false,
        profilePhoto: null,
        joinedDate: '2019-06-20'
      },
      {
        id: 3,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@realestate.com',
        phone: '+1 (555) 345-6789',
        role: 'Market Analyst',
        specialties: ['Market Research', 'Consulting', 'Commercial'],
        location: 'Business District',
        bio: 'Market expert with deep insights into real estate trends and investment opportunities.',
        totalSales: 52,
        rating: 5.0,
        reviewCount: 156,
        followerCount: 312,
        isFeatured: true,
        profilePhoto: null,
        joinedDate: '2018-03-10'
      },
      {
        id: 4,
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@realestate.com',
        phone: '+1 (555) 456-7890',
        role: 'Commercial Agent',
        specialties: ['Commercial', 'Industrial', 'Retail'],
        location: 'Industrial Zone',
        bio: 'Commercial real estate expert helping businesses find the perfect location for growth.',
        totalSales: 29,
        rating: 4.7,
        reviewCount: 73,
        followerCount: 145,
        isFeatured: false,
        profilePhoto: null,
        joinedDate: '2021-09-05'
      },
      {
        id: 5,
        firstName: 'Lisa',
        lastName: 'Park',
        email: 'lisa.park@realestate.com',
        phone: '+1 (555) 567-8901',
        role: 'Property Manager',
        specialties: ['Property Management', 'Rentals', 'Maintenance'],
        location: 'Residential Area',
        bio: 'Dedicated property manager ensuring optimal returns for property investors.',
        totalSales: 67,
        rating: 4.9,
        reviewCount: 203,
        followerCount: 278,
        isFeatured: true,
        profilePhoto: null,
        joinedDate: '2017-11-12'
      },
      {
        id: 6,
        firstName: 'James',
        lastName: 'Miller',
        email: 'james.miller@realestate.com',
        phone: '+1 (555) 678-9012',
        role: 'Investment Advisor',
        specialties: ['Investment', 'Portfolio Management', 'Market Analysis'],
        location: 'Financial District',
        bio: 'Investment specialist helping clients build wealth through strategic real estate investments.',
        totalSales: 41,
        rating: 4.8,
        reviewCount: 98,
        followerCount: 201,
        isFeatured: false,
        profilePhoto: null,
        joinedDate: '2020-07-22'
      }
    ]

    setTimeout(() => {
      setAgents(mockAgents)
      setFilteredAgents(mockAgents)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = [...agents]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(agent =>
        `${agent.firstName} ${agent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.specialties.some(specialty => specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
        agent.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Specialty filter
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(agent =>
        agent.specialties.some(specialty => specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()))
      )
    }

    // Location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(agent =>
        agent.location.toLowerCase().includes(selectedLocation.toLowerCase())
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'sales':
          return b.totalSales - a.totalSales
        case 'followers':
          return b.followerCount - a.followerCount
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        default:
          return 0
      }
    })

    setFilteredAgents(filtered)
  }, [agents, searchTerm, selectedSpecialty, selectedLocation, sortBy])

  const specialties = ['all', 'luxury homes', 'commercial', 'residential', 'investment', 'property management']
  const locations = ['all', 'downtown', 'suburban', 'business district', 'industrial', 'residential area']

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Agents...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Our Real Estate Agents</h1>
          <p className="text-muted-foreground">
            Connect with our experienced professionals who are ready to help you achieve your real estate goals.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{agents.length}</div>
              <div className="text-sm text-muted-foreground">Total Agents</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{agents.filter(a => a.isFeatured).length}</div>
              <div className="text-sm text-muted-foreground">Featured</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{agents.reduce((sum, a) => sum + a.totalSales, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {(agents.reduce((sum, a) => sum + a.rating, 0) / agents.length).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search agents, specialties, or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Specialty Filter */}
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty === 'all' ? 'All Specialties' : specialty.charAt(0).toUpperCase() + specialty.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Location Filter */}
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>
                      {location === 'all' ? 'All Locations' : location.charAt(0).toUpperCase() + location.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="sales">Most Sales</SelectItem>
                  <SelectItem value="followers">Most Followers</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredAgents.length} of {agents.length} agents
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agents Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  {agent.isFeatured && (
                    <Badge className="absolute top-4 right-4" variant="secondary">
                      Featured
                    </Badge>
                  )}
                  <Avatar className="w-20 h-20 mx-auto">
                    <AvatarFallback className="text-lg">
                      {agent.firstName[0]}{agent.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{agent.firstName} {agent.lastName}</CardTitle>
                  <CardDescription>{agent.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{agent.rating}</span>
                    <span className="text-muted-foreground">({agent.reviewCount})</span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{agent.location}</span>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-medium">{agent.totalSales} Sales</div>
                    <div className="text-xs text-muted-foreground">{agent.followerCount} Followers</div>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-center">
                    {agent.specialties.slice(0, 2).map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {agent.specialties.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{agent.specialties.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={`/agents/${agent.id}`}>
                        View Profile
                      </Link>
                    </Button>
                    <Button size="sm" className="flex-1">
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAgents.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="text-lg">
                        {agent.firstName[0]}{agent.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold">
                          {agent.firstName} {agent.lastName}
                        </h3>
                        {agent.isFeatured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">{agent.role}</p>
                      <p className="text-sm text-muted-foreground mb-3">{agent.bio}</p>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{agent.rating} ({agent.reviewCount})</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{agent.location}</span>
                        </div>
                        <div>{agent.totalSales} Sales</div>
                        <div>{agent.followerCount} Followers</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/agents/${agent.id}`}>
                          View Profile
                        </Link>
                      </Button>
                      <Button size="sm">
                        Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredAgents.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No agents found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters to find more agents.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default AgentsPage


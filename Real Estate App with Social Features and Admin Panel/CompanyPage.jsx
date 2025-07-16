import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Award, TrendingUp, Target, Heart, Shield } from 'lucide-react'

const CompanyPage = () => {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">About Real Estate Agency</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Leading the real estate industry with innovation, integrity, and exceptional service for over 15 years.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">150+</div>
              <div className="text-sm text-muted-foreground">Expert Agents</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">2500+</div>
              <div className="text-sm text-muted-foreground">Properties Sold</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">5000+</div>
              <div className="text-sm text-muted-foreground">Happy Clients</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Award className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">15+</div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Mission & Vision */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Our Mission</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  To revolutionize the real estate industry by providing exceptional service, 
                  innovative solutions, and building lasting relationships with our clients and community.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Our Values</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Integrity</h4>
                  <p className="text-sm text-muted-foreground">
                    Operating with transparency, honesty, and ethical practices in everything we do.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Excellence</h4>
                  <p className="text-sm text-muted-foreground">
                    Striving for the highest standards in service delivery and professional expertise.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Community</h4>
                  <p className="text-sm text-muted-foreground">
                    Building strong relationships and fostering a supportive community of professionals.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leadership Team */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Leadership Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { name: 'John Smith', role: 'CEO & Founder', experience: '20+ years' },
                  { name: 'Maria Garcia', role: 'COO', experience: '15+ years' },
                  { name: 'Robert Johnson', role: 'Head of Sales', experience: '18+ years' },
                  { name: 'Jennifer Lee', role: 'Head of Marketing', experience: '12+ years' }
                ].map((leader, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                      {leader.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold">{leader.name}</div>
                      <div className="text-sm text-muted-foreground">{leader.role}</div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {leader.experience}
                      </Badge>
                    </div>
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

export default CompanyPage


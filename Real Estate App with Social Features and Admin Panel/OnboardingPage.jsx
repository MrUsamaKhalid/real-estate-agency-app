import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, BookOpen, Users, Award, CheckCircle } from 'lucide-react'

const OnboardingPage = () => {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Real Estate Agency</h1>
          <p className="text-muted-foreground">
            Get started with our comprehensive onboarding program designed for newcomers.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Progress */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Account Setup</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground"></div>
                  <span className="text-sm text-muted-foreground">Company Introduction</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground"></div>
                  <span className="text-sm text-muted-foreground">Meet the Team</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground"></div>
                  <span className="text-sm text-muted-foreground">Platform Training</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Company Introduction</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Learn about our company history, mission, values, and what makes us unique in the real estate industry.
                </p>
                <Button>
                  <Play className="w-4 h-4 mr-2" />
                  Watch Introduction Video
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Meet the Team</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Get to know our leadership team, department heads, and key personnel who will support your journey.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {['Leadership Team', 'Sales Department', 'Marketing Team', 'Support Staff'].map((team) => (
                    <Button key={team} variant="outline" className="justify-start">
                      {team}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Success Stories</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Discover inspiring success stories from our agents and learn about our company achievements.
                </p>
                <div className="space-y-3">
                  {[
                    { title: 'Record-Breaking Quarter', category: 'Company Achievement' },
                    { title: 'Agent of the Year Award', category: 'Individual Success' },
                    { title: 'Community Impact Initiative', category: 'Social Responsibility' }
                  ].map((story, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{story.title}</div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {story.category}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        Read More
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage


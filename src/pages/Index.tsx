
import { useState } from "react";
import { MapPin, Navigation, Users, Smartphone, Accessibility, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const features = [
    {
      id: "maps",
      icon: MapPin,
      title: "Interactive Campus Maps",
      description: "Detailed outdoor and indoor navigation with custom markers for buildings, lecture halls, and key facilities.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "essentials",
      icon: Star,
      title: "First-Year Essentials",
      description: "Highlighted critical locations including orientation spots, student services, and cafeterias with smart filters.",
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "ar",
      icon: Smartphone,
      title: "AR Navigation Mode",
      description: "Camera-based wayfinding with real-time directional overlays for immersive navigation experience.",
      color: "from-green-500 to-emerald-500"
    },
    {
      id: "ai",
      icon: Navigation,
      title: "AI-Powered Suggestions",
      description: "Personalized route recommendations based on your schedule, preferences, and real-time campus data.",
      color: "from-orange-500 to-red-500"
    },
    {
      id: "accessibility",
      icon: Accessibility,
      title: "Accessibility-First Design",
      description: "Wheelchair-accessible routes, voice-guided navigation, and real-time accessibility information.",
      color: "from-teal-500 to-blue-500"
    },
    {
      id: "social",
      icon: Users,
      title: "Social & Gamification",
      description: "Save favorite spots, share routes with friends, and earn badges for exploring campus locations.",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="w-full p-6 backdrop-blur-sm bg-white/70 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Campus Compass
              </h1>
              <p className="text-sm text-gray-600">Smart University Navigation</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
              Features
            </Button>
            <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
              About
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200 px-4 py-2 text-sm font-medium">
            🎓 Perfect for First-Year Students
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
            Navigate Your
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Campus Journey
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Smart university navigation system with interactive maps, AR wayfinding, 
            and AI-powered suggestions to help you explore campus with confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              Start Exploring
              <Navigation className="ml-2 w-5 h-5" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
            >
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-15 animate-pulse delay-300"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-25 animate-pulse delay-700"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Powerful Navigation Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to navigate your university campus with ease and confidence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card 
                  key={feature.id}
                  className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-0 bg-white/80 backdrop-blur-sm"
                  onMouseEnter={() => setIsHovered(feature.id)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center transform transition-transform duration-300 ${isHovered === feature.id ? 'scale-110 rotate-3' : ''}`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 text-center leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
            <div className="space-y-2">
              <div className="text-4xl font-bold">500+</div>
              <div className="text-blue-100">Campus Locations</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">50+</div>
              <div className="text-blue-100">Buildings Mapped</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">24/7</div>
              <div className="text-blue-100">Live Updates</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">95%</div>
              <div className="text-blue-100">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Ready to Explore Your Campus?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of students who have discovered the easiest way to navigate their university campus.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              Start Navigation
              <MapPin className="ml-2 w-5 h-5" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 px-10 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Campus Compass</span>
          </div>
          
          <p className="text-gray-400 mb-4">
            Smart University Navigation System - Helping students navigate campus with confidence
          </p>
          
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

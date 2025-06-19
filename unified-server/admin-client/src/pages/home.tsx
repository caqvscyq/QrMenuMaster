import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Clock, Star, Users, ShoppingCart, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Afly OrderMeals</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#menu" className="text-gray-600 hover:text-gray-900">Menu</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            </nav>
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/menu">
                <Button className="bg-orange-600 hover:bg-orange-700">Order Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Delicious Food
            <span className="block text-orange-600">Delivered Fresh</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience the finest dining with our carefully crafted menu. Order online and enjoy 
            restaurant-quality meals delivered right to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/menu">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Browse Menu
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3">
              <Clock className="mr-2 h-5 w-5" />
              View Hours
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Afly OrderMeals?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're committed to providing exceptional food and service that exceeds your expectations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <ChefHat className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Expert Chefs</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our experienced chefs use only the finest ingredients to create memorable dining experiences.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Fast Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Quick and reliable delivery service ensures your food arrives hot and fresh every time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Quality Guaranteed</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We stand behind every dish with our satisfaction guarantee and commitment to excellence.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Items Preview */}
      <section id="menu" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Menu Items</h2>
            <p className="text-gray-600">Taste our most loved dishes</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <Card className="overflow-hidden">
              <div className="h-48 bg-gray-200 bg-cover bg-center" 
                   style={{backgroundImage: "url('https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300')"}} />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Grilled Salmon</CardTitle>
                  <Badge variant="secondary">$24.99</Badge>
                </div>
                <CardDescription>
                  Fresh Atlantic salmon with seasonal vegetables and herbs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-48 bg-gray-200 bg-cover bg-center" 
                   style={{backgroundImage: "url('https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300')"}} />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Margherita Pizza</CardTitle>
                  <Badge variant="secondary">$18.99</Badge>
                </div>
                <CardDescription>
                  Traditional pizza with fresh mozzarella and basil
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-48 bg-gray-200 bg-cover bg-center" 
                   style={{backgroundImage: "url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300')"}} />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Classic Beef Burger</CardTitle>
                  <Badge variant="secondary">$16.99</Badge>
                </div>
                <CardDescription>
                  Juicy beef patty with lettuce, tomato, and cheese
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/menu">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                View Full Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center mb-4">
                <Users className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold mb-2">10,000+</div>
              <div className="text-orange-100">Happy Customers</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <Star className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold mb-2">4.9/5</div>
              <div className="text-orange-100">Average Rating</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold mb-2">30 min</div>
              <div className="text-orange-100">Average Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <ChefHat className="h-8 w-8 text-orange-600" />
                <span className="ml-2 text-xl font-bold">Afly OrderMeals</span>
              </div>
              <p className="text-gray-400">
                Bringing you delicious food with exceptional service since 2024.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/menu" className="hover:text-white">Menu</Link></li>
                <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Contact Info</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Phone: (555) 123-4567</li>
                <li>Email: info@aflyordermeals.com</li>
                <li>Address: 123 Food Street</li>
                <li>City, State 12345</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Hours</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Monday - Friday: 11am - 10pm</li>
                <li>Saturday: 10am - 11pm</li>
                <li>Sunday: 10am - 9pm</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 Afly OrderMeals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
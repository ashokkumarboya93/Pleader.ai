import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scale, MessageSquare, FileText, Database, ArrowRight, CheckCircle, Menu, X } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const features = [
    {
      icon: <MessageSquare className="w-8 h-8 text-green-500" />,
      title: "Legal Query Assistant",
      description: "Get instant answers to your legal questions with AI-powered guidance based on Indian law."
    },
    {
      icon: <FileText className="w-8 h-8 text-green-500" />,
      title: "Document Analysis",
      description: "Upload and analyze legal documents to identify key clauses, risks, and recommendations."
    },
    {
      icon: <Database className="w-8 h-8 text-green-500" />,
      title: "RAG-Powered Accuracy",
      description: "Advanced retrieval system ensures responses are grounded in verified legal knowledge."
    }
  ];

  const steps = [
    { number: "01", title: "Sign Up", description: "Create your account in seconds" },
    { number: "02", title: "Ask Questions", description: "Chat with AI about your legal concerns" },
    { number: "03", title: "Upload Documents", description: "Analyze contracts and legal papers" },
    { number: "04", title: "Get Guidance", description: "Receive actionable legal insights" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2" data-testid="logo">
              <Scale className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">Pleader AI</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-green-500 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-green-500 transition-colors font-medium">How It Works</a>
              <a href="#about" className="text-gray-600 hover:text-green-500 transition-colors font-medium">About</a>
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-green-500"
                data-testid="login-button"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                className="bg-green-500 hover:bg-green-600 text-white px-6"
                data-testid="signup-button"
              >
                Sign Up
              </Button>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-green-500 transition-colors font-medium">Features</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-green-500 transition-colors font-medium">How It Works</a>
                <a href="#about" className="text-gray-600 hover:text-green-500 transition-colors font-medium">About</a>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-gray-600 hover:text-green-500 justify-start"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Sign Up
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white py-20 lg:py-32" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left animate-fade-in">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Your Personal <span className="text-green-500">Legal Advocate</span> Powered by AI
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Get instant legal guidance, analyze documents, and navigate Indian law with confidence using advanced AI technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg rounded-xl"
                  data-testid="hero-cta-button"
                >
                  Start Chatting <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-green-500 text-green-600 hover:bg-green-50 px-8 py-6 text-lg rounded-xl"
                  data-testid="learn-more-button"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1590099543482-3b3d3083a474"
                alt="Legal AI Technology"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for Legal Assistance
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to understand and navigate legal matters with confidence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border-2 border-green-100 rounded-2xl p-8 hover:border-green-300 hover:shadow-xl transition-all duration-300 hover-lift"
                data-testid={`feature-card-${index}`}
              >
                <div className="bg-green-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-green-50 to-white" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with Pleader AI in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative" data-testid={`step-${index}`}>
                <div className="bg-white rounded-2xl p-6 border-2 border-green-100 hover:border-green-300 transition-all duration-300 hover-lift">
                  <div className="text-5xl font-bold text-green-500/20 mb-4">{step.number}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-green-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <img
              src="https://images.unsplash.com/photo-1675865254433-6ba341f0f00b"
              alt="AI Chatbot Interface"
              className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="about" className="py-20 bg-white" data-testid="benefits-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1589307904488-7d60ff29c975"
                alt="Legal Documentation"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Why Choose Pleader AI?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Navigate complex legal matters with confidence using our AI-powered platform designed specifically for Indian law.
              </p>
              <div className="space-y-4">
                {[
                  "24/7 access to legal guidance",
                  "Instant document analysis and review",
                  "Based on Indian Constitution and legal precedents",
                  "Secure and confidential",
                  "Cost-effective legal assistance"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-500 to-green-600" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-green-50 mb-8">
            Join thousands of users who trust Pleader AI for their legal needs
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/signup')}
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl"
            data-testid="cta-button"
          >
            Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Scale className="w-6 h-6 text-green-500" />
                <span className="text-xl font-bold">Pleader AI</span>
              </div>
              <p className="text-gray-400">
                Your personal legal advocate powered by AI
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-green-500 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-green-500 transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-green-500 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-500 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Pleader AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

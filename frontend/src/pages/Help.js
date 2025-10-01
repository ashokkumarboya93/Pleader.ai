import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scale, ArrowLeft, Search, MessageSquare, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

const Help = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'general',
    message: ''
  });

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click on the 'Sign Up' button on the homepage. You can sign up using your email or Google account. Follow the prompts to complete your registration."
        },
        {
          q: "Is Pleader AI free to use?",
          a: "Yes, Pleader AI offers a free tier with basic features. Premium features and unlimited usage are available with paid plans."
        },
        {
          q: "What kind of legal questions can I ask?",
          a: "You can ask any questions related to Indian law, including property law, contract law, criminal law, family law, and more. Our AI is trained on Indian legal documents and precedents."
        }
      ]
    },
    {
      category: "Features",
      questions: [
        {
          q: "How does document analysis work?",
          a: "Upload your legal document (PDF, DOC, or TXT), and our AI will analyze it to identify key clauses, potential risks, and provide recommendations based on Indian law."
        },
        {
          q: "Can I save my chat conversations?",
          a: "Yes, all your chat conversations are automatically saved and can be accessed from the sidebar in your dashboard."
        },
        {
          q: "How accurate is the legal information provided?",
          a: "Our AI is powered by advanced language models and trained on verified legal documents. However, the information should be used as guidance only and not as a substitute for professional legal advice."
        }
      ]
    },
    {
      category: "Technical Issues",
      questions: [
        {
          q: "Why is my document upload failing?",
          a: "Ensure your document is in a supported format (PDF, DOC, DOCX, or TXT) and doesn't exceed the file size limit of 10MB. If the problem persists, try a different browser or contact support."
        },
        {
          q: "The AI is not responding to my questions",
          a: "Check your internet connection and ensure you're logged in. If the issue continues, try refreshing the page or clearing your browser cache."
        },
        {
          q: "How do I export my chat history?",
          a: "Click the 'Export' button at the top of your chat window. You can choose to export as PDF, Word document, or plain text."
        }
      ]
    },
    {
      category: "Billing",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards, debit cards, UPI, and net banking for Indian users."
        },
        {
          q: "Can I cancel my subscription anytime?",
          a: "Yes, you can cancel your subscription at any time from the Billing section in Settings. Your access will continue until the end of your billing period."
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const handleSubmitContact = (e) => {
    e.preventDefault();
    toast.success('Message sent! We will get back to you soon.');
    setContactForm({ subject: '', category: 'general', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="help-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                data-testid="back-button"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <Scale className="w-6 h-6 text-green-500" />
                <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help articles..."
              className="pl-10 h-12"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          {filteredFaqs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No results found for "{searchQuery}"</p>
          ) : (
            <div className="space-y-6">
              {filteredFaqs.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{category.category}</h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`${categoryIndex}-${index}`}
                        className="border border-gray-200 rounded-lg px-4"
                        data-testid={`faq-item-${categoryIndex}-${index}`}
                      >
                        <AccordionTrigger className="text-left font-medium text-gray-900 hover:text-green-600">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Support</h2>
            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                  className="mt-2"
                  data-testid="subject-input"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={contactForm.category}
                  onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg"
                  data-testid="category-select"
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your issue or question in detail"
                  required
                  rows={5}
                  className="mt-2"
                  data-testid="message-textarea"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                data-testid="submit-contact-button"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <a href="mailto:support@pleaderai.com" className="text-green-600 hover:text-green-700">
                      support@pleaderai.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <a href="tel:+911234567890" className="text-green-600 hover:text-green-700">
                      +91 123 456 7890
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Response Time</h3>
              <p className="text-gray-700 text-sm">
                We typically respond to inquiries within 24-48 hours on business days.
                For urgent matters, please call our support line.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-2">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-green-600 hover:text-green-700">
                    Video Tutorials
                  </a>
                </li>
                <li>
                  <a href="#" className="text-green-600 hover:text-green-700">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-green-600 hover:text-green-700">
                    Community Forum
                  </a>
                </li>
                <li>
                  <a href="#" className="text-green-600 hover:text-green-700">
                    Feature Requests
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;

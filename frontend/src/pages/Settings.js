import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Scale, ArrowLeft, User, Bell, Shield, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    notifications: true
  });

  const handleSavePreferences = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="settings-page">
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
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="profile" data-testid="profile-tab">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" data-testid="preferences-tab">
              <Bell className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="security-tab">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="billing" data-testid="billing-tab">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    defaultValue={user?.name}
                    className="mt-2"
                    data-testid="name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email}
                    className="mt-2"
                    disabled
                    data-testid="email-input"
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="mt-2"
                    data-testid="phone-input"
                  />
                </div>
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    placeholder="e.g., Lawyer, Business Owner"
                    className="mt-2"
                    data-testid="occupation-input"
                  />
                </div>
                <Button
                  onClick={handleSavePreferences}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  data-testid="save-profile-button"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Theme</Label>
                    <p className="text-sm text-gray-500">Choose your preferred theme</p>
                  </div>
                  <select
                    className="px-4 py-2 border border-gray-200 rounded-lg"
                    value={preferences.theme}
                    onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                    data-testid="theme-select"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Language</Label>
                    <p className="text-sm text-gray-500">Select your preferred language</p>
                  </div>
                  <select
                    className="px-4 py-2 border border-gray-200 rounded-lg"
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    data-testid="language-select"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Notifications</Label>
                    <p className="text-sm text-gray-500">Receive updates and alerts</p>
                  </div>
                  <Switch
                    checked={preferences.notifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, notifications: checked })}
                    data-testid="notifications-switch"
                  />
                </div>

                <Button
                  onClick={handleSavePreferences}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  data-testid="save-preferences-button"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    className="mt-2"
                    data-testid="current-password-input"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    className="mt-2"
                    data-testid="new-password-input"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="mt-2"
                    data-testid="confirm-new-password-input"
                  />
                </div>
                <Button
                  className="bg-green-500 hover:bg-green-600 text-white"
                  data-testid="change-password-button"
                >
                  Change Password
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Billing Information</h2>
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No billing information available</p>
                <p className="text-sm text-gray-500 mt-2">You're currently on a free plan</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
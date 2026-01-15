import { User, Bell, Shield, Key, Save } from 'lucide-react';
import { useState } from 'react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Save },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#2563EB] text-[#2563EB]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-4">Profile Information</h3>
                
                {/* Avatar Upload */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-24 h-24 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-2xl">
                    JD
                  </div>
                  <div>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mb-2">
                      Change Photo
                    </button>
                    <p className="text-gray-600 text-sm">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      defaultValue="John"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      defaultValue="Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  defaultValue="john.doe@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  defaultValue="Engineering"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  defaultValue="Senior Engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-4">
                <button className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-4">Default Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Default AI Model</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                      <option>Fast Extraction v2.1</option>
                      <option>Precision Extract v3.0</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Default Excel Template</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                      <option>Standard GA Export</option>
                      <option>Detailed Analysis</option>
                      <option>Summary Report</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Default PowerPoint Template</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                      <option>Executive Summary</option>
                      <option>Technical Presentation</option>
                      <option>Client Report</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-gray-900 mb-4">Regional Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Units</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                      <option>Metric (m, kg)</option>
                      <option>Imperial (ft, lb)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Date Format</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                      <option>YYYY-MM-DD</option>
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Time Format</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                      <option>24-hour</option>
                      <option>12-hour (AM/PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Timezone</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                      <option>UTC+0 (London)</option>
                      <option>UTC-5 (New York)</option>
                      <option>UTC+8 (Singapore)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-4">Email Notifications</h3>
                
                <div className="space-y-4">
                  {[
                    { id: 'extraction-complete', label: 'Extraction completed', description: 'Get notified when an extraction finishes', checked: true },
                    { id: 'extraction-failed', label: 'Extraction failed', description: 'Alert when an extraction fails', checked: true },
                    { id: 'weekly-summary', label: 'Weekly summary', description: 'Receive weekly activity summary', checked: true },
                    { id: 'new-features', label: 'New features', description: 'Updates about new features and improvements', checked: false },
                    { id: 'maintenance', label: 'Maintenance alerts', description: 'System maintenance notifications', checked: true },
                  ].map((notification) => (
                    <div key={notification.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="text-gray-900 mb-1">{notification.label}</div>
                        <div className="text-gray-600 text-sm">{notification.description}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={notification.checked}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#2563EB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-gray-900 mb-4">Notification Delivery</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-gray-700">Send to my email address</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-700">Send to alternate email</span>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
                  Save Notification Settings
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <button className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
                    Update Password
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-gray-900 mb-4">Two-Factor Authentication</h3>
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg max-w-md">
                  <div>
                    <div className="text-gray-900 mb-1">2FA Status</div>
                    <div className="text-gray-600 text-sm">Add an extra layer of security</div>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Enable
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-gray-900 mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  {[
                    { device: 'Chrome on Windows', location: 'New York, USA', current: true, time: 'Active now' },
                    { device: 'Safari on MacOS', location: 'London, UK', current: false, time: '2 days ago' },
                  ].map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="text-gray-900 mb-1">
                          {session.device}
                          {session.current && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {session.location} • {session.time}
                        </div>
                      </div>
                      {!session.current && (
                        <button className="text-red-600 hover:underline text-sm">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-gray-900 mb-4">API Keys</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="text-gray-900 mb-1">Production API Key</div>
                      <div className="text-gray-600 text-sm monospace">••••••••••••••••••••1a2b</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-600 hover:text-gray-900 rounded transition-colors">
                        <Key size={18} />
                      </button>
                      <button className="text-red-600 hover:underline text-sm">Revoke</button>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-[#2563EB] hover:text-[#2563EB] transition-colors">
                    + Generate New API Key
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

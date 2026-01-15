import { UserPlus, Search, MoreVertical, Shield, Activity } from 'lucide-react';
import { useState } from 'react';

export function Users() {
  const [searchQuery, setSearchQuery] = useState('');

  const users = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@company.com',
      role: 'admin',
      department: 'Engineering',
      lastActive: '2025-12-01 14:30',
      status: 'active',
      extractions: 247,
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      role: 'engineer',
      department: 'Design',
      lastActive: '2025-12-01 13:45',
      status: 'active',
      extractions: 189,
    },
    {
      id: 3,
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      role: 'engineer',
      department: 'Engineering',
      lastActive: '2025-12-01 11:20',
      status: 'active',
      extractions: 312,
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily.d@company.com',
      role: 'viewer',
      department: 'QA',
      lastActive: '2025-11-30 16:15',
      status: 'active',
      extractions: 45,
    },
    {
      id: 5,
      name: 'Robert Taylor',
      email: 'robert.t@company.com',
      role: 'engineer',
      department: 'Production',
      lastActive: '2025-11-29 09:30',
      status: 'inactive',
      extractions: 156,
    },
  ];

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin' },
      engineer: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Engineer' },
      viewer: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Viewer' },
    };
    const style = styles[role as keyof typeof styles] || styles.viewer;
    return (
      <span className={`px-3 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Inactive</span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Users</h1>
        <p className="text-gray-600">Manage user access and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 mb-1">Total Users</div>
          <div className="text-gray-900">{users.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 mb-1">Active Users</div>
          <div className="text-gray-900">{users.filter((u) => u.status === 'active').length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 mb-1">Administrators</div>
          <div className="text-gray-900">{users.filter((u) => u.role === 'admin').length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 mb-1">Total Extractions</div>
          <div className="text-gray-900 monospace">
            {users.reduce((acc, u) => acc + u.extractions, 0)}
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <button className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">User</th>
                <th className="px-6 py-3 text-left text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-gray-700">Department</th>
                <th className="px-6 py-3 text-left text-gray-700">Last Active</th>
                <th className="px-6 py-3 text-left text-gray-700">Extractions</th>
                <th className="px-6 py-3 text-left text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white flex-shrink-0">
                        {getInitials(user.name)}
                      </div>
                      <div className="text-gray-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 monospace">{user.email}</td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-gray-600">{user.department}</td>
                  <td className="px-6 py-4 text-gray-600 monospace">{user.lastActive}</td>
                  <td className="px-6 py-4 text-gray-600 monospace">{user.extractions}</td>
                  <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Activity className="text-gray-600" size={24} />
            <h2 className="text-gray-900">Recent Activity</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              {
                user: 'John Doe',
                action: 'completed extraction',
                file: 'GA-001-Rev-C.pdf',
                time: '2 hours ago',
              },
              {
                user: 'Mike Chen',
                action: 'uploaded new template',
                file: 'Custom_Export.xlsx',
                time: '3 hours ago',
              },
              {
                user: 'Sarah Johnson',
                action: 'started extraction',
                file: 'GA-009-Layout.dwg',
                time: '5 hours ago',
              },
              {
                user: 'Emily Davis',
                action: 'downloaded export',
                file: 'GA-002-Layout_export.xlsx',
                time: '1 day ago',
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
                  {getInitials(activity.user)}
                </div>
                <div className="flex-1">
                  <div className="text-gray-900">
                    <span>{activity.user}</span>{' '}
                    <span className="text-gray-600">{activity.action}</span>{' '}
                    <span className="monospace">{activity.file}</span>
                  </div>
                  <div className="text-gray-500 text-sm">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

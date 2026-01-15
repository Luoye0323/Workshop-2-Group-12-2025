import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, FileText, CheckCircle, Clock } from 'lucide-react';

export function Analytics() {
  const extractionsByMonth = [
    { month: 'Jul', extractions: 45 },
    { month: 'Aug', extractions: 52 },
    { month: 'Sep', extractions: 38 },
    { month: 'Oct', extractions: 61 },
    { month: 'Nov', extractions: 58 },
    { month: 'Dec', extractions: 12 },
  ];

  const successRateTrend = [
    { month: 'Jul', rate: 96.2 },
    { month: 'Aug', rate: 97.1 },
    { month: 'Sep', rate: 95.8 },
    { month: 'Oct', rate: 98.3 },
    { month: 'Nov', rate: 97.9 },
    { month: 'Dec', rate: 98.4 },
  ];

  const fileTypes = [
    { name: 'GA Drawings', value: 120, color: '#3b82f6' },
    { name: 'Technical Specs', value: 68, color: '#8b5cf6' },
    { name: 'Floor Plans', value: 45, color: '#10b981' },
    { name: 'Details', value: 34, color: '#f59e0b' },
  ];

  const stats = [
    { label: 'Avg. Processing Time', value: '2.4s', icon: Clock, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Files Processed', value: '267', icon: FileText, color: 'bg-purple-50 text-purple-600' },
    { label: 'Success Rate', value: '98.4%', icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Growth This Month', value: '+23%', icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-gray-900 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-500">Track your extraction performance and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-gray-500 mb-1">{stat.label}</p>
              <p className="text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-6">Extractions by Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={extractionsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="extractions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-6">Success Rate Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={successRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" domain={[94, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-6">File Types Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fileTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fileTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-6">Recent Performance</h3>
          <div className="space-y-4">
            {[
              { label: 'Files Processed Today', value: '12', change: '+8%', positive: true },
              { label: 'Avg. Rows per File', value: '14.5', change: '+12%', positive: true },
              { label: 'Processing Speed', value: '2.4s', change: '-15%', positive: true },
              { label: 'Error Rate', value: '1.6%', change: '-0.3%', positive: true },
            ].map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-gray-500">{metric.label}</p>
                  <p className="text-gray-900">{metric.value}</p>
                </div>
                <span className={`px-3 py-1 rounded-full ${
                  metric.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {metric.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

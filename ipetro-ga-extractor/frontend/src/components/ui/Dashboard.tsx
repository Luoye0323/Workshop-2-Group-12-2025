import { Upload, FileText, CheckCircle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: any) => void;
  username: string;
}

export function Dashboard({ onNavigate, username }: DashboardProps) {
  const stats = [
    { label: 'Total Extractions', value: '247', icon: FileText, color: 'bg-blue-50 text-blue-600' },
    { label: 'Recent Files', value: '12', icon: Upload, color: 'bg-purple-50 text-purple-600' },
    { label: 'Success Rate', value: '98.4%', icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'This Month', value: '+23%', icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-gray-900 mb-2">Welcome back, {username}</h2>
        <p className="text-gray-500">Extract table data from your engineering PDFs with ease</p>
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

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h3 className="text-gray-900">Start New Extraction</h3>
          
          <button
            onClick={() => onNavigate('new-extraction')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            New Extraction
          </button>

          <div className="pt-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
                 onClick={() => onNavigate('new-extraction')}>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-900 mb-1">Drag and drop your PDF here</p>
                  <p className="text-gray-500">or click to browse files</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { name: 'GA_Drawing_2024.pdf', date: '2 hours ago', status: 'success' },
              { name: 'Engineering_Specs.pdf', date: '5 hours ago', status: 'success' },
              { name: 'Technical_Layout.pdf', date: 'Yesterday', status: 'success' },
              { name: 'Floor_Plan_Rev3.pdf', date: '2 days ago', status: 'success' },
            ].map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 truncate">{file.name}</p>
                  <p className="text-gray-500">{file.date}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('new-extraction')}
              className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <Upload className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-blue-900">Upload New PDF</p>
                <p className="text-blue-600">Start a new extraction</p>
              </div>
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <FileText className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-gray-900">View History</p>
                <p className="text-gray-600">Browse past extractions</p>
              </div>
            </button>
            <button
              onClick={() => onNavigate('analytics')}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-gray-900">View Analytics</p>
                <p className="text-gray-600">Track your progress</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

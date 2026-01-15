import { FileText, CheckCircle2, Clock, HardDrive, TrendingUp, AlertCircle, Play } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const kpis = [
    { label: 'Total Extractions', value: '1,247', icon: FileText, color: 'bg-blue-500', trend: '+12%' },
    { label: 'Success Rate', value: '94.2%', icon: CheckCircle2, color: 'bg-green-500', trend: '+2.1%' },
    { label: 'Active Processing', value: '3', icon: Clock, color: 'bg-amber-500', trend: '' },
    { label: 'Storage Used', value: '42.8 GB', icon: HardDrive, color: 'bg-purple-500', trend: '+5.3 GB' },
  ];

  const recentExtractions = [
    { id: 1, filename: 'GA-001-Rev-C.pdf', date: '2025-12-01 14:30', status: 'completed', duration: '2m 34s' },
    { id: 2, filename: 'GA-002-Layout.dwg', date: '2025-12-01 13:15', status: 'completed', duration: '3m 12s' },
    { id: 3, filename: 'GA-003-Arrangement.pdf', date: '2025-12-01 11:45', status: 'processing', duration: '1m 20s' },
    { id: 4, filename: 'GA-004-Details.dxf', date: '2025-12-01 10:20', status: 'completed', duration: '2m 45s' },
    { id: 5, filename: 'GA-005-Section-A.pdf', date: '2025-11-30 16:50', status: 'failed', duration: '0m 45s' },
  ];

  const processingQueue = [
    { id: 1, filename: 'GA-006-Rev-A.pdf', progress: 67, step: 'Extracting table data' },
    { id: 2, filename: 'GA-007-Layout.dwg', progress: 34, step: 'OCR processing' },
    { id: 3, filename: 'GA-008-Details.pdf', progress: 12, step: 'Image preprocessing' },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your extraction activities</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`${kpi.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="text-white" size={24} />
                </div>
                {kpi.trend && (
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp size={16} />
                    <span className="text-sm">{kpi.trend}</span>
                  </div>
                )}
              </div>
              <div className="text-gray-600 mb-1">{kpi.label}</div>
              <div className="text-gray-900">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* New Extraction Button */}
      <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2">Start New Extraction</h2>
            <p className="text-blue-100">Upload your GA drawing and extract table data automatically</p>
          </div>
          <button
            onClick={() => onNavigate('new-extraction')}
            className="bg-white text-[#2563EB] px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Play size={20} />
            New Extraction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Extractions */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900">Recent Extractions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700">Filename</th>
                  <th className="px-6 py-3 text-left text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-gray-700">Duration</th>
                  <th className="px-6 py-3 text-left text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentExtractions.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 monospace">{item.filename}</td>
                    <td className="px-6 py-4 text-gray-600 monospace">{item.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 monospace">{item.duration}</td>
                    <td className="px-6 py-4">
                      <button className="text-[#2563EB] hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Processing Queue */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900">Processing Queue</h3>
          </div>
          <div className="p-6 space-y-6">
            {processingQueue.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-gray-900 truncate monospace text-sm">{item.filename}</div>
                  <div className="text-gray-600 text-sm monospace">{item.progress}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-[#2563EB] h-2 rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="text-gray-500 text-sm">{item.step}</div>
              </div>
            ))}
            {processingQueue.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Clock size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No active processing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

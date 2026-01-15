import { Brain, TrendingUp, Clock, CheckCircle2, BarChart3, Star } from 'lucide-react';

export function AIModels(){
    const models = [
        {
            id: 1,
            name: 'Gemini Flash 2.0',
            version: '2.0.1',
            status: 'active',
            isDefault: true,
            accuracy: 93.1,
            avgTime: 120, // ms
            useCases: 'Fast extraction, general GA drawings',
            lastUpdated: '2025-11-25',
            successRate: 92.5,
        },
        {
            id: 2,
            name: 'OpenAI GPT-4o',
            version: '1.3.0',
            status: 'active',
            isDefault: false,
            accuracy: 97.6,
            avgTime: 260, // ms
            useCases: 'Complex tables, low-quality drawings',
            lastUpdated: '2025-11-25',
            successRate: 97.2,
        },
        {
            id: 3,
            name: 'Llama 3.2 90b',
            version: '0.9.8',
            status: 'experimental',
            isDefault: false,
            accuracy: 90.1,
            avgTime: 78, // ms
            useCases: 'High extractiom, simple and clean tables',
            lastUpdated: '2025-11-25',
            successRate: 88.9,
            processedFiles: 342
        },
    ];

    const performanceData = [
        { month: 'Jul', fast: 91.2, precision: 96.8},
        { month: 'Aug', fast: 91.2, precision: 96.8},
        { month: 'Sep', fast: 91.2, precision: 96.8},
        { month: 'Nov', fast: 91.2, precision: 96.8},
        { month: 'Dec', fast: 91.2, precision: 96.8},
    ];

     const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Inactive</span>
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">AI Models</h1>
        <p className="text-gray-600">Manage and monitor AI extraction models</p>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {models.map((model) => (
          <div key={model.id} className={`bg-white rounded-lg shadow ${model.status === 'inactive' ? 'opacity-60' : ''}`}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    model.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Brain className={model.status === 'active' ? 'text-[#2563EB]' : 'text-gray-400'} size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-gray-900">{model.name}</h3>
                      {model.isDefault && (
                        <Star className="text-amber-500 fill-amber-500" size={16} />
                      )}
                    </div>
                    <div className="text-gray-600 text-sm monospace">v{model.version}</div>
                  </div>
                </div>
                {getStatusBadge(model.status)}
              </div>

              <p className="text-gray-600 text-sm mb-4">{model.useCases}</p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-gray-600 text-sm mb-1">Accuracy</div>
                  <div className="text-gray-900 monospace">{model.accuracy}%</div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm mb-1">Avg. Time</div>
                  <div className="text-gray-900 monospace">{formatTime(model.avgTime)}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm mb-1">Success Rate</div>
                  <div className="text-gray-900 monospace">{model.successRate}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  <span className="monospace">{model.processedFiles}</span> files processed
                </div>
                <div className="text-gray-500 monospace">Updated: {model.lastUpdated}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 flex gap-2">
              {model.status === 'active' && !model.isDefault && (
                <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2">
                  <Star size={16} />
                  Set as Default
                </button>
              )}
              <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors">
                View Details
              </button>
              {model.status === 'active' ? (
                <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors">
                  Deactivate
                </button>
              ) : (
                <button className="px-3 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Comparison */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-gray-600" size={24} />
            <h2 className="text-gray-900">Performance Trends</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#2563EB] rounded" />
                <span className="text-gray-700 text-sm">Fast Extraction v2.1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded" />
                <span className="text-gray-700 text-sm">Precision Extract v3.0</span>
              </div>
            </div>

            {/* Simple bar chart visualization */}
            <div className="space-y-4">
              {performanceData.map((data, index) => (
                <div key={index}>
                  <div className="text-gray-700 text-sm mb-2 monospace">{data.month} 2025</div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-1">Fast: {data.fast}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-[#2563EB] h-3 rounded-full"
                          style={{ width: `${data.fast}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-1">Precision: {data.precision}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full"
                          style={{ width: `${data.precision}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-gray-600" size={24} />
            <h2 className="text-gray-900">Model Comparison</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">Model</th>
                <th className="px-6 py-3 text-left text-gray-700">Version</th>
                <th className="px-6 py-3 text-left text-gray-700">Accuracy</th>
                <th className="px-6 py-3 text-left text-gray-700">Avg. Processing Time</th>
                <th className="px-6 py-3 text-left text-gray-700">Success Rate</th>
                <th className="px-6 py-3 text-left text-gray-700">Files Processed</th>
                <th className="px-6 py-3 text-left text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {model.name}
                      {model.isDefault && <Star className="text-amber-500 fill-amber-500" size={14} />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 monospace">v{model.version}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 monospace">{model.accuracy}%</span>
                      {model.accuracy > 95 && <CheckCircle2 className="text-green-500" size={16} />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 monospace">{formatTime(model.avgTime)}</td>
                  <td className="px-6 py-4 text-gray-600 monospace">{model.successRate}%</td>
                  <td className="px-6 py-4 text-gray-600 monospace">{model.processedFiles}</td>
                  <td className="px-6 py-4">{getStatusBadge(model.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
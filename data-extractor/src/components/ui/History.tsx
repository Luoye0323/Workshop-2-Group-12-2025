import { Search, Filter, Download, Eye, Trash2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function History() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const historyData = [
    {
      id: 1,
      thumbnail: '📄',
      filename: 'GA-001-Rev-C.pdf',
      date: '2025-12-01 14:30',
      status: 'completed',
      model: 'Fast Extract v2.1',
      duration: '2m 34s',
      tables: 3,
      rows: 247,
    },
    {
      id: 2,
      thumbnail: '📄',
      filename: 'GA-002-Layout.dwg',
      date: '2025-12-01 13:15',
      status: 'completed',
      model: 'Precision v3.0',
      duration: '5m 12s',
      tables: 5,
      rows: 412,
    },
    {
      id: 3,
      thumbnail: '📄',
      filename: 'GA-003-Arrangement.pdf',
      date: '2025-12-01 11:45',
      status: 'processing',
      model: 'Fast Extract v2.1',
      duration: '1m 20s',
      tables: 2,
      rows: 0,
    },
    {
      id: 4,
      thumbnail: '📄',
      filename: 'GA-004-Details.dxf',
      date: '2025-12-01 10:20',
      status: 'completed',
      model: 'Fast Extract v2.1',
      duration: '2m 45s',
      tables: 4,
      rows: 328,
    },
    {
      id: 5,
      thumbnail: '📄',
      filename: 'GA-005-Section-A.pdf',
      date: '2025-11-30 16:50',
      status: 'failed',
      model: 'Precision v3.0',
      duration: '0m 45s',
      tables: 0,
      rows: 0,
    },
    {
      id: 6,
      thumbnail: '📄',
      filename: 'GA-006-Rev-B.pdf',
      date: '2025-11-30 15:30',
      status: 'completed',
      model: 'Fast Extract v2.1',
      duration: '3m 10s',
      tables: 6,
      rows: 521,
    },
    {
      id: 7,
      thumbnail: '📄',
      filename: 'GA-007-Floor-Plan.dwg',
      date: '2025-11-30 14:15',
      status: 'completed',
      model: 'Precision v3.0',
      duration: '4m 55s',
      tables: 3,
      rows: 289,
    },
    {
      id: 8,
      thumbnail: '📄',
      filename: 'GA-008-Elevation.pdf',
      date: '2025-11-30 11:20',
      status: 'completed',
      model: 'Fast Extract v2.1',
      duration: '2m 18s',
      tables: 2,
      rows: 156,
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    };
    const style = styles[status as keyof typeof styles] || styles.completed;
    return (
      <span className={`px-3 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const filteredData = historyData.filter((item) => {
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">History</h1>
        <p className="text-gray-600">View and manage all your extraction history</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter size={18} />
              More Filters
            </button>

            <button className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
              <Download size={18} />
              Bulk Download
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-gray-600">
        Showing {filteredData.length} of {historyData.length} extractions
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  <button className="flex items-center gap-1 hover:text-gray-900">
                    Preview
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  <button className="flex items-center gap-1 hover:text-gray-900">
                    Filename
                    <ChevronDown size={16} />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  <button className="flex items-center gap-1 hover:text-gray-900">
                    Date
                    <ChevronDown size={16} />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-gray-700">AI Model</th>
                <th className="px-6 py-3 text-left text-gray-700">Duration</th>
                <th className="px-6 py-3 text-left text-gray-700">Data</th>
                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-2xl">
                      {item.thumbnail}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 monospace">{item.filename}</td>
                  <td className="px-6 py-4 text-gray-600 monospace">{item.date}</td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  <td className="px-6 py-4 text-gray-600">{item.model}</td>
                  <td className="px-6 py-4 text-gray-600 monospace">{item.duration}</td>
                  <td className="px-6 py-4 text-gray-600 monospace">
                    {item.status === 'completed' ? `${item.tables} tables, ${item.rows} rows` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-gray-600 hover:text-[#2563EB] hover:bg-blue-50 rounded transition-colors"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-gray-600">
            Page 1 of 3
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1 bg-[#2563EB] text-white rounded">1</button>
            <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
              3
            </button>
            <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

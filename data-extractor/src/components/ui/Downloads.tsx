import { Download, Eye, FileSpreadsheet, Presentation, Trash2, Search, HardDrive } from 'lucide-react';
import { useState } from 'react';

export function Downloads() {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('date');

  const downloadFiles = [
    {
      id: 1,
      name: 'GA-001-Rev-C_export.xlsx',
      type: 'excel',
      sourceDrawing: 'GA-001-Rev-C.pdf',
      date: '2025-12-01',
      time: '14:35',
      size: 245600,
    },
    {
      id: 2,
      name: 'GA-001-Rev-C_presentation.pptx',
      type: 'powerpoint',
      sourceDrawing: 'GA-001-Rev-C.pdf',
      date: '2025-12-01',
      time: '14:36',
      size: 1024000,
    },
    {
      id: 3,
      name: 'GA-002-Layout_export.xlsx',
      type: 'excel',
      sourceDrawing: 'GA-002-Layout.dwg',
      date: '2025-12-01',
      time: '13:20',
      size: 412800,
    },
    {
      id: 4,
      name: 'GA-004-Details_export.xlsx',
      type: 'excel',
      sourceDrawing: 'GA-004-Details.dxf',
      date: '2025-12-01',
      time: '10:25',
      size: 328000,
    },
    {
      id: 5,
      name: 'GA-006-Rev-B_export.xlsx',
      type: 'excel',
      sourceDrawing: 'GA-006-Rev-B.pdf',
      date: '2025-11-30',
      time: '15:35',
      size: 521000,
    },
    {
      id: 6,
      name: 'GA-006-Rev-B_presentation.pptx',
      type: 'powerpoint',
      sourceDrawing: 'GA-006-Rev-B.pdf',
      date: '2025-11-30',
      time: '15:36',
      size: 1536000,
    },
    {
      id: 7,
      name: 'GA-007-Floor-Plan_export.xlsx',
      type: 'excel',
      sourceDrawing: 'GA-007-Floor-Plan.dwg',
      date: '2025-11-30',
      time: '14:20',
      size: 289000,
    },
    {
      id: 8,
      name: 'GA-008-Elevation_export.xlsx',
      type: 'excel',
      sourceDrawing: 'GA-008-Elevation.pdf',
      date: '2025-11-30',
      time: '11:25',
      size: 156000,
    },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const totalSize = downloadFiles.reduce((acc, file) => acc + file.size, 0);
  const storageLimit = 100 * 1024 * 1024 * 1024; // 100 GB
  const storagePercent = (totalSize / storageLimit) * 100;

  const filteredFiles = downloadFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.sourceDrawing.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedFiles: { [key: string]: typeof downloadFiles } = {};
  filteredFiles.forEach((file) => {
    const key = groupBy === 'date' ? file.date : file.type;
    if (!groupedFiles[key]) {
      groupedFiles[key] = [];
    }
    groupedFiles[key].push(file);
  });

  const getFileIcon = (type: string) => {
    return type === 'excel' ? (
      <FileSpreadsheet className="text-green-600" size={40} />
    ) : (
      <Presentation className="text-orange-600" size={40} />
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Downloads</h1>
        <p className="text-gray-600">Access all your exported files</p>
      </div>

      {/* Storage Usage */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <HardDrive className="text-gray-600" size={24} />
            <div>
              <div className="text-gray-900">Storage Usage</div>
              <div className="text-gray-600 text-sm monospace">
                {formatFileSize(totalSize)} / {formatFileSize(storageLimit)}
              </div>
            </div>
          </div>
          <div className="text-gray-600 monospace">{storagePercent.toFixed(2)}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-[#2563EB] h-3 rounded-full"
            style={{ width: `${storagePercent}%` }}
          />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="date">Group by Date</option>
              <option value="type">Group by Type</option>
            </select>

            <button className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
              <Download size={18} />
              Download All
            </button>
          </div>
        </div>
      </div>

      {/* File Groups */}
      <div className="space-y-6">
        {Object.keys(groupedFiles).sort().reverse().map((groupKey) => (
          <div key={groupKey}>
            <h3 className="text-gray-900 mb-4">
              {groupBy === 'date' ? groupKey : groupKey === 'excel' ? 'Excel Files' : 'PowerPoint Files'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedFiles[groupKey].map((file) => (
                <div key={file.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 truncate mb-1 monospace">{file.name}</div>
                      <div className="text-gray-600 text-sm truncate">
                        Source: {file.sourceDrawing}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-600 monospace">{file.date} {file.time}</div>
                    <div className="text-gray-600 monospace">{formatFileSize(file.size)}</div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <Eye size={16} />
                      Preview
                    </button>
                    <button className="flex-1 px-3 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2">
                      <Download size={16} />
                      Download
                    </button>
                    <button className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Download size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-gray-900 mb-2">No downloads found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

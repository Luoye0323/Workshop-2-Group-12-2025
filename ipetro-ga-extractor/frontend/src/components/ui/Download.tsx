import { Download as DownloadIcon, FileSpreadsheet, Presentation, File, Calendar } from 'lucide-react';

export function Download() {
  const downloadFiles = [
    { 
      id: 1, 
      fileName: 'GA_Drawing_2024_Extract.xlsx', 
      type: 'excel', 
      date: '2024-12-02 14:35',
      size: '248 KB',
      sourceFile: 'GA_Drawing_2024.pdf'
    },
    { 
      id: 2, 
      fileName: 'GA_Drawing_2024_Extract.pptx', 
      type: 'powerpoint', 
      date: '2024-12-02 14:35',
      size: '1.2 MB',
      sourceFile: 'GA_Drawing_2024.pdf'
    },
    { 
      id: 3, 
      fileName: 'Engineering_Specs_Extract.xlsx', 
      type: 'excel', 
      date: '2024-12-02 10:20',
      size: '156 KB',
      sourceFile: 'Engineering_Specs.pdf'
    },
    { 
      id: 4, 
      fileName: 'Engineering_Specs_Extract.pptx', 
      type: 'powerpoint', 
      date: '2024-12-02 10:20',
      size: '890 KB',
      sourceFile: 'Engineering_Specs.pdf'
    },
    { 
      id: 5, 
      fileName: 'Technical_Layout_Extract.xlsx', 
      type: 'excel', 
      date: '2024-12-01 16:50',
      size: '324 KB',
      sourceFile: 'Technical_Layout.pdf'
    },
    { 
      id: 6, 
      fileName: 'Technical_Layout_Extract.pptx', 
      type: 'powerpoint', 
      date: '2024-12-01 16:50',
      size: '1.5 MB',
      sourceFile: 'Technical_Layout.pdf'
    },
    { 
      id: 7, 
      fileName: 'Floor_Plan_Rev3_Extract.xlsx', 
      type: 'excel', 
      date: '2024-12-01 09:25',
      size: '112 KB',
      sourceFile: 'Floor_Plan_Rev3.pdf'
    },
    { 
      id: 8, 
      fileName: 'Assembly_Drawing_Extract.xlsx', 
      type: 'excel', 
      date: '2024-11-30 11:35',
      size: '445 KB',
      sourceFile: 'Assembly_Drawing.pdf'
    },
  ];

  const getFileIcon = (type: string) => {
    if (type === 'excel') {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    return <Presentation className="w-5 h-5 text-orange-600" />;
  };

  const getFileColor = (type: string) => {
    if (type === 'excel') {
      return 'bg-green-50';
    }
    return 'bg-orange-50';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Download Center</h2>
          <p className="text-gray-500">Access all your exported Excel and PowerPoint files</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <DownloadIcon className="w-5 h-5" />
          Download All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <File className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500">Total Files</p>
              <p className="text-gray-900">{downloadFiles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500">Excel Files</p>
              <p className="text-gray-900">{downloadFiles.filter(f => f.type === 'excel').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Presentation className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-500">PowerPoint Files</p>
              <p className="text-gray-900">{downloadFiles.filter(f => f.type === 'powerpoint').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-6">Available Downloads</h3>
        <div className="space-y-3">
          {downloadFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
              <div className={`w-12 h-12 ${getFileColor(file.type)} rounded-lg flex items-center justify-center`}>
                {getFileIcon(file.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 truncate">{file.fileName}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-gray-500 flex items-center gap-1">
                    <File className="w-4 h-4" />
                    {file.sourceFile}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {file.date}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{file.size}</span>
                </div>
              </div>

              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                <DownloadIcon className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <DownloadIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-blue-900 mb-1">Quick Tip</p>
            <p className="text-blue-700">Files are stored for 30 days. Download important files to your local storage for long-term archival.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

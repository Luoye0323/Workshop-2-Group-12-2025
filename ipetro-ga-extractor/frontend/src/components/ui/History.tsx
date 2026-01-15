import { FileText, Download, CheckCircle, XCircle, Clock } from 'lucide-react';

export function History() {
  const historyData = [
    { id: 1, fileName: 'GA_Drawing_2024.pdf', date: '2024-12-02 14:30', status: 'success', rows: 12 },
    { id: 2, fileName: 'Engineering_Specs.pdf', date: '2024-12-02 10:15', status: 'success', rows: 8 },
    { id: 3, fileName: 'Technical_Layout.pdf', date: '2024-12-01 16:45', status: 'success', rows: 15 },
    { id: 4, fileName: 'Floor_Plan_Rev3.pdf', date: '2024-12-01 09:20', status: 'success', rows: 6 },
    { id: 5, fileName: 'Structural_Details.pdf', date: '2024-11-30 13:00', status: 'processing', rows: 0 },
    { id: 6, fileName: 'Assembly_Drawing.pdf', date: '2024-11-30 11:30', status: 'success', rows: 20 },
    { id: 7, fileName: 'Fabrication_Plan.pdf', date: '2024-11-29 15:10', status: 'success', rows: 18 },
    { id: 8, fileName: 'Detail_Sheet_A4.pdf', date: '2024-11-29 08:45', status: 'failed', rows: 0 },
    { id: 9, fileName: 'Connection_Details.pdf', date: '2024-11-28 14:20', status: 'success', rows: 9 },
    { id: 10, fileName: 'Material_Schedule.pdf', date: '2024-11-28 10:00', status: 'success', rows: 24 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full";
    switch (status) {
      case 'success':
        return <span className={`${baseClasses} bg-green-50 text-green-700`}>Success</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-50 text-red-700`}>Failed</span>;
      case 'processing':
        return <span className={`${baseClasses} bg-orange-50 text-orange-700`}>Processing</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Extraction History</h2>
          <p className="text-gray-500">View and manage your past PDF extractions</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Download className="w-5 h-5" />
          Export All
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-gray-700">File Name</th>
                <th className="text-left py-4 px-6 text-gray-700">Date</th>
                <th className="text-left py-4 px-6 text-gray-700">Rows Extracted</th>
                <th className="text-left py-4 px-6 text-gray-700">Status</th>
                <th className="text-left py-4 px-6 text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-gray-900">{item.fileName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{item.date}</td>
                  <td className="py-4 px-6 text-gray-600">{item.rows > 0 ? item.rows : '-'}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      {getStatusBadge(item.status)}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {item.status === 'success' && (
                      <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500">Total Extractions</p>
              <p className="text-gray-900">{historyData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500">Successful</p>
              <p className="text-gray-900">{historyData.filter(item => item.status === 'success').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-500">Failed</p>
              <p className="text-gray-900">{historyData.filter(item => item.status === 'failed').length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

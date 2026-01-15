import { ZoomIn, ZoomOut, Download, Save, Check, AlertTriangle, FileSpreadsheet, Presentation} from 'lucide-react';
import { useState } from 'react';

export function DataReview() {
  const [zoom, setZoom] = useState(100);
  const [dividerPosition, setDividerPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const extractedData = [
    { id: 1, item: 'Main Deck', length: '42.5', width: '12.8', height: '3.2', material: 'Steel', validated: true },
    { id: 2, item: 'Upper Deck', length: '38.2', width: '12.8', height: '2.8', material: 'Steel', validated: true },
    { id: 3, item: 'Bridge Deck', length: '15.6', width: '8.4', height: '2.4', material: 'Aluminum', validated: false },
    { id: 4, item: 'Cargo Hold 1', length: '18.5', width: '12.0', height: '8.5', material: 'Steel', validated: true },
    { id: 5, item: 'Cargo Hold 2', length: '18.5', width: '12.0', height: '8.5', material: 'Steel', validated: true },
    { id: 6, item: 'Engine Room', length: '12.4', width: '12.8', height: '6.2', material: 'Steel', validated: true },
  ];

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const container = e.currentTarget.getBoundingClientRect();
      const newPosition = ((e.clientX - container.left) / container.width) * 100;
      setDividerPosition(Math.max(20, Math.min(80, newPosition)));
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-1">Data Review</h1>
            <p className="text-gray-600 monospace">GA-001-Rev-C.pdf</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Save size={18} />
              Save Draft
            </button>
            <button className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div
        className="flex-1 flex relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Drawing Viewer */}
        <div
          className="bg-gray-100 overflow-hidden relative"
          style={{ width: `${dividerPosition}%` }}
        >
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white rounded-lg shadow p-2">
            <button
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="px-3 text-gray-700 monospace">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Drawing Preview */}
          <div className="w-full h-full flex items-center justify-center p-8">
            <div
              className="bg-white shadow-lg border border-gray-300 relative"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
            >
              <div className="w-[600px] h-[800px] p-8">
                {/* Simulated Drawing */}
                <div className="border-2 border-gray-800 h-full p-4">
                  <div className="text-center mb-6">
                    <h2 className="text-gray-800 mb-2">GENERAL ARRANGEMENT</h2>
                    <p className="text-gray-600 text-sm">Drawing No: GA-001-Rev-C</p>
                  </div>
                  
                  {/* Highlighted table area */}
                  <div className="border-2 border-[#2563EB] bg-blue-50 p-4 mt-8">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-400">
                          <th className="text-left p-1">Item</th>
                          <th className="text-left p-1">Length (m)</th>
                          <th className="text-left p-1">Width (m)</th>
                          <th className="text-left p-1">Height (m)</th>
                          <th className="text-left p-1">Material</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedData.slice(0, 3).map((row) => (
                          <tr key={row.id} className="border-b border-gray-300">
                            <td className="p-1">{row.item}</td>
                            <td className="p-1">{row.length}</td>
                            <td className="p-1">{row.width}</td>
                            <td className="p-1">{row.height}</td>
                            <td className="p-1">{row.material}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-1 bg-gray-300 hover:bg-[#2563EB] cursor-col-resize transition-colors relative z-20"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 bg-white border border-gray-300 rounded shadow flex items-center justify-center">
            <div className="w-0.5 h-6 bg-gray-400 mx-0.5" />
            <div className="w-0.5 h-6 bg-gray-400 mx-0.5" />
          </div>
        </div>

        {/* Data Table */}
        <div
          className="bg-white overflow-hidden flex flex-col"
          style={{ width: `${100 - dividerPosition}%` }}
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900 mb-2">Extracted Data</h3>
            <p className="text-gray-600 text-sm">Click any cell to edit. Validation warnings are highlighted.</p>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-gray-700">Item</th>
                  <th className="px-4 py-3 text-left text-gray-700">Length (m)</th>
                  <th className="px-4 py-3 text-left text-gray-700">Width (m)</th>
                  <th className="px-4 py-3 text-left text-gray-700">Height (m)</th>
                  <th className="px-4 py-3 text-left text-gray-700">Material</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {extractedData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      {row.validated ? (
                        <div title="Validated">
                          <Check className="text-green-500" size={20} />
                        </div>
                      ) : (
                        <div title="Needs review">
                          <AlertTriangle className="text-amber-500" size={20} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={row.item}
                        className="w-full px-2 py-1 border border-transparent hover:border-gray-300 focus:border-[#2563EB] focus:outline-none rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={row.length}
                        className="w-full px-2 py-1 border border-transparent hover:border-gray-300 focus:border-[#2563EB] focus:outline-none rounded monospace"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={row.width}
                        className="w-full px-2 py-1 border border-transparent hover:border-gray-300 focus:border-[#2563EB] focus:outline-none rounded monospace"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={row.height}
                        className={`w-full px-2 py-1 border ${
                          row.validated ? 'border-transparent' : 'border-amber-300 bg-amber-50'
                        } hover:border-gray-300 focus:border-[#2563EB] focus:outline-none rounded monospace`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={row.material}
                        className="w-full px-2 py-1 border border-transparent hover:border-gray-300 focus:border-[#2563EB] focus:outline-none rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export Panel */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <h3 className="text-gray-900 mb-4">Export Options</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Excel Template</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                  <option>Standard GA Export</option>
                  <option>Detailed Analysis</option>
                  <option>Summary Report</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">PowerPoint Template</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                  <option>Executive Summary</option>
                  <option>Technical Presentation</option>
                  <option>Client Report</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <FileSpreadsheet size={18} />
                Export to Excel
              </button>
              <button className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
                <Presentation size={18} />
                Export to PowerPoint
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

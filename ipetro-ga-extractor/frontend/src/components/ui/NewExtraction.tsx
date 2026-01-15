import { useState } from 'react';
import { Upload, FileText, Download, FileSpreadsheet, Presentation } from 'lucide-react';

export function NewExtraction() {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      startExtraction(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      startExtraction(selectedFile);
    }
  };

  const startExtraction = (file: File) => {
    setIsExtracting(true);
    setProgress(0);
    setIsComplete(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExtracting(false);
          setIsComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const mockTableData = [
    { id: 1, component: 'Beam A1', dimension: '250x150x8', material: 'Steel S355', quantity: 12, weight: '45.2 kg' },
    { id: 2, component: 'Column B2', dimension: '300x300x10', material: 'Steel S355', quantity: 8, weight: '89.5 kg' },
    { id: 3, component: 'Plate C3', dimension: '500x400x12', material: 'Steel S275', quantity: 24, weight: '75.8 kg' },
    { id: 4, component: 'Bracket D4', dimension: '150x100x6', material: 'Steel S275', quantity: 48, weight: '12.3 kg' },
    { id: 5, component: 'Stiffener E5', dimension: '200x80x8', material: 'Steel S355', quantity: 36, weight: '8.9 kg' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-gray-900 mb-6">Upload PDF Document</h2>
        
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-900 mb-1">Drag and drop your PDF here</p>
                <p className="text-gray-500">or click to browse files</p>
              </div>
              {file && (
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-900">{file.name}</span>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {isExtracting && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-gray-900 mb-4">Extracting Data...</h3>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-500 mt-2">{progress}% complete</p>
        </div>
      )}

      {isComplete && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900">Extracted Table Data</h3>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <FileSpreadsheet className="w-5 h-5" />
                  Export to Excel
                </button>
                <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Presentation className="w-5 h-5" />
                  Export to PowerPoint
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700">Component</th>
                    <th className="text-left py-3 px-4 text-gray-700">Dimension</th>
                    <th className="text-left py-3 px-4 text-gray-700">Material</th>
                    <th className="text-left py-3 px-4 text-gray-700">Quantity</th>
                    <th className="text-left py-3 px-4 text-gray-700">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTableData.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{row.component}</td>
                      <td className="py-3 px-4 text-gray-600">{row.dimension}</td>
                      <td className="py-3 px-4 text-gray-600">{row.material}</td>
                      <td className="py-3 px-4 text-gray-600">{row.quantity}</td>
                      <td className="py-3 px-4 text-gray-600">{row.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-green-900">Extraction Complete!</p>
                <p className="text-green-700">5 rows extracted successfully. Ready to export.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

export function NewExtraction() {
  const [file, setFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile({
        name: droppedFile.name,
        size: droppedFile.size,
        type: droppedFile.type,
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      });
    }
  };

  const startProcessing = () => {
    setProcessing(true);
    setProgress(0);
    setLogs([]);

    const steps = [
      { progress: 10, step: 'Uploading file...', log: '[00:00] File upload initiated' },
      { progress: 25, step: 'Preprocessing image...', log: '[00:03] Image preprocessing started' },
      { progress: 40, step: 'Running OCR...', log: '[00:08] OCR engine initialized' },
      { progress: 60, step: 'Detecting tables...', log: '[00:15] Table detection in progress' },
      { progress: 80, step: 'Extracting data...', log: '[00:22] Extracting table data' },
      { progress: 95, step: 'Validating results...', log: '[00:28] Data validation' },
      { progress: 100, step: 'Complete!', log: '[00:32] Extraction completed successfully' },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < steps.length) {
        setProgress(steps[index].progress);
        setCurrentStep(steps[index].step);
        setLogs(prev => [...prev, steps[index].log]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">New Extraction</h1>
        <p className="text-gray-600">Upload a GA drawing to extract table data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag & Drop Zone */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-900 mb-4">Upload Drawing</h3>
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                <h4 className="text-gray-900 mb-2">Drop your file here or click to browse</h4>
                <p className="text-gray-600 mb-4">Supported formats: PDF, DWG, DXF, PNG, JPG</p>
                <input
                  type="file"
                  id="file-input"
                  className="hidden"
                  accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                  onChange={handleFileInput}
                />
                <label
                  htmlFor="file-input"
                  className="inline-block bg-[#2563EB] text-white px-6 py-2 rounded-lg hover:bg-[#1D4ED8] transition-colors cursor-pointer"
                >
                  Select File
                </label>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <FileText className="text-[#2563EB] flex-shrink-0" size={40} />
                    <div>
                      <div className="text-gray-900 mb-1 monospace">{file.name}</div>
                      <div className="text-gray-600 text-sm">
                        Size: {formatFileSize(file.size)} • Type: {file.type || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setProcessing(false);
                      setProgress(0);
                      setLogs([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-gray-50 rounded p-4 space-y-2 monospace text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="text-gray-900">1920 × 1080 px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DPI:</span>
                    <span className="text-gray-900">300</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color Mode:</span>
                    <span className="text-gray-900">RGB</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Processing Section */}
          {file && !processing && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-900 mb-4">AI Model Selection</h3>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg hover:border-[#2563EB] cursor-pointer">
                  <input
                    type="radio"
                    name="model"
                    className="mt-1"
                    defaultChecked
                  />
                  <div className="flex-1">
                    <div className="text-gray-900 mb-1">Fast Extraction v2.1</div>
                    <div className="text-gray-600 text-sm">Accuracy: 92% • Speed: ~2 min</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg hover:border-[#2563EB] cursor-pointer">
                  <input
                    type="radio"
                    name="model"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-gray-900 mb-1">Precision Extract v3.0</div>
                    <div className="text-gray-600 text-sm">Accuracy: 97% • Speed: ~5 min</div>
                  </div>
                </label>
              </div>
              <button
                onClick={startProcessing}
                className="w-full mt-6 bg-[#2563EB] text-white py-3 rounded-lg hover:bg-[#1D4ED8] transition-colors"
              >
                Start Extraction
              </button>
            </div>
          )}

          {processing && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-900 mb-4">Processing</h3>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-gray-900">{currentStep}</div>
                  <div className="text-gray-600 monospace">{progress}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-[#2563EB] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                  <div>Time elapsed: {Math.floor((logs.length * 1.5) / 60)}:{((logs.length * 1.5) % 60).toString().padStart(2, '0')}</div>
                  <div>Est. remaining: ~{Math.max(0, Math.floor((7 - logs.length) * 1.5 / 60))}:{Math.max(0, ((7 - logs.length) * 1.5) % 60).toString().padStart(2, '0')}</div>
                </div>
              </div>

              {/* Processing Logs */}
              <div>
                <div className="text-gray-700 mb-2">Processing Logs</div>
                <div className="bg-gray-900 rounded p-4 h-48 overflow-y-auto monospace text-sm">
                  {logs.map((log, index) => (
                    <div key={index} className="text-green-400 mb-1">
                      {log}
                    </div>
                  ))}
                  {progress < 100 && (
                    <div className="text-green-400 animate-pulse">▊</div>
                  )}
                </div>
              </div>

              {progress === 100 && (
                <div className="mt-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} />
                  <div>
                    <div className="text-green-900">Extraction Complete!</div>
                    <div className="text-green-700 text-sm">Found 3 tables with 247 data points</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-900 mb-4">Quick Tips</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Higher DPI (300+) provides better accuracy</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Clear table borders improve detection</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Use Precision model for critical data</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Large files (&gt 10MB) may take longer</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-900 mb-4">Supported Formats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">PDF Documents</span>
                <span className="text-gray-900 monospace">.pdf</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">AutoCAD Drawings</span>
                <span className="text-gray-900 monospace">.dwg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">DXF Files</span>
                <span className="text-gray-900 monospace">.dxf</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Images</span>
                <span className="text-gray-900 monospace">.png .jpg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

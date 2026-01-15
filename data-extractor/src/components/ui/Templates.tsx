import { FileSpreadsheet, Presentation, Upload, Star, Edit, Trash2, Settings } from 'lucide-react';

export function Templates() {
  const excelTemplates = [
    {
      id: 1,
      name: 'Standard GA Export',
      description: 'Standard format for general arrangement data export',
      isDefault: true,
      fields: 12,
      lastModified: '2025-11-28',
    },
    {
      id: 2,
      name: 'Detailed Analysis',
      description: 'Comprehensive template with calculations and charts',
      isDefault: false,
      fields: 24,
      lastModified: '2025-11-15',
    },
    {
      id: 3,
      name: 'Summary Report',
      description: 'Condensed summary with key metrics only',
      isDefault: false,
      fields: 8,
      lastModified: '2025-11-10',
    },
  ];

  const powerpointTemplates = [
    {
      id: 1,
      name: 'Executive Summary',
      description: 'High-level overview for stakeholders',
      isDefault: true,
      slides: 8,
      lastModified: '2025-11-25',
    },
    {
      id: 2,
      name: 'Technical Presentation',
      description: 'Detailed technical presentation with diagrams',
      isDefault: false,
      slides: 15,
      lastModified: '2025-11-20',
    },
    {
      id: 3,
      name: 'Client Report',
      description: 'Professional client-facing report template',
      isDefault: false,
      slides: 12,
      lastModified: '2025-11-18',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Templates</h1>
        <p className="text-gray-600">Manage your export templates</p>
      </div>

      {/* Excel Templates */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-900">Excel Templates</h2>
          <button className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
            <Upload size={18} />
            Upload New Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {excelTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              {/* Template Preview/Thumbnail */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 flex items-center justify-center">
                <FileSpreadsheet className="text-green-600" size={64} />
              </div>

              {/* Template Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-gray-900">{template.name}</h3>
                  {template.isDefault && (
                    <Star className="text-amber-500 fill-amber-500 flex-shrink-0" size={18} />
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4">{template.description}</p>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="text-gray-600">
                    <span className="monospace">{template.fields}</span> fields
                  </div>
                  <div className="text-gray-500 monospace">{template.lastModified}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!template.isDefault && (
                    <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <Star size={16} />
                      Set Default
                    </button>
                  )}
                  <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PowerPoint Templates */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-900">PowerPoint Templates</h2>
          <button className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
            <Upload size={18} />
            Upload New Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {powerpointTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              {/* Template Preview/Thumbnail */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 flex items-center justify-center">
                <Presentation className="text-orange-600" size={64} />
              </div>

              {/* Template Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-gray-900">{template.name}</h3>
                  {template.isDefault && (
                    <Star className="text-amber-500 fill-amber-500 flex-shrink-0" size={18} />
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4">{template.description}</p>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="text-gray-600">
                    <span className="monospace">{template.slides}</span> slides
                  </div>
                  <div className="text-gray-500 monospace">{template.lastModified}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!template.isDefault && (
                    <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <Star size={16} />
                      Set Default
                    </button>
                  )}
                  <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field Mapping Interface */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="text-gray-600" size={24} />
            <h2 className="text-gray-900">Field Mapping Configuration</h2>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Configure how extracted data fields map to your template columns
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 pb-2 border-b border-gray-200">
              <div>Extracted Field</div>
              <div>Template Column</div>
              <div>Data Type</div>
            </div>

            {[
              { extracted: 'item_name', column: 'Description', type: 'Text' },
              { extracted: 'length', column: 'Length (m)', type: 'Number' },
              { extracted: 'width', column: 'Width (m)', type: 'Number' },
              { extracted: 'height', column: 'Height (m)', type: 'Number' },
              { extracted: 'material', column: 'Material Type', type: 'Text' },
            ].map((mapping, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-100">
                <div className="text-gray-900 monospace">{mapping.extracted}</div>
                <div>
                  <input
                    type="text"
                    defaultValue={mapping.column}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Reset to Default
            </button>
            <button className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
              Save Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

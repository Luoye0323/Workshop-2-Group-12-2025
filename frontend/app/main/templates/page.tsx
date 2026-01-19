'use client';

import { useEffect, useState } from 'react';
import { FiFile, FiFileText, FiExternalLink, FiDownload } from 'react-icons/fi';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import type { Template } from '@/lib/types';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth info
  const { userProfile } = useAuth();

  // Load all templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await api.templates.getAll();
        if (data.success) {
          const mappedTemplates: Template[] = [
            ...data.excelTemplates.map(t => ({ ...t, type: 'excel' as const })),
            ...data.inspectionTemplates.map(t => ({ ...t, type: 'inspectionPlan' as const })),
          ];
          setTemplates(mappedTemplates);
        } else {
          setError(data.message || 'Failed to load templates');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);

  // Render table
  const renderTable = (list: Template[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-1/2 px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
            <th className="w-1/4 px-4 py-2 text-left text-sm font-medium text-gray-500">Created At</th>
            <th className="w-1/4 px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {list.map(template => (
            <tr key={template.id} className="hover:bg-gray-50">
              {/* Name */}
              <td className="px-4 py-2 text-gray-800">
                <div className="flex items-center gap-2">
                  {template.type === 'excel' ? (
                    <FiFileText className="text-blue-600" />
                  ) : (
                    <FiFile className="text-purple-600" />
                  )}
                  <span className="truncate">{template.name}</span>
                </div>
              </td>

              {/* Created At */}
              <td className="px-4 py-2 text-gray-500">
                {template.createdAt
                  ? new Date(template.createdAt).toLocaleDateString()
                  : '-'}
              </td>

              {/* Actions */}
              <td className="px-4 py-2 text-right">
                <div className="inline-flex items-center gap-2 justify-end">
                  <button
                    onClick={() => template.url && window.open(template.url, '_blank')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition"
                  >
                    <FiExternalLink />
                    Open
                  </button>

                  {template.downloadUrl && (
                    <button
                      onClick={() => window.open(template.downloadUrl, '_blank')}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50 transition"
                    >
                      <FiDownload />
                      Download
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="flex items-center justify-center space-x-3">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        {/* Loading text */}
        <p className="text-gray-700 text-lg font-medium">Loading templates...</p>
      </div>
      <p className="mt-4 text-gray-400 text-sm">
        Please wait while we fetch your data.
      </p>
    </div>
  );
}

if (error) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <p className="text-red-600 text-lg font-semibold">{error}</p>
      <p className="mt-2 text-gray-400 text-sm">
        Try refreshing the page or check your internet connection.
      </p>
    </div>
  );
}

  const excelTemplates = templates.filter(t => t.type === 'excel');
  const inspectionTemplates = templates.filter(t => t.type === 'inspectionPlan');

  return (
    <div className="space-y-16">
      {/* Excel Templates Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Excel Templates</h2>
        {excelTemplates.length > 0 ? renderTable(excelTemplates) : (
          <p className="text-gray-400">No Excel templates available.</p>
        )}
      </section>

      {/* Inspection Plan Templates Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Inspection Plan Templates</h2>
        {inspectionTemplates.length > 0 ? renderTable(inspectionTemplates) : (
          <p className="text-gray-400">No inspection plan templates available.</p>
        )}
      </section>
    </div>
  );
}

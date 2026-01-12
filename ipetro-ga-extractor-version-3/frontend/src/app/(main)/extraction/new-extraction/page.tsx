'use client';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { uploadDrawing, getAvailableModels, AvailableModels } from '@/lib/api';



export default function NewExtractionPage() {
 
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('');
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await getAvailableModels();
      setAvailableModels(data);

      // set default model for selected provider
      if (data.models[provider as keyof typeof data.models]) {
        setModel(data.models[provider as keyof typeof data.models][0]);
      }
    } catch (err) {
      console.error('Failed to load models: ', err);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    if (availableModels?.models[newProvider as keyof typeof availableModels.models]){
      setModel(availableModels.models[newProvider as keyof typeof availableModels.models][0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const result = await uploadDrawing(file, provider, model);
      router.push(`/extraction/${result.extraction_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='p-6 max-w-2xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>New Extraction</h1>

      <div className='bg-white rounded-lg shadow p-6 space-y-6'>
        {error && (
          <div className='p-3 bg-red-50 border border-red-200 rounded text-red-700'>
            {error}
          </div>
        )}

        <div>
          <label className='block text-sm font-medium mb-2'>AI Provider</label>
          <select
           value={provider}
           onChange={(e) => handleProviderChange(e.target.value)}
           className='w-full px-3 py-2 border rounded-lg'
           disabled={!availableModels}
          >
            <option value="gemini" disabled={!availableModels?.configured.gemini}>
              Google Gemini {!availableModels?.configured.gemini && '(Not configured)'}
            </option>
            <option value="openai" disabled={!availableModels?.configured.openai}>
              OpenAI {!availableModels?.configured.openai && '(Not configured)'}
            </option>
            <option value="groq" disabled={!availableModels?.configured.groq}>
              Groq {!availableModels?.configured.groq && '(Not configured)'}
            </option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium mb-2' >Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className='w-full px-3 py-2 border rounded-lg'
            disabled={!availableModels}
          >
            {availableModels?.models[provider as keyof typeof availableModels.models]?.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium mb-2'>Upload Drawing (PDF/Image)</label>
          <input 
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className='block w-full px-3 py-2 border rounded-lg text-sm '
          />
        </div>

          {file && (
            <div className='p-3 bg-gray-50 rounded'>
              <p className='text-sm font-medium'>{file.name}</p>
              <p className='text-xs text-gray-500'>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className='flex gap-3'>
            <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
            >
              {uploading ? 'Processing...' : 'Upload & Extract'}
            </button>
            <button 
            onClick={() => router.back()}
            className='px-4 py-2 border rounded-lg hover:bg-gray-50'
            >
              Cancel
            </button>
          </div>
      </div>
    </div>
  );
}

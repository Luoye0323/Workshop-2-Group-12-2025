'use client';

import { useEffect, useState, useRef, DragEvent, ChangeEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { CreateTaskResponse, UserProfile, PdfItem } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/lib/AuthContext';

type LocalPdfItem = PdfItem & {
  file?: File;
  previewUrl?: string;
};

// **NEW: Create separate memoized components**
const EditableInput = ({ 
  value, 
  onChange, 
  className,
  placeholder = ''
}: { 
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };
  
  const handleBlur = () => {
    onChange(localValue);
  };
  
  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  );
};


// **UPDATED: Editable Equipment Data Viewer with proper input handling**
const EditableEquipmentDataViewer = ({ 
  data, 
  isEdit,
  onChange 
}: { 
  data: any[], 
  isEdit: boolean,
  onChange: (itemIndex: number, fieldName: string, value: string) => void 
}) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-500 italic">No data available</div>;
  }

  const firstItem = data[0];
  const equipmentNo = firstItem['EQUIPMENT NO.'] || '';
  const equipmentDesc = firstItem['EQUIPMENT DESCRIPTION'] || '';
  const no = firstItem['NO.'] || '';
  const pmtNo = firstItem['PMT NO.'] || '';

  // **NEW: List of read-only labels (just these specific ones)**
  const readOnlyLabels = ['No.', 'Equipment No.', 'PMT No.', 'Description','Parts'];
  
  const renderField = (label: string, value: string, fieldName: string, itemIndex: number = 0, widthClass: string = 'w-full') => {
    const isReadOnly = readOnlyLabels.includes(label);
    
    if (isEdit && !isReadOnly) {
      return (
        <EditableInput
          value={value || ''}
          onChange={(newValue) => onChange(itemIndex, fieldName, newValue)}
          className={`px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${widthClass}`}
          placeholder={label}
        />
      );
    }
    return <p className="text-sm font-bold text-gray-900">{value || 'N/A'}</p>;
  };

  return (
    <div className="space-y-4">
      {/* Header Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs font-semibold text-gray-600 uppercase">No.</span>
            {renderField('No.', no, 'NO.')}
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-600 uppercase">Equipment No.</span>
            {renderField('Equipment No.', equipmentNo, 'EQUIPMENT NO.')}
          </div>
          <div className="col-span-2">
            <span className="text-xs font-semibold text-gray-600 uppercase">PMT No.</span>
            {renderField('PMT No.', pmtNo, 'PMT NO.')}
          </div>
          <div className="col-span-2">
            <span className="text-xs font-semibold text-gray-600 uppercase">Description</span>
            {renderField('Description', equipmentDesc, 'EQUIPMENT DESCRIPTION')}
          </div>
        </div>
      </div>

      {/* Parts Data */}
      <div className="space-y-3">
        <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Parts Details</h4>
        {data.map((item, idx) => (
          <div key={`item-${idx}`} className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <div className="bg-indigo-100 px-3 py-2 rounded-t-lg -mx-4 -mt-4 mb-3">
              <h5 className="font-bold text-indigo-900">
                {
                (
                  item['PARTS'] || `Part ${idx + 1}`
                )}
              </h5>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {/* PHASE */}
              <div>
                <span className="font-semibold text-gray-600">Phase:</span>
                {isEdit ? (
                  <div className="mt-1">
                    <EditableInput
                      value={item['PHASE'] || ''}
                      onChange={(newValue) => onChange(idx, 'PHASE', newValue)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-900">{item['PHASE'] || 'N/A'}</span>
                )}
              </div>
              
              {/* FLUID */}
              <div>
                <span className="font-semibold text-gray-600">Fluid:</span>
                {isEdit ? (
                  <div className="mt-1">
                    <EditableInput
                      value={item['FLUID'] || ''}
                      onChange={(newValue) => onChange(idx, 'FLUID', newValue)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-900">{item['FLUID'] || 'N/A'}</span>
                )}
              </div>
              
              {/* MATERIAL INFORMATION */}
              <div className="col-span-2 border-t pt-2 mt-1">
                <span className="font-semibold text-gray-700">Material Information</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Type:</span>
                {isEdit ? (
                  <div className="mt-1">
                    <EditableInput
                      value={item['MATERIAL INFORMATION TYPE'] || ''}
                      onChange={(newValue) => onChange(idx, 'MATERIAL INFORMATION TYPE', newValue)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-900">{item['MATERIAL INFORMATION TYPE'] || 'N/A'}</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-gray-600">Spec.:</span>
                {isEdit ? (
                  <div className="mt-1">
                    <EditableInput
                      value={item['MATERIAL INFORMATION SPEC.'] || ''}
                      onChange={(newValue) => onChange(idx, 'MATERIAL INFORMATION SPEC.', newValue)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-900">{item['MATERIAL INFORMATION SPEC.'] || 'N/A'}</span>
                )}
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-gray-600">Grade:</span>
                {isEdit ? (
                  <div className="mt-1">
                    <EditableInput
                      value={item['MATERIAL INFORMATION GRADE'] || ''}
                      onChange={(newValue) => onChange(idx, 'MATERIAL INFORMATION GRADE', newValue)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-900">{item['MATERIAL INFORMATION GRADE'] || 'N/A'}</span>
                )}
              </div>
              
              {/* INSULATION */}
              <div className="col-span-2">
                <span className="font-semibold text-gray-600">Insulation (yes/No):</span>
                {isEdit ? (
                  <div className="mt-1">
                    <EditableInput
                      value={item['INSULATION (yes/No)'] || ''}
                      onChange={(newValue) => onChange(idx, 'INSULATION (yes/No)', newValue)}
                      className="w-32 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-900">{item['INSULATION (yes/No)'] || 'N/A'}</span>
                )}
              </div>
              
              {/* DESIGN */}
              <div className="col-span-2 border-t pt-2 mt-1">
                <span className="font-semibold text-gray-700">Design</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Temp. (°C):</span>
                {isEdit ? (
                  <div className="mt-1">
                    <EditableInput
                      value={item['DESIGN TEMP.  (°C)'] || ''}
                      onChange={(newValue) => onChange(idx, 'DESIGN TEMP.  (°C)', newValue)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-900">{item['DESIGN TEMP.  (°C)'] || 'N/A'}</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-gray-600">Pressure (Mpa):</span>
                {isEdit ? (
                  <div className="mt-1">
                    <EditableInput
                      value={item['DESIGN PRESSURE (Mpa)'] || ''}
                      onChange={(newValue) => onChange(idx, 'DESIGN PRESSURE (Mpa)', newValue)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-900">{item['DESIGN PRESSURE (Mpa)'] || 'N/A'}</span>
                )}
              </div>
              
              {/* OPERATING */}
              <div className="col-span-2 border-t pt-2 mt-1">
                <span className="font-semibold text-gray-700">Operating</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Temp. (°C):</span>
                {isEdit ? (
                  <div className="mt-1">
                    <EditableInput
                      value={item['OPERATING TEMP.  (°C)'] || ''}
                      onChange={(newValue) => onChange(idx, 'OPERATING TEMP.  (°C)', newValue)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-900">{item['OPERATING TEMP.  (°C)'] || 'N/A'}</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-gray-600">Pressure (Mpa):</span>
                {isEdit ? (
                  <div className="mt-1">
                    <EditableInput
                      value={item['OPERATING PRESSURE (Mpa)'] || ''}
                      onChange={(newValue) => onChange(idx, 'OPERATING PRESSURE (Mpa)', newValue)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                ) : (
                  <span className="ml-2 text-gray-900">{item['OPERATING PRESSURE (Mpa)'] || 'N/A'}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Read-only viewer (for extraction results modal)
const EquipmentDataViewer = ({ data }: { data: any[] }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-500 italic">No data available</div>;
  }

  const firstItem = data[0];
  const equipmentNo = firstItem['EQUIPMENT NO.'] || '';
  const equipmentDesc = firstItem['EQUIPMENT DESCRIPTION'] || '';
  const no = firstItem['NO.'] || '';
  const pmtNo = firstItem['PMT NO.'] || '';

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs font-semibold text-gray-600 uppercase">No.</span>
            <p className="text-sm font-bold text-gray-900">{no || 'N/A'}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-600 uppercase">Equipment No.</span>
            <p className="text-sm font-bold text-gray-900">{equipmentNo || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <span className="text-xs font-semibold text-gray-600 uppercase">PMT No.</span>
            <p className="text-sm font-bold text-gray-900">{pmtNo || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <span className="text-xs font-semibold text-gray-600 uppercase">Description</span>
            <p className="text-sm font-bold text-gray-900">{equipmentDesc || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Parts Details</h4>
        {data.map((item, idx) => (
          <div key={idx} className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <div className="bg-indigo-100 px-3 py-2 rounded-t-lg -mx-4 -mt-4 mb-3">
              <h5 className="font-bold text-indigo-900">{item['PARTS'] || `Part ${idx + 1}`}</h5>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="font-semibold text-gray-600">Phase:</span>
                <span className="ml-2 text-gray-900">{item['PHASE'] || 'N/A'}</span>
              </div>
              
              <div>
                <span className="font-semibold text-gray-600">Fluid:</span>
                <span className="ml-2 text-gray-900">{item['FLUID'] || 'N/A'}</span>
              </div>
              
              <div className="col-span-2 border-t pt-2 mt-1">
                <span className="font-semibold text-gray-700">Material Information</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Type:</span>
                <span className="ml-2 text-gray-900">{item['MATERIAL INFORMATION TYPE'] || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Spec.:</span>
                <span className="ml-2 text-gray-900">{item['MATERIAL INFORMATION SPEC.'] || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-gray-600">Grade:</span>
                <span className="ml-2 text-gray-900">{item['MATERIAL INFORMATION GRADE'] || 'N/A'}</span>
              </div>
              
              <div className="col-span-2">
                <span className="font-semibold text-gray-600">Insulation (yes/No):</span>
                <span className="ml-2 text-gray-900">{item['INSULATION (yes/No)'] || 'N/A'}</span>
              </div>
              
              <div className="col-span-2 border-t pt-2 mt-1">
                <span className="font-semibold text-gray-700">Design</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Temp. (°C):</span>
                <span className="ml-2 text-gray-900">{item['DESIGN TEMP.  (°C)'] || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Pressure (Mpa):</span>
                <span className="ml-2 text-gray-900">{item['DESIGN PRESSURE (Mpa)'] || 'N/A'}</span>
              </div>
              
              <div className="col-span-2 border-t pt-2 mt-1">
                <span className="font-semibold text-gray-700">Operating</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Temp. (°C):</span>
                <span className="ml-2 text-gray-900">{item['OPERATING TEMP.  (°C)'] || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Pressure (Mpa):</span>
                <span className="ml-2 text-gray-900">{item['OPERATING PRESSURE (Mpa)'] || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [insertingToSlide, setInsertingToSlide] = useState(false);
  const [task, setTask] = useState<CreateTaskResponse['task'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [pdfs, setPdfs] = useState<LocalPdfItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [extractingCount, setExtractingCount] = useState(0);
  const [completingTask, setCompletingTask] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const { userProfile } = useAuth();
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  

  // Modal
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [modalSize, setModalSize] = useState({ width: 1200, height:700 });
  const resizingRef = useRef<boolean>(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Extraction results modal
  const [showExtractionResults, setShowExtractionResults] = useState(false);
  const [selectedExtraction, setSelectedExtraction] = useState<any>(null);

  // **NEW: Edit mode state**
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch task details and PDFs
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        
        // Fetch current user
        const user = await api.users.me();
        setCurrentUser(user);
        
        const response = await api.tasks.listUserTasks();
        const foundTask = response.tasks.find((t) => t.taskId === taskId);
        if (!foundTask) {
          setError('Task not found');
          toast.error('Task not found', { icon: '❌', duration: 4000 });
        } else {
          setTask(foundTask);
          await loadPdfs();
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load task');
        toast.error('Failed to load task', { icon: '❌', duration: 4000 });
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId]);

  // Load existing PDFs from backend
  const loadPdfs = async () => {
    if (!taskId || typeof taskId !== 'string') return;
    
    try {
      const response = await api.tasks.listPdfs(taskId);
      const loadedPdfs: LocalPdfItem[] = response.pdfs.map(pdf => {
        let previewUrl = pdf.url;
        if (pdf.url && pdf.url.includes('drive.google.com')) {
          const fileIdMatch = pdf.url.match(/\/d\/([^\/]+)/);
          if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
          }
        }
        
        return {
          ...pdf,
          url: previewUrl,
          status: pdf.status || 'pending',
          extractedData: pdf.extractedData || [],
          selected: false,
        };
      });
      setPdfs(loadedPdfs);
    } catch (err) {
      console.error('Failed to load PDFs:', err);
      toast.error('Failed to load PDFs', { icon: '❌', duration: 3000 });
    }
  };

  // Upload a single PDF to backend
  const uploadPdf = async (file: File): Promise<{ success: boolean; pdf?: LocalPdfItem; error?: string; isDuplicate?: boolean }> => {
    if (!taskId || typeof taskId !== 'string') return { success: false, error: 'Invalid task ID' };

    try {
      const response = await api.tasks.uploadPdf(taskId, file);
      
      return {
        success: true,
        pdf: {
          fileId: response.pdf.fileId,
          fileName: response.pdf.fileName,
          url: response.pdf.url,
          thumbnail: response.pdf.thumbnail,
          createdAt: response.pdf.createdAt,
          status: 'pending',
          extractedData: [],
          selected: true,
          previewUrl: URL.createObjectURL(file),
        }
      };
    } catch (err: any) {
      console.error(`Failed to upload ${file.name}:`, err);
      
      const errorMessage = err.message || String(err);
      const isDuplicate = errorMessage.includes('already exists');
      
      return { 
        success: false, 
        error: errorMessage,
        isDuplicate 
      };
    }
  };

  // Handle PDF file selection
  const handlePdfUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    
    if (files.length === 0) {
      toast.error('Please select PDF files only', { icon: '📄', duration: 3000 });
      return;
    }

    const tempPdfs: LocalPdfItem[] = files.map(f => ({
      fileId: `temp-${Date.now()}-${Math.random()}`,
      fileName: f.name,
      status: 'uploading',
      extractedData: [],
      selected: true,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    
    setPdfs(prev => [...prev, ...tempPdfs]);
    setUploadingCount(files.length);

    const uploadToast = toast.loading(`Uploading ${files.length} file(s)...`, { icon: '📤' });

    const uploadPromises = files.map(file => uploadPdf(file));
    const results = await Promise.all(uploadPromises);
    
    const successful: LocalPdfItem[] = [];
    const duplicates: string[] = [];
    const failed: string[] = [];
    
    results.forEach((result, index) => {
      if (result.success && result.pdf) {
        successful.push(result.pdf);
      } else if (result.isDuplicate) {
        duplicates.push(files[index].name);
      } else {
        failed.push(files[index].name);
      }
    });
    
    setPdfs(prev => {
      const withoutTemp = prev.filter(p => p.status !== 'uploading');
      return [...withoutTemp, ...successful];
    });
    
    setUploadingCount(0);
    toast.dismiss(uploadToast);
    
    if (successful.length > 0) {
      toast.success(`${successful.length} file(s) uploaded successfully`, { icon: '✅', duration: 4000 });
    }
    if (duplicates.length > 0) {
      toast.error(`${duplicates.length} duplicate(s) skipped`, { icon: '⚠️', duration: 4000 });
    }
    if (failed.length > 0) {
      toast.error(`${failed.length} file(s) failed to upload`, { icon: '❌', duration: 4000 });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    setDragActive(true); 
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    setDragActive(false); 
  };
  
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    
    if (files.length === 0) {
      toast.error('Please drop PDF files only', { icon: '📄', duration: 3000 });
      return;
    }

    const tempPdfs: LocalPdfItem[] = files.map(f => ({
      fileId: `temp-${Date.now()}-${Math.random()}`,
      fileName: f.name,
      status: 'uploading',
      extractedData: [],
      selected: true,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    
    setPdfs(prev => [...prev, ...tempPdfs]);
    setUploadingCount(files.length);

    const uploadToast = toast.loading(`Uploading ${files.length} file(s)...`, { icon: '📤' });

    const uploadPromises = files.map(file => uploadPdf(file));
    const results = await Promise.all(uploadPromises);
    
    const successful: LocalPdfItem[] = [];
    const duplicates: string[] = [];
    const failed: string[] = [];
    
    results.forEach((result, index) => {
      if (result.success && result.pdf) {
        successful.push(result.pdf);
      } else if (result.isDuplicate) {
        duplicates.push(files[index].name);
      } else {
        failed.push(files[index].name);
      }
    });
    
    setPdfs(prev => {
      const withoutTemp = prev.filter(p => p.status !== 'uploading');
      return [...withoutTemp, ...successful];
    });
    
    setUploadingCount(0);
    toast.dismiss(uploadToast);
    
    if (successful.length > 0) {
      toast.success(`${successful.length} file(s) uploaded successfully`, { icon: '✅', duration: 4000 });
    }
    if (duplicates.length > 0) {
      toast.error(`${duplicates.length} duplicate(s) skipped`, { icon: '⚠️', duration: 4000 });
    }
    if (failed.length > 0) {
      toast.error(`${failed.length} file(s) failed to upload`, { icon: '❌', duration: 4000 });
    }
  };

  // Select all / deselect all
const toggleSelectAll = (checked: boolean) => {
  setPdfs(prev => prev.map(p => 
    // Only allow selection of pending or extracted PDFs (not completed)
    (p.status === 'pending' || p.status === 'extracted') 
      ? { ...p, selected: checked } 
      : p
  ));
  
  toast.success(checked ? 'All PDFs selected' : 'All PDFs deselected', {
    icon: checked ? '☑️' : '⬜',
    duration: 2000,
  });
};

  // Remove selected PDFs
  // Remove selected PDFs
const handleRemoveSelected = async () => {
  if (!taskId || typeof taskId !== 'string') return;
  
  const selectedPdfs = pdfs.filter(p => p.selected);
  
  if (selectedPdfs.length === 0) {
    toast.error('No PDFs selected for removal', { icon: '⚠️', duration: 3000 });
    return;
  }

  const deleteToast = toast.loading(`Deleting ${selectedPdfs.length} file(s)...`, { icon: '🗑️' });

  const newPdfs = pdfs.filter(p => !p.selected);
  pdfs.forEach(p => { 
    if (p.selected && p.previewUrl) {
      URL.revokeObjectURL(p.previewUrl); 
    }
  });
  setPdfs(newPdfs);

  try {
    const deletePromises = selectedPdfs.map(pdf =>
      api.tasks.deletePdf(taskId, pdf.fileId)
    );
    
    await Promise.all(deletePromises);
    
    toast.dismiss(deleteToast);
    toast.success(`${selectedPdfs.length} file(s) deleted successfully`, { icon: '✅', duration: 3000 });
  } catch (err) {
    console.error('Failed to delete PDF metadata:', err);
    toast.dismiss(deleteToast);
    toast.error('Some PDFs failed to delete', { icon: '❌', duration: 4000 });
  }
};

  // Extract selected PDFs using Gemini AI
  const handleExtractSelected = async () => {
    if (!taskId || typeof taskId !== 'string') return;

    console.log('📊 All PDFs:', pdfs.map(p => ({ 
      name: p.fileName, 
       selected: p.selected, 
      status: p.status 
    })));

    const selectedPdfs = pdfs.filter((p) => p.selected && (p.status === 'pending'||p.status === 'extracted'));
    console.log('✅ Filtered selectedPdfs:', selectedPdfs.length);
    console.log('📋 Files:', selectedPdfs.map(p => p.fileName));

    if (selectedPdfs.length === 0) {
      toast.error('No pending PDFs selected for extraction', { icon: '⚠️', duration: 3000 });
      return;
    }

    if (!task || !task.sheet || !task.sheet.id) {
      toast.error('Sheet ID not found in task data', { icon: '❌', duration: 3000 });
      return;
    }

    const sheetId = task.sheet.id;
    const fileIds = selectedPdfs.map((p) => p.fileId);
    setExtractingCount(selectedPdfs.length);
    
    const extractToast = toast.loading(`Extracting data from ${selectedPdfs.length} file(s)...`, {
      icon: '🔍',
      duration: Infinity,
    });
    
    setPdfs((prev) =>
      prev.map((p) =>
         p.selected && (p.status === 'pending' || p.status === 'extracted')
          ? { ...p, status: 'uploading' as const }
          : p
      )
    );
    
    try {
      if (selectedPdfs.length === 1) {
        const fileId = fileIds[0];
        const response = await api.tasks.extractSinglePdf(taskId, fileId, sheetId);

        if (response.extractedData) {
          setPdfs((prev) =>
            prev.map((p) =>
              p.fileId === fileId
                ? { ...p, status: 'extracted' as const, extractedData: response.extractedData }
                : p
            )
          );
          toast.dismiss(extractToast);
          toast.success('PDF extracted successfully', { icon: '✅', duration: 4000 });
        } else {
          setPdfs((prev) =>
            prev.map((p) =>
              p.fileId === fileId ? { ...p, status: 'pending' as const } : p
            )
          );
          toast.dismiss(extractToast);
          toast.error('PDF extraction failed', { icon: '❌', duration: 4000 });
        }
        return;
      }
      const BATCH_SIZE = 2;
      const batches: string[][] = [];
      for (let i = 0; i < fileIds.length; i += BATCH_SIZE) {
        batches.push(fileIds.slice(i, i + BATCH_SIZE));
      }

      let totalSuccessful = 0;
      let totalFailed = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        try {
          const response = await api.tasks.extractMultiplePdfs(taskId, batch, sheetId);

          response.results.forEach((result) => {
            if (!result.extraction_result) return;

            setPdfs((prev) =>
              prev.map((p) =>
                p.fileId === result.file_id
                  ? {
                      ...p,
                      status: result.extraction_result.success ? 'extracted' as const : 'pending' as const,
                      extractedData: result.extraction_result.success ? result.extraction_result.data : p.extractedData,
                    }
                  : p
              )
            );
          });

          totalSuccessful += response.summary.successful;
          totalFailed += response.summary.failed;
        } catch (batchError: any) {
          console.error(`Batch ${i + 1} failed:`, batchError);

          setPdfs((prev) =>
            prev.map((p) =>
              batch.includes(p.fileId) ? { ...p, status: 'pending' as const } : p
            )
          );

          totalFailed += batch.length;
        }
      }

      toast.dismiss(extractToast);
      
      if (totalSuccessful > 0) {
        toast.success(`${totalSuccessful} file(s) extracted successfully`, { icon: '✅', duration: 4000 });
      }
      if (totalFailed > 0) {
        toast.error(`${totalFailed} file(s) failed to extract`, { icon: '❌', duration: 4000 });
      }
    } catch (err: any) {
      console.error('Failed to extract PDFs:', err);
      toast.dismiss(extractToast);
      toast.error(`Extraction failed: ${err.message || 'Unknown error'}`, { icon: '❌', duration: 5000 });

      setPdfs((prev) =>
        prev.map((p) =>
          fileIds.includes(p.fileId) ? { ...p, status: 'pending' as const } : p
        )
      );
    } finally {
      setExtractingCount(0);
    }
  };

  // View extraction results
  const handleViewExtraction = (pdf: LocalPdfItem) => {
    if (pdf.extractedData) {
      setSelectedExtraction({
        fileName: pdf.fileName,
        data: pdf.extractedData
      });
      setShowExtractionResults(true);
    }
  };

  // **NEW: Handle field changes in edit mode - FIXED with useCallback**
  const handleFieldChange = useCallback((itemIndex: number, fieldName: string, value: string) => {
    setEditedData(prev => {
      const newData = [...prev];
      if (newData[itemIndex]) {
        newData[itemIndex] = {
          ...newData[itemIndex],
          [fieldName]: value
        };
      }
      return newData;
    });
  }, []);

  // **NEW: Handle edit mode toggle**
  const handleEditToggle = () => {
    if (previewIndex === null) return;
    
    const currentPdf = pdfs[previewIndex];
    if (!isEditMode) {
      // Entering edit mode - create a deep copy of the data
      setEditedData(JSON.parse(JSON.stringify(currentPdf.extractedData || [])));
    }
    setIsEditMode(!isEditMode);
  };

  // **NEW: Save edited data**
  const handleSaveEdit = async () => {
    if (previewIndex === null || !taskId || typeof taskId !== 'string') return;
    
    const currentPdf = pdfs[previewIndex];
    
    setIsSaving(true);
    const saveToast = toast.loading('Saving changes...', { icon: '💾' });
    
    try {
      // Call API to update the extracted data
      const response = await api.tasks.updateExtractedData(
        taskId,
        currentPdf.fileId,
        editedData
      );

      if (response.success) {
        // Update local state
        setPdfs(prev => prev.map(p => 
          p.fileId === currentPdf.fileId 
            ? { ...p, extractedData: editedData }
            : p
        ));
        
        setIsEditMode(false);
        toast.dismiss(saveToast);
        toast.success('Data updated successfully!', { icon: '✅', duration: 3000 });
      } else {
        toast.dismiss(saveToast);
        toast.error('Failed to update data', { icon: '❌', duration: 3000 });
      }
    } catch (err: any) {
      console.error('Failed to save edited data:', err);
      toast.dismiss(saveToast);
      toast.error(`Error saving data: ${err.message || 'Unknown error'}`, { icon: '❌', duration: 4000 });
    } finally {
      setIsSaving(false);
    }
  };

  // **NEW: Cancel editing**
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedData([]);
    toast.success('Edit cancelled', { icon: 'ℹ️', duration: 2000 });
  };

  // **NEW: Complete task function**
  // **NEW: Complete task function with custom modal**
const handleCompleteTask = async () => {
    if (!taskId || typeof taskId !== 'string') return;
    
    setShowCompleteConfirm(false);
    setCompletingTask(true);
    const completeToast = toast.loading('Completing task...', { icon: '⏳' });
    
    try {
      const response = await api.tasks.updateTaskStatus(taskId, 'Completed');
      
      if (response.success) {
        setTask(prev => prev ? { ...prev, status: 'completed' } : null);
        toast.dismiss(completeToast);
        toast.success('Task marked as completed successfully!', { icon: '🎉', duration: 5000 });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.dismiss(completeToast);
        toast.error('Failed to complete task', { icon: '❌', duration: 3000 });
      }
    } catch (err: any) {
      console.error('Failed to complete task:', err);
      toast.dismiss(completeToast);
      toast.error(`Error completing task: ${err.message || 'Unknown error'}`, { icon: '❌', duration: 4000 });
    } finally {
      setCompletingTask(false);
    }
  };

  // Copy data to clipboard
  const copyToClipboard = (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast.success('Data copied to clipboard!', { icon: '📋', duration: 2000 });
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy data', { icon: '❌', duration: 3000 });
    });
  };

  // Insert data to Google Sheet
  // Insert data to Google Sheet
const handleInsertToSheet = async () => {
  if (!taskId || typeof taskId !== 'string') return;

  const selected = pdfs.filter(p => p.selected && p.status === 'extracted');

  if (selected.length === 0) {
    toast.error('No extracted data selected for Sheet insertion', { icon: '⚠️', duration: 3000 });
    return;
  }

  if (!task || !task.sheet || !task.sheet.id) {
    toast.error('Sheet ID not found in task data', { icon: '❌', duration: 3000 });
    return;
  }

  const fileIds = selected.map(p => p.fileId);
  const sheetId = task.sheet.id;

  const insertToast = toast.loading(`Inserting data from ${selected.length} PDF(s)...`, {
    icon: '📊',
    duration: Infinity,
  });

  try {
    const response = await api.tasks.insertToSheet(taskId, fileIds, sheetId);
  
    setPdfs(prev =>
      prev.map(p =>
        fileIds.includes(p.fileId)
          ? { ...p, status: 'completed' as const, selected: false }
          : p
      )
    );
    
    toast.dismiss(insertToast);
    toast.success(
      `Data inserted successfully!\n\nRows updated: ${response.rows_updated || 0}\nCells updated: ${response.cells_updated || 0}`,
      { icon: '✅', duration: 5000 }
    );
  
  } catch (err: any) {
    console.error('Failed to insert to sheet:', err);
    toast.dismiss(insertToast);
    toast.error(`Failed to insert to sheet: ${err.message || 'Unknown error'}`, {
      icon: '❌',
      duration: 5000,
    });
  }
};

  const handleInsertToSlide = async () => {
    if (!task?.sheet?.id || !task.slide?.id) {
      toast.error('Sheet or Slide ID missing', { icon: '❌', duration: 3000 });
      return;
    }
    
    const slideToast = toast.loading('Updating slide presentation...', {
      icon: '📑',
      duration: Infinity,
    });
    
    try {
      setInsertingToSlide(true);
      const result = await api.tasks.insertDataToSlide(task.slide.id, task.sheet.id, 0);
      
      toast.dismiss(slideToast);
      
      if (result.success) {
        toast.success('Data inserted to Slide successfully!', { icon: '✅', duration: 4000 });
      } else {
        toast.error('Data insertion to Slide failed', { icon: '❌', duration: 4000 });
      } 
    } catch (err: any) {
      console.error(err);
      toast.dismiss(slideToast);
      toast.error(`Error inserting to Slide: ${err.error || err.message || 'Unknown error'}`, {
        icon: '❌',
        duration: 5000,
      });
    } finally {
      setInsertingToSlide(false);
    }
  };

  // Preview modal
  const openPreview = () => {
    const index = pdfs.findIndex(p => p.selected);
    if (index >= 0) {
      setPreviewIndex(index);
      // Initialize edit data when opening preview
      setEditedData(JSON.parse(JSON.stringify(pdfs[index].extractedData || [])));
      setIsEditMode(false);
    } else {
      toast.error('Select at least one PDF to preview', { icon: '⚠️', duration: 3000 });
    }
  };
  
  const closePreview = () => {
    setPreviewIndex(null);
    setIsEditMode(false);
    setEditedData([]);
  };
  
  const prevPreview = () => { 
    if (previewIndex === null) return; 
    if (previewIndex > 0) {
      const newIndex = previewIndex - 1;
      setPreviewIndex(newIndex);
      setEditedData(JSON.parse(JSON.stringify(pdfs[newIndex].extractedData || [])));
      setIsEditMode(false);
    }
  };
  
  const nextPreview = () => { 
    if (previewIndex === null) return; 
    if (previewIndex < pdfs.length - 1) {
      const newIndex = previewIndex + 1;
      setPreviewIndex(newIndex);
      setEditedData(JSON.parse(JSON.stringify(pdfs[newIndex].extractedData || [])));
      setIsEditMode(false);
    }
  };

  // Resize modal handlers
  const startResize = (e: React.MouseEvent) => { 
    resizingRef.current = true; 
    lastPos.current = { x: e.clientX, y: e.clientY }; 
  };
  
  const stopResize = () => { 
    resizingRef.current = false; 
  };
  
  const handleResize = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setModalSize(prev => ({ 
      width: Math.max(600, prev.width + dx), 
      height: Math.max(400, prev.height + dy) 
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading task...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!task) return null;

  return (
  <>
    {/* **TOASTER COMPONENT** */}
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
          borderRadius: '10px',
          padding: '16px',
          fontSize: '14px',
          maxWidth: '500px',
        },
        success: {
          style: {
            background: '#10B981',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
          },
        },
        error: {
          style: {
            background: '#EF4444',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
          },
        },
        loading: {
          style: {
            background: '#3B82F6',
          },
        },
      }}
    />
    
  <div className="max-w-5xl mx-auto py-8">
    {/* Header */}
    <div className="mb-4 flex justify-between items-center">
      <h2 className="text-2xl font-bold">{task.taskName}</h2>
      <button onClick={() => router.back()} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">Back</button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Task Details */}
      <div className="lg:col-span-1">
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Task Details</h3>
          <p><strong>Start Date:</strong> {task.startDate}</p>
          <p><strong>Due Date:</strong> {task.dueDate}</p>
          <p>
            <strong>Status:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
              task.status === 'Completed' 
                ? 'bg-green-100 text-green-800' 
                : task.status === 'In Progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {task.status}
            </span>
          </p>
          <p><strong>Created By:</strong> {userMap[task.createdBy] || task.createdBy}</p>
          <p><strong>Members:</strong> {task.members.map(email => userMap[email] || email).join(', ')}</p>

          <div className="space-y-2 pt-4 border-t">
            <a href={task.sheet.url} target="_blank" className="block w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-center">
              Open Sheet
            </a>
            <a href={task.slide.url} target="_blank" className="block w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-purple-600 text-center">
              Open Slide
            </a>
            {userProfile?.position!=="tech assistant" &&task.status !== 'Completed' &&(
            <button 
              onClick={handleInsertToSlide} 
              disabled={insertingToSlide || task.status === 'completed'}
              className="w-full px-3 py-2 bg-orange-700 text-white rounded hover:bg-purple-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {insertingToSlide ? '⏳ Updating...' : 'Update Slide'}
            </button>
            )}
            
            {/* Review and Complete Button - Only show if task is not completed AND user has permission */}
            {task.status !== 'Completed' && userProfile?.email===task.createdBy && (
                  <button 
                    onClick={() => setShowCompleteConfirm(true)}
                    disabled={completingTask}
                    className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold shadow-md transition-all"
                  >
                    {completingTask ? '⏳ Completing...' : '✅ Review & Complete Task'}
                  </button>
            )}

            {/* Show completion message if task is completed */}
            {task.status === 'Completed' && (
              <div className="w-full px-3 py-2 bg-green-50 border-2 border-green-300 rounded text-center">
                <p className="text-green-700 font-semibold">✅ Task Completed</p>
                <p className="text-xs text-green-600 mt-1">This task has been finalized</p>
              </div>
            )}
          </div>
        </div>

        {uploadingCount > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-700">Uploading {uploadingCount} file{uploadingCount > 1 ? 's' : ''}...</p>
          </div>
        )}

        {extractingCount > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-700">Extracting data from {extractingCount} file{extractingCount > 1 ? 's' : ''}... This may take a moment.</p>
          </div>
        )}

        {insertingToSlide && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-700">Updating data to Slide... Please wait.</p>
          </div>
        )}

        {completingTask && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
            <p className="text-purple-700">Completing task... Please wait.</p>
          </div>
        )}
      </div>

      {/* Right Column - PDF Management */}
      <div className="lg:col-span-2 space-y-6">
        {task.status !== 'Completed' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div 
            onDragOver={handleDragOver} 
            onDragLeave={handleDragLeave} 
            onDrop={handleDrop} 
            className={`p-6 border-2 border-dashed rounded text-center cursor-pointer ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'} ${task.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <p className="mb-2 text-gray-700">
              {'Drag & Drop PDFs here'}
            </p>
          </div>

          <div className="mt-4">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={uploadingCount > 0 || task.status === 'Completed'}
            >
              Select PDF
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="application/pdf" 
              multiple 
              onChange={handlePdfUpload} 
              className="hidden" 
              disabled={task.status === 'Completed'}
            />
          </div>
        </div>)}

        {pdfs.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              {task.status !== 'Completed' &&(
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={toggleSelectAll.bind(null, true)} 
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={task.status === 'Completed'}
                >
                  Select All
                </button>
                <button 
                  onClick={toggleSelectAll.bind(null, false)} 
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Deselect All
                </button>
                <button 
                  onClick={handleExtractSelected} 
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={task.status === 'Completed'}
                >
                  Extract
                </button>
                <button 
                  onClick={openPreview} 
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Preview
                </button>
                <button 
                  onClick={handleInsertToSheet} 
                  className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={task.status === 'Completed'}
                >
                  Insert to Sheet
                </button>
                <button 
                  onClick={handleRemoveSelected} 
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={task.status === 'Completed'}
                >
                  Remove
                </button>
              </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">File Name</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Select</th>
                    <th className="px-4 py-2">Extracted Data</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pdfs.map((pdf, idx) => (
                    <tr key={pdf.fileId} className={pdf.status === 'uploading' ? 'opacity-50 animate-pulse'  : pdf.status === 'completed' ? 'bg-green-100 border-l-4 border-green-500' :  ''}>
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2">{pdf.fileName}</td>
                      <td className="px-4 py-2">
                        {pdf.status === 'uploading' ? (
                          <span className="text-blue-600 font-semibold flex items-center gap-1">
                            <span className="animate-spin">⏳</span> Uploading...</span>
                        ) : pdf.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                             ✓ Completed
                          </span>
                          ) : (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            pdf.status === 'extracted' ? 'bg-blue-100 text-blue-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {pdf.status}
                          </span>
                          )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input 
                          type="checkbox" 
                          checked={pdf.selected || false}
                          disabled={pdf.status === 'uploading' || pdf.status === 'completed' || task.status === 'completed'}
                          onChange={() => {
                            const newPdfs = [...pdfs];
                            newPdfs[idx].selected = !newPdfs[idx].selected;
                            setPdfs(newPdfs);
                          }} 
                          className={pdf.status === 'completed' || task.status === 'completed' ? 'cursor-not-allowed opacity-50' : ''}
                        />
                      </td>
                      <td className="px-4 py-2">
                        {(pdf.status === 'extracted'||pdf.status === 'completed') && pdf.extractedData ? (
                          <button
                            onClick={() => handleViewExtraction(pdf)}
                            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                          >
                            View Data
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">No data</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* **UPDATED: Preview Modal with Edit Functionality - FIXED** */}
    {previewIndex !== null && pdfs[previewIndex] && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div style={{ width: modalSize.width, height: modalSize.height }} className="bg-white rounded shadow-lg flex flex-col overflow-hidden relative">
          
          {/* **Top Navigation Bar** */}
          <div className="bg-gray-100 border-b px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                PDF {previewIndex + 1} of {pdfs.length}
              </span>
              <span className="text-xs text-gray-500">
                - {pdfs[previewIndex].fileName}
              </span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={prevPreview} 
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm" 
                disabled={isEditMode || previewIndex === 0}
              >
                ← Prev
              </button>
              <button 
                onClick={nextPreview} 
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm" 
                disabled={isEditMode || previewIndex === pdfs.length - 1}
              >
                Next →
              </button>
              <button 
                onClick={closePreview} 
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* **Content Area** */}
          <div className="flex flex-1 overflow-hidden">
            {/* PDF Viewer */}
            <iframe 
              src={pdfs[previewIndex].previewUrl || pdfs[previewIndex].url}
              className="w-2/3 h-full border-0"
              title="PDF Preview"
              loading="lazy"
            />
            
            {/* Data Panel */}
            <div className="w-1/3 flex flex-col border-l bg-gray-50">
              {/* Data Panel Header */}
              <div className="px-4 py-3 border-b bg-white flex justify-between items-center">
                <h3 className="font-bold text-lg">
                  {isEditMode ? '✏️ Edit Mode' : 'Extracted Data'}
                </h3>
                {pdfs[previewIndex].extractedData && pdfs[previewIndex].extractedData.length > 0 && task.status !== 'Completed' && (
                  <button
                    onClick={handleEditToggle}
                    className={`px-3 py-1 text-sm rounded ${
                      isEditMode 
                        ? 'bg-gray-500 text-white hover:bg-gray-600' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    disabled={isSaving}
                  >
                    {isEditMode ? '✕ Cancel' : '✏️ Edit'}
                  </button>
                )}
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {pdfs[previewIndex].extractedData ? (
                  <div className="text-sm">
                    <EditableEquipmentDataViewer 
                      data={isEditMode ? editedData : pdfs[previewIndex].extractedData} 
                      isEdit={isEditMode}
                      onChange={handleFieldChange}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-2">No data extracted</p>
                    <p className="text-xs text-gray-500">Select this PDF and click Extract to analyze</p>
                  </div>
                )}
              </div>

              {/* Save/Cancel Buttons - Sticky at bottom when in edit mode */}
              {isEditMode && (
                <div className="p-4 bg-white border-t">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                    >
                      {isSaving ? '⏳ Saving...' : '💾 Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* **Resize Handle** */}
          <div 
            onMouseDown={startResize}
            className="absolute bottom-0 right-0 w-4 h-4 bg-gray-400 cursor-se-resize" 
          />
        </div>
      </div>
    )}

    {/* Extraction Results Modal */}
    {showExtractionResults && selectedExtraction && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Extraction Results</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedExtraction.fileName}</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => copyToClipboard(selectedExtraction.data)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-1"
                title="Copy all data"
              >
                📋 Copy
              </button>
              <button 
                onClick={() => {
                  const jsonString = JSON.stringify(selectedExtraction.data, null, 2);
                  const blob = new Blob([jsonString], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedExtraction.fileName}_extraction.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('File downloaded!', { icon: '💾', duration: 2000 });
                }}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex items-center gap-1"
                title="Download as JSON"
              >
                💾 Download
              </button>
              <button 
                onClick={() => setShowExtractionResults(false)}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                ✕ Close
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <EquipmentDataViewer  data={selectedExtraction.data} />
            </div>

            <div className="mt-6">
              <details className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <summary className="px-4 py-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex justify-between items-center">
                  <span>📄 View Raw JSON</span>
                  <span className="text-xs text-gray-500">Click to expand</span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <pre className="p-4 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto font-mono">
{JSON.stringify(selectedExtraction.data, null, 2)}
                  </pre>
                </div>
              </details>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Use the Copy button to paste this data elsewhere, or Download to save as a JSON file.
              </p>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Complete Task Confirmation Modal */}
{showCompleteConfirm && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideUp">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">🎯</span>
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-2xl font-bold text-center text-gray-800 mb-3">
        Complete This Task?
      </h3>
      
      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 text-center mb-3">
          This action will finalize the task and notify all team members.
        </p>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>All PDFs will be locked from editing</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Task status will be updated to completed</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>No further changes can be made to this task</span>
          </div>
        </div>
      </div>
      
      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
        <p className="text-xs text-amber-800 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span><strong>Note:</strong> This action cannot be undone</span>
        </p>
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCompleteConfirm(false)}
          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleCompleteTask}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold shadow-lg transition-all"
        >
          Yes, Complete
        </button>
      </div>
    </div>
  </div>
)}
  </>
  );
}
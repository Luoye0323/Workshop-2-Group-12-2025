// api.ts
import { register } from 'module';
import type {
  UserProfile,
  UsersListResponse,
  RegisterResponse,
  MessageResponse,
  TemplatesResponse,
  Template,
  CreateTaskRequest, 
  CreateTaskResponse, 
  ListTasksResponse, 
  UsersByPosition,
  UploadPdfResponse,
  ListPdfsResponse,
  UpdatePdfRequest,
  ExtractMultipleResponse,
  ExtractSingleResponse,
  GetExtractionResponse,
  UpdateTaskRequest,
  UpdateExtractedDataRequest,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT = 180000; // 3 minutes

// --------------------------------------------
// Auth token helpers
// --------------------------------------------
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', token);
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
}

// --------------------------------------------
// Generic API call with timeout
// --------------------------------------------
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;

  const token = getAuthToken();

  // Timeout promise
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
  );

  try {
    // Build headers
    const headers: Record<string, string> = {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    // Add existing headers from options
    if (options?.headers) {
      const existingHeaders = new Headers(options.headers);
      existingHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    }

    // ✅ IMPORTANT: Don't set Content-Type for FormData
    // Browser will automatically set it with the correct boundary
    if (!(options?.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchPromise = fetch(url, {
      ...options,
      headers,
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
      } catch {}
      
      if (response.status === 401) {
        removeAuthToken();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
    
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('An unexpected error occurred');
  }
}

// --------------------------------------------
// HTTP METHOD HELPERS
// --------------------------------------------
function get<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' });
}

function post<T>(endpoint: string, data?: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

function put<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

function patch<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

function del<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE' });
}

// --------------------------------------------
// API METHODS
// --------------------------------------------
export const api = {
  users: {
    register: (userData: {
      name: string;
      email: string;
      password: string;
      phone: string;
      gender: string;
      position: string;
    }) => post<RegisterResponse>('/register', userData),

    me: (): Promise<UserProfile> =>
      get<UserProfile>('/me'),

    list: (): Promise<UsersListResponse> =>
      get<UsersListResponse>('/all_users'),

    listAllByPosition: (): Promise<UsersByPosition> => 
      get<UsersByPosition>("/all_by_position"),
  },

  tasks: {
    createTask: (data: CreateTaskRequest): Promise<CreateTaskResponse> =>
      post<CreateTaskResponse>('/create_task', data),

    updateTask: (taskId: string, data: UpdateTaskRequest): Promise<MessageResponse> =>
      patch<MessageResponse>(`/update_task/${taskId}`, data),

    updateTaskStatus: (taskId: string, status: string): Promise<MessageResponse> =>
      patch<MessageResponse>(`/tasks/${taskId}/status`, { status }),

    listUserTasks: (): Promise<ListTasksResponse> =>
       get<ListTasksResponse>('/my_tasks'),

   uploadPdf: async (taskId: string, file: File): Promise<UploadPdfResponse> => {
      const formData = new FormData();
      formData.append('file', file);
    
      return apiCall<UploadPdfResponse>(`/upload_pdf/${taskId}`, {
        method: 'POST',
        body: formData,
      });
    },

    insertToSheet: (taskId: string, fileIds: string[], sheetId: string): Promise<MessageResponse> =>
      post<MessageResponse>(`/insert_to_sheet/${taskId}`, { 
        file_ids: fileIds,
        sheet_id: sheetId 
      }),

    listPdfs: (taskId: string): Promise<ListPdfsResponse> =>
      get<ListPdfsResponse>(`/list_pdfs/${taskId}`),

    updatePdf: (taskId: string, fileId: string, updates: UpdatePdfRequest): Promise<MessageResponse> =>
      patch<MessageResponse>(`/update_pdf/${taskId}/${fileId}`, updates),

    deletePdf: (taskId: string, fileId: string): Promise<MessageResponse> =>
      del<MessageResponse>(`/delete_pdf/${taskId}/${fileId}`),

    extractSinglePdf: (taskId: string, fileId: string, sheetId: string): Promise<ExtractSingleResponse> =>
      post<ExtractSingleResponse>(`/extract_pdf/${taskId}/${fileId}`, { sheet_id: sheetId }),

    extractMultiplePdfs: (taskId: string, fileIds: string[], sheetId: string): Promise<ExtractMultipleResponse> =>
      post<ExtractMultipleResponse>(`/extract_multiple/${taskId}`, { 
        file_ids: fileIds,
        sheet_id: sheetId 
      }),

    getExtraction: (taskId: string, fileId: string): Promise<GetExtractionResponse> =>
      get<GetExtractionResponse>(`/get_extraction/${taskId}/${fileId}`),

    insertDataToSlide: (
      presentationId: string, 
      spreadsheetId: string, 
      sheetIndex: number = 0
    ): Promise<MessageResponse> => 
      get<MessageResponse>(`/get-all-rows?presentation_id=${presentationId}&spreadsheet_id=${spreadsheetId}&sheet_index=${sheetIndex}`),

    updateExtractedData: (taskId: string, fileId: string, extractedData: any[]): Promise<MessageResponse> =>
      put<MessageResponse>(`/update_extracted_data/${taskId}/${fileId}`, { 
        extracted_data: extractedData 
      }),
  },

  templates: {
    getAll: (): Promise<TemplatesResponse> =>
      get<TemplatesResponse>('/all_templates'),

    openTemplate: (template: Template) => {
      if (template.url) window.open(template.url, '_blank');
    },

    downloadTemplate: (template: Template) => {
      if (template.downloadUrl) window.open(template.downloadUrl, '_blank');
    },

    create: (name: string, type: 'excel' | 'inspection') =>
      post<Template>('/create_template', { name, type }),
  },
};

export default api;
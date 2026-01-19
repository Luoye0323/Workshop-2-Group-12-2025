// types.ts

export interface UpdateTaskRequest {
  taskName: string;
  startDate: string;
  dueDate: string;
  members: string[];
}


export interface UpdateExtractedDataRequest {
  extracted_data: any[];
}


// ---------------- Firebase / Users ----------------
export type RegisterResponse =
  { message: string}
  
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  gender?: 'male' | 'female';
  position?: 'rbi lead' | 'rbi engineer' | 'tech assistant'|'admin';
  created_at?: string;
}

// ---------------- API Response Types ----------------
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface MessageResponse {
  message: string;
  success?: boolean;
  warning?: string;
  action?: string;
  rows_updated?: number;      // ✨ Add this
  cells_updated?: number;     // ✨ Add this
}

export interface UserResponse {
  user: UserProfile;
}

export interface UsersListResponse {
  users: UserProfile[];
  total: number;
}

// ---------------- Project / Task ----------------
export interface TaskFileInfo {
  id: string;
  name: string;
  url: string;
}

export interface TaskResponse {
  taskId: string;
  taskName: string;
  createdBy: string;
  folderId: string;
  sheet: TaskFileInfo;
  slide: TaskFileInfo;
  members: string[];
  startDate: string;
  dueDate: string;
  status: string;
}

export interface CreateTaskResponse {
  message: string;
  task: TaskResponse;
}

export interface ListTasksResponse {
  tasks: TaskResponse[];
}

// ---------------- Templates ----------------
export type TemplateType = 'excel' | 'inspectionPlan';

export interface Template {
  id: string;             // Google Drive file ID
  name: string;           // File name
  mimeType: string;
  createdAt?: string;
  url?: string;
  downloadUrl?: string;
  type: TemplateType;
}

export interface TemplatesResponse {
  excelTemplates: Template[];
  inspectionTemplates: Template[];
  message?: string;
  success: boolean;
}

// ---------------- Task Creation ----------------
export interface CreateTaskRequest {
  taskName: string;
  startDate: string;
  dueDate: string;
  members?: string[];
  sheetTemplateId: string;
  slideTemplateId: string;
}

export interface UsersByPosition {
  [position: string]: UserProfile[];
}

export interface DashboardStats {
  // Add dashboard stats fields as needed
}

export interface ActivitiesResponse {
  // Add activities fields as needed
}

export interface ProjectResponse {
  // Add project fields as needed
}

export interface ProjectsListResponse {
  // Add projects list fields as needed
}

// ---------------- PDF Upload ----------------
export interface PdfItem {
  fileId: string;
  fileName: string;
  url?: string;
  thumbnail?: string;
  createdAt?: string;
  uploadedBy?: string;
  size?: string;
  status?: 'pending' | 'completed' | 'extracted' | 'uploading' | 'error';
  extractedData?: string[] | ExtractedData | any; // Support both legacy string[] and new ExtractedData
  selected?: boolean;
}

export interface UploadPdfResponse {
  message: string;
  pdf: PdfItem;
}

export interface ListPdfsResponse {
  pdfs: PdfItem[];
  count: number;
}

export interface UpdatePdfRequest {
  status?: 'pending' | 'extracted';
  extractedData?: string[] | ExtractedData | any;
}

// ---------------- PDF Extraction ----------------
export interface BillOfMaterial {
  TopHead: string;
  Shell: string;
  BottomHead: string;
}

export interface DesignData {
  Fluid: string;
  Insulation: string;
  DesignTemperature: string | number;
  DesignPressure: string | number;
  OperatingTemperature: string;
  OperatingPressure: string;
  PressureUnit: string;
  TemperatureUnit: string;
}

export interface ExtractedData {
  Part1: {
    BillOfMaterial: BillOfMaterial;
  };
  Part2: {
    DesignData: DesignData;
  };
}

export interface ExtractionResult {
  fileId: string;
  fileName: string;
  extractedData: ExtractedData;
}

export interface ExtractSingleResponse {
  message: string;
  fileId: string;
  fileName: string;
  extractedData: ExtractedData;
}

export interface ExtractionResultItem {
  file_id: string;
  file_name: string;
  extraction_result: {
    success: boolean;
    data?: ExtractedData;
    message?: string;
  };
}

export interface ExtractMultipleResponse {
  message: string;
  results: ExtractionResultItem[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface GetExtractionResponse {
  fileId: string;
  fileName: string;
  status: string;
  extractedData: ExtractedData;
  updatedAt?: string;
}
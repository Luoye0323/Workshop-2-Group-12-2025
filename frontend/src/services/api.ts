import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000, // Increased to 10 seconds for file uploads
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("📤 Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("📥 Response error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Dashboard API endpoints
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentActivities: () => api.get("/dashboard/recent-activities"),
  getProcessingProgress: () => api.get("/dashboard/processing-progress"),
};

// Scheduling API endpoints
export const schedulingAPI = {
  getInspections: () => api.get("/scheduling/inspections"),
  getCalendarEvents: () => api.get("/scheduling/calendar-events"),
  createInspection: (data: any) => api.post("/scheduling/inspections", data),
  updateInspection: (id: string, data: any) =>
    api.put(`/scheduling/inspections/${id}`, data),
  deleteInspection: (id: string) => api.delete(`/scheduling/inspections/${id}`),
};

// Upload API endpoints (NEW)
export const uploadAPI = {
  uploadPDF: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/upload/pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  getUploadStatus: () => api.get("/upload/status"),
};

// Health check (NEW)
export const healthAPI = {
  check: () => api.get("/health"),
};

export default api;

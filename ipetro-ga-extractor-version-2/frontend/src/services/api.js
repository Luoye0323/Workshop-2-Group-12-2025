import axios from 'axios';

// Define the base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,  // This sets the base URL for all requests
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===== AUTHENTICATION API =====

export const register = async (username, email, password) => {
  const response = await api.post('/auth/register', {  // ✅ Just '/auth/register', not 'API_BASE_URL/auth/register'
    username,
    email,
    password
  });
  return response.data;
};

export const login = async (username, password) => {
  const response = await api.post('/auth/login', {  // ✅ Just '/auth/login'
    username,
    password
  });
  
  // Save token to localStorage
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');  // ✅ Just '/auth/me'
  return response.data;
};

// ===== FILE PROCESSING API =====

export const uploadFiles = async (files, onProgress) => {
  const formData = new FormData();
  
  // Add multiple files
  files.forEach(file => {
    formData.append('files[]', file);
  });
  
  const response = await api.post('/upload', formData, {  // ✅ Just '/upload'
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      if (onProgress) {
        onProgress(percentCompleted);
      }
    }
  });
  
  return response.data;
};

export const getUserFiles = async () => {
  const response = await api.get('/files');  // ✅ Just '/files'
  return response.data;
};

export const downloadFile = (fileType, filename) => {
  const token = localStorage.getItem('token');
  const url = `${API_BASE_URL}/download/${fileType}/${filename}`;
  
  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  
  // For authenticated downloads, open in new window with token in header
  // Or use fetch to download with proper headers
  fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    });
};

export default api;
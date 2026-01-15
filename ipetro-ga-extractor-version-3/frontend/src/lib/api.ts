import { NumberDomain } from "recharts/types/util/types";
import { receiveMessageOnPort } from "worker_threads";

// === API client for FastAPI backend ===
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// == types ==

export interface User {
  id: string;
  email: string;
  full_name: string;
  company?: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Equipment {
  id: string;
  tag: string;
  type: string;
  fluid: string;
  material_type: string;
  material_spec: string;
  material_grade: string;
  design_pressure: number;
  design_temp: number;
  operating_pressure: number;
  operating_temp: number;
  insulation: boolean;
  created_at: string;
}

export interface Extraction {
  id: string;
  filename: string;
  status: string;
  provider: string;
  model: string;
  equipment_data: any;
  excel_file?: string;
  pptx_file?: string;
  pptx_google_link?: string;
  created_at: string;
}

export interface AvailableModels {
  models: {
    gemini: string[];
    openai: string[];
    groq: string[];
  };
  configured: {
    gemini: boolean;
    openai: boolean;
    groq: boolean;
  };
}

// === storage helper ===

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
}

export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
  }
}

export function setUser(user: User) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export function getUser(): User | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
}

export function removeUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
}

// === API headers ===

function getHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

// authentication APIs

export async function register(
  email: string,
  password: string,
  full_name: string,
  company?: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name, company }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  const data = await response.json();
  setToken(data.access_token);
  setUser(data.user);
  return data;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  const data = await response.json();
  setToken(data.access_token);
  setUser(data.user);
  return data;
}

export function logout() {
  removeToken();
  removeUser();
  window.location.href = "/login";
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: getHeaders(true),
  });

  if (!response.ok) {
    throw new Error("Failed to get user info");
  }
  return response.json();
}

// model APIs
export async function getAvailableModels(): Promise<AvailableModels> {
  const response = await fetch(`${API_BASE_URL}/api/models`, {
    headers: getHeaders(true),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch models");
  }

  return response.json();
}

// upload and extraction APIs

export async function uploadDrawing(
  file: File,
  provider: string = "gemini",
  model?: string,
  signal?: AbortSignal
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("provider", provider);
  if (model) {
    formData.append("model", model);
  }

  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
}

export async function listExtractions(): Promise<Extraction[]> {
  const response = await fetch(`${API_BASE_URL}/api/extractions`, {
    headers: getHeaders(true),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch extractions");
  }
  return response.json();
}

export async function getExtraction(extractionId: string): Promise<Extraction> {
  const response = await fetch(
    `${API_BASE_URL}/api/extractions/${extractionId}`,
    {
      headers: getHeaders(true),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch extraction");
  }
  return response.json();
}

// equipment APIs

export async function createEquipment(equipment: {
  tag: string;
  type: string;
  fluid: string;
  material_type: string;
  material_spec: string;
  material_grade: string;
  design_pressure: number;
  design_temp: number;
  operating_pressure: number;
  operating_temp: number;
  insulation: boolean;
}): Promise<Equipment> {
  const response = await fetch(`${API_BASE_URL}/api/equipment`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify(equipment),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create equipment");
  }
  return response.json();
}

export async function listEquipment(): Promise<Equipment[]> {
  const response = await fetch(`${API_BASE_URL}/api/equipment`, {
    headers: getHeaders(true),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch equipment");
  }

  return response.json();
}

export async function getEquipment(equipmentId: string): Promise<Equipment[]> {
  const response = await fetch(`${API_BASE_URL}/api/equipment/${equipmentId}`, {
    headers: getHeaders(true),
  });

  if (!response.ok) {
    throw new Error("Equipment not found");
  }

  return response.json();
}

// download APIs

export async function downloadFile(
  fileType: "excel" | "pptx",
  filename: string
) {
  const token = getToken();
  const response = await fetch(
    `${API_BASE_URL}/api/download/${fileType}/${encodeURIComponent(filename)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Download failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function generateSyncedPPTX(
  tag: string
): Promise<{ success: boolean; pptx_file: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/generate-pptx`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify({ tag }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate PPTX");
  }

  return response.json();
}

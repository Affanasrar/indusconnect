import axios from "axios";

// Normalize API base URL to ensure clean formatting with /api suffix and no trailing slash
const resolveApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
  if (!envUrl) {
    return "http://localhost:5000/api";
  }
  const stripped = envUrl.replace(/\/+$/, "");
  return stripped.endsWith("/api") ? stripped : `${stripped}/api`;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("indusconnect_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("indusconnect_token");
      localStorage.removeItem("indusconnect_user");
    }

    return Promise.reject(error);
  }
);
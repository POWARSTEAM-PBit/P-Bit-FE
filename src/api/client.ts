import axios from "axios";

// Export base URL (used in dashboard display)
export const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Create axios client
const client = axios.create({
  baseURL: baseUrl,
  withCredentials: false,
  timeout: 10000, // 10s timeout
  headers: { "Content-Type": "application/json" },
});

// Add token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);

export default client;

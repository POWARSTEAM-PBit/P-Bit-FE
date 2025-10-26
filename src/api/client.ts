import axios from "axios";

/**
 * API base URL
 * - Use environment variable for production
 * - Fallback to localhost for development
 */
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/'; 

const client = axios.create({
  baseURL: baseUrl,
  withCredentials: false, // We're using Bearer token auth, not cookies
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
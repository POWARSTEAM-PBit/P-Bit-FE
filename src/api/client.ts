import axios from "axios";

/**
 * API base URL
 * - Prefer reading from .env (Vite style: VITE_*)
 * - Fallback to localhost:8000 so local dev still works if .env is missing
 */
// const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const baseUrl = 'http://ec2-13-239-216-36.ap-southeast-2.compute.amazonaws.com:8000';

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
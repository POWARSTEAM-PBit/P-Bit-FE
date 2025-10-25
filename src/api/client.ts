import axios from "axios";

/**
 * API base URL
 * - Prefer reading from .env (Vite style: VITE_*)
 * - Fallback to localhost:8000 so local dev still works if .env is missing
 */
const baseUrl = 'http://172-233-114-136.ip.linodeusercontent.com:8000/';

//Change this to work with development environment!!!
// const baseUrl = 'http://localhost:8000/'; 

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
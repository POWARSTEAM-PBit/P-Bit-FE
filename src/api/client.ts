import axios from "axios";

/**
 * API base URL
 * - Prefer reading from .env (Vite style: VITE_*)
 * - Fallback to localhost:8000 so local dev still works if .env is missing
 */
const baseUrl = import.meta.env.VITE_API_BASE_URL;

const client = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default client;
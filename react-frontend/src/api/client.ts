import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8000", // <-- hardcoded URL here
  withCredentials: true, // optional: needed for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export default client;

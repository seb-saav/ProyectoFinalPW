// Centralized configuration for API URLs
// This allows the app to work in both local development and production (cloud) environments automatically.

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Socket.io usually shares the same base URL as the API
export const SOCKET_URL = API_URL;

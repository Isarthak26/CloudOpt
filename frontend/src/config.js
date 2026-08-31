// In dev the Vite server proxies the backend routes (see vite.config.js), so
// requests stay same-origin and the backend needs no CORS configuration.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "" : "http://127.0.0.1:8000");

export const LOAD_LEVELS = ["low", "medium", "high"];

// Development uses the Vite proxy; production is served by FastAPI from the
// same origin. A different API host can still be supplied explicitly.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const LOAD_LEVELS = ["low", "medium", "high"];

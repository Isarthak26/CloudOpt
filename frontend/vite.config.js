import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// Keep the client-side `/recommendations` page out of the API proxy. Only the
// concrete backend recommendation endpoints should be forwarded to FastAPI;
// otherwise a direct page load or refresh is answered by the backend with 404.
const BACKEND_ROUTES = [
  "/experiments",
  "^/recommendations/(?:low|medium|high|comparison)$",
  "/health",
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    server: {
      proxy: Object.fromEntries(
        BACKEND_ROUTES.map((route) => [route, { target, changeOrigin: true }]),
      ),
    },
  };
});

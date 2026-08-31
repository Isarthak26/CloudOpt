import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const BACKEND_ROUTES = ["/experiments", "/recommendations", "/health"];

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

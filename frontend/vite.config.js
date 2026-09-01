import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Carga variables de entorno del .env / .env.local
  const env = loadEnv(mode, process.cwd(), "");

  // URL del backend para el proxy de desarrollo.
  // Cambiar VITE_BACKEND_URL en .env.local si el backend corre en otra IP/puerto.
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:4050";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});

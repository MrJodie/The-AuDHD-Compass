import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Vercel auto-detects this, but we explicitly define base for safety.
  base: "/",

  build: {
    outDir: "dist",
    sourcemap: false, // Set to true if you need debugging
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },

  server: {
    port: 5173, // local dev port
    open: true, // auto-opens browser
  },

  define: {
    // Allow safe access to injected Firebase globals if needed
    __app_id: JSON.stringify(process.env.VITE_APP_ID || "default-app-id"),
    __firebase_config: JSON.stringify(
      process.env.VITE_FIREBASE_CONFIG || "{}"
    ),
    __initial_auth_token: JSON.stringify(
      process.env.VITE_INITIAL_AUTH_TOKEN || null
    ),
  },
});

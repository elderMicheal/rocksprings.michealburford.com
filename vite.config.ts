import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  build: {
    // Three.js is intentionally isolated behind the exhibit scene's dynamic import.
    // Keep this just above that known 586 kB renderer chunk so unrelated growth warns.
    chunkSizeWarningLimit: 600,
  },
});

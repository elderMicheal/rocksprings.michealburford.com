import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js is intentionally isolated behind the exhibit scene's dynamic import.
    // Keep this just above that known renderer chunk so unrelated growth warns.
    chunkSizeWarningLimit: 600,
  },
});

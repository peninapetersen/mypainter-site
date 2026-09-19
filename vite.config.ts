import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, "app"),
  base: "/app/",
  build: {
    outDir: path.resolve(__dirname, "dist/app"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "app/src"),
    },
  },
});

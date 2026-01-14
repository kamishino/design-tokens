import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "site",
  base: "/design-tokens/",
  envDir: "../", // Load .env from project root (one level up from site/)
  plugins: [react()],
  build: {
    outDir: "../build",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "site/index.html"),
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@tokens": resolve(__dirname, "dist/json/tokens.json"),
      "@css": resolve(__dirname, "dist/css"),
      "@": resolve(__dirname, "site/src"),
      "@features": resolve(__dirname, "site/src/features"),
      "@shared": resolve(__dirname, "site/src/shared"),
      "@layouts": resolve(__dirname, "site/src/layouts"),
      "@core": resolve(__dirname, "site/src/core"),
    },
  },
  publicDir: resolve(__dirname, "dist"),
});

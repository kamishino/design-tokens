import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "site",
  base: "/design-tokens/",
  plugins: [react()],
  build: {
    outDir: "../docs",
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
    },
  },
  publicDir: resolve(__dirname, "dist"),
});

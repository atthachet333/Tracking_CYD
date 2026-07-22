/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@tracking-cyd/shared": path.resolve(__dirname, "../shared/index.ts"),
    },
  },
  server: {
    port: 6677,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:6678",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 6677,
    strictPort: true,
  },
  test: {
    // ค่าเริ่มต้น node (เทสต์ helper เดิมเร็ว); เทสต์ component ใช้ // @vitest-environment jsdom ต่อไฟล์
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

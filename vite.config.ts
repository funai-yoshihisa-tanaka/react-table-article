/// <reference types="vitest" />
// ↑ 必須

import { reactRouter } from "@react-router/dev/vite";
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config"; // ← 要変更
import * as path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), process.env.VITEST ? react() : reactRouter(), tsconfigPaths()], // ← 要変更
  // ↓ 要追加
  test: {
    globals: true,
    setupFiles: './tests/setup.ts',
    environment: "jsdom",
    include: ["tests/**/*.spec.{js,ts,jsx,tsx}"],
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
});

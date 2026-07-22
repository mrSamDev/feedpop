import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { feedProxyPlugin } from "./vite/feedProxy";

export default defineConfig({
  plugins: [react(), tailwindcss(), feedProxyPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    deps: {
      moduleDirectories: ["node_modules"],
    },
  },
});
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { feedProxyPlugin } from "./src/feedProxy";

export default defineConfig({
  plugins: [react(), tailwindcss(), feedProxyPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
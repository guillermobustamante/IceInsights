import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("@chakra-ui") ||
              id.includes("@emotion") ||
              id.includes("framer-motion")
            ) {
              return "vendor_ui";
            }
            if (id.includes("react-router")) {
              return "vendor_router";
            }
            if (id.includes("zustand")) {
              return "vendor_state";
            }
            return "vendor";
          }
        },
      },
    },
  },
});

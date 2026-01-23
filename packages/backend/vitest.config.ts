import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/_generated/**"],
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
  },
});

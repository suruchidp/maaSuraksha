import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: { NODE_ENV: "test" },
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30000,
    hookTimeout: 120000,
    include: ["tests/**/*.test.ts"],
  },
});
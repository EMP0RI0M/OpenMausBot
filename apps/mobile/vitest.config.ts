import { defineConfig } from "vitest/config";

// Mobile logic tests run in the plain node environment. Only pure, RN-free
// modules (services, engine parsing, reducers) are covered here; component
// rendering would need a react-native preset and is out of scope for now.
// root is pinned so the run stays scoped to apps/mobile regardless of cwd.
export default defineConfig({
  root: new URL(".", import.meta.url).pathname,
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 15_000,
  },
});

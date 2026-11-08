import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/**/src/**/*.test.ts",
      "packages/**/src/**/*.test.tsx",
      "apps/**/src/**/*.test.ts",
      "apps/**/src/**/*.test.tsx",
      "tests/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web/src"),
      "@nxtqr/ui": path.resolve(__dirname, "./packages/ui/src"),
      "@nxtqr/design-system": path.resolve(__dirname, "./packages/design-system/src"),
      "@nxtqr/icons": path.resolve(__dirname, "./packages/icons/src"),
      "@nxtqr/shared-types": path.resolve(__dirname, "./packages/shared-types/src"),
      "@nxtqr/validation": path.resolve(__dirname, "./packages/validation/src"),
      "@nxtqr/database": path.resolve(__dirname, "./packages/database/src"),
      "@nxtqr/auth": path.resolve(__dirname, "./packages/auth/src"),
      "@nxtqr/api-client": path.resolve(__dirname, "./packages/api-client/src"),
      "@nxtqr/query": path.resolve(__dirname, "./packages/query/src"),
      "@nxtqr/state": path.resolve(__dirname, "./packages/state/src"),
      "@nxtqr/canvas-core": path.resolve(__dirname, "./packages/canvas-core/src"),
      "@nxtqr/graph-schema": path.resolve(__dirname, "./packages/graph-schema/src"),
      "@nxtqr/node-registry": path.resolve(__dirname, "./packages/node-registry/src"),
      "@nxtqr/simulation-core": path.resolve(__dirname, "./packages/simulation-core/src"),
      "@nxtqr/execution-trace": path.resolve(__dirname, "./packages/execution-trace/src"),
      "@nxtqr/analytics": path.resolve(__dirname, "./packages/analytics/src"),
      "@nxtqr/security": path.resolve(__dirname, "./packages/security/src"),
      "@nxtqr/observability": path.resolve(__dirname, "./packages/observability/src"),
      "@nxtqr/performance": path.resolve(__dirname, "./packages/performance/src"),
      "@nxtqr/utils": path.resolve(__dirname, "./packages/utils/src"),
    },
  },
});

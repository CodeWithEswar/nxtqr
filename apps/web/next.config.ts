import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@nxtqr/ui",
    "@nxtqr/design-system",
    "@nxtqr/icons",
    "@nxtqr/shared-types",
    "@nxtqr/validation",
    "@nxtqr/database",
    "@nxtqr/auth",
    "@nxtqr/api-client",
    "@nxtqr/query",
    "@nxtqr/state",
    "@nxtqr/canvas-core",
    "@nxtqr/graph-schema",
    "@nxtqr/node-registry",
    "@nxtqr/simulation-core",
    "@nxtqr/execution-trace",
    "@nxtqr/analytics",
    "@nxtqr/security",
    "@nxtqr/observability",
    "@nxtqr/performance",
    "@nxtqr/utils",
  ],
  experimental: {
    // optimizePackageImports for heavy libraries
    optimizePackageImports: ["@hugeicons/react", "d3", "recharts", "@xyflow/react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

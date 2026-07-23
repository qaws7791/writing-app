import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import type { NextConfig } from "next"
import { createNextSecurityHeaders } from "@workspace/nextjs-config/security-headers"

const appDirectory = dirname(fileURLToPath(import.meta.url))
const development = process.env.NODE_ENV !== "production"

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
  },
  output: "standalone",
  outputFileTracingRoot: join(appDirectory, "../.."),
  async headers() {
    return [
      {
        headers: [
          ...createNextSecurityHeaders({
            development,
            includeContentSecurityPolicy: false,
            upgradeInsecureRequests: false,
          }),
        ],
        source: "/(.*)",
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        hostname: "lh3.googleusercontent.com",
        protocol: "https",
      },
      {
        hostname: "*.googleusercontent.com",
        protocol: "https",
      },
    ],
  },
  reactStrictMode: true,
  reactCompiler: true,
  serverExternalPackages: ["sharp"],
  poweredByHeader: false,
  turbopack: {
    root: join(appDirectory, "../.."),
  },
  transpilePackages: ["@workspace/auth", "@workspace/ui"],
}

export default nextConfig

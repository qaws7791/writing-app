import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import type { NextConfig } from "next"
import { createNextSecurityHeaders } from "@workspace/config/nextjs/security-headers"
import { localRuntimeDefaults } from "@workspace/env"

const appDirectory = dirname(fileURLToPath(import.meta.url))
const development = process.env.NODE_ENV !== "production"
const learnerApiOrigin =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? localRuntimeDefaults.learnerApiBaseUrl

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [
          ...createNextSecurityHeaders({
            connectSources: [learnerApiOrigin],
            development,
            imageSources: [
              "https://lh3.googleusercontent.com",
              "https://images.googleusercontent.com",
            ],
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
  poweredByHeader: false,
  turbopack: {
    root: join(appDirectory, "../.."),
  },
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig

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
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
        source: "/course-thumbnails/:name.png",
      },
      {
        headers: [
          ...createNextSecurityHeaders({
            development,
            includeContentSecurityPolicy: false,
          }),
        ],
        source: "/(.*)",
      },
    ]
  },
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,
  serverExternalPackages: ["sharp"],
  turbopack: {
    root: join(appDirectory, "../.."),
  },
  transpilePackages: ["@workspace/auth", "@workspace/ui"],
}

export default nextConfig

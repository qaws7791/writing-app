import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import type { NextConfig } from "next"
import { createNextSecurityHeaders } from "@workspace/config/nextjs/security-headers"
import { localRuntimeDefaults } from "@workspace/env"

const appDirectory = dirname(fileURLToPath(import.meta.url))
const development = process.env.NODE_ENV !== "production"
const adminApiOrigin =
  process.env.ADMIN_API_BASE_URL ?? localRuntimeDefaults.adminApiBaseUrl

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [
          ...createNextSecurityHeaders({
            allowHttpsImages: true,
            connectSources: [adminApiOrigin],
            development,
          }),
        ],
        source: "/(.*)",
      },
    ]
  },
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,
  turbopack: {
    root: join(appDirectory, "../.."),
  },
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig

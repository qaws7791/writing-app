import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import type { NextConfig } from "next"
import { createNextSecurityHeaders } from "@workspace/config/nextjs/security-headers"
import { localRuntimeDefaults } from "@workspace/env"

const appDirectory = dirname(fileURLToPath(import.meta.url))
const development = process.env.NODE_ENV !== "production"
const configuredAdminApiOrigin = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL
const adminApiOrigin =
  configuredAdminApiOrigin ??
  (development ? localRuntimeDefaults.adminApiBaseUrl : undefined)
const adminApiConnectSources = createAdminApiConnectSources(adminApiOrigin)

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [
          ...createNextSecurityHeaders({
            allowHttpsImages: true,
            connectSources: adminApiConnectSources,
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

function createAdminApiConnectSources(apiOrigin: string | undefined): string[] {
  if (apiOrigin === undefined) {
    return []
  }

  const webSocketUrl = new URL(apiOrigin)
  webSocketUrl.protocol = webSocketUrl.protocol === "https:" ? "wss:" : "ws:"

  return [apiOrigin, webSocketUrl.origin]
}

export default nextConfig

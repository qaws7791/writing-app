import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import type { NextConfig } from "next"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import {
  parseContentAssetImageAllowedOrigins,
  parseContentAssetPublicBaseUrl,
} from "@workspace/env/public-url"
import { createNextSecurityHeaders } from "@workspace/nextjs-config/security-headers"
import {
  createContentAssetRemotePatterns,
  resolveContentAssetImageAllowedOrigins,
  shouldAllowLocalContentAssetImages,
} from "@workspace/nextjs-config/content-asset-images"
import { adminContentAssetMaxBytes } from "@workspace/contracts/content/admin-assets"

const appDirectory = dirname(fileURLToPath(import.meta.url))
const contentAssetServerActionBodyLimit = adminContentAssetMaxBytes + 64 * 1024
const development = process.env.NODE_ENV !== "production"
const contentAssetPublicBaseUrl = parseContentAssetPublicBaseUrl(
  process.env.CONTENT_ASSET_PUBLIC_BASE_URL,
  {
    description: "content asset public base URL",
    nodeEnvironment: process.env.NODE_ENV,
  }
)
const contentAssetImageAllowedOrigins = resolveContentAssetImageAllowedOrigins(
  parseContentAssetImageAllowedOrigins(
    process.env.CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS,
    {
      description: "content asset image allowed origins",
      nodeEnvironment: process.env.NODE_ENV,
    }
  ),
  contentAssetPublicBaseUrl,
  development
)

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
    serverActions: {
      // 파일 상한은 API가 검증하고, 이 경계는 multipart 메타데이터 여유만 둔다.
      bodySizeLimit: contentAssetServerActionBodyLimit,
    },
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
            upgradeInsecureRequests: false,
          }),
        ],
        source: "/(.*)",
      },
    ]
  },
  poweredByHeader: false,
  images: {
    dangerouslyAllowLocalIP: shouldAllowLocalContentAssetImages(
      contentAssetImageAllowedOrigins,
      development
    ),
    remotePatterns: [
      ...createContentAssetRemotePatterns(contentAssetImageAllowedOrigins),
    ],
  },
  async rewrites() {
    if (!development) return []

    const apiBaseUrl = (
      process.env.API_BASE_URL ?? localRuntimeDefaults.apiBaseUrl
    ).replace(/\/+$/u, "")
    return [
      {
        destination: `${apiBaseUrl}/api/admin/:path*`,
        source: "/api/admin/:path*",
      },
    ]
  },
  reactStrictMode: true,
  reactCompiler: true,
  serverExternalPackages: ["sharp"],
  turbopack: {
    root: join(appDirectory, "../.."),
  },
  transpilePackages: ["@workspace/auth", "@workspace/ui"],
}

export default nextConfig

import { basename, dirname, join } from "node:path"
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

const appDirectory = dirname(fileURLToPath(import.meta.url))
const e2eRunRoot = process.env.E2E_RUN_ROOT?.trim()
const e2eDistDirectory =
  e2eRunRoot === undefined || e2eRunRoot === ""
    ? undefined
    : join(".next/e2e", basename(e2eRunRoot))
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
  ...(e2eDistDirectory === undefined ? {} : { distDir: e2eDistDirectory }),
  experimental: {
    cpus: 1,
    useTypeScriptCli: false,
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
    dangerouslyAllowLocalIP: shouldAllowLocalContentAssetImages(
      contentAssetImageAllowedOrigins,
      development
    ),
    remotePatterns: [
      ...createContentAssetRemotePatterns(contentAssetImageAllowedOrigins),
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
  async rewrites() {
    if (!development) return []

    const apiBaseUrl = (
      process.env.API_BASE_URL ?? localRuntimeDefaults.apiBaseUrl
    ).replace(/\/+$/u, "")
    return [
      {
        destination: `${apiBaseUrl}/api/:path*`,
        source: "/api/:path*",
      },
    ]
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

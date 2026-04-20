import path from "node:path"
import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"

const workspaceRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
)

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/storage"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  turbopack: {
    root: workspaceRoot,
  },
}

export default nextConfig

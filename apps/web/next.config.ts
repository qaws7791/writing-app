import path from "node:path"
import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"

const workspaceRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
)

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  async redirects() {
    return [
      {
        source: "/library",
        destination: "/writings",
        permanent: false,
      },
      {
        source: "/my-journeys",
        destination: "/journeys",
        permanent: false,
      },
      {
        source: "/prompts/:promptId",
        destination: "/writings",
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  reactCompiler: true,
  turbopack: {
    root: workspaceRoot,
  },
}

export default nextConfig

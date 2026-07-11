import type { MetadataRoute } from "next"

import { readWebOrigin } from "@/runtime-config-server"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ["/app/", "/login"],
      userAgent: "*",
    },
    sitemap: `${readWebOrigin()}/sitemap.xml`,
  }
}

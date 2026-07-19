import type { MetadataRoute } from "next"

import { readWebOrigin } from "@/server/env/runtime-config"

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

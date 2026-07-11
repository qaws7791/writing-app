import type { MetadataRoute } from "next"

import { readWebOrigin } from "@/runtime-config-server"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: "weekly",
      priority: 1,
      url: readWebOrigin(),
    },
  ]
}

import type { MetadataRoute } from "next"

import { readWebOrigin } from "@/server/env/runtime-config"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: "weekly",
      priority: 1,
      url: readWebOrigin(),
    },
  ]
}

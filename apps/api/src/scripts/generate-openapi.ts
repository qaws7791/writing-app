import { createOpenApiDocument } from "@/openapi/openapi-document"

const outputPath = new URL(
  "../../../../docs/openapi/writing-app-api.json",
  import.meta.url
)

await Bun.write(
  outputPath,
  `${JSON.stringify(createOpenApiDocument(), null, 2)}\n`
)

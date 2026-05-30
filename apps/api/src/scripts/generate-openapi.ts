import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { createOpenApiDocument } from "@/openapi/openapi-document"

const defaultOutputPath = fileURLToPath(
  new URL("../../../../docs/openapi/writing-app-api.json", import.meta.url)
)

const outputPath = process.argv[2] ?? defaultOutputPath
const document = await createOpenApiDocument()

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`)

process.stdout.write(`OpenAPI document written to ${outputPath}\n`)

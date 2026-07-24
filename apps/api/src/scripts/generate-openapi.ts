import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import { validate } from "@scalar/openapi-parser"

import {
  createOpenApiDocuments,
  serializeOpenApiDocument,
} from "@/openapi/openapi-documents"

export const defaultOpenApiOutputDirectory = resolve(
  import.meta.dir,
  "../../.generated/openapi"
)

export async function generateOpenApiDocuments(
  outputDirectory = defaultOpenApiOutputDirectory
) {
  const documents = createOpenApiDocuments()
  const serialized = {
    admin: serializeOpenApiDocument(documents.admin),
    learner: serializeOpenApiDocument(documents.learner),
  }

  await Promise.all(
    Object.entries(serialized).map(async ([audience, document]) => {
      const result = await validate(document)
      if (!result.valid) {
        throw new Error(
          `${audience} OpenAPI validation failed: ${JSON.stringify(result.errors)}`
        )
      }
    })
  )

  await mkdir(outputDirectory, { recursive: true })
  const paths = {
    admin: resolve(outputDirectory, "admin.json"),
    learner: resolve(outputDirectory, "learner.json"),
  }
  await Promise.all([
    writeFile(paths.admin, serialized.admin, "utf8"),
    writeFile(paths.learner, serialized.learner, "utf8"),
  ])

  return paths
}

if (import.meta.main) {
  const paths = await generateOpenApiDocuments()
  process.stdout.write(
    `admin OpenAPI: ${paths.admin}\nlearner OpenAPI: ${paths.learner}\n`
  )
}

import fs from "node:fs"
import path from "node:path"

import { createApp } from "../lib/hono/create-app"
import { createMemoryRateLimitBackend } from "../rate-limit/rate-limit-backend"
import { allRoutes } from "../routes"

const DEFAULT_OUTPUT_PATH = path.resolve(
  import.meta.dirname,
  "../../.generated/openapi.json"
)

const args = process.argv.slice(2)
const outputIndex = args.indexOf("--output")

function resolveOutputPath(): string {
  const outputArg = outputIndex === -1 ? undefined : args[outputIndex + 1]

  if (!outputArg) {
    return DEFAULT_OUTPUT_PATH
  }

  return path.resolve(outputArg)
}

async function main() {
  const outputPath = resolveOutputPath()
  const app = createApp({
    openapi: {
      description:
        "글쓰기 플랫폼 API입니다. 글감 탐색, 글 작성, 자동 저장 등 에세이 작성 워크플로우를 지원합니다.",
      servers: [
        {
          description: "API 서버",
          url: process.env.API_BASE_URL ?? "http://localhost:3010",
        },
      ],
      title: "Writing App API",
      version: "1.0.0",
    },
    routes: [
      ...allRoutes({
        rateLimitBackend: createMemoryRateLimitBackend(),
      }),
    ],
  })

  const response = await app.request("/openapi.json")
  if (!response.ok) {
    throw new Error(`Failed to build OpenAPI document: ${response.status}`)
  }

  const spec = await response.json()
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2))
  console.log(`Saved: ${outputPath}`)
}

main().catch((error) => {
  console.error("Failed to write OpenAPI spec:", error)
  process.exit(1)
})

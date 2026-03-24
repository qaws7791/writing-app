/**
 * OpenAPI 스펙에서 TypeScript 타입을 생성합니다.
 *
 * 사용법:
 *   bun run scripts/generate-api-types.ts
 *
 * API 서버가 실행 중이어야 합니다 (기본: http://localhost:3010).
 * 또는 로컬 스펙 파일에서 생성할 수 있습니다:
 *   bun run scripts/generate-api-types.ts --input src/openapi.json
 */
import openapiTS, { astToString } from "openapi-typescript"
import fs from "node:fs"
import path from "node:path"

const SPEC_URL = "http://localhost:3010/openapi.json"
const OUTPUT_PATH = path.resolve(import.meta.dirname, "../src/schema.d.ts")

const args = process.argv.slice(2)
const inputIndex = args.indexOf("--input")

async function main() {
  let source: string | URL

  if (inputIndex !== -1 && args[inputIndex + 1]) {
    const inputPath = path.resolve(args[inputIndex + 1]!)
    console.log(`Reading spec from: ${inputPath}`)
    source = new URL(`file:///${inputPath.replace(/\\/g, "/")}`)
  } else {
    console.log(`Fetching spec from: ${SPEC_URL}`)
    source = new URL(SPEC_URL)
  }

  const ast = await openapiTS(source)
  const output = astToString(ast)
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, output)
  console.log(`Generated: ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error("Failed to generate API types:", error)
  process.exit(1)
})
